/**
 * GTM Tracking Utilities
 * (TC01-Google-Tag-Manager-Setup.md, TC02-Google-Analytics-Hotjar-Setup.md)
 *
 * Utility functions for pushing events to GTM dataLayer.
 * These functions provide a type-safe API for tracking user actions,
 * page views, and custom events throughout the application.
 *
 * Includes GA4 and Hotjar integration functions for:
 * - User identification and properties
 * - Subscription purchase tracking
 * - E-commerce event tracking
 *
 * Usage:
 *   import { trackPageView, trackEvent, trackAction, identifyUser } from '$lib/utils/tracking';
 *   trackPageView('/dashboard');
 *   trackEvent('button_click', { button_id: 'signup' });
 *   identifyUser(userId, 'pro', 'en');
 */

import { browser } from '$app/environment';
import type { GTMDataLayerEvent } from '$lib/components/tracking/types';

// ============================================================================
// Core DataLayer Functions
// ============================================================================

/**
 * Push an event to the GTM dataLayer
 *
 * @param event - The event object to push to dataLayer
 * @returns void
 *
 * @example
 * pushToDataLayer({
 *   event: 'custom_event',
 *   custom_param: 'value'
 * });
 */
export function pushToDataLayer(event: GTMDataLayerEvent): void {
	if (!browser) return;

	// Initialize dataLayer if it doesn't exist
	if (!window.dataLayer) {
		console.warn('[Tracking] GTM not initialized, queueing event:', event.event);
		window.dataLayer = [event];
		return;
	}

	window.dataLayer.push(event);
}

// ============================================================================
// Page View Tracking
// ============================================================================

/**
 * Track a page view event (for SPA navigation)
 *
 * SvelteKit uses client-side routing, so we need to manually
 * send page view events on each navigation.
 *
 * @param path - The page path (e.g., '/dashboard')
 * @param title - Optional page title (defaults to document.title)
 *
 * @example
 * // In layout or page component
 * afterNavigate(({ to }) => {
 *   trackPageView(to.url.pathname);
 * });
 */
export function trackPageView(path: string, title?: string): void {
	if (!browser) return;

	pushToDataLayer({
		event: 'pageview',
		page: {
			path,
			title: title || document.title,
			url: window.location.href
		}
	});
}

/**
 * Track page view with GA4-compatible parameters
 *
 * @param path - The page path
 * @param title - Optional page title
 */
export function trackPageViewGA4(path: string, title?: string): void {
	if (!browser) return;

	pushToDataLayer({
		event: 'page_view',
		page_path: path,
		page_title: title || document.title,
		page_location: window.location.href
	});
}

// ============================================================================
// Event Tracking
// ============================================================================

/**
 * Track a custom event with optional parameters
 *
 * @param eventName - The name of the event
 * @param eventParams - Optional additional parameters
 *
 * @example
 * trackEvent('signup_started', { method: 'google' });
 * trackEvent('feature_used', { feature_name: 'export' });
 */
export function trackEvent(eventName: string, eventParams?: Record<string, unknown>): void {
	pushToDataLayer({
		event: eventName,
		...eventParams
	});
}

/**
 * Track a user action (legacy GA Universal Analytics format)
 *
 * @param category - Event category (e.g., 'Button', 'Form')
 * @param action - Event action (e.g., 'click', 'submit')
 * @param label - Optional event label
 * @param value - Optional numeric value
 *
 * @example
 * trackAction('Button', 'click', 'signup_button');
 * trackAction('Video', 'play', 'intro_video', 30);
 */
export function trackAction(
	category: string,
	action: string,
	label?: string,
	value?: number
): void {
	pushToDataLayer({
		event: 'user_action',
		eventCategory: category,
		eventAction: action,
		eventLabel: label,
		eventValue: value
	});
}

// ============================================================================
// E-commerce Tracking
// ============================================================================

/**
 * Track a purchase event (e-commerce)
 *
 * @param transactionId - Unique transaction ID
 * @param value - Total transaction value
 * @param currency - Currency code (e.g., 'USD')
 * @param items - Optional array of purchased items
 *
 * @example
 * trackPurchase('TXN123', 29.99, 'USD', [
 *   { item_id: 'pro_plan', item_name: 'Pro Plan', price: 29.99, quantity: 1 }
 * ]);
 */
export function trackPurchase(
	transactionId: string,
	value: number,
	currency: string = 'USD',
	items?: Array<{
		item_id: string;
		item_name: string;
		price: number;
		quantity: number;
	}>
): void {
	pushToDataLayer({
		event: 'purchase',
		ecommerce: {
			transaction_id: transactionId,
			value,
			currency,
			items
		}
	});
}

/**
 * Track when a user begins checkout
 *
 * @param value - Cart value
 * @param currency - Currency code
 * @param items - Cart items
 */
export function trackBeginCheckout(
	value: number,
	currency: string = 'USD',
	items?: Array<{
		item_id: string;
		item_name: string;
		price: number;
		quantity: number;
	}>
): void {
	pushToDataLayer({
		event: 'begin_checkout',
		ecommerce: {
			value,
			currency,
			items
		}
	});
}

// ============================================================================
// User Tracking (Privacy-Safe)
// ============================================================================

/**
 * Track user sign up
 *
 * @param method - Sign up method (e.g., 'email', 'google', 'github')
 */
export function trackSignUp(method: string): void {
	pushToDataLayer({
		event: 'sign_up',
		method
	});
}

/**
 * Track user login
 *
 * @param method - Login method (e.g., 'email', 'google', 'github')
 */
export function trackLogin(method: string): void {
	pushToDataLayer({
		event: 'login',
		method
	});
}

/**
 * Set user properties (hashed/anonymous only - no PII)
 *
 * @param userId - Hashed or anonymous user ID
 * @param properties - Additional user properties
 */
export function setUserProperties(userId: string, properties?: Record<string, unknown>): void {
	pushToDataLayer({
		event: 'user_properties',
		user_id: userId,
		...properties
	});
}

// ============================================================================
// Subscription Tracking
// ============================================================================

/**
 * Track subscription-related events
 *
 * @param action - Subscription action
 * @param tier - Subscription tier
 * @param interval - Billing interval
 */
export function trackSubscription(
	action: 'started' | 'upgraded' | 'downgraded' | 'cancelled' | 'renewed',
	tier: string,
	interval?: 'monthly' | 'annual'
): void {
	pushToDataLayer({
		event: `subscription_${action}`,
		subscription_tier: tier,
		subscription_interval: interval
	});
}

// ============================================================================
// Error Tracking
// ============================================================================

/**
 * Track application errors
 *
 * @param errorType - Type of error
 * @param errorMessage - Error message (sanitized)
 * @param errorLocation - Where the error occurred
 */
export function trackError(errorType: string, errorMessage: string, errorLocation?: string): void {
	pushToDataLayer({
		event: 'error',
		error_type: errorType,
		error_message: errorMessage,
		error_location: errorLocation
	});
}

// ============================================================================
// TC02: GA4 & Hotjar Integration Functions
// ============================================================================

/**
 * Hash a user ID for privacy-safe tracking
 * Uses base64 encoding with truncation (use proper hashing in production)
 *
 * @param userId - The raw user ID to hash
 * @returns Hashed user ID prefixed with 'user_'
 */
export function hashUserId(userId: string): string {
	if (!browser) return '';
	return `user_${btoa(userId).substring(0, 16)}`;
}

/**
 * Identify user for tracking (GA4 and Hotjar)
 * Pushes user properties to dataLayer for GTM variables
 * and triggers Hotjar user identification.
 *
 * @param userId - Raw user ID (will be hashed)
 * @param subscriptionTier - User's subscription tier (e.g., 'free', 'pro', 'enterprise')
 * @param locale - User's locale (e.g., 'en', 'es', 'fr')
 *
 * @example
 * identifyUser(currentUser.id, 'pro', 'en');
 */
export function identifyUser(userId: string, subscriptionTier: string, locale: string): void {
	if (!browser) return;

	const hashedUserId = hashUserId(userId);
	const paymentProvider = locale === 'en' ? 'stripe' : 'lemonsqueezy';

	// Push to dataLayer for GA4 and Hotjar GTM tags
	pushToDataLayer({
		event: 'user_authenticated',
		user: {
			id: hashedUserId,
			subscriptionTier,
			locale,
			paymentProvider
		}
	});

	// Direct Hotjar identify call (if Hotjar is loaded)
	if (typeof window.hj === 'function') {
		window.hj('identify', hashedUserId, {
			subscription_tier: subscriptionTier,
			locale,
			payment_provider: paymentProvider
		});
	}
}

/**
 * Track subscription purchase with e-commerce data
 * Follows GA4 e-commerce purchase event structure.
 *
 * @param tier - Subscription tier (e.g., 'pro', 'enterprise')
 * @param value - Purchase value
 * @param currency - Currency code (e.g., 'USD')
 * @param provider - Payment provider ('stripe' or 'lemonsqueezy')
 * @param interval - Billing interval ('monthly' or 'annual')
 *
 * @example
 * trackSubscriptionPurchase('pro', 29.99, 'USD', 'stripe', 'monthly');
 */
export function trackSubscriptionPurchase(
	tier: string,
	value: number,
	currency: string,
	provider: 'stripe' | 'lemonsqueezy',
	interval: 'monthly' | 'annual' = 'monthly'
): void {
	const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);

	pushToDataLayer({
		event: 'purchase',
		tier,
		provider,
		ecommerce: {
			transaction_id: `sub_${Date.now()}`,
			value,
			currency,
			items: [
				{
					item_id: `${tier}_${interval}`,
					item_name: `${tierName} Plan`,
					item_category: 'subscription',
					price: value,
					quantity: 1
				}
			]
		}
	});
}

/**
 * Track subscription tier change (upgrade/downgrade)
 *
 * @param fromTier - Previous subscription tier
 * @param toTier - New subscription tier
 *
 * @example
 * trackTierChange('free', 'pro');
 */
export function trackTierChange(fromTier: string, toTier: string): void {
	pushToDataLayer({
		event: 'tier_change',
		from_tier: fromTier,
		to_tier: toTier
	});
}

/**
 * Track locale/language change
 *
 * @param fromLocale - Previous locale
 * @param toLocale - New locale
 *
 * @example
 * trackLocaleChange('en', 'es');
 */
export function trackLocaleChange(fromLocale: string, toLocale: string): void {
	pushToDataLayer({
		event: 'locale_change',
		from_locale: fromLocale,
		to_locale: toLocale
	});
}

/**
 * Track payment provider selection
 * Used when user is directed to checkout based on locale.
 *
 * @param provider - Payment provider selected
 * @param locale - User locale that determined provider
 *
 * @example
 * trackPaymentProviderSelection('stripe', 'en');
 */
export function trackPaymentProviderSelection(
	provider: 'stripe' | 'lemonsqueezy',
	locale: string
): void {
	pushToDataLayer({
		event: 'payment_provider_selected',
		provider,
		locale
	});
}

/**
 * Track feature usage
 * Use this to track when users interact with specific features.
 *
 * @param featureName - Name of the feature
 * @param action - Action taken (e.g., 'view', 'use', 'complete')
 * @param metadata - Additional metadata about the feature usage
 *
 * @example
 * trackFeatureUsage('dashboard', 'view');
 * trackFeatureUsage('export', 'use', { format: 'csv' });
 */
export function trackFeatureUsage(
	featureName: string,
	action: 'view' | 'use' | 'complete',
	metadata?: Record<string, unknown>
): void {
	pushToDataLayer({
		event: 'feature_usage',
		feature_name: featureName,
		feature_action: action,
		...metadata
	});
}
