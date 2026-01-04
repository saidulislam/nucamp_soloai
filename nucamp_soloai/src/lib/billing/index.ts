/**
 * Billing Module Exports
 * Re-exports all billing-related types and utilities
 *
 * PAYMENT PROVIDER SELECTION:
 * - Stripe: Used for US users (locale: 'en')
 * - LemonSqueezy: Used for non-US users (all other locales)
 *
 * The provider is automatically selected based on the user's active
 * Paraglide locale. Both providers share the same subscription tier
 * structure from P02-Pricing-Tiers.md.
 */

// Types and helpers for subscription management
export * from './types';

// Stripe configuration and validation (server-side)
// Note: Only import stripe-config in server-side code (+server.ts, +page.server.ts)
// as it accesses private environment variables
export * from './stripe-config';

// LemonSqueezy configuration and validation (server-side)
// Note: Only import lemonsqueezy-config in server-side code (+server.ts, +page.server.ts)
// as it accesses private environment variables
export * from './lemonsqueezy-config';
