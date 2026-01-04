/**
 * LemonSqueezy Webhook Handler
 * (LS04-LemonSqueezy-Webhooks.md)
 *
 * Handles LemonSqueezy webhook events for subscription lifecycle management.
 * Implements idempotency to prevent duplicate event processing.
 *
 * POST /api/lemonsqueezy/webhook
 * - Verifies webhook signature using HMAC-SHA256
 * - Processes subscription and order events
 * - Updates user billing status
 *
 * Key Events Handled:
 * - order_created: User completed checkout
 * - subscription_created/updated/cancelled: Subscription lifecycle
 * - subscription_payment_success/failed: Recurring billing
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	verifyWebhookSignature,
	parseWebhookPayload,
	getEventType,
	getCustomData,
	isTestModeWebhook,
	extractSubscriptionData,
	extractOrderData
} from '$lib/lemonsqueezy/webhooks';
import type { LemonSqueezyWebhookPayload, LemonSqueezyWebhookEventType } from '$lib/lemonsqueezy/types';
import { prisma } from '$lib/prisma';

// ============================================================================
// Types
// ============================================================================

interface WebhookResponse {
	received: boolean;
	eventType?: string;
	message?: string;
}

interface WebhookErrorResponse {
	error: string;
	code?: string;
}

// ============================================================================
// Webhook Handler
// ============================================================================

export const POST: RequestHandler = async ({ request }) => {
	// Get raw body for signature verification
	const body = await request.text();
	const signature = request.headers.get('x-signature');

	if (!signature) {
		console.error('[LemonSqueezy Webhook] Missing x-signature header');
		return json<WebhookErrorResponse>(
			{ error: 'Missing signature', code: 'MISSING_SIGNATURE' },
			{ status: 400 }
		);
	}

	// Verify webhook signature
	const isValid = verifyWebhookSignature(body, signature);
	if (!isValid) {
		console.error('[LemonSqueezy Webhook] Signature verification failed');
		return json<WebhookErrorResponse>(
			{ error: 'Invalid signature', code: 'INVALID_SIGNATURE' },
			{ status: 401 }
		);
	}

	// Parse webhook payload
	const payload = parseWebhookPayload(body);
	if (!payload) {
		console.error('[LemonSqueezy Webhook] Failed to parse webhook payload');
		return json<WebhookErrorResponse>(
			{ error: 'Invalid payload', code: 'INVALID_PAYLOAD' },
			{ status: 400 }
		);
	}

	const eventType = getEventType(payload);
	const eventId = payload.data.id;
	const isTestMode = isTestModeWebhook(payload);

	console.log(`[LemonSqueezy Webhook] Received event: ${eventType} (${eventId})${isTestMode ? ' [TEST MODE]' : ''}`);

	// Check idempotency - prevent duplicate processing
	const existingEvent = await prisma.webhookEvent.findUnique({
		where: {
			provider_eventId: {
				provider: 'lemonsqueezy',
				eventId: eventId
			}
		}
	});

	if (existingEvent?.processed) {
		console.log(`[LemonSqueezy Webhook] Event ${eventId} already processed, skipping`);
		return json<WebhookResponse>({
			received: true,
			eventType,
			message: 'Already processed'
		});
	}

	// Create webhook event record for idempotency tracking
	if (!existingEvent) {
		await prisma.webhookEvent.create({
			data: {
				provider: 'lemonsqueezy',
				eventId: eventId,
				eventType,
				processed: false,
				payload: body
			}
		});
	}

	// Process event
	let userId: string | null = null;
	let processingStatus = 'success';
	let errorMessage: string | null = null;

	try {
		switch (eventType) {
			// ================================================================
			// Order Events (Checkout Flow)
			// ================================================================
			case 'order_created':
				userId = await handleOrderCreated(payload);
				break;

			case 'order_refunded':
				userId = await handleOrderRefunded(payload);
				break;

			// ================================================================
			// Subscription Events
			// ================================================================
			case 'subscription_created':
				userId = await handleSubscriptionCreated(payload);
				break;

			case 'subscription_updated':
				userId = await handleSubscriptionUpdated(payload);
				break;

			case 'subscription_cancelled':
				userId = await handleSubscriptionCancelled(payload);
				break;

			case 'subscription_resumed':
				userId = await handleSubscriptionResumed(payload);
				break;

			case 'subscription_expired':
				userId = await handleSubscriptionExpired(payload);
				break;

			case 'subscription_paused':
				userId = await handleSubscriptionPaused(payload);
				break;

			case 'subscription_unpaused':
				userId = await handleSubscriptionUnpaused(payload);
				break;

			// ================================================================
			// Payment Events
			// ================================================================
			case 'subscription_payment_success':
				userId = await handlePaymentSuccess(payload);
				break;

			case 'subscription_payment_failed':
				userId = await handlePaymentFailed(payload);
				break;

			case 'subscription_payment_recovered':
				userId = await handlePaymentRecovered(payload);
				break;

			// ================================================================
			// License Key Events (for future use)
			// ================================================================
			case 'license_key_created':
				console.log('[LemonSqueezy Webhook] License key created - not yet implemented');
				break;

			default:
				console.log(`[LemonSqueezy Webhook] Unhandled event type: ${eventType}`);
		}

		// Mark event as processed
		await prisma.webhookEvent.update({
			where: {
				provider_eventId: {
					provider: 'lemonsqueezy',
					eventId: eventId
				}
			},
			data: {
				processed: true,
				processingStatus,
				userId: userId || undefined,
				processedAt: new Date()
			}
		});

		console.log(`[LemonSqueezy Webhook] Successfully processed ${eventType}${userId ? ` for user ${userId}` : ''}`);

		return json<WebhookResponse>({
			received: true,
			eventType
		});
	} catch (error) {
		console.error(`[LemonSqueezy Webhook] Error processing ${eventType}:`, error);

		errorMessage = error instanceof Error ? error.message : 'Unknown error';
		processingStatus = 'failed';

		// Update event record with error
		await prisma.webhookEvent.update({
			where: {
				provider_eventId: {
					provider: 'lemonsqueezy',
					eventId: eventId
				}
			},
			data: {
				processed: false,
				processingStatus,
				errorMessage,
				processedAt: new Date()
			}
		});

		// Return 500 to trigger LemonSqueezy retry
		return json<WebhookErrorResponse>(
			{ error: 'Processing failed', code: 'PROCESSING_ERROR' },
			{ status: 500 }
		);
	}
};

// ============================================================================
// Order Event Handlers
// ============================================================================

/**
 * Handle order_created
 * User has completed checkout via LemonSqueezy hosted page
 */
async function handleOrderCreated(payload: LemonSqueezyWebhookPayload): Promise<string | null> {
	const customData = getCustomData(payload);
	const userId = customData.user_id;

	if (!userId) {
		console.warn('[LemonSqueezy Webhook] order_created - No user_id in custom data');
		return null;
	}

	const orderData = extractOrderData(payload);
	if (!orderData) {
		console.warn('[LemonSqueezy Webhook] order_created - Failed to extract order data');
		return userId;
	}

	const tier = customData.tier || 'pro';
	const attributes = payload.data.attributes as Record<string, unknown>;

	// Extract customer ID and first order item info
	const customerId = orderData.customerId?.toString() || null;
	const firstOrderItem = (attributes.first_order_item as Record<string, unknown>) || null;
	const subscriptionId = firstOrderItem?.subscription_id?.toString() || null;

	console.log(`[LemonSqueezy Webhook] Order created for user ${userId}, tier: ${tier}, customer: ${customerId}`);

	// Update user with LemonSqueezy customer ID and subscription info
	await prisma.user.update({
		where: { id: userId },
		data: {
			lemonSqueezyCustomerId: customerId,
			lemonSqueezySubscriptionId: subscriptionId,
			subscriptionTier: tier,
			subscriptionStatus: 'active'
		}
	});

	return userId;
}

/**
 * Handle order_refunded
 * Order has been refunded
 */
async function handleOrderRefunded(payload: LemonSqueezyWebhookPayload): Promise<string | null> {
	const customData = getCustomData(payload);
	const userId = customData.user_id;

	if (!userId) {
		// Try to find user by customer ID
		const orderData = extractOrderData(payload);
		if (orderData?.customerId) {
			const user = await prisma.user.findFirst({
				where: { lemonSqueezyCustomerId: orderData.customerId.toString() }
			});
			if (user) {
				console.log(`[LemonSqueezy Webhook] Order refunded for user ${user.id}`);
				await prisma.user.update({
					where: { id: user.id },
					data: {
						subscriptionTier: 'free',
						subscriptionStatus: 'cancelled',
						subscriptionEndDate: new Date()
					}
				});
				return user.id;
			}
		}
		console.warn('[LemonSqueezy Webhook] order_refunded - No user found');
		return null;
	}

	console.log(`[LemonSqueezy Webhook] Order refunded for user ${userId}`);

	// Revert to free tier on refund
	await prisma.user.update({
		where: { id: userId },
		data: {
			subscriptionTier: 'free',
			subscriptionStatus: 'cancelled',
			subscriptionEndDate: new Date()
		}
	});

	return userId;
}

// ============================================================================
// Subscription Event Handlers
// ============================================================================

/**
 * Handle subscription_created
 * New subscription created (usually follows order_created)
 */
async function handleSubscriptionCreated(payload: LemonSqueezyWebhookPayload): Promise<string | null> {
	const customData = getCustomData(payload);
	const userId = customData.user_id;
	const subData = extractSubscriptionData(payload);

	if (!subData) {
		console.warn('[LemonSqueezy Webhook] subscription_created - Failed to extract data');
		return null;
	}

	// Try to find user by userId or customer ID
	let user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

	if (!user && subData.customerId) {
		user = await prisma.user.findFirst({
			where: { lemonSqueezyCustomerId: subData.customerId.toString() }
		});
	}

	if (!user) {
		console.warn('[LemonSqueezy Webhook] subscription_created - No user found');
		return null;
	}

	const tier = customData.tier || 'pro';

	console.log(`[LemonSqueezy Webhook] Subscription created for user ${user.id}, status: ${subData.status}`);

	await prisma.user.update({
		where: { id: user.id },
		data: {
			lemonSqueezySubscriptionId: subData.subscriptionId,
			lemonSqueezyCustomerId: subData.customerId?.toString() || undefined,
			subscriptionTier: tier,
			subscriptionStatus: mapLemonSqueezyStatus(subData.status),
			subscriptionEndDate: subData.currentPeriodEnd
		}
	});

	return user.id;
}

/**
 * Handle subscription_updated
 * Subscription has been updated (plan change, renewal date, etc.)
 */
async function handleSubscriptionUpdated(payload: LemonSqueezyWebhookPayload): Promise<string | null> {
	const subData = extractSubscriptionData(payload);

	if (!subData) {
		console.warn('[LemonSqueezy Webhook] subscription_updated - Failed to extract data');
		return null;
	}

	// Find user by subscription ID
	const user = await prisma.user.findFirst({
		where: { lemonSqueezySubscriptionId: subData.subscriptionId }
	});

	if (!user) {
		// Try by customer ID
		if (subData.customerId) {
			const userByCustomer = await prisma.user.findFirst({
				where: { lemonSqueezyCustomerId: subData.customerId.toString() }
			});
			if (userByCustomer) {
				await updateUserSubscription(userByCustomer.id, subData);
				return userByCustomer.id;
			}
		}
		console.warn('[LemonSqueezy Webhook] subscription_updated - No user found');
		return null;
	}

	await updateUserSubscription(user.id, subData);
	return user.id;
}

/**
 * Handle subscription_cancelled
 * Subscription has been cancelled (will expire at period end)
 */
async function handleSubscriptionCancelled(payload: LemonSqueezyWebhookPayload): Promise<string | null> {
	const subData = extractSubscriptionData(payload);

	if (!subData) {
		console.warn('[LemonSqueezy Webhook] subscription_cancelled - Failed to extract data');
		return null;
	}

	// Find user by subscription ID
	const user = await prisma.user.findFirst({
		where: { lemonSqueezySubscriptionId: subData.subscriptionId }
	});

	if (!user) {
		console.warn('[LemonSqueezy Webhook] subscription_cancelled - No user found');
		return null;
	}

	console.log(`[LemonSqueezy Webhook] Subscription cancelled for user ${user.id}`);

	// Update status to cancelled but keep tier until period end
	await prisma.user.update({
		where: { id: user.id },
		data: {
			subscriptionStatus: 'cancelled',
			subscriptionEndDate: subData.cancelledAt || subData.currentPeriodEnd || new Date()
		}
	});

	return user.id;
}

/**
 * Handle subscription_resumed
 * Previously cancelled subscription has been reactivated
 */
async function handleSubscriptionResumed(payload: LemonSqueezyWebhookPayload): Promise<string | null> {
	const subData = extractSubscriptionData(payload);

	if (!subData) {
		console.warn('[LemonSqueezy Webhook] subscription_resumed - Failed to extract data');
		return null;
	}

	const user = await prisma.user.findFirst({
		where: { lemonSqueezySubscriptionId: subData.subscriptionId }
	});

	if (!user) {
		console.warn('[LemonSqueezy Webhook] subscription_resumed - No user found');
		return null;
	}

	console.log(`[LemonSqueezy Webhook] Subscription resumed for user ${user.id}`);

	await prisma.user.update({
		where: { id: user.id },
		data: {
			subscriptionStatus: 'active',
			subscriptionEndDate: subData.currentPeriodEnd
		}
	});

	return user.id;
}

/**
 * Handle subscription_expired
 * Subscription has expired (end of billing period after cancellation)
 */
async function handleSubscriptionExpired(payload: LemonSqueezyWebhookPayload): Promise<string | null> {
	const subData = extractSubscriptionData(payload);

	if (!subData) {
		console.warn('[LemonSqueezy Webhook] subscription_expired - Failed to extract data');
		return null;
	}

	const user = await prisma.user.findFirst({
		where: { lemonSqueezySubscriptionId: subData.subscriptionId }
	});

	if (!user) {
		console.warn('[LemonSqueezy Webhook] subscription_expired - No user found');
		return null;
	}

	console.log(`[LemonSqueezy Webhook] Subscription expired for user ${user.id}`);

	// Revert to free tier
	await prisma.user.update({
		where: { id: user.id },
		data: {
			subscriptionTier: 'free',
			subscriptionStatus: 'cancelled',
			lemonSqueezySubscriptionId: null,
			subscriptionEndDate: new Date()
		}
	});

	return user.id;
}

/**
 * Handle subscription_paused
 * Subscription has been paused
 */
async function handleSubscriptionPaused(payload: LemonSqueezyWebhookPayload): Promise<string | null> {
	const subData = extractSubscriptionData(payload);

	if (!subData) {
		return null;
	}

	const user = await prisma.user.findFirst({
		where: { lemonSqueezySubscriptionId: subData.subscriptionId }
	});

	if (!user) {
		console.warn('[LemonSqueezy Webhook] subscription_paused - No user found');
		return null;
	}

	console.log(`[LemonSqueezy Webhook] Subscription paused for user ${user.id}`);

	await prisma.user.update({
		where: { id: user.id },
		data: {
			subscriptionStatus: 'suspended' // Use 'suspended' for paused state
		}
	});

	return user.id;
}

/**
 * Handle subscription_unpaused
 * Subscription has been unpaused
 */
async function handleSubscriptionUnpaused(payload: LemonSqueezyWebhookPayload): Promise<string | null> {
	const subData = extractSubscriptionData(payload);

	if (!subData) {
		return null;
	}

	const user = await prisma.user.findFirst({
		where: { lemonSqueezySubscriptionId: subData.subscriptionId }
	});

	if (!user) {
		console.warn('[LemonSqueezy Webhook] subscription_unpaused - No user found');
		return null;
	}

	console.log(`[LemonSqueezy Webhook] Subscription unpaused for user ${user.id}`);

	await prisma.user.update({
		where: { id: user.id },
		data: {
			subscriptionStatus: 'active',
			subscriptionEndDate: subData.currentPeriodEnd
		}
	});

	return user.id;
}

// ============================================================================
// Payment Event Handlers
// ============================================================================

/**
 * Handle subscription_payment_success
 * Recurring payment was successful
 */
async function handlePaymentSuccess(payload: LemonSqueezyWebhookPayload): Promise<string | null> {
	const subData = extractSubscriptionData(payload);

	if (!subData) {
		return null;
	}

	const user = await prisma.user.findFirst({
		where: { lemonSqueezySubscriptionId: subData.subscriptionId }
	});

	if (!user) {
		console.warn('[LemonSqueezy Webhook] subscription_payment_success - No user found');
		return null;
	}

	console.log(`[LemonSqueezy Webhook] Payment successful for user ${user.id}`);

	// Ensure status is active after successful payment
	if (user.subscriptionStatus !== 'active') {
		await prisma.user.update({
			where: { id: user.id },
			data: {
				subscriptionStatus: 'active',
				subscriptionEndDate: subData.currentPeriodEnd
			}
		});
	}

	return user.id;
}

/**
 * Handle subscription_payment_failed
 * Recurring payment failed
 */
async function handlePaymentFailed(payload: LemonSqueezyWebhookPayload): Promise<string | null> {
	const subData = extractSubscriptionData(payload);

	if (!subData) {
		return null;
	}

	const user = await prisma.user.findFirst({
		where: { lemonSqueezySubscriptionId: subData.subscriptionId }
	});

	if (!user) {
		console.warn('[LemonSqueezy Webhook] subscription_payment_failed - No user found');
		return null;
	}

	console.log(`[LemonSqueezy Webhook] Payment failed for user ${user.id}`);

	// Update status to past_due
	await prisma.user.update({
		where: { id: user.id },
		data: {
			subscriptionStatus: 'past_due'
		}
	});

	// Could trigger payment failed email via Mautic here

	return user.id;
}

/**
 * Handle subscription_payment_recovered
 * Previously failed payment has been recovered
 */
async function handlePaymentRecovered(payload: LemonSqueezyWebhookPayload): Promise<string | null> {
	const subData = extractSubscriptionData(payload);

	if (!subData) {
		return null;
	}

	const user = await prisma.user.findFirst({
		where: { lemonSqueezySubscriptionId: subData.subscriptionId }
	});

	if (!user) {
		console.warn('[LemonSqueezy Webhook] subscription_payment_recovered - No user found');
		return null;
	}

	console.log(`[LemonSqueezy Webhook] Payment recovered for user ${user.id}`);

	// Restore active status
	await prisma.user.update({
		where: { id: user.id },
		data: {
			subscriptionStatus: 'active',
			subscriptionEndDate: subData.currentPeriodEnd
		}
	});

	return user.id;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map LemonSqueezy subscription status to our internal status
 */
function mapLemonSqueezyStatus(lsStatus: string | null): string {
	if (!lsStatus) return 'active';

	switch (lsStatus) {
		case 'active':
			return 'active';
		case 'on_trial':
			return 'trial';
		case 'past_due':
			return 'past_due';
		case 'cancelled':
		case 'expired':
			return 'cancelled';
		case 'paused':
			return 'suspended';
		case 'unpaid':
			return 'past_due';
		default:
			return 'active';
	}
}

/**
 * Update user subscription fields from extracted subscription data
 */
async function updateUserSubscription(
	userId: string,
	subData: {
		subscriptionId: string;
		customerId: string | null;
		status: string | null;
		currentPeriodEnd: Date | null;
	}
): Promise<void> {
	const status = mapLemonSqueezyStatus(subData.status);

	await prisma.user.update({
		where: { id: userId },
		data: {
			lemonSqueezySubscriptionId: subData.subscriptionId,
			lemonSqueezyCustomerId: subData.customerId?.toString() || undefined,
			subscriptionStatus: status,
			subscriptionEndDate: subData.currentPeriodEnd
		}
	});

	console.log(`[LemonSqueezy Webhook] Updated subscription for user ${userId}: status=${status}`);
}
