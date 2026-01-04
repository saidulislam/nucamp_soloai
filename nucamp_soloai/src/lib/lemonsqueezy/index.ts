/**
 * LemonSqueezy Module Exports
 * (LS02-Install-LemonSqueezy-SDK.md)
 *
 * Central export point for all LemonSqueezy-related utilities.
 *
 * IMPORTANT: This module should only be imported in server-side code
 * (+server.ts, +page.server.ts, hooks.server.ts) as it uses API keys.
 *
 * INTEGRATION CONTEXT:
 * LemonSqueezy is the payment provider for non-US users (all locales except 'en').
 * US users are handled by Stripe (see $lib/stripe).
 *
 * @example
 * ```ts
 * // In a +server.ts file
 * import {
 *   isLemonSqueezyReady,
 *   createCheckoutUrl,
 *   verifyWebhookSignature
 * } from '$lib/lemonsqueezy';
 * ```
 */

// ============================================================================
// Client
// ============================================================================

export {
	initLemonSqueezy,
	ensureInitialized,
	isLemonSqueezyReady,
	getLemonSqueezyInitError,
	getStoreId,
	isTestMode,
	verifyCredentials,
	getConfigSummary
} from './client';

// ============================================================================
// Checkout & Subscription Management
// ============================================================================

export {
	createCheckoutUrl,
	createCheckoutUrlWithOptions,
	getCustomerPortalUrl,
	cancelSubscription,
	resumeSubscription
} from './checkout';

// ============================================================================
// Webhooks
// ============================================================================

export {
	verifyWebhookSignature,
	verifyWebhookSignatureWithResult,
	parseWebhookPayload,
	getEventType,
	getCustomData,
	isTestModeWebhook,
	isSubscriptionEvent,
	isOrderEvent,
	extractSubscriptionData,
	extractOrderData,
	SUBSCRIPTION_EVENTS,
	ORDER_EVENTS
} from './webhooks';

// ============================================================================
// Types
// ============================================================================

export type {
	// Checkout types
	BillingInterval,
	CreateCheckoutParams,
	CheckoutResult,
	LemonSqueezyError,
	CheckoutOptions,
	// Webhook types
	LemonSqueezyWebhookEventType,
	WebhookHandlerResult,
	WebhookVerificationResult,
	LemonSqueezyWebhookPayload,
	// Subscription types
	LemonSqueezySubscriptionStatus,
	SimpleSubscriptionStatus,
	// Customer types
	CustomerParams,
	// Product/Variant types
	VariantInfo,
	ProductWithVariants,
	// Response types
	LemonSqueezySuccessResponse,
	LemonSqueezyErrorResponse,
	LemonSqueezyResponse
} from './types';

// Export utility functions from types
export {
	mapSubscriptionStatus,
	isLemonSqueezySuccess,
	isLemonSqueezyError
} from './types';
