/**
 * Billing Portal API Endpoint
 * (ST05-Stripe-Portal-Integration.md)
 *
 * Generates a customer portal URL for the user to manage their subscription.
 * Uses Stripe Customer Portal for Stripe subscriptions.
 * Uses LemonSqueezy Customer Portal for LemonSqueezy subscriptions.
 *
 * POST /api/billing/portal
 * - Requires authentication
 * - Requires active paid subscription
 * - Returns JSON with portal URL for client-side redirect
 *
 * CRITICAL: Returns JSON + URL for client-side redirect.
 * Server-side redirect does NOT work with fetch() requests.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSubscriptionDataFromUser, type PortalSessionResponse } from '$lib/billing/types';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { getStripeOrNull } from '$lib/stripe/server';

export const POST: RequestHandler = async ({ locals, url }) => {
	// Verify authentication
	if (!locals.session || !locals.user) {
		return json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
	}

	try {
		const user = locals.user as {
			id: string;
			stripeCustomerId?: string | null;
			lemonSqueezyCustomerId?: string | null;
			subscriptionTier?: string | null;
			subscriptionStatus?: string | null;
			subscriptionEndDate?: Date | null;
			stripeSubscriptionId?: string | null;
			lemonSqueezySubscriptionId?: string | null;
		};
		const subscription = getSubscriptionDataFromUser(user);

		// Check if user has a payment provider
		if (!subscription.provider) {
			return json(
				{
					error: 'No active subscription found',
					code: 'NO_SUBSCRIPTION',
					details: 'You need an active paid subscription to access the billing portal'
				},
				{ status: 400 }
			);
		}

		// Use request origin for return URL, fallback to PUBLIC_BASE_URL
		const returnUrl = `${url.origin || PUBLIC_BASE_URL}/account`;

		// Generate portal URL based on provider
		let portalUrl: string;

		if (subscription.provider === 'stripe') {
			// Get Stripe client
			const stripe = getStripeOrNull();
			if (!stripe) {
				console.error('[Billing Portal] Stripe client not available');
				return json(
					{
						error: 'Payment system is currently unavailable',
						code: 'STRIPE_UNAVAILABLE'
					},
					{ status: 503 }
				);
			}

			// Check if user has Stripe customer ID
			const stripeCustomerId = user.stripeCustomerId;
			if (!stripeCustomerId) {
				return json(
					{
						error: 'No Stripe customer ID found',
						code: 'NO_CUSTOMER_ID',
						details: 'Please subscribe to a plan first'
					},
					{ status: 400 }
				);
			}

			// Create Stripe Customer Portal session
			const portalSession = await stripe.billingPortal.sessions.create({
				customer: stripeCustomerId,
				return_url: returnUrl
			});

			portalUrl = portalSession.url;
			console.log(`[Billing Portal] Created Stripe portal session for customer ${stripeCustomerId}`);
		} else if (subscription.provider === 'lemonsqueezy') {
			// LemonSqueezy portal URL
			// TODO: Implement LemonSqueezy Customer Portal API call when LS integration is added
			// For now, return the LemonSqueezy billing page with return URL
			const lsCustomerId = user.lemonSqueezyCustomerId;
			if (!lsCustomerId) {
				return json(
					{
						error: 'No LemonSqueezy customer ID found',
						code: 'NO_CUSTOMER_ID',
						details: 'Please subscribe to a plan first'
					},
					{ status: 400 }
				);
			}

			// LemonSqueezy doesn't have a direct portal session API like Stripe
			// They use a customer portal URL pattern
			portalUrl = `https://app.lemonsqueezy.com/my-orders`;
			console.log(`[Billing Portal] Redirecting to LemonSqueezy portal for customer ${lsCustomerId}`);
		} else {
			return json(
				{
					error: 'Unknown payment provider',
					code: 'INVALID_PROVIDER'
				},
				{ status: 400 }
			);
		}

		// Return JSON with portal URL for client-side redirect
		// CRITICAL: Do NOT use server-side redirect - it doesn't work with fetch()
		const response: PortalSessionResponse = {
			url: portalUrl,
			provider: subscription.provider
		};

		return json(response);
	} catch (error) {
		console.error('[Billing Portal] Error generating portal URL:', error);

		// Handle specific Stripe errors
		if (error instanceof Error && 'type' in error) {
			const stripeError = error as { type: string; message: string; code?: string };

			if (stripeError.code === 'resource_missing') {
				return json(
					{
						error: 'Customer not found in Stripe',
						code: 'CUSTOMER_NOT_FOUND',
						details: 'Your payment profile may have been deleted. Please contact support.'
					},
					{ status: 400 }
				);
			}
		}

		return json(
			{
				error: 'Failed to generate portal URL',
				code: 'PORTAL_ERROR',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
