/**
 * Email Translation API Endpoint
 * Translates Mautic emails to multiple languages using OpenAI
 *
 * POST /api/mautic/emails/[emailId]/translate
 *
 * @see MA07-Email-Translations-Route.md
 */

import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MAUTIC_PASSWORD, MAUTIC_USERNAME } from '$env/static/private';
import { translateEmail } from './helper';
import type { TranslateEmailRequest } from '$lib/services/datamodel';

/**
 * POST /api/mautic/emails/[emailId]/translate
 *
 * Translates a Mautic email to specified languages (or all configured languages except English)
 *
 * Request Body:
 * {
 *   "languages": ["es", "fr", "de"]  // Optional: specific languages to translate to
 * }
 *
 * Response:
 * [
 *   { "email": {...}, "language": "es" },
 *   { "email": {...}, "language": "fr" },
 *   ...
 * ]
 */
export const POST: RequestHandler = async ({ request, params }) => {
	// Extract email ID from URL params
	const { emailId } = params;

	if (!emailId || isNaN(parseInt(emailId))) {
		error(400, 'Invalid email ID');
	}

	// Validate Basic Auth
	const authHeader = request.headers.get('Authorization');

	if (!authHeader) {
		error(401, 'Authorization header required');
	}

	const username = MAUTIC_USERNAME;
	const password = MAUTIC_PASSWORD;

	if (!username || !password) {
		error(500, 'Mautic credentials not configured');
	}

	const expectedAuth = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

	if (authHeader !== expectedAuth) {
		error(401, 'Invalid credentials');
	}

	// Parse request body for language filter
	let languages: string[] = [];

	try {
		const contentType = request.headers.get('content-type');

		if (contentType?.includes('application/json')) {
			const body = await request.text();

			if (body && body.trim()) {
				const data: TranslateEmailRequest = JSON.parse(body);

				if (data?.languages && Array.isArray(data.languages)) {
					languages = data.languages;
				}
			}
		}
	} catch {
		// No body or invalid JSON - proceed with default (all languages)
	}

	try {
		// Translate email to target languages
		const createdEmails = await translateEmail(parseInt(emailId), languages);

		return json(createdEmails);
	} catch (err) {
		console.error('Email translation error:', err);

		if (err instanceof Error) {
			if (err.message.includes('not found')) {
				error(404, err.message);
			}
			error(500, err.message);
		}

		error(500, 'Failed to translate email');
	}
};
