import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Server-side layout load function for the account route.
 *
 * This provides an additional layer of authentication validation beyond the
 * hooks.server.ts middleware. It ensures user data is available to child pages
 * and handles edge cases where session might be invalid.
 *
 * Note: Primary route protection is handled by hooks.server.ts via the
 * protectedRoutes configuration in routes.ts. This layout provides:
 * 1. User data to child pages via PageData
 * 2. Fallback redirect if session is somehow invalid
 * 3. Structured user data for dashboard display
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Session should be validated by hooks.server.ts, but double-check
	// This handles edge cases like session expiration between middleware and load
	if (!locals.session || !locals.user) {
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	// Return user and session data for child pages
	return {
		user: {
			id: locals.user.id,
			email: locals.user.email,
			name: locals.user.name,
			image: locals.user.image ?? null,
			emailVerified: locals.user.emailVerified,
			createdAt: locals.user.createdAt,
			updatedAt: locals.user.updatedAt,
			locale: locals.user.locale ?? null,
			timezone: locals.user.timezone ?? null,
			// Subscription fields (D04-Account-Billing.md)
			subscriptionTier: locals.user.subscriptionTier ?? null,
			subscriptionStatus: locals.user.subscriptionStatus ?? null,
			subscriptionEndDate: locals.user.subscriptionEndDate ?? null,
			stripeCustomerId: locals.user.stripeCustomerId ?? null,
			stripeSubscriptionId: locals.user.stripeSubscriptionId ?? null,
			lemonSqueezyCustomerId: locals.user.lemonSqueezyCustomerId ?? null,
			lemonSqueezySubscriptionId: locals.user.lemonSqueezySubscriptionId ?? null
		},
		session: {
			id: locals.session.id,
			createdAt: locals.session.createdAt,
			expiresAt: locals.session.expiresAt,
			ipAddress: locals.session.ipAddress ?? null,
			userAgent: locals.session.userAgent ?? null
		}
	};
};
