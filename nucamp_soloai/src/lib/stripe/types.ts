/**
 * Stripe Type Definitions
 * (ST02-Install-Stripe-SDK.md)
 *
 * Custom type definitions for Stripe integration.
 * The Stripe SDK provides its own types, these are application-specific extensions.
 */

import type Stripe from 'stripe';

// ============================================================================
// Extended Stripe Types (for properties not always exposed)
// ============================================================================

/**
 * Subscription with current_period_end exposed
 */
export type SubscriptionWithPeriodEnd = Stripe.Subscription & {
	current_period_end: number;
};

/**
 * Invoice with subscription field exposed
 */
export type InvoiceWithSubscription = Stripe.Invoice & {
	subscription: string | Stripe.Subscription | null;
};

// ============================================================================
// Checkout Session Types
// ============================================================================

/**
 * Subscription billing interval options
 */
export type BillingInterval = 'month' | 'year';

/**
 * Parameters for creating a checkout session
 */
export interface CreateCheckoutSessionParams {
	/** Stripe Price ID for the subscription */
	priceId: string;
	/** User's email for pre-filling checkout */
	customerEmail?: string;
	/** Existing Stripe Customer ID (if user already has one) */
	customerId?: string;
	/** Internal user ID for metadata */
	userId?: string;
	/** Subscription tier name for metadata */
	tier?: string;
	/** URL to redirect on successful payment */
	successUrl?: string;
	/** URL to redirect on cancelled payment */
	cancelUrl?: string;
	/** Allow promotion codes in checkout */
	allowPromotionCodes?: boolean;
	/** Trial period in days */
	trialPeriodDays?: number;
	/** Additional metadata to attach to the session */
	metadata?: Record<string, string>;
}

/**
 * Result of checkout session creation
 */
export interface CheckoutSessionResult {
	/** The created Stripe Checkout Session */
	session: Stripe.Checkout.Session;
	/** URL to redirect user to Stripe Checkout */
	url: string;
}

/**
 * Error result for checkout operations
 */
export interface CheckoutError {
	/** Error code for programmatic handling */
	code: 'STRIPE_NOT_CONFIGURED' | 'SESSION_CREATION_FAILED' | 'INVALID_PRICE' | 'UNKNOWN_ERROR';
	/** Human-readable error message */
	message: string;
	/** Original Stripe error if available */
	stripeError?: Stripe.errors.StripeError;
}

// ============================================================================
// Webhook Types
// ============================================================================

/**
 * Webhook event types we handle
 */
export type StripeWebhookEventType =
	| 'checkout.session.completed'
	| 'checkout.session.expired'
	| 'customer.subscription.created'
	| 'customer.subscription.updated'
	| 'customer.subscription.deleted'
	| 'invoice.paid'
	| 'invoice.payment_failed'
	| 'customer.created'
	| 'customer.updated';

/**
 * Webhook handler result
 */
export interface WebhookHandlerResult {
	/** Whether the webhook was handled successfully */
	success: boolean;
	/** Event type that was processed */
	eventType: string;
	/** Optional message for logging */
	message?: string;
	/** Error details if failed */
	error?: string;
}

/**
 * Webhook verification result
 */
export interface WebhookVerificationResult {
	/** Whether the signature is valid */
	valid: boolean;
	/** The verified event if valid */
	event?: Stripe.Event;
	/** Error message if invalid */
	error?: string;
}

// ============================================================================
// Customer Types
// ============================================================================

/**
 * Parameters for creating/updating a Stripe customer
 */
export interface CustomerParams {
	/** Customer email */
	email: string;
	/** Customer name */
	name?: string;
	/** Internal user ID */
	userId: string;
	/** Additional metadata */
	metadata?: Record<string, string>;
}

/**
 * Customer with subscription info
 */
export interface CustomerWithSubscription {
	/** Stripe Customer object */
	customer: Stripe.Customer;
	/** Active subscription if any */
	subscription: Stripe.Subscription | null;
}

// ============================================================================
// Portal Types
// ============================================================================

/**
 * Parameters for creating a billing portal session
 */
export interface CreatePortalSessionParams {
	/** Stripe Customer ID */
	customerId: string;
	/** URL to return to after portal session */
	returnUrl: string;
}

/**
 * Result of portal session creation
 */
export interface PortalSessionResult {
	/** URL to redirect user to billing portal */
	url: string;
}

// ============================================================================
// Product/Price Types
// ============================================================================

/**
 * Simplified price information for frontend display
 */
export interface PriceInfo {
	/** Stripe Price ID */
	id: string;
	/** Price in cents */
	unitAmount: number;
	/** Currency code (e.g., 'usd') */
	currency: string;
	/** Billing interval */
	interval: BillingInterval;
	/** Associated product ID */
	productId: string;
	/** Whether this price is active */
	active: boolean;
}

/**
 * Product with its prices
 */
export interface ProductWithPrices {
	/** Stripe Product ID */
	id: string;
	/** Product name */
	name: string;
	/** Product description */
	description: string | null;
	/** Whether product is active */
	active: boolean;
	/** Associated prices */
	prices: PriceInfo[];
	/** Product metadata */
	metadata: Record<string, string>;
}

// ============================================================================
// Subscription Status Types
// ============================================================================

/**
 * Simplified subscription status for internal use
 */
export type SimpleSubscriptionStatus =
	| 'active'
	| 'trialing'
	| 'past_due'
	| 'canceled'
	| 'unpaid'
	| 'incomplete';

/**
 * Map Stripe subscription status to simple status
 */
export function mapSubscriptionStatus(
	stripeStatus: Stripe.Subscription.Status
): SimpleSubscriptionStatus {
	switch (stripeStatus) {
		case 'active':
			return 'active';
		case 'trialing':
			return 'trialing';
		case 'past_due':
			return 'past_due';
		case 'canceled':
			return 'canceled';
		case 'unpaid':
			return 'unpaid';
		case 'incomplete':
		case 'incomplete_expired':
			return 'incomplete';
		case 'paused':
			return 'active'; // Treat paused as active for simplicity
		default:
			return 'incomplete';
	}
}

// ============================================================================
// Service Response Types
// ============================================================================

/**
 * Generic success response
 */
export interface StripeSuccessResponse<T> {
	success: true;
	data: T;
}

/**
 * Generic error response
 */
export interface StripeErrorResponse {
	success: false;
	error: CheckoutError;
}

/**
 * Combined response type
 */
export type StripeResponse<T> = StripeSuccessResponse<T> | StripeErrorResponse;

/**
 * Type guard for success response
 */
export function isStripeSuccess<T>(response: StripeResponse<T>): response is StripeSuccessResponse<T> {
	return response.success === true;
}

/**
 * Type guard for error response
 */
export function isStripeError<T>(response: StripeResponse<T>): response is StripeErrorResponse {
	return response.success === false;
}
