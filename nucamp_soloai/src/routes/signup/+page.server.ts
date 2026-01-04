import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Server-side load function for the signup page
 *
 * Handles authentication state checking and redirects:
 * - If user is already authenticated, redirects to /account (or redirect param)
 * - If not authenticated, allows page to render normally
 * - Validates and sanitizes redirect URL parameter to prevent open redirect attacks
 */
export const load: PageServerLoad = async ({ locals, url }) => {
	// Check if user is already authenticated via event.locals (populated in hooks.server.ts)
	if (locals.session && locals.user) {
		// Get the redirect URL from query parameter
		const redirectTo = url.searchParams.get('redirect');

		// Validate redirect URL to prevent open redirect attacks
		// Only allow relative URLs or same-origin URLs
		const safeRedirect = validateRedirectUrl(redirectTo);

		// Redirect authenticated users to their intended destination or account page
		redirect(302, safeRedirect);
	}

	// Return redirect parameter for client-side use after signup
	const redirectParam = url.searchParams.get('redirect');

	return {
		redirectTo: validateRedirectUrl(redirectParam, '/account')
	};
};

/**
 * Validates and sanitizes a redirect URL to prevent open redirect vulnerabilities
 *
 * @param url - The URL to validate
 * @param fallback - Default URL to return if validation fails (defaults to '/account')
 * @returns A safe redirect URL
 */
function validateRedirectUrl(url: string | null, fallback: string = '/account'): string {
	if (!url) {
		return fallback;
	}

	// Trim whitespace
	const trimmedUrl = url.trim();

	// Must start with a single forward slash (relative path)
	// This prevents protocol-relative URLs (//evil.com) and absolute URLs (http://evil.com)
	if (!trimmedUrl.startsWith('/') || trimmedUrl.startsWith('//')) {
		return fallback;
	}

	// Block URLs that could be interpreted as protocol handlers
	if (
		trimmedUrl.toLowerCase().includes('javascript:') ||
		trimmedUrl.toLowerCase().includes('data:') ||
		trimmedUrl.toLowerCase().includes('vbscript:')
	) {
		return fallback;
	}

	// Additional check: ensure it doesn't have a backslash which could be normalized to forward slash
	if (trimmedUrl.includes('\\')) {
		return fallback;
	}

	return trimmedUrl;
}
