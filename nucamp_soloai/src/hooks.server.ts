import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { auth } from './auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { isExemptPath, isProtectedRoute, isRouteAuthorized } from './routes';
import mauticService from '$lib/services/mautic';
import { prisma } from '$lib/prisma';
import type { MauticUserData } from '$lib/services/datamodel';
import { validateStripeConfig, logStripeConfigStatus } from '$lib/billing/stripe-config';

// ============================================================================
// Startup Validation (ST01-Stripe-Account-Setup.md)
// ============================================================================
// Validate Stripe configuration on server startup (runs once)
if (!building) {
	const stripeValidation = validateStripeConfig();

	if (!stripeValidation.isValid) {
		console.warn('[Stripe] Configuration issues detected:');
		stripeValidation.errors.forEach((error) => console.error(`  - ${error}`));
	}

	if (stripeValidation.warnings.length > 0) {
		stripeValidation.warnings.forEach((warning) => console.warn(`[Stripe] ${warning}`));
	}

	// Log detailed status in development
	if (process.env.NODE_ENV !== 'production') {
		logStripeConfigStatus();
	}
}

// Better Auth route handler - handles all /api/auth/* requests
const betterAuthRouteHandler: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth, building });
};

// Session population handler - populates event.locals with session data
const sessionHandler: Handle = async ({ event, resolve }) => {
	// Skip during build
	if (building) {
		return resolve(event);
	}

	// Fetch session data and populate event.locals
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	} else {
		event.locals.session = null;
		event.locals.user = null;
	}

	return resolve(event);
};

/**
 * Mautic user provisioning handler (MA02-Mautic-API-Auth.md)
 *
 * Handles anonymous to authenticated user transition:
 * 1. Detects users without mauticId in database
 * 2. Reads mtc_id cookie from Mautic tracking script
 * 3. Creates or updates Mautic contact with user data
 * 4. Persists mauticId to database for future requests
 * 5. Syncs locale from Paraglide to Mautic for multilingual campaigns
 */
const mauticProvisioningHandler: Handle = async ({ event, resolve }) => {
	// Skip during build
	if (building) {
		return resolve(event);
	}

	// Skip if Mautic service is not initialized
	if (!mauticService.isInitialized()) {
		return resolve(event);
	}

	// Skip if no authenticated user
	const user = event.locals.user;
	if (!user) {
		return resolve(event);
	}

	// Skip if user already has mauticId (already provisioned)
	if (user.mauticId) {
		return resolve(event);
	}

	// User needs Mautic provisioning
	try {
		// Read Mautic tracking cookie (set by mtc.js)
		const mauticIdCookie = event.cookies.get('mtc_id');

		// Prepare contact data for Mautic
		const contactData: MauticUserData = {
			email: user.email,
			firstname: user.name?.split(' ')[0] || '',
			lastname: user.name?.split(' ').slice(1).join(' ') || '',
			ipAddress: event.getClientAddress(),
			locale: user.locale || 'en', // From Paraglide via Better Auth
			preferred_locale: user.locale || 'en', // Same value for compatibility
			timezone: user.timezone || 'UTC',
			mauticId: mauticIdCookie ? parseInt(mauticIdCookie, 10) : undefined,
			last_active: new Date().toISOString()
		};

		// Create or update Mautic contact
		const mauticUser = await mauticService.getOrCreateMauticUser(contactData);

		// Update user in database with Mautic ID
		if (mauticUser?.contact?.id) {
			const updatedMauticId = mauticUser.contact.id;

			// Persist mauticId to database
			await prisma.user.update({
				where: { id: user.id },
				data: { mauticId: updatedMauticId }
			});

			// Update session user object for current request
			event.locals.user = { ...user, mauticId: updatedMauticId };

			// Sync cookie with database value if different
			const currentCookieValue = mauticIdCookie ? parseInt(mauticIdCookie, 10) : 0;
			if (updatedMauticId !== currentCookieValue) {
				event.cookies.set('mtc_id', updatedMauticId.toString(), {
					path: '/',
					httpOnly: false, // mtc.js needs to read this
					secure: event.url.protocol === 'https:',
					sameSite: 'lax',
					maxAge: 60 * 60 * 24 * 365 // 1 year
				});
			}

			// Add to "New Authenticated Users" segment (MA05-Mautic-Frontend-Connect.md)
			// This triggers the welcome campaign from MA03-Mautic-Create-Campaign.md
			await mauticService.addToNewUsersSegment(updatedMauticId);

			console.log(`Mautic: Provisioned user ${user.email} with Mautic ID: ${updatedMauticId}`);
		}
	} catch (error) {
		// Don't block authentication on Mautic errors - log and continue
		console.error('Mautic provisioning error:', error);
	}

	return resolve(event);
};

/**
 * Route protection middleware.
 *
 * Checks if the current route requires authentication and/or specific roles.
 * Redirects unauthenticated users to login with redirectTo parameter preserved.
 */
const protectRoutes: Handle = async ({ event, resolve }) => {
	// Skip during build
	if (building) {
		return resolve(event);
	}

	const pathname = event.url.pathname;

	// Skip protection for exempt paths (auth endpoints, login, signup, etc.)
	if (isExemptPath(pathname)) {
		return resolve(event);
	}

	// Check if this route needs protection
	if (!isProtectedRoute(pathname)) {
		return resolve(event);
	}

	// Get session data from event.locals (populated by sessionHandler)
	const session = event.locals.session;
	const user = event.locals.user;

	// No session - redirect to login
	if (!session || !user) {
		const redirectTo = encodeURIComponent(pathname + event.url.search);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	// Build user roles array
	// For this implementation, authenticated users get 'authenticated' role
	// Admin status can be checked via user properties if needed
	const userRoles: string[] = ['authenticated'];

	// Check if user is authorized for this route
	if (!isRouteAuthorized(pathname, userRoles)) {
		// User is authenticated but lacks required role
		// Redirect to login (could also redirect to unauthorized page)
		const redirectTo = encodeURIComponent(pathname + event.url.search);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	return resolve(event);
};

// Compose handlers using sequence
// Order matters:
// 1. betterAuthRouteHandler - handles /api/auth/* requests
// 2. sessionHandler - populates event.locals with session data
// 3. mauticProvisioningHandler - provisions new users in Mautic (MA02-Mautic-API-Auth.md)
// 4. protectRoutes - guards protected routes
export const handle: Handle = sequence(
	betterAuthRouteHandler,
	sessionHandler,
	mauticProvisioningHandler,
	protectRoutes
);
