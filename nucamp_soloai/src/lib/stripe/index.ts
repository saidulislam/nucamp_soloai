/**
 * Stripe Module Exports
 * (ST02-Install-Stripe-SDK.md)
 *
 * Central export point for all Stripe-related utilities.
 *
 * IMPORTANT: This module should only be imported in server-side code
 * (+server.ts, +page.server.ts, hooks.server.ts) as it uses secret keys.
 *
 * @example
 * ```ts
 * // In a +server.ts file
 * import {
 *   getStripe,
 *   createCheckoutSession,
 *   verifyWebhookSignature
 * } from '$lib/stripe';
 * ```
 */

// ============================================================================
// Server Client
// ============================================================================

export {
	getStripe,
	getStripeOrNull,
	isStripeReady,
	getStripeInitError,
	verifyWebhookSignature,
	verifyWebhookSignatureWithResult,
	getCustomer,
	getSubscription,
	getCustomerSubscriptions
} from './server';

// Re-export Stripe SDK types
export type { Stripe, StripeSDK } from './server';

// ============================================================================
// Checkout & Portal
// ============================================================================

export {
	createCheckoutSession,
	getCheckoutSession,
	expireCheckoutSession,
	createPortalSession,
	getOrCreateCustomer,
	updateDefaultPaymentMethod,
	cancelSubscriptionAtPeriodEnd,
	reactivateSubscription,
	changeSubscriptionPlan
} from './checkout';

// ============================================================================
// Types
// ============================================================================

export type {
	// Checkout types
	BillingInterval,
	CreateCheckoutSessionParams,
	CheckoutSessionResult,
	CheckoutError,
	// Webhook types
	StripeWebhookEventType,
	WebhookHandlerResult,
	WebhookVerificationResult,
	// Customer types
	CustomerParams,
	CustomerWithSubscription,
	// Portal types
	CreatePortalSessionParams,
	PortalSessionResult,
	// Product/Price types
	PriceInfo,
	ProductWithPrices,
	// Subscription types
	SimpleSubscriptionStatus,
	// Response types
	StripeSuccessResponse,
	StripeErrorResponse,
	StripeResponse
} from './types';

// Export utility functions from types
export { mapSubscriptionStatus, isStripeSuccess, isStripeError } from './types';
