/**
 * LemonSqueezy Checkout Session API Endpoint
 * (LS03-LemonSqueezy-Checkout-URLs.md)
 *
 * Creates LemonSqueezy checkout URLs for subscription purchases.
 * Returns JSON with checkout URL for client-side redirect.
 *
 * POST /api/lemonsqueezy/checkout
 * - Requires authentication
 * - Creates checkout URL with user data in custom fields
 * - Returns checkout URL for redirect to LemonSqueezy-hosted page
 *
 * IMPORTANT: LemonSqueezy is used for NON-US users only.
 * US users (locale: 'en') should use Stripe (/api/stripe/checkout).
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCheckoutUrl, isLemonSqueezyReady } from '$lib/lemonsqueezy';
import { prisma } from '$lib/prisma';

// ============================================================================
// Types
// ============================================================================

interface CheckoutRequest {
	variantId: string;
	tier?: 'pro' | 'enterprise';
}

interface CheckoutSuccessResponse {
	url: string;
	checkoutId?: string;
}

interface CheckoutErrorResponse {
	error: string;
	code?: string;
}

// ============================================================================
// POST Handler
// ============================================================================

export const POST: RequestHandler = async ({ request, locals, url }) => {
	// Verify authentication
	const session = locals.session;
	const user = locals.user;

	if (!session || !user) {
		return json<CheckoutErrorResponse>(
			{ error: 'You must be logged in to subscribe', code: 'UNAUTHORIZED' },
			{ status: 401 }
		);
	}

	// Check if LemonSqueezy is configured
	if (!isLemonSqueezyReady()) {
		console.error('[LemonSqueezy Checkout] LemonSqueezy is not configured');
		return json<CheckoutErrorResponse>(
			{ error: 'Payment system is currently unavailable', code: 'LEMONSQUEEZY_UNAVAILABLE' },
			{ status: 503 }
		);
	}

	try {
		// Parse request body
		const body = await request.json();
		const { variantId, tier } = body as CheckoutRequest;

		// Validate required fields
		if (!variantId) {
			return json<CheckoutErrorResponse>(
				{ error: 'Missing required field: variantId', code: 'MISSING_VARIANT_ID' },
				{ status: 400 }
			);
		}

		// Build success/cancel URLs
		const successUrl = `${url.origin}/account?success=true`;
		const cancelUrl = `${url.origin}/pricing?canceled=true`;

		console.log(
			`[LemonSqueezy Checkout] Creating checkout for user ${user.email}, variant: ${variantId}, tier: ${tier || 'unknown'}`
		);

		// Create checkout URL using SDK utilities
		const result = await createCheckoutUrl({
			variantId,
			email: user.email,
			name: user.name || undefined,
			userId: user.id,
			tier: tier || undefined,
			successUrl,
			cancelUrl,
			customData: {
				tier: tier || 'unknown',
				userEmail: user.email
			}
		});

		if (!result.success) {
			console.error('[LemonSqueezy Checkout] Checkout creation failed:', result.error);

			// Handle specific error types
			if (result.error.code === 'LEMONSQUEEZY_NOT_CONFIGURED') {
				return json<CheckoutErrorResponse>(
					{ error: 'Payment system is currently unavailable', code: 'LEMONSQUEEZY_UNAVAILABLE' },
					{ status: 503 }
				);
			}

			if (result.error.code === 'INVALID_VARIANT') {
				return json<CheckoutErrorResponse>(
					{ error: 'The selected plan is not available', code: 'INVALID_VARIANT' },
					{ status: 400 }
				);
			}

			if (result.error.code === 'STORE_NOT_FOUND') {
				return json<CheckoutErrorResponse>(
					{ error: 'Payment configuration error. Please contact support.', code: 'STORE_ERROR' },
					{ status: 500 }
				);
			}

			return json<CheckoutErrorResponse>(
				{ error: result.error.message || 'Failed to create checkout session', code: 'CHECKOUT_FAILED' },
				{ status: 500 }
			);
		}

		console.log(
			`[LemonSqueezy Checkout] Created checkout for user ${user.email} (tier: ${tier || 'unknown'}), checkoutId: ${result.data.checkoutId || 'N/A'}`
		);

		// Optionally store LemonSqueezy customer ID if we have one
		// This will be properly set by webhook after successful payment
		// For now, just track the checkout attempt

		// Return JSON with checkout URL for client-side redirect
		// IMPORTANT: Do NOT use server-side redirect - it doesn't work with fetch()
		return json<CheckoutSuccessResponse>({
			url: result.data.url,
			checkoutId: result.data.checkoutId
		});
	} catch (error) {
		console.error('[LemonSqueezy Checkout] Session creation failed:', error);

		// Generic error response
		const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
		return json<CheckoutErrorResponse>(
			{ error: errorMessage, code: 'CHECKOUT_FAILED' },
			{ status: 500 }
		);
	}
};
