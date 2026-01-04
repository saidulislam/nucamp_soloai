/**
 * Mautic Webhook Endpoint
 * Receives and processes webhook events from Mautic
 *
 * Events handled:
 * - contact.identified: Anonymous contact becomes identified
 * - contact.added: New contact created
 * - contact.updated: Contact fields updated
 * - form.submitted: Form submission received
 * - email.opened: Email opened by contact
 * - email.clicked: Email link clicked by contact
 *
 * @see MA02-Mautic-API-Auth.md
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import type { MauticWebhookPayload, MauticWebhookEventType } from '$lib/services/datamodel';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const payload = (await request.json()) as MauticWebhookPayload;

		// Extract event type and contact from payload
		const eventType = payload['mautic.webhook_event'];
		const contact = payload['mautic.lead'];

		console.log('Mautic webhook received:', {
			eventType,
			contactId: contact?.id,
			contactEmail: contact?.fields?.all?.email,
			timestamp: payload.timestamp
		});

		// Handle different webhook events
		switch (eventType) {
			case 'contact.identified':
				await handleContactIdentified(contact);
				break;

			case 'contact.added':
				await handleContactAdded(contact);
				break;

			case 'contact.updated':
				await handleContactUpdated(contact);
				break;

			case 'form.submitted':
				await handleFormSubmission(payload);
				break;

			case 'email.opened':
			case 'email.clicked':
				await handleEmailEngagement(payload, eventType);
				break;

			default:
				console.log('Unhandled Mautic webhook event:', eventType);
		}

		return json({ success: true, event: eventType });
	} catch (error) {
		console.error('Mautic webhook error:', error);
		return json(
			{ success: false, error: 'Webhook processing failed' },
			{ status: 500 }
		);
	}
};

/**
 * Handle contact identified event
 * Triggered when an anonymous contact is identified (e.g., submits email)
 */
async function handleContactIdentified(
	contact: MauticWebhookPayload['mautic.lead']
): Promise<void> {
	if (!contact) return;

	const email = contact.fields?.all?.email;
	const mauticId = contact.id;

	console.log('Contact identified:', { mauticId, email });

	// If we have an email, try to link to existing user
	if (email && mauticId) {
		try {
			// Check if user exists with this email but no mauticId
			const user = await prisma.user.findUnique({
				where: { email },
				select: { id: true, mauticId: true }
			});

			if (user && !user.mauticId) {
				// Link Mautic contact to existing user
				await prisma.user.update({
					where: { id: user.id },
					data: { mauticId }
				});
				console.log(`Linked Mautic contact ${mauticId} to user ${user.id}`);
			}
		} catch (error) {
			console.error('Error handling contact identified:', error);
		}
	}
}

/**
 * Handle contact added event
 * Triggered when a new contact is created in Mautic
 */
async function handleContactAdded(
	contact: MauticWebhookPayload['mautic.lead']
): Promise<void> {
	if (!contact) return;

	console.log('Contact added:', {
		id: contact.id,
		email: contact.fields?.all?.email,
		dateAdded: contact.dateAdded
	});

	// New contacts are typically anonymous at creation
	// They will be linked when identified via contact.identified event
}

/**
 * Handle contact updated event
 * Triggered when contact fields are modified in Mautic
 */
async function handleContactUpdated(
	contact: MauticWebhookPayload['mautic.lead']
): Promise<void> {
	if (!contact) return;

	const email = contact.fields?.all?.email;
	const mauticId = contact.id;

	console.log('Contact updated:', {
		id: mauticId,
		email,
		dateModified: contact.dateModified
	});

	// Optionally sync contact updates back to your database
	// This is useful for keeping user preferences in sync
	if (email && mauticId) {
		try {
			const user = await prisma.user.findFirst({
				where: { mauticId },
				select: { id: true, email: true }
			});

			if (user) {
				// User exists - could sync preferences here if needed
				// For now, just log the update
				console.log(`Mautic contact ${mauticId} updated for user ${user.id}`);
			}
		} catch (error) {
			console.error('Error handling contact updated:', error);
		}
	}
}

/**
 * Handle form submission event
 * Triggered when a Mautic form is submitted
 */
async function handleFormSubmission(payload: MauticWebhookPayload): Promise<void> {
	const form = payload['mautic.form'];
	const contact = payload['mautic.lead'];

	console.log('Form submitted:', {
		formId: form?.id,
		formName: form?.name,
		contactId: contact?.id,
		contactEmail: contact?.fields?.all?.email
	});

	// Handle specific form submissions here
	// Example: Newsletter signup, contact form, etc.
}

/**
 * Handle email engagement events (opened, clicked)
 * Triggered when contact opens or clicks email
 */
async function handleEmailEngagement(
	payload: MauticWebhookPayload,
	eventType: MauticWebhookEventType
): Promise<void> {
	const email = payload['mautic.email'];
	const contact = payload['mautic.lead'];

	console.log('Email engagement:', {
		eventType,
		emailId: email?.id,
		emailSubject: email?.subject,
		contactId: contact?.id
	});

	// Track email engagement metrics here
	// Could update user engagement scores, trigger follow-up actions, etc.
}

// GET handler for webhook verification (some systems send GET to verify endpoint)
export const GET: RequestHandler = async () => {
	return json({
		status: 'ok',
		message: 'Mautic webhook endpoint is active'
	});
};
