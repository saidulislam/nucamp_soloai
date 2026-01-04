/**
 * LemonSqueezy Type Definitions
 * (LS02-Install-LemonSqueezy-SDK.md)
 *
 * Custom type definitions for LemonSqueezy integration.
 * These are application-specific types that complement the SDK's built-in types.
 */

// ============================================================================
// Checkout Session Types
// ============================================================================

/**
 * Subscription billing interval options
 */
export type BillingInterval = 'month' | 'year';

/**
 * Parameters for creating a LemonSqueezy checkout
 */
export interface CreateCheckoutParams {
	/** LemonSqueezy Variant ID for the product/subscription */
	variantId: string;
	/** User's email for pre-filling checkout */
	email?: string;
	/** User's name for pre-filling checkout */
	name?: string;
	/** Internal user ID for custom data */
	userId: string;
	/** Subscription tier name for custom data */
	tier?: string;
	/** URL to redirect on successful payment */
	successUrl: string;
	/** URL to redirect on cancelled payment */
	cancelUrl: string;
	/** Discount code to apply */
	discountCode?: string;
	/** Additional custom data to attach */
	customData?: Record<string, string>;
}

/**
 * Result of checkout creation
 */
export interface CheckoutResult {
	/** The checkout URL to redirect user to */
	url: string;
	/** The checkout ID */
	checkoutId?: string;
}

/**
 * Error result for checkout operations
 */
export interface LemonSqueezyError {
	/** Error code for programmatic handling */
	code:
		| 'LEMONSQUEEZY_NOT_CONFIGURED'
		| 'CHECKOUT_CREATION_FAILED'
		| 'INVALID_VARIANT'
		| 'STORE_NOT_FOUND'
		| 'API_ERROR'
		| 'UNKNOWN_ERROR';
	/** Human-readable error message */
	message: string;
	/** Original error details if available */
	details?: unknown;
}

// ============================================================================
// Webhook Types
// ============================================================================

/**
 * LemonSqueezy webhook event types we handle
 */
export type LemonSqueezyWebhookEventType =
	| 'subscription_created'
	| 'subscription_updated'
	| 'subscription_cancelled'
	| 'subscription_resumed'
	| 'subscription_expired'
	| 'subscription_paused'
	| 'subscription_unpaused'
	| 'subscription_payment_success'
	| 'subscription_payment_failed'
	| 'subscription_payment_recovered'
	| 'order_created'
	| 'order_refunded'
	| 'license_key_created';

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
	/** The raw payload if valid */
	payload?: string;
	/** Error message if invalid */
	error?: string;
}

/**
 * LemonSqueezy webhook payload structure
 */
export interface LemonSqueezyWebhookPayload {
	meta: {
		event_name: LemonSqueezyWebhookEventType;
		custom_data?: {
			user_id?: string;
			success_url?: string;
			cancel_url?: string;
			[key: string]: string | undefined;
		};
		test_mode: boolean;
	};
	data: {
		id: string;
		type: string;
		attributes: Record<string, unknown>;
		relationships?: Record<string, unknown>;
	};
}

// ============================================================================
// Subscription Types
// ============================================================================

/**
 * LemonSqueezy subscription status
 */
export type LemonSqueezySubscriptionStatus =
	| 'on_trial'
	| 'active'
	| 'paused'
	| 'past_due'
	| 'unpaid'
	| 'cancelled'
	| 'expired';

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
 * Map LemonSqueezy subscription status to simple status
 */
export function mapSubscriptionStatus(lsStatus: LemonSqueezySubscriptionStatus): SimpleSubscriptionStatus {
	switch (lsStatus) {
		case 'active':
			return 'active';
		case 'on_trial':
			return 'trialing';
		case 'past_due':
			return 'past_due';
		case 'cancelled':
		case 'expired':
			return 'canceled';
		case 'unpaid':
			return 'unpaid';
		case 'paused':
			return 'active'; // Treat paused as active for simplicity
		default:
			return 'incomplete';
	}
}

// ============================================================================
// Customer Types
// ============================================================================

/**
 * Parameters for customer data
 */
export interface CustomerParams {
	/** Customer email */
	email: string;
	/** Customer name */
	name?: string;
	/** Internal user ID */
	userId: string;
}

// ============================================================================
// Product/Variant Types
// ============================================================================

/**
 * Simplified variant information for frontend display
 */
export interface VariantInfo {
	/** LemonSqueezy Variant ID */
	id: string;
	/** Product ID this variant belongs to */
	productId: string;
	/** Variant name */
	name: string;
	/** Price in cents */
	price: number;
	/** Currency code (e.g., 'USD') */
	currency: string;
	/** Billing interval */
	interval: BillingInterval | null;
	/** Whether this is a subscription variant */
	isSubscription: boolean;
	/** Whether this variant is active */
	active: boolean;
}

/**
 * Product with its variants
 */
export interface ProductWithVariants {
	/** LemonSqueezy Product ID */
	id: string;
	/** Product name */
	name: string;
	/** Product description */
	description: string | null;
	/** Whether product is active */
	active: boolean;
	/** Associated variants */
	variants: VariantInfo[];
}

// ============================================================================
// Service Response Types
// ============================================================================

/**
 * Generic success response
 */
export interface LemonSqueezySuccessResponse<T> {
	success: true;
	data: T;
}

/**
 * Generic error response
 */
export interface LemonSqueezyErrorResponse {
	success: false;
	error: LemonSqueezyError;
}

/**
 * Combined response type
 */
export type LemonSqueezyResponse<T> = LemonSqueezySuccessResponse<T> | LemonSqueezyErrorResponse;

/**
 * Type guard for success response
 */
export function isLemonSqueezySuccess<T>(
	response: LemonSqueezyResponse<T>
): response is LemonSqueezySuccessResponse<T> {
	return response.success === true;
}

/**
 * Type guard for error response
 */
export function isLemonSqueezyError<T>(
	response: LemonSqueezyResponse<T>
): response is LemonSqueezyErrorResponse {
	return response.success === false;
}

// ============================================================================
// Checkout Options Types
// ============================================================================

/**
 * Options for checkout appearance
 */
export interface CheckoutOptions {
	/** Show embedded mode (false for hosted checkout) */
	embed?: boolean;
	/** Show product media */
	media?: boolean;
	/** Show store logo */
	logo?: boolean;
	/** Show product description */
	desc?: boolean;
	/** Show discount code field */
	discount?: boolean;
	/** Use dark theme */
	dark?: boolean;
	/** Show subscription preview */
	subscriptionPreview?: boolean;
	/** Primary button color (hex) */
	buttonColor?: string;
}
