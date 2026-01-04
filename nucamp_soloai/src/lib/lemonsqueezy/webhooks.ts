/**
 * LemonSqueezy Webhook Utilities
 * (LS02-Install-LemonSqueezy-SDK.md)
 *
 * This module provides utilities for handling LemonSqueezy webhooks:
 * - Signature verification using HMAC-SHA256
 * - Payload parsing
 * - Event type helpers
 *
 * SECURITY NOTES:
 * - Always verify webhook signatures before processing
 * - Use timing-safe comparison to prevent timing attacks
 * - Never trust unverified webhook data
 */

import crypto from 'crypto';
import { getWebhookSecret } from '$lib/billing/lemonsqueezy-config';
import type {
	LemonSqueezyWebhookPayload,
	LemonSqueezyWebhookEventType,
	WebhookVerificationResult
} from './types';

// ============================================================================
// Signature Verification
// ============================================================================

/**
 * Verify a LemonSqueezy webhook signature
 *
 * LemonSqueezy signs webhooks using HMAC-SHA256 with your webhook secret.
 * The signature is sent in the X-Signature header.
 *
 * @param payload - Raw request body as string (must be raw, not parsed JSON)
 * @param signature - X-Signature header value from the request
 * @returns Whether the signature is valid
 *
 * @example
 * ```ts
 * import { verifyWebhookSignature } from '$lib/lemonsqueezy/webhooks';
 *
 * const isValid = verifyWebhookSignature(rawBody, signature);
 * if (!isValid) {
 *   return json({ error: 'Invalid signature' }, { status: 400 });
 * }
 * ```
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
	const secret = getWebhookSecret();

	if (!secret) {
		console.error('[LemonSqueezy Webhook] Webhook secret not configured');
		return false;
	}

	if (!payload || !signature) {
		console.error('[LemonSqueezy Webhook] Missing payload or signature');
		return false;
	}

	try {
		// Create HMAC-SHA256 hash of payload using webhook secret
		const hmac = crypto.createHmac('sha256', secret);
		const digest = hmac.update(payload).digest('hex');

		// Use timing-safe comparison to prevent timing attacks
		const signatureBuffer = Buffer.from(signature);
		const digestBuffer = Buffer.from(digest);

		// Buffers must be same length for timingSafeEqual
		if (signatureBuffer.length !== digestBuffer.length) {
			return false;
		}

		return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
	} catch (error) {
		console.error('[LemonSqueezy Webhook] Signature verification error:', error);
		return false;
	}
}

/**
 * Verify webhook signature with detailed result
 *
 * @param payload - Raw request body as string
 * @param signature - X-Signature header value
 * @returns Verification result with details
 */
export function verifyWebhookSignatureWithResult(
	payload: string,
	signature: string
): WebhookVerificationResult {
	const secret = getWebhookSecret();

	if (!secret) {
		return { valid: false, error: 'Webhook secret not configured' };
	}

	if (!payload) {
		return { valid: false, error: 'Missing webhook payload' };
	}

	if (!signature) {
		return { valid: false, error: 'Missing webhook signature' };
	}

	try {
		const hmac = crypto.createHmac('sha256', secret);
		const digest = hmac.update(payload).digest('hex');

		const signatureBuffer = Buffer.from(signature);
		const digestBuffer = Buffer.from(digest);

		if (signatureBuffer.length !== digestBuffer.length) {
			return { valid: false, error: 'Signature length mismatch' };
		}

		const isValid = crypto.timingSafeEqual(signatureBuffer, digestBuffer);

		if (isValid) {
			return { valid: true, payload };
		}

		return { valid: false, error: 'Signature verification failed' };
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : 'Unknown verification error'
		};
	}
}

// ============================================================================
// Payload Parsing
// ============================================================================

/**
 * Parse a LemonSqueezy webhook payload
 *
 * @param payload - Raw payload string or parsed object
 * @returns Parsed webhook payload or null if invalid
 */
export function parseWebhookPayload(
	payload: string | object
): LemonSqueezyWebhookPayload | null {
	try {
		const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;

		// Validate basic structure
		if (!parsed.meta || !parsed.data) {
			console.error('[LemonSqueezy Webhook] Invalid payload structure');
			return null;
		}

		return parsed as LemonSqueezyWebhookPayload;
	} catch (error) {
		console.error('[LemonSqueezy Webhook] Failed to parse payload:', error);
		return null;
	}
}

/**
 * Get the event type from a webhook payload
 */
export function getEventType(payload: LemonSqueezyWebhookPayload): LemonSqueezyWebhookEventType {
	return payload.meta.event_name;
}

/**
 * Get custom data from a webhook payload
 */
export function getCustomData(
	payload: LemonSqueezyWebhookPayload
): Record<string, string | undefined> {
	return payload.meta.custom_data || {};
}

/**
 * Check if webhook is from test mode
 */
export function isTestModeWebhook(payload: LemonSqueezyWebhookPayload): boolean {
	return payload.meta.test_mode === true;
}

// ============================================================================
// Event Type Helpers
// ============================================================================

/**
 * Subscription-related event types
 */
export const SUBSCRIPTION_EVENTS: LemonSqueezyWebhookEventType[] = [
	'subscription_created',
	'subscription_updated',
	'subscription_cancelled',
	'subscription_resumed',
	'subscription_expired',
	'subscription_paused',
	'subscription_unpaused',
	'subscription_payment_success',
	'subscription_payment_failed',
	'subscription_payment_recovered'
];

/**
 * Order-related event types
 */
export const ORDER_EVENTS: LemonSqueezyWebhookEventType[] = ['order_created', 'order_refunded'];

/**
 * Check if an event is subscription-related
 */
export function isSubscriptionEvent(eventType: LemonSqueezyWebhookEventType): boolean {
	return SUBSCRIPTION_EVENTS.includes(eventType);
}

/**
 * Check if an event is order-related
 */
export function isOrderEvent(eventType: LemonSqueezyWebhookEventType): boolean {
	return ORDER_EVENTS.includes(eventType);
}

// ============================================================================
// Data Extraction Helpers
// ============================================================================

/**
 * Extract subscription data from webhook payload
 */
export function extractSubscriptionData(payload: LemonSqueezyWebhookPayload): {
	subscriptionId: string;
	customerId: string | null;
	status: string | null;
	productId: string | null;
	variantId: string | null;
	currentPeriodEnd: Date | null;
	cancelledAt: Date | null;
} | null {
	try {
		const { data } = payload;
		const attributes = data.attributes as Record<string, unknown>;

		return {
			subscriptionId: data.id,
			customerId: (attributes.customer_id as string) || null,
			status: (attributes.status as string) || null,
			productId: (attributes.product_id?.toString() as string) || null,
			variantId: (attributes.variant_id?.toString() as string) || null,
			currentPeriodEnd: attributes.renews_at
				? new Date(attributes.renews_at as string)
				: null,
			cancelledAt: attributes.cancelled_at
				? new Date(attributes.cancelled_at as string)
				: null
		};
	} catch (error) {
		console.error('[LemonSqueezy Webhook] Failed to extract subscription data:', error);
		return null;
	}
}

/**
 * Extract order data from webhook payload
 */
export function extractOrderData(payload: LemonSqueezyWebhookPayload): {
	orderId: string;
	customerId: string | null;
	customerEmail: string | null;
	status: string | null;
	total: number;
	currency: string;
} | null {
	try {
		const { data } = payload;
		const attributes = data.attributes as Record<string, unknown>;

		return {
			orderId: data.id,
			customerId: (attributes.customer_id as string) || null,
			customerEmail: (attributes.user_email as string) || null,
			status: (attributes.status as string) || null,
			total: (attributes.total as number) || 0,
			currency: (attributes.currency as string) || 'USD'
		};
	} catch (error) {
		console.error('[LemonSqueezy Webhook] Failed to extract order data:', error);
		return null;
	}
}
