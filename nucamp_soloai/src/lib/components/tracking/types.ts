/**
 * GTM Tracking Types
 * (TC01-Google-Tag-Manager-Setup.md, TC02-Google-Analytics-Hotjar-Setup.md)
 *
 * TypeScript type definitions for Google Tag Manager integration,
 * including GA4 and Hotjar event structures.
 * These types ensure type-safe dataLayer operations and event tracking.
 */

// ============================================================================
// DataLayer Types
// ============================================================================

/**
 * Base interface for all GTM dataLayer events
 */
export interface GTMDataLayerEvent {
	event: string;
	[key: string]: unknown;
}

/**
 * Page view event structure
 */
export interface GTMPageViewEvent extends GTMDataLayerEvent {
	event: 'pageview' | 'page_view';
	page?: {
		path: string;
		title: string;
		url: string;
	};
	page_path?: string;
	page_title?: string;
	page_location?: string;
}

/**
 * User action event structure (GA4 compatible)
 */
export interface GTMUserActionEvent extends GTMDataLayerEvent {
	event: 'user_action';
	eventCategory: string;
	eventAction: string;
	eventLabel?: string;
	eventValue?: number;
}

/**
 * E-commerce purchase event structure
 */
export interface GTMPurchaseEvent extends GTMDataLayerEvent {
	event: 'purchase';
	ecommerce: {
		transaction_id: string;
		value: number;
		currency: string;
		items?: Array<{
			item_id: string;
			item_name: string;
			price: number;
			quantity: number;
		}>;
	};
}

/**
 * Custom event with flexible parameters
 */
export interface GTMCustomEvent extends GTMDataLayerEvent {
	event: string;
	[key: string]: unknown;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * GTM configuration options
 */
export interface GTMConfig {
	containerId: string;
	enabled: boolean;
	dataLayer?: GTMDataLayerEvent[];
}

/**
 * GTM component props
 */
export interface GTMProps {
	containerId: string;
	enabled?: boolean;
}

// ============================================================================
// Global Window Interface Extension
// ============================================================================

/**
 * Extend Window interface to include dataLayer
 */
declare global {
	interface Window {
		dataLayer: GTMDataLayerEvent[];
		hj?: (command: string, ...args: unknown[]) => void;
	}
}

// ============================================================================
// GA4 Event Types (TC02-Google-Analytics-Hotjar-Setup.md)
// ============================================================================

/**
 * GA4 User properties for custom dimensions
 */
export interface GA4UserProperties {
	subscription_tier: string;
	user_locale: string;
	payment_provider: 'stripe' | 'lemonsqueezy';
}

/**
 * GA4 E-commerce item structure
 */
export interface GA4EcommerceItem {
	item_id: string;
	item_name: string;
	item_category?: string;
	price: number;
	quantity: number;
}

/**
 * GA4 E-commerce purchase event
 */
export interface GA4PurchaseEvent extends GTMDataLayerEvent {
	event: 'purchase';
	tier: string;
	provider: 'stripe' | 'lemonsqueezy';
	ecommerce: {
		transaction_id: string;
		value: number;
		currency: string;
		items: GA4EcommerceItem[];
	};
}

/**
 * GA4 Sign up event
 */
export interface GA4SignUpEvent extends GTMDataLayerEvent {
	event: 'sign_up';
	method: 'email' | 'google' | 'github';
}

/**
 * GA4 Login event
 */
export interface GA4LoginEvent extends GTMDataLayerEvent {
	event: 'login';
	method: 'email' | 'google' | 'github';
}

/**
 * Tier change event
 */
export interface TierChangeEvent extends GTMDataLayerEvent {
	event: 'tier_change';
	from_tier: string;
	to_tier: string;
}

// ============================================================================
// Hotjar Types (TC02-Google-Analytics-Hotjar-Setup.md)
// ============================================================================

/**
 * Hotjar user attributes for segmentation
 */
export interface HotjarUserAttributes {
	subscription_tier: string;
	locale: string;
	payment_provider: 'stripe' | 'lemonsqueezy';
}

/**
 * User authenticated event (triggers Hotjar identify)
 */
export interface UserAuthenticatedEvent extends GTMDataLayerEvent {
	event: 'user_authenticated';
	user: {
		id: string;
		subscriptionTier: string;
		locale: string;
		paymentProvider: 'stripe' | 'lemonsqueezy';
	};
}

export {};
