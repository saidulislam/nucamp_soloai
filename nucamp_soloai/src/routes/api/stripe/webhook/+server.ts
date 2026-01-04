/**
 * Stripe Webhook Handler
 * (ST04-Stripe-Webhooks.md)
 *
 * Handles Stripe webhook events for subscription lifecycle management.
 * Implements idempotency to prevent duplicate event processing.
 *
 * POST /api/stripe/webhook
 * - Verifies webhook signature
 * - Processes subscription events
 * - Updates user billing status
 *
 * Key Events Handled:
 * - checkout.session.completed: User completed checkout
 * - customer.subscription.created/updated/deleted: Subscription lifecycle
 * - invoice.payment_succeeded/failed: Recurring billing
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyWebhookSignature, getStripeOrNull } from '$lib/stripe/server';
import { prisma } from '$lib/prisma';
import type { SubscriptionWithPeriodEnd, InvoiceWithSubscription } from '$lib/stripe/types';

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
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		console.error('[Stripe Webhook] Missing stripe-signature header');
		return json<WebhookErrorResponse>(
			{ error: 'Missing signature', code: 'MISSING_SIGNATURE' },
			{ status: 400 }
		);
	}

	// Verify webhook signature
	const event = verifyWebhookSignature(body, signature);
	if (!event) {
		console.error('[Stripe Webhook] Signature verification failed');
		return json<WebhookErrorResponse>(
			{ error: 'Invalid signature', code: 'INVALID_SIGNATURE' },
			{ status: 400 }
		);
	}

	console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

	// Check idempotency - prevent duplicate processing
	const existingEvent = await prisma.webhookEvent.findUnique({
		where: {
			provider_eventId: {
				provider: 'stripe',
				eventId: event.id
			}
		}
	});

	if (existingEvent?.processed) {
		console.log(`[Stripe Webhook] Event ${event.id} already processed, skipping`);
		return json<WebhookResponse>({
			received: true,
			eventType: event.type,
			message: 'Already processed'
		});
	}

	// Create webhook event record for idempotency tracking
	if (!existingEvent) {
		await prisma.webhookEvent.create({
			data: {
				provider: 'stripe',
				eventId: event.id,
				eventType: event.type,
				processed: false,
				payload: JSON.stringify(event)
			}
		});
	}

	// Process event
	let userId: string | null = null;
	let processingStatus = 'success';
	let errorMessage: string | null = null;

	try {
		switch (event.type) {
			// ================================================================
			// Checkout Events
			// ================================================================
			case 'checkout.session.completed':
				userId = await handleCheckoutSessionCompleted(event);
				break;

			case 'checkout.session.expired':
				userId = await handleCheckoutSessionExpired(event);
				break;

			// ================================================================
			// Subscription Events
			// ================================================================
			case 'customer.subscription.created':
				userId = await handleSubscriptionCreated(event);
				break;

			case 'customer.subscription.updated':
				userId = await handleSubscriptionUpdated(event);
				break;

			case 'customer.subscription.deleted':
				userId = await handleSubscriptionDeleted(event);
				break;

			case 'customer.subscription.trial_will_end':
				userId = await handleTrialWillEnd(event);
				break;

			// ================================================================
			// Payment Events
			// ================================================================
			case 'invoice.payment_succeeded':
				userId = await handlePaymentSucceeded(event);
				break;

			case 'invoice.payment_failed':
				userId = await handlePaymentFailed(event);
				break;

			// ================================================================
			// Customer Portal Events
			// ================================================================
			case 'billing_portal.session.created':
				console.log('[Stripe Webhook] Customer accessed billing portal');
				break;

			case 'customer.updated':
				console.log('[Stripe Webhook] Customer info updated');
				break;

			default:
				console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
		}

		// Mark event as processed
		await prisma.webhookEvent.update({
			where: {
				provider_eventId: {
					provider: 'stripe',
					eventId: event.id
				}
			},
			data: {
				processed: true,
				processingStatus,
				userId: userId || undefined,
				processedAt: new Date()
			}
		});

		console.log(`[Stripe Webhook] Successfully processed ${event.type}${userId ? ` for user ${userId}` : ''}`);

		return json<WebhookResponse>({
			received: true,
			eventType: event.type
		});
	} catch (error) {
		console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);

		errorMessage = error instanceof Error ? error.message : 'Unknown error';
		processingStatus = 'failed';

		// Update event record with error
		await prisma.webhookEvent.update({
			where: {
				provider_eventId: {
					provider: 'stripe',
					eventId: event.id
				}
			},
			data: {
				processed: false,
				processingStatus,
				errorMessage,
				processedAt: new Date()
			}
		});

		// Return 500 to trigger Stripe retry
		return json<WebhookErrorResponse>(
			{ error: 'Processing failed', code: 'PROCESSING_ERROR' },
			{ status: 500 }
		);
	}
};

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Handle checkout.session.completed
 * User has successfully completed checkout via Stripe-hosted page
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<string | null> {
	const session = event.data.object as Stripe.Checkout.Session;

	// Get user ID from session metadata
	const userId = session.metadata?.userId;
	if (!userId) {
		console.warn('[Stripe Webhook] checkout.session.completed - No userId in metadata');
		return null;
	}

	const tier = session.metadata?.tier || 'pro';
	const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
	const subscriptionId = typeof session.subscription === 'string'
		? session.subscription
		: session.subscription?.id;

	console.log(`[Stripe Webhook] Checkout completed for user ${userId}, tier: ${tier}`);

	// Update user subscription status
	await prisma.user.update({
		where: { id: userId },
		data: {
			stripeCustomerId: customerId || undefined,
			stripeSubscriptionId: subscriptionId || undefined,
			subscriptionTier: tier,
			subscriptionStatus: 'active'
		}
	});

	return userId;
}

/**
 * Handle checkout.session.expired
 * Checkout session expired without completion
 */
async function handleCheckoutSessionExpired(event: Stripe.Event): Promise<string | null> {
	const session = event.data.object as Stripe.Checkout.Session;
	const userId = session.metadata?.userId;

	if (userId) {
		console.log(`[Stripe Webhook] Checkout expired for user ${userId}`);
	}

	// No user update needed - session just expired
	return userId || null;
}

/**
 * Handle customer.subscription.created
 * New subscription created (often follows checkout.session.completed)
 */
async function handleSubscriptionCreated(event: Stripe.Event): Promise<string | null> {
	const subscription = event.data.object as SubscriptionWithPeriodEnd;

	const userId = subscription.metadata?.userId;
	if (!userId) {
		// Try to find user by customer ID
		const customerId = typeof subscription.customer === 'string'
			? subscription.customer
			: subscription.customer?.id;

		if (customerId) {
			const user = await prisma.user.findFirst({
				where: { stripeCustomerId: customerId }
			});
			if (user) {
				await updateUserSubscription(user.id, subscription);
				return user.id;
			}
		}
		console.warn('[Stripe Webhook] subscription.created - No userId found');
		return null;
	}

	await updateUserSubscription(userId, subscription);
	return userId;
}

/**
 * Handle customer.subscription.updated
 * Subscription modified (plan change, renewal, etc.)
 */
async function handleSubscriptionUpdated(event: Stripe.Event): Promise<string | null> {
	const subscription = event.data.object as SubscriptionWithPeriodEnd;

	const userId = subscription.metadata?.userId;
	if (!userId) {
		// Try to find user by subscription ID
		const user = await prisma.user.findFirst({
			where: { stripeSubscriptionId: subscription.id }
		});
		if (user) {
			await updateUserSubscription(user.id, subscription);
			return user.id;
		}
		console.warn('[Stripe Webhook] subscription.updated - No user found');
		return null;
	}

	await updateUserSubscription(userId, subscription);
	return userId;
}

/**
 * Handle customer.subscription.deleted
 * Subscription cancelled or expired
 */
async function handleSubscriptionDeleted(event: Stripe.Event): Promise<string | null> {
	const subscription = event.data.object as Stripe.Subscription;

	// Find user by subscription ID
	const user = await prisma.user.findFirst({
		where: { stripeSubscriptionId: subscription.id }
	});

	if (!user) {
		console.warn('[Stripe Webhook] subscription.deleted - No user found');
		return null;
	}

	console.log(`[Stripe Webhook] Subscription deleted for user ${user.id}`);

	// Revert to free tier
	await prisma.user.update({
		where: { id: user.id },
		data: {
			subscriptionTier: 'free',
			subscriptionStatus: 'cancelled',
			stripeSubscriptionId: null,
			subscriptionEndDate: new Date()
		}
	});

	return user.id;
}

/**
 * Handle customer.subscription.trial_will_end
 * Trial period ending soon (3 days before)
 */
async function handleTrialWillEnd(event: Stripe.Event): Promise<string | null> {
	const subscription = event.data.object as Stripe.Subscription;

	// Find user
	const user = await prisma.user.findFirst({
		where: { stripeSubscriptionId: subscription.id }
	});

	if (user) {
		console.log(`[Stripe Webhook] Trial ending soon for user ${user.id}`);
		// Could trigger email notification via Mautic here
	}

	return user?.id || null;
}

/**
 * Handle invoice.payment_succeeded
 * Successful payment (initial or recurring)
 */
async function handlePaymentSucceeded(event: Stripe.Event): Promise<string | null> {
	const invoice = event.data.object as InvoiceWithSubscription;

	if (!invoice.subscription) {
		console.log('[Stripe Webhook] payment_succeeded - No subscription (one-time payment)');
		return null;
	}

	const subscriptionId = typeof invoice.subscription === 'string'
		? invoice.subscription
		: invoice.subscription.id;

	// Find user by subscription ID
	const user = await prisma.user.findFirst({
		where: { stripeSubscriptionId: subscriptionId }
	});

	if (!user) {
		console.warn('[Stripe Webhook] payment_succeeded - No user found');
		return null;
	}

	console.log(`[Stripe Webhook] Payment succeeded for user ${user.id}`);

	// Ensure status is active after successful payment
	if (user.subscriptionStatus !== 'active') {
		await prisma.user.update({
			where: { id: user.id },
			data: { subscriptionStatus: 'active' }
		});
	}

	return user.id;
}

/**
 * Handle invoice.payment_failed
 * Payment failed (card declined, etc.)
 */
async function handlePaymentFailed(event: Stripe.Event): Promise<string | null> {
	const invoice = event.data.object as InvoiceWithSubscription;

	if (!invoice.subscription) {
		return null;
	}

	const subscriptionId = typeof invoice.subscription === 'string'
		? invoice.subscription
		: invoice.subscription.id;

	// Find user by subscription ID
	const user = await prisma.user.findFirst({
		where: { stripeSubscriptionId: subscriptionId }
	});

	if (!user) {
		console.warn('[Stripe Webhook] payment_failed - No user found');
		return null;
	}

	console.log(`[Stripe Webhook] Payment failed for user ${user.id}`);

	// Update status to past_due
	await prisma.user.update({
		where: { id: user.id },
		data: { subscriptionStatus: 'past_due' }
	});

	// Could trigger payment failed email via Mautic here

	return user.id;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Update user subscription fields from Stripe subscription object
 */
async function updateUserSubscription(
	userId: string,
	subscription: SubscriptionWithPeriodEnd
): Promise<void> {
	const tier = subscription.metadata?.tier || 'pro';

	// Map Stripe status to our status
	let status: string;
	switch (subscription.status) {
		case 'active':
		case 'trialing':
			status = 'active';
			break;
		case 'past_due':
			status = 'past_due';
			break;
		case 'canceled':
		case 'unpaid':
			status = 'cancelled';
			break;
		default:
			status = subscription.status;
	}

	// Calculate end date from current_period_end
	const endDate = subscription.current_period_end
		? new Date(subscription.current_period_end * 1000)
		: null;

	await prisma.user.update({
		where: { id: userId },
		data: {
			stripeSubscriptionId: subscription.id,
			subscriptionTier: tier,
			subscriptionStatus: status,
			subscriptionEndDate: endDate
		}
	});

	console.log(`[Stripe Webhook] Updated subscription for user ${userId}: tier=${tier}, status=${status}`);
}
