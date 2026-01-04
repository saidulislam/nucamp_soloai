/**
 * LemonSqueezy Checkout Utilities
 * (LS02-Install-LemonSqueezy-SDK.md)
 *
 * This module provides utilities for creating LemonSqueezy checkout URLs
 * for subscription payments. Uses LemonSqueezy-hosted checkout pages.
 *
 * IMPORTANT NOTES:
 * - Success/cancel URLs must be in `custom` data, NOT in `checkoutOptions`
 * - The checkout URL is signed by LemonSqueezy - never modify it after receiving
 * - Modifying the URL breaks the signature and causes "Invalid signature" errors
 * - Handle redirects in webhook handler using URLs from `meta.custom_data`
 *
 * SECURITY NOTES:
 * - Server-side only - never import in client code
 * - All sensitive operations use the API key
 */

import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { getStoreId, isTestMode, ensureInitialized, isLemonSqueezyReady } from './client';
import type {
	CreateCheckoutParams,
	CheckoutResult,
	LemonSqueezyResponse,
	CheckoutOptions
} from './types';

// ============================================================================
// Default Checkout Options
// ============================================================================

const DEFAULT_CHECKOUT_OPTIONS: CheckoutOptions = {
	embed: false, // Use hosted checkout, not embedded
	media: true,
	logo: true,
	desc: true,
	discount: true,
	dark: false,
	subscriptionPreview: true,
	buttonColor: '#3B82F6' // Tailwind blue-500
};

// ============================================================================
// Checkout Creation
// ============================================================================

/**
 * Create a LemonSqueezy checkout URL for subscription
 *
 * @param params - Checkout parameters
 * @returns Result with checkout URL or error
 *
 * @example
 * ```ts
 * import { createCheckoutUrl } from '$lib/lemonsqueezy/checkout';
 *
 * const result = await createCheckoutUrl({
 *   variantId: '12345',
 *   email: 'user@example.com',
 *   userId: 'user_123',
 *   tier: 'pro',
 *   successUrl: 'https://app.example.com/account?success=true',
 *   cancelUrl: 'https://app.example.com/pricing?canceled=true'
 * });
 *
 * if (result.success) {
 *   redirect(303, result.data.url);
 * }
 * ```
 */
export async function createCheckoutUrl(
	params: CreateCheckoutParams
): Promise<LemonSqueezyResponse<CheckoutResult>> {
	// Check if LemonSqueezy is ready
	if (!isLemonSqueezyReady()) {
		return {
			success: false,
			error: {
				code: 'LEMONSQUEEZY_NOT_CONFIGURED',
				message: 'LemonSqueezy is not configured. Please check your environment variables.'
			}
		};
	}

	try {
		ensureInitialized();

		// Get store ID (fetches from API if not in env)
		const storeId = await getStoreId();
		const testMode = isTestMode();

		// Build custom data with user info and redirect URLs
		// IMPORTANT: Success/cancel URLs go in custom data, not checkoutOptions
		const customData: Record<string, string> = {
			user_id: params.userId,
			success_url: params.successUrl,
			cancel_url: params.cancelUrl
		};

		if (params.tier) {
			customData.tier = params.tier;
		}

		// Merge any additional custom data
		if (params.customData) {
			Object.assign(customData, params.customData);
		}

		// Create checkout session
		const { data: checkout, error } = await createCheckout(storeId, params.variantId, {
			checkoutData: {
				email: params.email,
				name: params.name,
				custom: customData
			},
			checkoutOptions: {
				embed: DEFAULT_CHECKOUT_OPTIONS.embed,
				media: DEFAULT_CHECKOUT_OPTIONS.media,
				logo: DEFAULT_CHECKOUT_OPTIONS.logo,
				desc: DEFAULT_CHECKOUT_OPTIONS.desc,
				discount: DEFAULT_CHECKOUT_OPTIONS.discount,
				dark: DEFAULT_CHECKOUT_OPTIONS.dark,
				subscriptionPreview: DEFAULT_CHECKOUT_OPTIONS.subscriptionPreview,
				buttonColor: DEFAULT_CHECKOUT_OPTIONS.buttonColor
			},
			expiresAt: undefined,
			preview: false,
			testMode
		});

		if (error) {
			console.error('[LemonSqueezy Checkout] API error:', error);
			return {
				success: false,
				error: {
					code: 'CHECKOUT_CREATION_FAILED',
					message: error.message || 'Failed to create checkout session',
					details: error
				}
			};
		}

		// Extract checkout URL from response
		// The SDK response structure can vary, so we check multiple paths
		const checkoutUrl =
			checkout?.data?.attributes?.url || checkout?.attributes?.url || (checkout as { url?: string })?.url;

		if (!checkoutUrl) {
			console.error('[LemonSqueezy Checkout] No URL in response:', checkout);
			return {
				success: false,
				error: {
					code: 'CHECKOUT_CREATION_FAILED',
					message: 'No checkout URL found in response'
				}
			};
		}

		// Get checkout ID if available
		const checkoutId = checkout?.data?.id || (checkout as { id?: string })?.id;

		console.log(
			`[LemonSqueezy Checkout] Created checkout for variant ${params.variantId}, user ${params.userId}`
		);

		// IMPORTANT: Return URL as-is, never modify it (it's signed)
		return {
			success: true,
			data: {
				url: checkoutUrl,
				checkoutId
			}
		};
	} catch (error) {
		console.error('[LemonSqueezy Checkout] Error creating checkout:', error);

		// Handle specific error types
		if (error instanceof Error) {
			if (error.message.includes('store')) {
				return {
					success: false,
					error: {
						code: 'STORE_NOT_FOUND',
						message: 'LemonSqueezy store not found. Please check your configuration.',
						details: error.message
					}
				};
			}

			if (error.message.includes('variant')) {
				return {
					success: false,
					error: {
						code: 'INVALID_VARIANT',
						message: 'The specified product variant does not exist.',
						details: error.message
					}
				};
			}
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
 * Create checkout URL with custom options
 *
 * @param params - Checkout parameters
 * @param options - Custom checkout appearance options
 * @returns Result with checkout URL or error
 */
export async function createCheckoutUrlWithOptions(
	params: CreateCheckoutParams,
	options: Partial<CheckoutOptions>
): Promise<LemonSqueezyResponse<CheckoutResult>> {
	// Check if LemonSqueezy is ready
	if (!isLemonSqueezyReady()) {
		return {
			success: false,
			error: {
				code: 'LEMONSQUEEZY_NOT_CONFIGURED',
				message: 'LemonSqueezy is not configured. Please check your environment variables.'
			}
		};
	}

	try {
		ensureInitialized();

		const storeId = await getStoreId();
		const testMode = isTestMode();

		// Merge custom options with defaults
		const checkoutOptions = { ...DEFAULT_CHECKOUT_OPTIONS, ...options };

		// Build custom data
		const customData: Record<string, string> = {
			user_id: params.userId,
			success_url: params.successUrl,
			cancel_url: params.cancelUrl
		};

		if (params.tier) {
			customData.tier = params.tier;
		}

		if (params.customData) {
			Object.assign(customData, params.customData);
		}

		const { data: checkout, error } = await createCheckout(storeId, params.variantId, {
			checkoutData: {
				email: params.email,
				name: params.name,
				custom: customData,
				discountCode: params.discountCode
			},
			checkoutOptions: {
				embed: checkoutOptions.embed,
				media: checkoutOptions.media,
				logo: checkoutOptions.logo,
				desc: checkoutOptions.desc,
				discount: checkoutOptions.discount,
				dark: checkoutOptions.dark,
				subscriptionPreview: checkoutOptions.subscriptionPreview,
				buttonColor: checkoutOptions.buttonColor
			},
			expiresAt: undefined,
			preview: false,
			testMode
		});

		if (error) {
			return {
				success: false,
				error: {
					code: 'CHECKOUT_CREATION_FAILED',
					message: error.message || 'Failed to create checkout session',
					details: error
				}
			};
		}

		const checkoutUrl =
			checkout?.data?.attributes?.url || checkout?.attributes?.url || (checkout as { url?: string })?.url;

		if (!checkoutUrl) {
			return {
				success: false,
				error: {
					code: 'CHECKOUT_CREATION_FAILED',
					message: 'No checkout URL found in response'
				}
			};
		}

		const checkoutId = checkout?.data?.id || (checkout as { id?: string })?.id;

		return {
			success: true,
			data: {
				url: checkoutUrl,
				checkoutId
			}
		};
	} catch (error) {
		console.error('[LemonSqueezy Checkout] Error:', error);

		return {
			success: false,
			error: {
				code: 'UNKNOWN_ERROR',
				message: error instanceof Error ? error.message : 'An unexpected error occurred'
			}
		};
	}
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Get the customer portal URL for a subscription
 * Note: LemonSqueezy generates portal URLs per subscription
 *
 * @param subscriptionId - LemonSqueezy subscription ID
 * @returns Portal URL or null if not found
 */
export async function getCustomerPortalUrl(subscriptionId: string): Promise<string | null> {
	if (!isLemonSqueezyReady()) {
		console.warn('[LemonSqueezy] Not configured, cannot get portal URL');
		return null;
	}

	try {
		// Import dynamically to avoid initialization issues
		const { getSubscription } = await import('@lemonsqueezy/lemonsqueezy.js');
		ensureInitialized();

		const { data, error } = await getSubscription(subscriptionId);

		if (error) {
			console.error('[LemonSqueezy] Error fetching subscription:', error);
			return null;
		}

		// Portal URL is in the subscription's URLs
		const urls = data?.data?.attributes?.urls;
		return urls?.customer_portal || null;
	} catch (error) {
		console.error('[LemonSqueezy] Error getting portal URL:', error);
		return null;
	}
}

/**
 * Cancel a subscription at period end
 *
 * @param subscriptionId - LemonSqueezy subscription ID
 * @returns Whether cancellation was successful
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
	if (!isLemonSqueezyReady()) {
		console.warn('[LemonSqueezy] Not configured, cannot cancel subscription');
		return false;
	}

	try {
		const { cancelSubscription: lsCancelSubscription } = await import(
			'@lemonsqueezy/lemonsqueezy.js'
		);
		ensureInitialized();

		const { error } = await lsCancelSubscription(subscriptionId);

		if (error) {
			console.error('[LemonSqueezy] Error cancelling subscription:', error);
			return false;
		}

		console.log(`[LemonSqueezy] Cancelled subscription ${subscriptionId}`);
		return true;
	} catch (error) {
		console.error('[LemonSqueezy] Error cancelling subscription:', error);
		return false;
	}
}

/**
 * Resume a paused subscription
 *
 * @param subscriptionId - LemonSqueezy subscription ID
 * @returns Whether resume was successful
 */
export async function resumeSubscription(subscriptionId: string): Promise<boolean> {
	if (!isLemonSqueezyReady()) {
		console.warn('[LemonSqueezy] Not configured, cannot resume subscription');
		return false;
	}

	try {
		const { updateSubscription } = await import('@lemonsqueezy/lemonsqueezy.js');
		ensureInitialized();

		const { error } = await updateSubscription(subscriptionId, {
			cancelled: false
		});

		if (error) {
			console.error('[LemonSqueezy] Error resuming subscription:', error);
			return false;
		}

		console.log(`[LemonSqueezy] Resumed subscription ${subscriptionId}`);
		return true;
	} catch (error) {
		console.error('[LemonSqueezy] Error resuming subscription:', error);
		return false;
	}
}
