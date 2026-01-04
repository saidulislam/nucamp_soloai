/**
 * Stripe Products Configuration
 * (ST06-Configure-Stripe-Products.md)
 *
 * This module provides:
 * - Product and pricing tier definitions
 * - Price ID configuration from environment variables
 * - Validation utilities for price IDs
 * - Type-safe access to product metadata
 *
 * SETUP INSTRUCTIONS:
 * 1. Create products in Stripe Dashboard (Products section)
 * 2. Copy price IDs (format: price_xxx) to environment variables
 * 3. Configure webhook to receive subscription events
 *
 * SECURITY NOTES:
 * - Price IDs are public and safe to expose
 * - Product metadata is used for checkout sessions
 * - Always validate price IDs before creating checkout sessions
 */

import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

// ============================================================================
// Types
// ============================================================================

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type BillingInterval = 'monthly' | 'annual';

export interface ProductMetadata {
	tier_id: SubscriptionTier;
	tier_name: string;
	max_users: string;
	features: string;
}

export interface PriceConfig {
	priceId: string;
	amount: number; // in cents
	currency: string;
	interval: BillingInterval;
	trialDays?: number;
}

export interface ProductConfig {
	name: string;
	description: string;
	tier: SubscriptionTier;
	metadata: ProductMetadata;
	prices: {
		monthly?: PriceConfig;
		annual?: PriceConfig;
	};
}

export interface StripeProductsConfig {
	free: ProductConfig;
	pro: ProductConfig;
	enterprise: ProductConfig;
}

// ============================================================================
// Product Definitions (from ST06-Configure-Stripe-Products.md)
// ============================================================================

/**
 * Free Tier Configuration
 * No Stripe price object needed - handled in app logic
 */
const FREE_PRODUCT: ProductConfig = {
	name: 'Free Plan',
	description: 'Get started with essential features',
	tier: 'free',
	metadata: {
		tier_id: 'free',
		tier_name: 'Free',
		max_users: '1',
		features: 'basic'
	},
	prices: {
		// No prices - free tier doesn't use Stripe checkout
	}
};

/**
 * Pro Tier Configuration
 * - Monthly: $29.00 USD
 * - Annual: $290.00 USD (2 months free)
 * - 14-day trial period
 */
const PRO_PRODUCT: ProductConfig = {
	name: 'Pro Plan',
	description: 'Perfect for growing teams',
	tier: 'pro',
	metadata: {
		tier_id: 'pro',
		tier_name: 'Pro',
		max_users: '10',
		features: 'advanced'
	},
	prices: {
		monthly: {
			priceId: '', // Set from environment
			amount: 2900, // $29.00
			currency: 'usd',
			interval: 'monthly',
			trialDays: 14
		},
		annual: {
			priceId: '', // Set from environment
			amount: 29000, // $290.00 (2 months free)
			currency: 'usd',
			interval: 'annual',
			trialDays: 14
		}
	}
};

/**
 * Enterprise Tier Configuration
 * - Monthly: $99.00 USD
 * - Annual: $990.00 USD (2 months free)
 * - 14-day trial period
 */
const ENTERPRISE_PRODUCT: ProductConfig = {
	name: 'Enterprise Plan',
	description: 'Full-featured solution for large organizations',
	tier: 'enterprise',
	metadata: {
		tier_id: 'enterprise',
		tier_name: 'Enterprise',
		max_users: 'unlimited',
		features: 'premium'
	},
	prices: {
		monthly: {
			priceId: '', // Set from environment
			amount: 9900, // $99.00
			currency: 'usd',
			interval: 'monthly',
			trialDays: 14
		},
		annual: {
			priceId: '', // Set from environment
			amount: 99000, // $990.00 (2 months free)
			currency: 'usd',
			interval: 'annual',
			trialDays: 14
		}
	}
};

// ============================================================================
// Configuration Access
// ============================================================================

/**
 * Get all Stripe products configuration with price IDs from environment
 */
export function getStripeProducts(): StripeProductsConfig {
	// Clone base products and inject price IDs from environment
	const products: StripeProductsConfig = {
		free: { ...FREE_PRODUCT },
		pro: {
			...PRO_PRODUCT,
			prices: {
				monthly: PRO_PRODUCT.prices.monthly
					? {
							...PRO_PRODUCT.prices.monthly,
							priceId: env.STRIPE_PRICE_PRO_MONTHLY || ''
						}
					: undefined,
				annual: PRO_PRODUCT.prices.annual
					? {
							...PRO_PRODUCT.prices.annual,
							priceId: env.STRIPE_PRICE_PRO_ANNUAL || ''
						}
					: undefined
			}
		},
		enterprise: {
			...ENTERPRISE_PRODUCT,
			prices: {
				monthly: ENTERPRISE_PRODUCT.prices.monthly
					? {
							...ENTERPRISE_PRODUCT.prices.monthly,
							priceId: env.STRIPE_PRICE_ENTERPRISE_MONTHLY || ''
						}
					: undefined,
				annual: ENTERPRISE_PRODUCT.prices.annual
					? {
							...ENTERPRISE_PRODUCT.prices.annual,
							priceId: env.STRIPE_PRICE_ENTERPRISE_ANNUAL || ''
						}
					: undefined
			}
		}
	};

	return products;
}

/**
 * Get price ID for a specific tier and billing interval
 */
export function getPriceId(tier: SubscriptionTier, interval: BillingInterval = 'monthly'): string | null {
	if (tier === 'free') {
		return null; // Free tier doesn't have a price ID
	}

	const products = getStripeProducts();
	const product = products[tier];

	if (!product || !product.prices[interval]) {
		return null;
	}

	return product.prices[interval]?.priceId || null;
}

/**
 * Get all configured price IDs as a flat object
 * Useful for quick lookups and validation
 */
export function getAllPriceIds(): Record<string, { tier: SubscriptionTier; interval: BillingInterval }> {
	const products = getStripeProducts();
	const priceIds: Record<string, { tier: SubscriptionTier; interval: BillingInterval }> = {};

	for (const [tierKey, product] of Object.entries(products)) {
		const tier = tierKey as SubscriptionTier;
		if (product.prices.monthly?.priceId) {
			priceIds[product.prices.monthly.priceId] = { tier, interval: 'monthly' };
		}
		if (product.prices.annual?.priceId) {
			priceIds[product.prices.annual.priceId] = { tier, interval: 'annual' };
		}
	}

	return priceIds;
}

/**
 * Get product configuration by price ID
 */
export function getProductByPriceId(
	priceId: string
): { product: ProductConfig; interval: BillingInterval } | null {
	const products = getStripeProducts();

	for (const product of Object.values(products)) {
		if (product.prices.monthly?.priceId === priceId) {
			return { product, interval: 'monthly' };
		}
		if (product.prices.annual?.priceId === priceId) {
			return { product, interval: 'annual' };
		}
	}

	return null;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that a price ID is properly configured and valid
 */
export function isValidPriceId(priceId: string): boolean {
	// Must have proper format
	if (!priceId || !priceId.startsWith('price_')) {
		return false;
	}

	// Must be one of our configured price IDs
	const allPriceIds = getAllPriceIds();
	return priceId in allPriceIds;
}

/**
 * Validate Stripe products configuration
 */
export function validateProductsConfig(): {
	isValid: boolean;
	errors: string[];
	warnings: string[];
} {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Skip validation during build
	if (building) {
		return { isValid: true, errors: [], warnings: ['Validation skipped during build'] };
	}

	const products = getStripeProducts();

	// Check Pro tier prices
	if (!products.pro.prices.monthly?.priceId) {
		warnings.push('STRIPE_PRICE_PRO_MONTHLY is not set - Pro monthly checkout will not work');
	} else if (!products.pro.prices.monthly.priceId.startsWith('price_')) {
		errors.push('STRIPE_PRICE_PRO_MONTHLY has invalid format (should start with price_)');
	}

	if (!products.pro.prices.annual?.priceId) {
		warnings.push('STRIPE_PRICE_PRO_ANNUAL is not set - Pro annual checkout will not work');
	} else if (!products.pro.prices.annual.priceId.startsWith('price_')) {
		errors.push('STRIPE_PRICE_PRO_ANNUAL has invalid format (should start with price_)');
	}

	// Check Enterprise tier prices
	if (!products.enterprise.prices.monthly?.priceId) {
		warnings.push('STRIPE_PRICE_ENTERPRISE_MONTHLY is not set - Enterprise monthly checkout will not work');
	} else if (!products.enterprise.prices.monthly.priceId.startsWith('price_')) {
		errors.push('STRIPE_PRICE_ENTERPRISE_MONTHLY has invalid format (should start with price_)');
	}

	if (!products.enterprise.prices.annual?.priceId) {
		warnings.push('STRIPE_PRICE_ENTERPRISE_ANNUAL is not set - Enterprise annual checkout will not work');
	} else if (!products.enterprise.prices.annual.priceId.startsWith('price_')) {
		errors.push('STRIPE_PRICE_ENTERPRISE_ANNUAL has invalid format (should start with price_)');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Check if at least one price ID is configured
 */
export function hasAnyPriceConfigured(): boolean {
	const products = getStripeProducts();

	return !!(
		products.pro.prices.monthly?.priceId ||
		products.pro.prices.annual?.priceId ||
		products.enterprise.prices.monthly?.priceId ||
		products.enterprise.prices.annual?.priceId
	);
}

// ============================================================================
// Public Price IDs for Client-Side
// ============================================================================

/**
 * Get price IDs that are safe to expose to the client
 * Returns only the IDs, not full product configuration
 */
export function getPublicPriceIds(): {
	pro: { monthly: string; annual: string };
	enterprise: { monthly: string; annual: string };
} {
	const products = getStripeProducts();

	return {
		pro: {
			monthly: products.pro.prices.monthly?.priceId || '',
			annual: products.pro.prices.annual?.priceId || ''
		},
		enterprise: {
			monthly: products.enterprise.prices.monthly?.priceId || '',
			annual: products.enterprise.prices.annual?.priceId || ''
		}
	};
}

// ============================================================================
// Logging & Debugging
// ============================================================================

/**
 * Log products configuration status (for debugging)
 * Only logs in development, masks price IDs partially
 */
export function logProductsConfigStatus(): void {
	if (process.env.NODE_ENV === 'production') {
		return;
	}

	const products = getStripeProducts();
	const validation = validateProductsConfig();

	console.log('[Stripe Products Config Status]');
	console.log('  Pro Monthly:', maskPriceId(products.pro.prices.monthly?.priceId));
	console.log('  Pro Annual:', maskPriceId(products.pro.prices.annual?.priceId));
	console.log('  Enterprise Monthly:', maskPriceId(products.enterprise.prices.monthly?.priceId));
	console.log('  Enterprise Annual:', maskPriceId(products.enterprise.prices.annual?.priceId));
	console.log('  Valid:', validation.isValid);

	if (validation.errors.length > 0) {
		console.log('  Errors:', validation.errors.join(', '));
	}
	if (validation.warnings.length > 0) {
		console.log('  Warnings:', validation.warnings.join(', '));
	}
}

/**
 * Mask price ID for logging
 */
function maskPriceId(priceId: string | undefined): string {
	if (!priceId) return 'NOT SET';
	if (priceId.length < 15) return 'INVALID';
	return `${priceId.substring(0, 10)}...${priceId.substring(priceId.length - 4)}`;
}
