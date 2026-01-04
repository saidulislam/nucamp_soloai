/**
 * Subscription Data API Endpoint
 * (ST05-Stripe-Portal-Integration.md)
 *
 * Fetches the current user's subscription details including:
 * - Subscription tier and status from database
 * - Additional Stripe data (cancel_at_period_end, current_period dates)
 * - Payment method summary from Stripe
 * - Next billing amount
 *
 * GET /api/billing/subscription
 * - Requires authentication
 * - Returns subscription overview with payment details
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getSubscriptionDataFromUser,
	type BillingOverviewResponse,
	type PaymentMethodData,
	type SubscriptionData
} from '$lib/billing/types';
import { getStripeOrNull } from '$lib/stripe/server';

export const GET: RequestHandler = async ({ locals }) => {
	// Verify authentication
	if (!locals.session || !locals.user) {
		return json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
	}

	try {
		const user = locals.user as {
			id: string;
			stripeCustomerId?: string | null;
			stripeSubscriptionId?: string | null;
			lemonSqueezyCustomerId?: string | null;
			lemonSqueezySubscriptionId?: string | null;
			subscriptionTier?: string | null;
			subscriptionStatus?: string | null;
			subscriptionEndDate?: Date | null;
		};

		// Get subscription data from user object (database)
		let subscription = getSubscriptionDataFromUser(user);

		let paymentMethod: PaymentMethodData | null = null;
		let nextBillingAmount: number | null = null;
		let currency = 'USD';

		// Only fetch additional details for paid subscriptions with Stripe
		if (subscription.provider === 'stripe' && user.stripeSubscriptionId) {
			const stripe = getStripeOrNull();

			if (stripe) {
				try {
					// Fetch subscription details from Stripe
					const stripeSubscription = await stripe.subscriptions.retrieve(
						user.stripeSubscriptionId,
						{
							expand: ['default_payment_method', 'latest_invoice']
						}
					);

					// Enhance subscription data with Stripe details
					const enhancedSubscription: SubscriptionData = {
						...subscription,
						currentPeriodEnd: stripeSubscription.current_period_end
							? new Date(stripeSubscription.current_period_end * 1000)
							: subscription.currentPeriodEnd,
						cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
						trialEnd: stripeSubscription.trial_end
							? new Date(stripeSubscription.trial_end * 1000)
							: null
					};
					subscription = enhancedSubscription;

					// Get payment method details
					const pm = stripeSubscription.default_payment_method;
					if (pm && typeof pm === 'object' && pm.type === 'card' && pm.card) {
						paymentMethod = {
							type: 'card',
							last4: pm.card.last4 || null,
							brand: pm.card.brand || null,
							expiryMonth: pm.card.exp_month || null,
							expiryYear: pm.card.exp_year || null,
							isDefault: true
						};
					}

					// Get next billing amount from latest invoice or subscription items
					const latestInvoice = stripeSubscription.latest_invoice;
					if (latestInvoice && typeof latestInvoice === 'object') {
						// For upcoming billing, use subscription item amount
						if (stripeSubscription.items?.data?.[0]?.price?.unit_amount) {
							nextBillingAmount = stripeSubscription.items.data[0].price.unit_amount;
							currency = stripeSubscription.items.data[0].price.currency?.toUpperCase() || 'USD';
						}
					}

					console.log(`[Billing Subscription] Fetched Stripe data for subscription ${user.stripeSubscriptionId}`);
				} catch (stripeError) {
					// Log error but continue with database data
					console.error('[Billing Subscription] Error fetching Stripe data:', stripeError);
					// Fall through to return database data only
				}
			}
		} else if (subscription.provider === 'lemonsqueezy' && user.lemonSqueezySubscriptionId) {
			// TODO: Implement LemonSqueezy API calls when LS integration is added
			// For now, use database data only
			console.log('[Billing Subscription] LemonSqueezy subscription - using database data');
		}

		// If no Stripe data available but user has paid subscription, use tier-based defaults
		if (!nextBillingAmount && subscription.tier !== 'free') {
			// Default amounts based on tier (in cents)
			nextBillingAmount = subscription.tier === 'pro' ? 1900 : 4900;
		}

		const response: BillingOverviewResponse = {
			subscription,
			paymentMethod,
			nextBillingAmount,
			currency
		};

		return json(response);
	} catch (error) {
		console.error('[Billing Subscription] Error fetching subscription:', error);
		return json(
			{
				error: 'Failed to fetch subscription data',
				code: 'FETCH_ERROR',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
