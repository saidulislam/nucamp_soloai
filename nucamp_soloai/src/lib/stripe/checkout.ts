/**
 * Stripe Checkout Session Utilities
 * (ST02-Install-Stripe-SDK.md)
 *
 * This module provides utilities for creating Stripe Checkout sessions
 * for subscription payments. Uses Stripe-hosted payment pages.
 *
 * SECURITY NOTES:
 * - Server-side only - never import in client code
 * - All sensitive operations use the secret key
 */

import type Stripe from 'stripe';
import { getStripe, getStripeOrNull } from './server';
import { getStripeConfig } from '$lib/billing/stripe-config';
import type {
	CreateCheckoutSessionParams,
	CheckoutSessionResult,
	CheckoutError,
	StripeResponse,
	CreatePortalSessionParams,
	PortalSessionResult
} from './types';

// ============================================================================
// Checkout Session Creation
// ============================================================================

/**
 * Create a Stripe Checkout session for subscription
 *
 * @param params - Checkout session parameters
 * @returns Result with session URL or error
 *
 * @example
 * ```ts
 * import { createCheckoutSession } from '$lib/stripe/checkout';
 *
 * const result = await createCheckoutSession({
 *   priceId: 'price_xxxxx',
 *   customerEmail: 'user@example.com',
 *   userId: 'user_123',
 *   tier: 'pro'
 * });
 *
 * if (result.success) {
 *   redirect(303, result.data.url);
 * }
 * ```
 */
export async function createCheckoutSession(
	params: CreateCheckoutSessionParams
): Promise<StripeResponse<CheckoutSessionResult>> {
	const stripe = getStripeOrNull();

	if (!stripe) {
		return {
			success: false,
			error: {
				code: 'STRIPE_NOT_CONFIGURED',
				message: 'Stripe is not configured. Please check your environment variables.'
			}
		};
	}

	const config = getStripeConfig();

	try {
		// Build session configuration
		const sessionConfig: Stripe.Checkout.SessionCreateParams = {
			mode: 'subscription',
			payment_method_types: ['card'],
			line_items: [
				{
					price: params.priceId,
					quantity: 1
				}
			],
			success_url: params.successUrl || config.successUrl,
			cancel_url: params.cancelUrl || config.cancelUrl,
			// Metadata for webhook processing
			metadata: {
				userId: params.userId || '',
				tier: params.tier || '',
				...params.metadata
			},
			// Subscription-specific settings
			subscription_data: {
				metadata: {
					userId: params.userId || '',
					tier: params.tier || ''
				}
			}
		};

		// Add customer info
		if (params.customerId) {
			// Use existing customer
			sessionConfig.customer = params.customerId;
		} else if (params.customerEmail) {
			// Pre-fill email for new customer
			sessionConfig.customer_email = params.customerEmail;
		}

		// Optional: Allow promotion codes
		if (params.allowPromotionCodes) {
			sessionConfig.allow_promotion_codes = true;
		}

		// Optional: Add trial period
		if (params.trialPeriodDays && params.trialPeriodDays > 0) {
			sessionConfig.subscription_data!.trial_period_days = params.trialPeriodDays;
		}

		// Create the session
		const session = await stripe.checkout.sessions.create(sessionConfig);

		if (!session.url) {
			return {
				success: false,
				error: {
					code: 'SESSION_CREATION_FAILED',
					message: 'Checkout session created but URL is missing'
				}
			};
		}

		return {
			success: true,
			data: {
				session,
				url: session.url
			}
		};
	} catch (error) {
		console.error('[Stripe Checkout] Session creation error:', error);

		if (error instanceof Error && 'type' in error) {
			const stripeError = error as Stripe.errors.StripeError;

			// Handle specific Stripe errors
			if (stripeError.code === 'resource_missing') {
				return {
					success: false,
					error: {
						code: 'INVALID_PRICE',
						message: 'The specified price does not exist',
						stripeError
					}
				};
			}

			return {
				success: false,
				error: {
					code: 'SESSION_CREATION_FAILED',
					message: stripeError.message || 'Failed to create checkout session',
					stripeError
				}
			};
		}

		return {
			success: false,
			error: {
				code: 'UNKNOWN_ERROR',
				message: error instanceof Error ? error.message : 'An unexpected error occurred'
			}
		};
	}
}

/**
 * Retrieve a checkout session by ID
 *
 * @param sessionId - Stripe Checkout Session ID
 * @returns The session or null if not found
 */
export async function getCheckoutSession(
	sessionId: string
): Promise<Stripe.Checkout.Session | null> {
	const stripe = getStripeOrNull();
	if (!stripe) return null;

	try {
		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ['subscription', 'customer']
		});
		return session;
	} catch (error) {
		console.error('[Stripe Checkout] Error retrieving session:', error);
		return null;
	}
}

/**
 * Expire a checkout session (cancel it)
 *
 * @param sessionId - Stripe Checkout Session ID
 * @returns Whether the expiration was successful
 */
export async function expireCheckoutSession(sessionId: string): Promise<boolean> {
	const stripe = getStripeOrNull();
	if (!stripe) return false;

	try {
		await stripe.checkout.sessions.expire(sessionId);
		return true;
	} catch (error) {
		console.error('[Stripe Checkout] Error expiring session:', error);
		return false;
	}
}

// ============================================================================
// Customer Portal
// ============================================================================

/**
 * Create a billing portal session for subscription management
 *
 * @param params - Portal session parameters
 * @returns Result with portal URL or error
 *
 * @example
 * ```ts
 * import { createPortalSession } from '$lib/stripe/checkout';
 *
 * const result = await createPortalSession({
 *   customerId: 'cus_xxxxx',
 *   returnUrl: 'https://app.example.com/account'
 * });
 *
 * if (result.success) {
 *   redirect(303, result.data.url);
 * }
 * ```
 */
export async function createPortalSession(
	params: CreatePortalSessionParams
): Promise<StripeResponse<PortalSessionResult>> {
	const stripe = getStripeOrNull();

	if (!stripe) {
		return {
			success: false,
			error: {
				code: 'STRIPE_NOT_CONFIGURED',
				message: 'Stripe is not configured'
			}
		};
	}

	try {
		const session = await stripe.billingPortal.sessions.create({
			customer: params.customerId,
			return_url: params.returnUrl
		});

		return {
			success: true,
			data: {
				url: session.url
			}
		};
	} catch (error) {
		console.error('[Stripe Portal] Session creation error:', error);

		return {
			success: false,
			error: {
				code: 'SESSION_CREATION_FAILED',
				message: error instanceof Error ? error.message : 'Failed to create portal session'
			}
		};
	}
}

// ============================================================================
// Customer Management
// ============================================================================

/**
 * Create or get a Stripe customer for a user
 *
 * @param email - Customer email
 * @param userId - Internal user ID for metadata
 * @param name - Optional customer name
 * @returns The Stripe customer or null on error
 */
export async function getOrCreateCustomer(
	email: string,
	userId: string,
	name?: string
): Promise<Stripe.Customer | null> {
	const stripe = getStripeOrNull();
	if (!stripe) return null;

	try {
		// Search for existing customer by email
		const existingCustomers = await stripe.customers.list({
			email,
			limit: 1
		});

		if (existingCustomers.data.length > 0) {
			const customer = existingCustomers.data[0];
			// Update metadata if needed
			if (customer.metadata?.userId !== userId) {
				await stripe.customers.update(customer.id, {
					metadata: { userId }
				});
			}
			return customer;
		}

		// Create new customer
		const customer = await stripe.customers.create({
			email,
			name: name || undefined,
			metadata: { userId }
		});

		return customer;
	} catch (error) {
		console.error('[Stripe Customer] Error:', error);
		return null;
	}
}

/**
 * Update a customer's default payment method
 *
 * @param customerId - Stripe Customer ID
 * @param paymentMethodId - Stripe Payment Method ID
 * @returns Whether the update was successful
 */
export async function updateDefaultPaymentMethod(
	customerId: string,
	paymentMethodId: string
): Promise<boolean> {
	const stripe = getStripeOrNull();
	if (!stripe) return false;

	try {
		await stripe.customers.update(customerId, {
			invoice_settings: {
				default_payment_method: paymentMethodId
			}
		});
		return true;
	} catch (error) {
		console.error('[Stripe Customer] Error updating payment method:', error);
		return false;
	}
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Cancel a subscription at period end
 *
 * @param subscriptionId - Stripe Subscription ID
 * @returns The updated subscription or null on error
 */
export async function cancelSubscriptionAtPeriodEnd(
	subscriptionId: string
): Promise<Stripe.Subscription | null> {
	const stripe = getStripeOrNull();
	if (!stripe) return null;

	try {
		const subscription = await stripe.subscriptions.update(subscriptionId, {
			cancel_at_period_end: true
		});
		return subscription;
	} catch (error) {
		console.error('[Stripe Subscription] Error canceling:', error);
		return null;
	}
}

/**
 * Reactivate a subscription that was set to cancel
 *
 * @param subscriptionId - Stripe Subscription ID
 * @returns The updated subscription or null on error
 */
export async function reactivateSubscription(
	subscriptionId: string
): Promise<Stripe.Subscription | null> {
	const stripe = getStripeOrNull();
	if (!stripe) return null;

	try {
		const subscription = await stripe.subscriptions.update(subscriptionId, {
			cancel_at_period_end: false
		});
		return subscription;
	} catch (error) {
		console.error('[Stripe Subscription] Error reactivating:', error);
		return null;
	}
}

/**
 * Change subscription to a different price/plan
 *
 * @param subscriptionId - Stripe Subscription ID
 * @param newPriceId - New Stripe Price ID
 * @returns The updated subscription or null on error
 */
export async function changeSubscriptionPlan(
	subscriptionId: string,
	newPriceId: string
): Promise<Stripe.Subscription | null> {
	const stripe = getStripeOrNull();
	if (!stripe) return null;

	try {
		// Get current subscription
		const subscription = await stripe.subscriptions.retrieve(subscriptionId);

		if (subscription.items.data.length === 0) {
			console.error('[Stripe Subscription] No items found');
			return null;
		}

		// Update to new price
		const updated = await stripe.subscriptions.update(subscriptionId, {
			items: [
				{
					id: subscription.items.data[0].id,
					price: newPriceId
				}
			],
			proration_behavior: 'create_prorations'
		});

		return updated;
	} catch (error) {
		console.error('[Stripe Subscription] Error changing plan:', error);
		return null;
	}
}
