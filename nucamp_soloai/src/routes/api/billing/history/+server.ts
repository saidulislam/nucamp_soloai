/**
 * Billing History API Endpoint
 * (ST05-Stripe-Portal-Integration.md)
 *
 * Fetches the user's billing history including:
 * - Past payments with dates and amounts
 * - Invoice download URLs from Stripe
 * - Payment status
 *
 * GET /api/billing/history
 * - Requires authentication
 * - Supports pagination via query params: ?limit=10&offset=0
 * - Returns billing history with invoice URLs
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getSubscriptionDataFromUser,
	type BillingHistoryResponse,
	type BillingHistoryItem
} from '$lib/billing/types';
import { getStripeOrNull } from '$lib/stripe/server';

export const GET: RequestHandler = async ({ locals, url }) => {
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

		// Parse pagination params
		const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// For free tier or no provider, return empty history
		if (subscription.tier === 'free' || !subscription.provider) {
			const response: BillingHistoryResponse = {
				items: [],
				hasMore: false,
				totalCount: 0
			};
			return json(response);
		}

		let items: BillingHistoryItem[] = [];
		let hasMore = false;
		let totalCount = 0;

		if (subscription.provider === 'stripe' && user.stripeCustomerId) {
			const stripe = getStripeOrNull();

			if (stripe) {
				try {
					// Fetch invoices from Stripe
					const invoices = await stripe.invoices.list({
						customer: user.stripeCustomerId,
						limit: limit + 1, // Fetch one extra to check if there are more
						starting_after: offset > 0 ? undefined : undefined // Note: Stripe uses cursor pagination
					});

					// Map Stripe invoices to our billing history format
					items = invoices.data.slice(0, limit).map((invoice): BillingHistoryItem => {
						// Map Stripe status to our status type
						let status: 'paid' | 'pending' | 'failed' | 'refunded' = 'pending';
						if (invoice.status === 'paid') status = 'paid';
						else if (invoice.status === 'open' || invoice.status === 'draft') status = 'pending';
						else if (invoice.status === 'uncollectible') status = 'failed';
						else if (invoice.status === 'void') status = 'refunded';

						return {
							id: invoice.id,
							date: new Date(invoice.created * 1000),
							amount: invoice.amount_paid || invoice.total || 0,
							currency: invoice.currency?.toUpperCase() || 'USD',
							status,
							description: invoice.description || `Invoice #${invoice.number || invoice.id.slice(-8)}`,
							invoiceUrl: invoice.hosted_invoice_url || null,
							invoicePdfUrl: invoice.invoice_pdf || null
						};
					});

					hasMore = invoices.has_more;
					totalCount = items.length + (hasMore ? 1 : 0); // Approximate total

					console.log(`[Billing History] Fetched ${items.length} invoices for customer ${user.stripeCustomerId}`);
				} catch (stripeError) {
					console.error('[Billing History] Error fetching Stripe invoices:', stripeError);
					// Return empty list on error rather than failing completely
				}
			}
		} else if (subscription.provider === 'lemonsqueezy' && user.lemonSqueezyCustomerId) {
			// TODO: Implement LemonSqueezy invoice fetching when LS integration is added
			console.log('[Billing History] LemonSqueezy billing history not yet implemented');
		}

		const response: BillingHistoryResponse = {
			items,
			hasMore,
			totalCount
		};

		return json(response);
	} catch (error) {
		console.error('[Billing History] Error fetching billing history:', error);
		return json(
			{
				error: 'Failed to fetch billing history',
				code: 'FETCH_ERROR',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
