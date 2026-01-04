/**
 * Pricing Page Server Load
 * (ST06-Configure-Stripe-Products.md)
 *
 * Loads Stripe price IDs from environment configuration
 * and passes them to the client for checkout session creation.
 *
 * This keeps price IDs configurable via environment variables
 * while providing type-safe access on the client.
 */

import type { PageServerLoad } from './$types';
import { getPublicPriceIds, validateProductsConfig } from '$lib/stripe/products';

// ============================================================================
// Types
// ============================================================================

export interface PriceIds {
	pro: {
		monthly: string;
		annual: string;
	};
	enterprise: {
		monthly: string;
		annual: string;
	};
}

// ============================================================================
// Load Function
// ============================================================================

export const load: PageServerLoad = async () => {
	// Get price IDs from server-side configuration
	const stripePriceIds = getPublicPriceIds();

	// Validate configuration and log warnings in development
	if (process.env.NODE_ENV !== 'production') {
		const validation = validateProductsConfig();
		if (validation.warnings.length > 0) {
			console.warn('[Pricing Page] Configuration warnings:', validation.warnings);
		}
		if (validation.errors.length > 0) {
			console.error('[Pricing Page] Configuration errors:', validation.errors);
		}
	}

	return {
		stripePriceIds
	};
};
