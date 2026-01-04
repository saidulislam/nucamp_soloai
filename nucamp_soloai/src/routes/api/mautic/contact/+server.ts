/**
 * Contact Form API Endpoint
 * Submits contact form data to Mautic for lead capture
 *
 * @see MA05-Mautic-Frontend-Connect.md
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import mauticService from '$lib/services/mautic';
import type { ContactFormData } from '$lib/services/datamodel';

/**
 * POST /api/mautic/contact
 * Submit contact form to Mautic
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Validate required fields
		if (!body.email || typeof body.email !== 'string') {
			return json(
				{ success: false, error: 'Email is required' },
				{ status: 400 }
			);
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(body.email)) {
			return json(
				{ success: false, error: 'Invalid email format' },
				{ status: 400 }
			);
		}

		// Prepare contact form data
		const contactData: ContactFormData = {
			email: body.email.toLowerCase().trim(),
			firstname: body.firstname?.trim() || body.name?.split(' ')[0]?.trim() || '',
			lastname: body.lastname?.trim() || body.name?.split(' ').slice(1).join(' ')?.trim() || '',
			message: body.message?.trim(),
			subject: body.subject?.trim(),
			phone: body.phone?.trim(),
			company: body.company?.trim(),
			source: body.source || 'contact-form'
		};

		// Check if Mautic service is initialized
		if (!mauticService.isInitialized()) {
			console.warn('Mautic service not initialized, contact form submission logged only');
			// Log the submission even if Mautic is not available
			console.log('Contact form submission:', {
				email: contactData.email,
				name: `${contactData.firstname} ${contactData.lastname}`.trim(),
				subject: contactData.subject
			});

			return json({
				success: true,
				message: 'Contact form submitted successfully',
				mauticEnabled: false
			});
		}

		// Submit to Mautic
		const result = await mauticService.submitContactForm(contactData);

		if (result?.contact?.id) {
			return json({
				success: true,
				message: 'Contact form submitted successfully',
				mauticEnabled: true,
				contactId: result.contact.id
			});
		}

		// Mautic submission failed but we don't want to fail the user request
		console.error('Mautic contact form submission failed, but returning success to user');
		return json({
			success: true,
			message: 'Contact form submitted successfully',
			mauticEnabled: false
		});
	} catch (error) {
		console.error('Contact form API error:', error);
		return json(
			{ success: false, error: 'Failed to submit contact form' },
			{ status: 500 }
		);
	}
};
