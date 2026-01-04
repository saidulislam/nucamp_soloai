/**
 * LemonSqueezy Server-Side Client
 * (LS02-Install-LemonSqueezy-SDK.md)
 *
 * This module provides:
 * - SDK initialization for server-side operations
 * - Store ID fetching (auto-fetches from API with env fallback)
 * - Configuration helpers
 *
 * SECURITY NOTES:
 * - This module should ONLY be imported in server-side code (+server.ts, +page.server.ts)
 * - Never import this in client-side code or .svelte files
 * - The API key must never be exposed to the client
 */

import { lemonSqueezySetup, getAuthenticatedUser, listStores } from '@lemonsqueezy/lemonsqueezy.js';
import { building } from '$app/environment';
import {
	getLemonSqueezyConfig,
	isLemonSqueezyConfigured,
	getApiKey,
	getStoreId as getConfigStoreId,
	isSandboxMode
} from '$lib/billing/lemonsqueezy-config';

// ============================================================================
// State
// ============================================================================

let isInitialized = false;
let initializationError: string | null = null;
let cachedStoreId: string | null = null;

// ============================================================================
// SDK Initialization
// ============================================================================

/**
 * Initialize the LemonSqueezy SDK
 * Should be called once at server startup
 */
export function initLemonSqueezy(): boolean {
	// Skip during build
	if (building) {
		return false;
	}

	// Already initialized
	if (isInitialized) {
		return true;
	}

	// Already tried and failed
	if (initializationError) {
		return false;
	}

	// Check configuration
	if (!isLemonSqueezyConfigured()) {
		initializationError = 'LemonSqueezy is not configured. Check environment variables.';
		console.warn('[LemonSqueezy Client]', initializationError);
		return false;
	}

	const apiKey = getApiKey();

	try {
		lemonSqueezySetup({
			apiKey,
			onError: (error) => {
				console.error('[LemonSqueezy SDK Error]', error);
			}
		});

		isInitialized = true;
		console.log('[LemonSqueezy Client] SDK initialized successfully');
		return true;
	} catch (error) {
		initializationError =
			error instanceof Error ? error.message : 'Failed to initialize LemonSqueezy SDK';
		console.error('[LemonSqueezy Client] Initialization error:', initializationError);
		return false;
	}
}

/**
 * Ensure SDK is initialized before making API calls
 * Throws if initialization fails
 */
export function ensureInitialized(): void {
	if (!initLemonSqueezy()) {
		throw new Error(initializationError || 'LemonSqueezy SDK initialization failed');
	}
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if LemonSqueezy SDK is ready
 */
export function isLemonSqueezyReady(): boolean {
	if (building) return false;
	return initLemonSqueezy();
}

/**
 * Get any initialization error that occurred
 */
export function getLemonSqueezyInitError(): string | null {
	// Trigger initialization attempt if not done
	initLemonSqueezy();
	return initializationError;
}

/**
 * Get Store ID - fetches from API or uses environment fallback
 *
 * LemonSqueezy allows multiple stores per account. This function:
 * 1. Returns cached store ID if available
 * 2. Uses LEMON_SQUEEZY_STORE_ID env var if set
 * 3. Fetches the first store from the API as fallback
 *
 * @returns Store ID string
 * @throws Error if no store can be found
 */
export async function getStoreId(): Promise<string> {
	// Return cached value
	if (cachedStoreId) {
		return cachedStoreId;
	}

	// Use environment variable if set
	const envStoreId = getConfigStoreId();
	if (envStoreId && envStoreId !== 'store_id_here') {
		cachedStoreId = envStoreId;
		return cachedStoreId;
	}

	// Fetch from API
	ensureInitialized();

	try {
		const { data, error } = await listStores();

		if (error) {
			throw new Error(error.message || 'Failed to fetch stores from LemonSqueezy');
		}

		if (!data?.data || data.data.length === 0) {
			throw new Error('No stores found in LemonSqueezy account');
		}

		// Use the first store
		cachedStoreId = data.data[0].id;
		console.log(`[LemonSqueezy Client] Using store ID: ${cachedStoreId}`);
		return cachedStoreId;
	} catch (error) {
		console.error('[LemonSqueezy Client] Error fetching store ID:', error);
		throw new Error(
			`Failed to get LemonSqueezy store ID: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Check if we're in test/sandbox mode
 */
export function isTestMode(): boolean {
	return isSandboxMode();
}

/**
 * Verify API credentials are valid by making a test API call
 */
export async function verifyCredentials(): Promise<{ valid: boolean; error?: string }> {
	if (building) {
		return { valid: false, error: 'Cannot verify during build' };
	}

	try {
		ensureInitialized();
		const { data, error } = await getAuthenticatedUser();

		if (error) {
			return { valid: false, error: error.message || 'API authentication failed' };
		}

		if (data?.data) {
			console.log('[LemonSqueezy Client] Credentials verified successfully');
			return { valid: true };
		}

		return { valid: false, error: 'No user data returned from API' };
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : 'Credential verification failed'
		};
	}
}

/**
 * Get current configuration summary (safe for logging)
 */
export function getConfigSummary(): {
	initialized: boolean;
	testMode: boolean;
	storeIdConfigured: boolean;
	error: string | null;
} {
	const config = getLemonSqueezyConfig();

	return {
		initialized: isInitialized,
		testMode: isTestMode(),
		storeIdConfigured: !!(config.storeId && config.storeId !== 'store_id_here'),
		error: initializationError
	};
}

// ============================================================================
// Auto-initialize on import (server-side only)
// ============================================================================

// Initialize SDK when this module is first imported
// This ensures SDK is ready for API calls
if (!building) {
	initLemonSqueezy();
}
