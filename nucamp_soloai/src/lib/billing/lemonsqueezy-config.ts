/**
 * LemonSqueezy Configuration and Validation
 * (LS01-LemonSqueezy-Account.md)
 *
 * This module provides:
 * - Environment variable access for LemonSqueezy configuration
 * - Validation utilities for API keys
 * - Type-safe configuration access
 *
 * INTEGRATION CONTEXT:
 * LemonSqueezy is used as the payment provider for NON-US users
 * (detected via Paraglide locale). It acts as Merchant of Record,
 * handling all tax compliance, VAT, and international payment processing.
 *
 * SECURITY NOTES:
 * - API keys should ONLY be used in server-side code (+server.ts, +page.server.ts)
 * - Webhook secrets are server-side only for signature verification
 * - Store IDs are generally safe but should be kept server-side for consistency
 */

import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

// ============================================================================
// Types
// ============================================================================

export interface LemonSqueezyConfig {
	apiKey: string;
	storeId: string;
	webhookSecret: string;
	environment: 'sandbox' | 'production';
	isConfigured: boolean;
	baseUrl: string;
}

export interface LemonSqueezyValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = 'https://api.lemonsqueezy.com/v1';

// ============================================================================
// Configuration Access
// ============================================================================

/**
 * Get LemonSqueezy configuration from environment variables
 * For server-side use only
 */
export function getLemonSqueezyConfig(): LemonSqueezyConfig {
	const apiKey = env.LEMON_SQUEEZY_API_KEY || '';
	const storeId = env.LEMON_SQUEEZY_STORE_ID || '';
	const webhookSecret = env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';
	const environmentValue = env.LEMON_SQUEEZY_ENVIRONMENT || 'sandbox';

	// Normalize environment value
	const environment: 'sandbox' | 'production' =
		environmentValue === 'production' ? 'production' : 'sandbox';

	const isConfigured = !!(apiKey && storeId);

	return {
		apiKey,
		storeId,
		webhookSecret,
		environment,
		isConfigured,
		baseUrl: API_BASE_URL
	};
}

/**
 * Get API key for server-side API operations
 * NEVER expose this to client-side code
 */
export function getApiKey(): string {
	return env.LEMON_SQUEEZY_API_KEY || '';
}

/**
 * Get Store ID for product and subscription operations
 */
export function getStoreId(): string {
	return env.LEMON_SQUEEZY_STORE_ID || '';
}

/**
 * Get webhook secret for signature verification
 * Server-side only
 */
export function getWebhookSecret(): string {
	return env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';
}

/**
 * Get current environment (sandbox or production)
 */
export function getEnvironment(): 'sandbox' | 'production' {
	const envValue = env.LEMON_SQUEEZY_ENVIRONMENT || 'sandbox';
	return envValue === 'production' ? 'production' : 'sandbox';
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate LemonSqueezy configuration
 * Call during application startup to catch configuration errors early
 */
export function validateLemonSqueezyConfig(): LemonSqueezyValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const config = getLemonSqueezyConfig();

	// Skip validation during build
	if (building) {
		return { isValid: true, errors: [], warnings: ['Validation skipped during build'] };
	}

	// Check API key
	if (!config.apiKey) {
		warnings.push('LEMON_SQUEEZY_API_KEY is not set - LemonSqueezy payments will be disabled');
	} else if (config.apiKey === 'test_api_key_here') {
		warnings.push('LEMON_SQUEEZY_API_KEY is using placeholder value');
	}

	// Check Store ID
	if (!config.storeId) {
		warnings.push('LEMON_SQUEEZY_STORE_ID is not set - LemonSqueezy payments will be disabled');
	} else if (config.storeId === 'store_id_here') {
		warnings.push('LEMON_SQUEEZY_STORE_ID is using placeholder value');
	}

	// Check webhook secret
	if (!config.webhookSecret) {
		warnings.push(
			'LEMON_SQUEEZY_WEBHOOK_SECRET is not set - webhook signature verification will fail'
		);
	} else if (config.webhookSecret === 'webhook_secret_here') {
		warnings.push('LEMON_SQUEEZY_WEBHOOK_SECRET is using placeholder value');
	}

	// Check environment
	if (!env.LEMON_SQUEEZY_ENVIRONMENT) {
		warnings.push('LEMON_SQUEEZY_ENVIRONMENT is not set - defaulting to sandbox');
	}

	// Warn about sandbox mode in production
	if (process.env.NODE_ENV === 'production' && config.environment === 'sandbox') {
		warnings.push('Using LemonSqueezy sandbox environment in production');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Assert that LemonSqueezy is properly configured
 * Throws an error if configuration is invalid
 * Use at the start of routes that require LemonSqueezy
 */
export function assertLemonSqueezyConfigured(): void {
	const validation = validateLemonSqueezyConfig();

	if (!validation.isValid) {
		const errorMessage = `LemonSqueezy configuration error: ${validation.errors.join('; ')}`;
		console.error('[LemonSqueezy Config]', errorMessage);
		throw new Error(errorMessage);
	}

	// Log warnings
	if (validation.warnings.length > 0) {
		validation.warnings.forEach((warning) => {
			console.warn('[LemonSqueezy Config]', warning);
		});
	}
}

/**
 * Check if LemonSqueezy is in sandbox mode
 */
export function isSandboxMode(): boolean {
	const config = getLemonSqueezyConfig();
	return config.environment === 'sandbox';
}

/**
 * Check if LemonSqueezy is configured and ready to use
 */
export function isLemonSqueezyConfigured(): boolean {
	const config = getLemonSqueezyConfig();
	// LemonSqueezy is configured if we have API key and store ID
	// Webhook secret is only needed for webhook handling
	return config.isConfigured && !!config.apiKey && !!config.storeId;
}

// ============================================================================
// Logging & Debugging (Development Only)
// ============================================================================

/**
 * Log LemonSqueezy configuration status (for debugging)
 * Only logs in development, masks sensitive data
 */
export function logLemonSqueezyConfigStatus(): void {
	if (process.env.NODE_ENV === 'production') {
		return;
	}

	const config = getLemonSqueezyConfig();
	const validation = validateLemonSqueezyConfig();

	console.log('[LemonSqueezy Config Status]');
	console.log(`  Configured: ${config.isConfigured}`);
	console.log(`  Environment: ${config.environment}`);
	console.log(`  API Key: ${config.apiKey ? maskKey(config.apiKey) : 'NOT SET'}`);
	console.log(`  Store ID: ${config.storeId || 'NOT SET'}`);
	console.log(`  Webhook Secret: ${config.webhookSecret ? 'SET' : 'NOT SET'}`);
	console.log(`  Base URL: ${config.baseUrl}`);
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
