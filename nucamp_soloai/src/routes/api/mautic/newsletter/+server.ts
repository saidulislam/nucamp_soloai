/**
 * Newsletter Signup API Endpoint
 * Submits newsletter subscription to Mautic
 *
 * @see MA05-Mautic-Frontend-Connect.md
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import mauticService from '$lib/services/mautic';
import type { NewsletterSignupData } from '$lib/services/datamodel';

/**
 * POST /api/mautic/newsletter
 * Subscribe to newsletter
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

		// Prepare newsletter signup data
		const signupData: NewsletterSignupData = {
			email: body.email.toLowerCase().trim(),
			firstname: body.firstname?.trim() || body.name?.split(' ')[0]?.trim() || '',
			lastname: body.lastname?.trim() || body.name?.split(' ').slice(1).join(' ')?.trim() || '',
			source: body.source || 'newsletter-form',
			locale: body.locale || 'en'
		};

		// Check if Mautic service is initialized
		if (!mauticService.isInitialized()) {
			console.warn('Mautic service not initialized, newsletter signup logged only');
			// Log the signup even if Mautic is not available
			console.log('Newsletter signup:', {
				email: signupData.email,
				locale: signupData.locale
			});

			return json({
				success: true,
				message: 'Newsletter subscription successful',
				mauticEnabled: false
			});
		}

		// Submit to Mautic
		const result = await mauticService.signupNewsletter(signupData);

		if (result?.contact?.id) {
			return json({
				success: true,
				message: 'Newsletter subscription successful',
				mauticEnabled: true,
				contactId: result.contact.id
			});
		}

		// Mautic submission failed but we don't want to fail the user request
		console.error('Mautic newsletter signup failed, but returning success to user');
		return json({
			success: true,
			message: 'Newsletter subscription successful',
			mauticEnabled: false
		});
	} catch (error) {
		console.error('Newsletter signup API error:', error);
		return json(
			{ success: false, error: 'Failed to subscribe to newsletter' },
			{ status: 500 }
		);
	}
};
