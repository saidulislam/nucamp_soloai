/**
 * Subscription Cancellation API Endpoint
 * (ST05-Stripe-Portal-Integration.md)
 *
 * Initiates subscription cancellation for the authenticated user.
 * The subscription will remain active until the end of the current billing period.
 * Uses Stripe's cancel_at_period_end to allow users to continue using their
 * subscription until the paid period expires.
 *
 * POST /api/billing/cancel
 * - Requires authentication
 * - Requires active paid subscription
 * - Returns updated subscription data
 *
 * NOTE: For full subscription management, users should use the Customer Portal.
 * This endpoint provides a direct cancellation option for UX convenience.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getSubscriptionDataFromUser,
	canCancelSubscription,
	type SubscriptionData
} from '$lib/billing/types';
import { getStripeOrNull } from '$lib/stripe/server';
import { prisma } from '$lib/prisma';

export const POST: RequestHandler = async ({ locals }) => {
	// Verify authentication
	if (!locals.session || !locals.user) {
		return json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
	}

	try {
		const user = locals.user as {
			id: string;
			stripeSubscriptionId?: string | null;
			lemonSqueezySubscriptionId?: string | null;
			subscriptionTier?: string | null;
			subscriptionStatus?: string | null;
			subscriptionEndDate?: Date | null;
		};
		const subscription = getSubscriptionDataFromUser(user);

		// Check if subscription can be cancelled
		if (!canCancelSubscription(subscription)) {
			return json(
				{
					error: 'Cannot cancel subscription',
					code: 'CANCEL_NOT_ALLOWED',
					details:
						subscription.tier === 'free'
							? 'You are on the free plan'
							: subscription.cancelAtPeriodEnd
								? 'Subscription is already scheduled for cancellation'
								: 'Subscription is not in a cancellable state'
				},
				{ status: 400 }
			);
		}

		let cancelledSubscription: SubscriptionData;
		let effectiveDate: Date | null = subscription.currentPeriodEnd;

		if (subscription.provider === 'stripe' && user.stripeSubscriptionId) {
			// Get Stripe client
			const stripe = getStripeOrNull();
			if (!stripe) {
				return json(
					{
						error: 'Payment system is currently unavailable',
						code: 'STRIPE_UNAVAILABLE'
					},
					{ status: 503 }
				);
			}

			// Cancel subscription at period end via Stripe API
			const updatedSubscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
				cancel_at_period_end: true
			});

			// Update local database to reflect cancellation
			await prisma.user.update({
				where: { id: user.id },
				data: {
					subscriptionStatus: 'cancelled'
				}
			});

			// Build response subscription data
			cancelledSubscription = {
				...subscription,
				cancelAtPeriodEnd: true,
				currentPeriodEnd: updatedSubscription.current_period_end
					? new Date(updatedSubscription.current_period_end * 1000)
					: subscription.currentPeriodEnd
			};
			effectiveDate = cancelledSubscription.currentPeriodEnd;

			console.log(`[Billing Cancel] Cancelled Stripe subscription ${user.stripeSubscriptionId} for user ${user.id}`);
		} else if (subscription.provider === 'lemonsqueezy' && user.lemonSqueezySubscriptionId) {
			// TODO: Implement LemonSqueezy cancellation when LS integration is added
			// For now, just update the database
			await prisma.user.update({
				where: { id: user.id },
				data: {
					subscriptionStatus: 'cancelled'
				}
			});

			cancelledSubscription = {
				...subscription,
				cancelAtPeriodEnd: true
			};

			console.log(`[Billing Cancel] Cancelled LemonSqueezy subscription for user ${user.id}`);
		} else {
			// No valid provider - shouldn't happen if canCancelSubscription passed
			return json(
				{
					error: 'No valid subscription to cancel',
					code: 'NO_SUBSCRIPTION'
				},
				{ status: 400 }
			);
		}

		return json({
			success: true,
			message: 'Subscription scheduled for cancellation',
			subscription: cancelledSubscription,
			effectiveDate
		});
	} catch (error) {
		console.error('[Billing Cancel] Error cancelling subscription:', error);

		// Handle specific Stripe errors
		if (error instanceof Error && 'type' in error) {
			const stripeError = error as { type: string; message: string; code?: string };

			if (stripeError.code === 'resource_missing') {
				return json(
					{
						error: 'Subscription not found',
						code: 'SUBSCRIPTION_NOT_FOUND',
						details: 'The subscription may have already been cancelled or deleted.'
					},
					{ status: 400 }
				);
			}
		}

		return json(
			{
				error: 'Failed to cancel subscription',
				code: 'CANCEL_ERROR',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
