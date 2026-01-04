/**
 * Stripe Configuration and Validation
 * (ST01-Stripe-Account-Setup.md)
 *
 * This module provides:
 * - Environment variable access for Stripe configuration
 * - Validation utilities for API keys
 * - Type-safe configuration access
 *
 * SECURITY NOTES:
 * - Secret keys should ONLY be used in server-side code (+server.ts, +page.server.ts)
 * - Publishable keys are safe for client-side use
 * - Webhook secrets are server-side only for signature verification
 */

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { building } from '$app/environment';

// ============================================================================
// Types
// ============================================================================

export interface StripeConfig {
	publishableKey: string;
	secretKey: string;
	webhookSecret: string;
	successUrl: string;
	cancelUrl: string;
	isTestMode: boolean;
	isConfigured: boolean;
}

export interface StripeValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

// ============================================================================
// Configuration Access
// ============================================================================

/**
 * Get Stripe configuration from environment variables
 * For server-side use only (secret key included)
 */
export function getStripeConfig(): StripeConfig {
	const publishableKey = env.STRIPE_PUBLISHABLE_KEY || '';
	const secretKey = env.STRIPE_SECRET_KEY || '';
	const webhookSecret = env.STRIPE_WEBHOOK_SECRET || '';
	const successUrl = env.STRIPE_SUCCESS_URL || 'http://localhost:5173/account?success=true';
	const cancelUrl = env.STRIPE_CANCEL_URL || 'http://localhost:5173/pricing?canceled=true';

	const isTestMode = publishableKey.startsWith('pk_test_') || secretKey.startsWith('sk_test_');
	const isConfigured = !!(publishableKey && secretKey);

	return {
		publishableKey,
		secretKey,
		webhookSecret,
		successUrl,
		cancelUrl,
		isTestMode,
		isConfigured
	};
}

/**
 * Get publishable key for client-side use
 * Safe to expose to browser
 */
export function getPublishableKey(): string {
	return env.STRIPE_PUBLISHABLE_KEY || '';
}

/**
 * Get secret key for server-side API operations
 * NEVER expose this to client-side code
 */
export function getSecretKey(): string {
	return env.STRIPE_SECRET_KEY || '';
}

/**
 * Get webhook secret for signature verification
 * Server-side only
 */
export function getWebhookSecret(): string {
	return env.STRIPE_WEBHOOK_SECRET || '';
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate Stripe API key format
 */
function isValidKeyFormat(key: string, prefix: string): boolean {
	return key.startsWith(prefix) && key.length > prefix.length + 10;
}

/**
 * Validate Stripe configuration
 * Call during application startup to catch configuration errors early
 */
export function validateStripeConfig(): StripeValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const config = getStripeConfig();

	// Skip validation during build
	if (building) {
		return { isValid: true, errors: [], warnings: ['Validation skipped during build'] };
	}

	// Check publishable key
	if (!config.publishableKey) {
		errors.push('STRIPE_PUBLISHABLE_KEY is not set');
	} else if (!config.publishableKey.startsWith('pk_test_') && !config.publishableKey.startsWith('pk_live_')) {
		errors.push('STRIPE_PUBLISHABLE_KEY has invalid format (should start with pk_test_ or pk_live_)');
	}

	// Check secret key
	if (!config.secretKey) {
		errors.push('STRIPE_SECRET_KEY is not set');
	} else if (!config.secretKey.startsWith('sk_test_') && !config.secretKey.startsWith('sk_live_')) {
		errors.push('STRIPE_SECRET_KEY has invalid format (should start with sk_test_ or sk_live_)');
	}

	// Check webhook secret
	if (!config.webhookSecret) {
		warnings.push('STRIPE_WEBHOOK_SECRET is not set - webhook signature verification will fail');
	} else if (!config.webhookSecret.startsWith('whsec_')) {
		errors.push('STRIPE_WEBHOOK_SECRET has invalid format (should start with whsec_)');
	}

	// Check for test/live mode consistency
	const publishableIsTest = config.publishableKey.startsWith('pk_test_');
	const secretIsTest = config.secretKey.startsWith('sk_test_');

	if (config.publishableKey && config.secretKey && publishableIsTest !== secretIsTest) {
		errors.push('Stripe keys are mismatched: publishable and secret keys must both be test or both be live');
	}

	// Warn about test mode in production
	if (process.env.NODE_ENV === 'production' && config.isTestMode) {
		warnings.push('Using test Stripe keys in production environment');
	}

	// Check redirect URLs
	if (!config.successUrl) {
		warnings.push('STRIPE_SUCCESS_URL is not set - using default');
	}
	if (!config.cancelUrl) {
		warnings.push('STRIPE_CANCEL_URL is not set - using default');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Assert that Stripe is properly configured
 * Throws an error if configuration is invalid
 * Use at the start of routes that require Stripe
 */
export function assertStripeConfigured(): void {
	const validation = validateStripeConfig();

	if (!validation.isValid) {
		const errorMessage = `Stripe configuration error: ${validation.errors.join('; ')}`;
		console.error('[Stripe Config]', errorMessage);
		throw new Error(errorMessage);
	}

	// Log warnings
	if (validation.warnings.length > 0) {
		validation.warnings.forEach((warning) => {
			console.warn('[Stripe Config]', warning);
		});
	}
}

/**
 * Check if Stripe is in test mode
 */
export function isTestMode(): boolean {
	const config = getStripeConfig();
	return config.isTestMode;
}

/**
 * Check if Stripe is configured and ready to use
 */
export function isStripeConfigured(): boolean {
	const config = getStripeConfig();
	return config.isConfigured && validateStripeConfig().isValid;
}

// ============================================================================
// Logging & Debugging (Development Only)
// ============================================================================

/**
 * Log Stripe configuration status (for debugging)
 * Only logs in development, masks sensitive data
 */
export function logStripeConfigStatus(): void {
	if (process.env.NODE_ENV === 'production') {
		return;
	}

	const config = getStripeConfig();
	const validation = validateStripeConfig();

	console.log('[Stripe Config Status]');
	console.log(`  Configured: ${config.isConfigured}`);
	console.log(`  Test Mode: ${config.isTestMode}`);
	console.log(`  Publishable Key: ${config.publishableKey ? maskKey(config.publishableKey) : 'NOT SET'}`);
	console.log(`  Secret Key: ${config.secretKey ? maskKey(config.secretKey) : 'NOT SET'}`);
	console.log(`  Webhook Secret: ${config.webhookSecret ? 'SET' : 'NOT SET'}`);
	console.log(`  Success URL: ${config.successUrl}`);
	console.log(`  Cancel URL: ${config.cancelUrl}`);
	console.log(`  Valid: ${validation.isValid}`);

	if (validation.errors.length > 0) {
		console.log(`  Errors: ${validation.errors.join(', ')}`);
	}
	if (validation.warnings.length > 0) {
		console.log(`  Warnings: ${validation.warnings.join(', ')}`);
	}
}

/**
 * Mask sensitive key for logging
 */
function maskKey(key: string): string {
	if (key.length < 12) return '***';
	return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
}
