/**
 * Stripe Server-Side Client
 * (ST02-Install-Stripe-SDK.md)
 *
 * This module provides:
 * - Singleton Stripe client for server-side operations
 * - Secure initialization with secret key
 * - Helper methods for common operations
 *
 * SECURITY NOTES:
 * - This module should ONLY be imported in server-side code (+server.ts, +page.server.ts)
 * - Never import this in client-side code or .svelte files
 * - The Stripe client uses the secret key which must never be exposed
 */

import Stripe from 'stripe';
import { building } from '$app/environment';
import { getStripeConfig, isStripeConfigured } from '$lib/billing/stripe-config';

// ============================================================================
// Stripe Client Singleton
// ============================================================================

let stripeClient: Stripe | null = null;
let initializationError: string | null = null;

/**
 * Get or create the Stripe client instance
 * Returns null if Stripe is not configured or during build
 */
function getOrCreateStripeClient(): Stripe | null {
	// Skip during build
	if (building) {
		return null;
	}

	// Return cached client if already initialized
	if (stripeClient) {
		return stripeClient;
	}

	// Return null if we already tried and failed
	if (initializationError) {
		return null;
	}

	// Check configuration
	if (!isStripeConfigured()) {
		initializationError = 'Stripe is not configured. Check environment variables.';
		console.warn('[Stripe Server]', initializationError);
		return null;
	}

	const config = getStripeConfig();

	try {
		stripeClient = new Stripe(config.secretKey, {
			// Use the latest API version
			apiVersion: '2025-04-30.basil',
			// Add app info for Stripe Dashboard identification
			appInfo: {
				name: 'SoloAI SaaS',
				version: '1.0.0',
				url: 'https://soloai.example.com'
			},
			// TypeScript strict mode
			typescript: true
		});

		console.log('[Stripe Server] Client initialized successfully');
		return stripeClient;
	} catch (error) {
		initializationError =
			error instanceof Error ? error.message : 'Failed to initialize Stripe client';
		console.error('[Stripe Server] Initialization error:', initializationError);
		return null;
	}
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get the Stripe client for server-side operations
 * Throws an error if Stripe is not configured
 *
 * @throws Error if Stripe client cannot be initialized
 *
 * @example
 * ```ts
 * import { getStripe } from '$lib/stripe/server';
 *
 * const stripe = getStripe();
 * const session = await stripe.checkout.sessions.create({...});
 * ```
 */
export function getStripe(): Stripe {
	const client = getOrCreateStripeClient();

	if (!client) {
		throw new Error(initializationError || 'Stripe client is not available');
	}

	return client;
}

/**
 * Get the Stripe client if available, returns null otherwise
 * Use this when you want to handle missing Stripe gracefully
 *
 * @example
 * ```ts
 * import { getStripeOrNull } from '$lib/stripe/server';
 *
 * const stripe = getStripeOrNull();
 * if (!stripe) {
 *   return json({ error: 'Payment system unavailable' }, { status: 503 });
 * }
 * ```
 */
export function getStripeOrNull(): Stripe | null {
	return getOrCreateStripeClient();
}

/**
 * Check if Stripe is available and ready to use
 */
export function isStripeReady(): boolean {
	return getOrCreateStripeClient() !== null;
}

/**
 * Get any initialization error that occurred
 */
export function getStripeInitError(): string | null {
	// Trigger initialization attempt if not done
	getOrCreateStripeClient();
	return initializationError;
}

// ============================================================================
// Webhook Verification
// ============================================================================

/**
 * Verify a webhook signature and parse the event
 *
 * @param payload - Raw request body as string
 * @param signature - Stripe-Signature header value
 * @returns Verified Stripe event or null if invalid
 *
 * @example
 * ```ts
 * import { verifyWebhookSignature } from '$lib/stripe/server';
 *
 * const event = verifyWebhookSignature(rawBody, signature);
 * if (!event) {
 *   return json({ error: 'Invalid signature' }, { status: 400 });
 * }
 * ```
 */
export function verifyWebhookSignature(
	payload: string,
	signature: string
): Stripe.Event | null {
	const stripe = getStripeOrNull();
	if (!stripe) {
		console.error('[Stripe Webhook] Client not available');
		return null;
	}

	const config = getStripeConfig();
	if (!config.webhookSecret) {
		console.error('[Stripe Webhook] Webhook secret not configured');
		return null;
	}

	try {
		const event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);
		return event;
	} catch (error) {
		if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
			console.error('[Stripe Webhook] Signature verification failed:', error.message);
		} else {
			console.error('[Stripe Webhook] Error:', error);
		}
		return null;
	}
}

/**
 * Verify webhook signature with detailed result
 */
export function verifyWebhookSignatureWithResult(
	payload: string,
	signature: string
): { valid: boolean; event?: Stripe.Event; error?: string } {
	const stripe = getStripeOrNull();
	if (!stripe) {
		return { valid: false, error: 'Stripe client not available' };
	}

	const config = getStripeConfig();
	if (!config.webhookSecret) {
		return { valid: false, error: 'Webhook secret not configured' };
	}

	try {
		const event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);
		return { valid: true, event };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unknown verification error';
		return { valid: false, error: message };
	}
}

// ============================================================================
// Helper Methods
// ============================================================================

/**
 * Retrieve a customer by ID
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
	const stripe = getStripeOrNull();
	if (!stripe) return null;

	try {
		const customer = await stripe.customers.retrieve(customerId);
		if (customer.deleted) {
			return null;
		}
		return customer as Stripe.Customer;
	} catch (error) {
		console.error('[Stripe] Error retrieving customer:', error);
		return null;
	}
}

/**
 * Retrieve a subscription by ID
 */
export async function getSubscription(
	subscriptionId: string
): Promise<Stripe.Subscription | null> {
	const stripe = getStripeOrNull();
	if (!stripe) return null;

	try {
		const subscription = await stripe.subscriptions.retrieve(subscriptionId);
		return subscription;
	} catch (error) {
		console.error('[Stripe] Error retrieving subscription:', error);
		return null;
	}
}

/**
 * List active subscriptions for a customer
 */
export async function getCustomerSubscriptions(
	customerId: string
): Promise<Stripe.Subscription[]> {
	const stripe = getStripeOrNull();
	if (!stripe) return [];

	try {
		const subscriptions = await stripe.subscriptions.list({
			customer: customerId,
			status: 'active',
			limit: 10
		});
		return subscriptions.data;
	} catch (error) {
		console.error('[Stripe] Error listing subscriptions:', error);
		return [];
	}
}

// ============================================================================
// Re-export Stripe types for convenience
// ============================================================================

export type { Stripe };
export { Stripe as StripeSDK };
