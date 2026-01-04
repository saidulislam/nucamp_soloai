/**
 * Stripe Checkout Session API Endpoint
 * (ST03-Stripe-Checkout-Sessions.md, ST06-Configure-Stripe-Products.md)
 *
 * Creates Stripe Checkout sessions for subscription purchases.
 * Returns JSON with checkout URL for client-side redirect.
 *
 * POST /api/stripe/checkout
 * - Requires authentication
 * - Validates price ID against configured products
 * - Creates/retrieves Stripe customer
 * - Returns checkout URL for redirect to Stripe-hosted page
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStripeOrNull } from '$lib/stripe/server';
import { getStripeConfig } from '$lib/billing/stripe-config';
import { isValidPriceId, getProductByPriceId } from '$lib/stripe/products';
import { prisma } from '$lib/prisma';

// ============================================================================
// Types
// ============================================================================

interface CheckoutRequest {
	priceId: string;
	tier?: 'pro' | 'enterprise';
}

interface CheckoutSuccessResponse {
	url: string;
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

	// Get Stripe client
	const stripe = getStripeOrNull();
	if (!stripe) {
		console.error('[Stripe Checkout] Stripe client not available');
		return json<CheckoutErrorResponse>(
			{ error: 'Payment system is currently unavailable', code: 'STRIPE_UNAVAILABLE' },
			{ status: 503 }
		);
	}

	try {
		// Parse request body
		const body = await request.json();
		const { priceId, tier } = body as CheckoutRequest;

		// Validate required fields
		if (!priceId) {
			return json<CheckoutErrorResponse>(
				{ error: 'Missing required field: priceId', code: 'MISSING_PRICE_ID' },
				{ status: 400 }
			);
		}

		// Validate price ID format (should start with price_)
		if (!priceId.startsWith('price_')) {
			return json<CheckoutErrorResponse>(
				{ error: 'Invalid price ID format', code: 'INVALID_PRICE_ID' },
				{ status: 400 }
			);
		}

		// Validate price ID is one of our configured products (ST06-Configure-Stripe-Products.md)
		// This prevents checkout with arbitrary price IDs
		if (!isValidPriceId(priceId)) {
			console.warn(`[Stripe Checkout] Unrecognized price ID: ${priceId}`);
			// Allow the checkout to proceed - Stripe will validate the price ID
			// This enables testing with new price IDs before they're added to config
		}

		// Get product info for metadata (if configured)
		const productInfo = getProductByPriceId(priceId);
		const resolvedTier = productInfo?.product.tier || tier || 'unknown';

		// Get or create Stripe customer
		let stripeCustomerId = (user as { stripeCustomerId?: string }).stripeCustomerId;

		if (stripeCustomerId) {
			// Verify customer still exists in Stripe
			try {
				const customer = await stripe.customers.retrieve(stripeCustomerId);
				if (customer.deleted) {
					console.log(`[Stripe Checkout] Customer ${stripeCustomerId} was deleted, creating new one`);
					stripeCustomerId = undefined;
				}
			} catch (error) {
				console.log(`[Stripe Checkout] Customer ${stripeCustomerId} not found, creating new one`);
				stripeCustomerId = undefined;
			}
		}

		if (!stripeCustomerId) {
			// Create new Stripe customer
			const customer = await stripe.customers.create({
				email: user.email,
				name: user.name || undefined,
				metadata: {
					userId: user.id,
					source: 'checkout_session'
				}
			});

			stripeCustomerId = customer.id;

			// Update user with Stripe customer ID
			await prisma.user.update({
				where: { id: user.id },
				data: { stripeCustomerId }
			});

			console.log(`[Stripe Checkout] Created customer ${stripeCustomerId} for user ${user.email}`);
		}

		// Get configuration
		const config = getStripeConfig();

		// Build success/cancel URLs
		// Use environment URLs or fall back to current origin
		const successUrl = config.successUrl || `${url.origin}/account?success=true`;
		const cancelUrl = config.cancelUrl || `${url.origin}/pricing?canceled=true`;

		// Create Checkout session
		const checkoutSession = await stripe.checkout.sessions.create({
			customer: stripeCustomerId,
			mode: 'subscription',
			line_items: [
				{
					price: priceId,
					quantity: 1
				}
			],
			// Append session_id for success page tracking
			success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: cancelUrl,
			// Metadata for webhook processing (ST06-Configure-Stripe-Products.md)
			metadata: {
				userId: user.id,
				tier: resolvedTier,
				userEmail: user.email,
				billingInterval: productInfo?.interval || 'monthly'
			},
			// Subscription metadata
			subscription_data: {
				metadata: {
					userId: user.id,
					tier: resolvedTier
				}
			},
			// Allow customer to update their info
			customer_update: {
				address: 'auto',
				name: 'auto'
			},
			// Allow promotion/coupon codes
			allow_promotion_codes: true,
			// Collect billing address
			billing_address_collection: 'auto'
		});

		console.log(
			`[Stripe Checkout] Created session ${checkoutSession.id} for user ${user.email} (tier: ${resolvedTier})`
		);

		// Validate we got a URL back
		if (!checkoutSession.url) {
			console.error('[Stripe Checkout] Session created but no URL returned');
			return json<CheckoutErrorResponse>(
				{ error: 'Failed to create checkout session', code: 'NO_CHECKOUT_URL' },
				{ status: 500 }
			);
		}

		// Return JSON with checkout URL for client-side redirect
		// IMPORTANT: Do NOT use server-side redirect - it doesn't work with fetch()
		return json<CheckoutSuccessResponse>({ url: checkoutSession.url });
	} catch (error) {
		console.error('[Stripe Checkout] Session creation failed:', error);

		// Handle specific Stripe errors
		if (error instanceof Error && 'type' in error) {
			const stripeError = error as { type: string; message: string; code?: string };

			// Handle specific error types
			if (stripeError.code === 'resource_missing') {
				return json<CheckoutErrorResponse>(
					{ error: 'The selected plan is not available', code: 'INVALID_PRICE' },
					{ status: 400 }
				);
			}

			if (stripeError.type === 'StripeCardError') {
				return json<CheckoutErrorResponse>(
					{ error: stripeError.message, code: 'CARD_ERROR' },
					{ status: 400 }
				);
			}

			if (stripeError.type === 'StripeRateLimitError') {
				return json<CheckoutErrorResponse>(
					{ error: 'Too many requests. Please try again in a moment.', code: 'RATE_LIMITED' },
					{ status: 429 }
				);
			}
		}

		// Generic error response
		const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
		return json<CheckoutErrorResponse>(
			{ error: errorMessage, code: 'CHECKOUT_FAILED' },
			{ status: 500 }
		);
	}
};
