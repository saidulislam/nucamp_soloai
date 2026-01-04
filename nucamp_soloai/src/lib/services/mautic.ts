/**
 * Mautic API Service
 * Handles all interactions with the Mautic REST API
 *
 * Features:
 * - Basic Authentication
 * - Retry logic with exponential backoff
 * - Contact CRUD operations
 * - Anonymous to authenticated user transition handling
 * - Duplicate contact prevention
 *
 * @see MA02-Mautic-API-Auth.md
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { MAUTIC_BASEURL, MAUTIC_PASSWORD, MAUTIC_USERNAME } from '$env/static/private';
import type {
	MauticUserData,
	SimplifiedError,
	MauticContactResponse,
	MauticContactsListResponse,
	MauticSegmentsListResponse,
	ContactFormData,
	NewsletterSignupData,
	MauticEmail,
	MauticEmailResponse,
	MauticEmailCreateData
} from './datamodel';

/**
 * Mautic API Service Class
 * Provides methods for interacting with Mautic contacts API
 */
class Mautic {
	private client: AxiosInstance;
	private initialized: boolean = false;

	constructor() {
		const baseURL = MAUTIC_BASEURL;
		const username = MAUTIC_USERNAME;
		const password = MAUTIC_PASSWORD;

		// Check if Mautic credentials are configured
		if (!baseURL || !username || !password) {
			console.warn(
				'Mautic credentials not configured. Set MAUTIC_BASEURL, MAUTIC_USERNAME, and MAUTIC_PASSWORD environment variables.'
			);
			// Create a dummy client that won't be used
			this.client = axios.create();
			this.initialized = false;
			return;
		}

		const auth = Buffer.from(`${username}:${password}`).toString('base64');

		this.client = axios.create({
			baseURL,
			headers: {
				Authorization: `Basic ${auth}`,
				'Content-Type': 'application/json',
				'User-Agent': 'SoloAI-SvelteKit/1.0'
			},
			timeout: 10000 // 10 second timeout
		});

		// Configure axios-retry with exponential backoff
		axiosRetry(this.client, {
			retries: 3,
			retryDelay: axiosRetry.exponentialDelay,
			retryCondition: (error: AxiosError) => {
				// Retry on rate limits (429) and server errors (5xx)
				return (
					!error.response?.status ||
					error.response?.status === 429 ||
					error.response?.status >= 500
				);
			},
			onRetry: (retryCount, error) => {
				console.log(`Mautic API retry attempt ${retryCount} for: ${error.config?.url}`);
			}
		});

		this.initialized = true;
	}

	/**
	 * Check if Mautic service is properly initialized
	 */
	public isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * Get a contact by ID
	 */
	public async getUser(id: number): Promise<MauticContactResponse | null> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping getUser');
			return null;
		}

		try {
			const response = await this.client.get<MauticContactResponse>(`/contacts/${id}`);
			return response.data;
		} catch (error) {
			this.handleError(error);
			return null;
		}
	}

	/**
	 * Create a new contact
	 */
	public async createUser(data: MauticUserData): Promise<MauticContactResponse | null> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping createUser');
			return null;
		}

		try {
			const response = await this.client.post<MauticContactResponse>('/contacts/new', data);
			return response.data;
		} catch (error) {
			this.handleError(error);
			return null;
		}
	}

	/**
	 * Edit an existing contact
	 * @param id Contact ID
	 * @param data Contact data to update
	 * @param createIfNotFound If true, creates contact if not found (PUT), otherwise patches (PATCH)
	 */
	public async editUser(
		id: number,
		data: MauticUserData,
		createIfNotFound: boolean = false
	): Promise<MauticContactResponse | null> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping editUser');
			return null;
		}

		try {
			const method = createIfNotFound ? 'put' : 'patch';
			const response = await this.client.request<MauticContactResponse>({
				method,
				url: `/contacts/${id}/edit`,
				data
			});
			return response.data;
		} catch (error) {
			this.handleError(error);
			return null;
		}
	}

	/**
	 * Find a contact by email address
	 */
	public async findUserByEmail(
		email: string
	): Promise<MauticContactResponse['contact'] | null> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping findUserByEmail');
			return null;
		}

		try {
			const response = await this.client.get<MauticContactsListResponse>('/contacts', {
				params: { search: email }
			});

			if (response.data.total && parseInt(response.data.total) > 0) {
				const contactId = Object.keys(response.data.contacts)[0];
				return response.data.contacts[contactId];
			}
			return null;
		} catch (error) {
			this.handleError(error);
			return null;
		}
	}

	/**
	 * Get or create a Mautic contact, handling anonymous to authenticated transition
	 *
	 * This function implements the key logic for avoiding duplicate contacts:
	 * 1. If user has an email, search for existing contact by email first
	 * 2. If found, update that contact with new data
	 * 3. If mauticId exists (from cookie), try to get that contact
	 * 4. If email changed, create new contact (different person)
	 * 5. Otherwise, update existing contact
	 * 6. If no existing contact found, create new one
	 */
	public async getOrCreateMauticUser(
		contactData: MauticUserData
	): Promise<MauticContactResponse | null> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping getOrCreateMauticUser');
			return null;
		}

		try {
			// Step 1: Search by email first (most reliable match)
			let mauticUser = await this.findUserByEmail(contactData.email);

			if (mauticUser) {
				// Found by email - update existing contact
				console.log(`Mautic: Found existing contact by email, updating ID: ${mauticUser.id}`);
				const updated = await this.editUser(mauticUser.id, contactData, true);
				return updated;
			}

			// Step 2: No email match, check if we have mauticId from cookie
			if (contactData.mauticId) {
				const existingContact = await this.getUser(contactData.mauticId);

				if (existingContact?.contact) {
					const existingEmail = existingContact.contact.fields?.all?.email;

					if (existingEmail && existingEmail !== contactData.email) {
						// Email changed - this is a different user on same browser
						// Create new contact to avoid overwriting different person's data
						console.log(
							`Mautic: Different email detected, creating new contact for: ${contactData.email}`
						);
						return await this.createUser(contactData);
					} else {
						// Same user (no email or same email), update anonymous contact
						console.log(
							`Mautic: Updating anonymous contact ID: ${contactData.mauticId} with email: ${contactData.email}`
						);
						return await this.editUser(contactData.mauticId, contactData, true);
					}
				}
			}

			// Step 3: No existing contact found - create new
			console.log(`Mautic: Creating new contact for: ${contactData.email}`);
			return await this.createUser(contactData);
		} catch (error) {
			this.handleError(error);
			return null;
		}
	}

	/**
	 * Test API connectivity
	 * Returns true if API is accessible and authenticated
	 */
	public async testConnection(): Promise<boolean> {
		if (!this.initialized) {
			return false;
		}

		try {
			// Try to fetch contacts with limit 1 to test connectivity
			const response = await this.client.get('/contacts', {
				params: { limit: 1 }
			});
			return response.status === 200;
		} catch (error) {
			console.error('Mautic connection test failed:', error);
			return false;
		}
	}

	// =========================================================================
	// Segment Management Methods (MA05-Mautic-Frontend-Connect.md)
	// =========================================================================

	/**
	 * Get segment by alias
	 */
	public async getSegmentByAlias(
		alias: string
	): Promise<MauticSegmentsListResponse['lists'][string] | null> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping getSegmentByAlias');
			return null;
		}

		try {
			const response = await this.client.get<MauticSegmentsListResponse>('/segments', {
				params: { search: alias }
			});

			if (response.data.total && parseInt(response.data.total) > 0) {
				// Find segment with matching alias
				const segments = Object.values(response.data.lists);
				const segment = segments.find((s) => s.alias === alias);
				return segment || null;
			}
			return null;
		} catch (error) {
			this.handleError(error);
			return null;
		}
	}

	/**
	 * Add contact to a segment
	 * @param contactId Mautic contact ID
	 * @param segmentId Mautic segment ID
	 */
	public async addContactToSegment(contactId: number, segmentId: number): Promise<boolean> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping addContactToSegment');
			return false;
		}

		try {
			await this.client.post(`/segments/${segmentId}/contact/${contactId}/add`);
			console.log(`Mautic: Added contact ${contactId} to segment ${segmentId}`);
			return true;
		} catch (error) {
			this.handleError(error);
			return false;
		}
	}

	/**
	 * Remove contact from a segment
	 * @param contactId Mautic contact ID
	 * @param segmentId Mautic segment ID
	 */
	public async removeContactFromSegment(contactId: number, segmentId: number): Promise<boolean> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping removeContactFromSegment');
			return false;
		}

		try {
			await this.client.post(`/segments/${segmentId}/contact/${contactId}/remove`);
			console.log(`Mautic: Removed contact ${contactId} from segment ${segmentId}`);
			return true;
		} catch (error) {
			this.handleError(error);
			return false;
		}
	}

	/**
	 * Add contact to "New Authenticated Users" segment
	 * Uses the segment created in MA03-Mautic-Create-Campaign.md
	 */
	public async addToNewUsersSegment(contactId: number): Promise<boolean> {
		// First try to find the segment by alias
		const segment = await this.getSegmentByAlias('new-authenticated-users');

		if (segment) {
			return await this.addContactToSegment(contactId, segment.id);
		}

		// Fallback: try segment ID 1 (default created by setup script)
		console.log('Mautic: Segment not found by alias, trying ID 1');
		return await this.addContactToSegment(contactId, 1);
	}

	// =========================================================================
	// Contact Form & Newsletter Methods (MA05-Mautic-Frontend-Connect.md)
	// =========================================================================

	/**
	 * Submit contact form to Mautic
	 * Creates or updates contact with form data and tags them appropriately
	 */
	public async submitContactForm(data: ContactFormData): Promise<MauticContactResponse | null> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping submitContactForm');
			return null;
		}

		try {
			// Prepare contact data with contact form specific fields
			const contactData: MauticUserData = {
				email: data.email,
				firstname: data.firstname || '',
				lastname: data.lastname || '',
				// Custom fields that may exist in Mautic
				company: data.company,
				phone: data.phone,
				// Tags to identify contact source
				tags: ['contact-form', data.source || 'website']
			};

			// Create or update contact
			const result = await this.getOrCreateMauticUser(contactData);

			if (result?.contact?.id) {
				console.log(`Mautic: Contact form submitted for ${data.email}, contact ID: ${result.contact.id}`);
			}

			return result;
		} catch (error) {
			this.handleError(error);
			return null;
		}
	}

	/**
	 * Sign up for newsletter
	 * Creates minimal contact for newsletter subscription
	 */
	public async signupNewsletter(data: NewsletterSignupData): Promise<MauticContactResponse | null> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping signupNewsletter');
			return null;
		}

		try {
			// Prepare minimal contact data for newsletter
			const contactData: MauticUserData = {
				email: data.email,
				firstname: data.firstname || '',
				lastname: data.lastname || '',
				locale: data.locale || 'en',
				preferred_locale: data.locale || 'en',
				// Tags to identify newsletter subscribers
				tags: ['newsletter', data.source || 'website']
			};

			// Create or update contact
			const result = await this.getOrCreateMauticUser(contactData);

			if (result?.contact?.id) {
				console.log(`Mautic: Newsletter signup for ${data.email}, contact ID: ${result.contact.id}`);

				// Optionally add to a newsletter segment if it exists
				const newsletterSegment = await this.getSegmentByAlias('newsletter-subscribers');
				if (newsletterSegment) {
					await this.addContactToSegment(result.contact.id, newsletterSegment.id);
				}
			}

			return result;
		} catch (error) {
			this.handleError(error);
			return null;
		}
	}

	/**
	 * Update contact marketing preferences
	 * @param contactId Mautic contact ID
	 * @param optIn Whether user opts in to marketing emails
	 */
	public async updateMarketingPreference(contactId: number, optIn: boolean): Promise<boolean> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping updateMarketingPreference');
			return false;
		}

		try {
			// Update the contact's do not contact status
			const endpoint = optIn
				? `/contacts/${contactId}/dnc/email/remove`
				: `/contacts/${contactId}/dnc/email/add`;

			await this.client.post(endpoint);
			console.log(`Mautic: Updated marketing preference for contact ${contactId}: opt-in=${optIn}`);
			return true;
		} catch (error) {
			this.handleError(error);
			return false;
		}
	}

	// =========================================================================
	// Email Methods (MA07-Email-Translations-Route.md)
	// =========================================================================

	/**
	 * Get an email by ID
	 * @param emailId Mautic email ID
	 */
	public async getEmail(emailId: number): Promise<MauticEmail | null> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping getEmail');
			return null;
		}

		try {
			const response = await this.client.get<MauticEmailResponse>(`/emails/${emailId}`);
			return response.data.email;
		} catch (error) {
			this.handleError(error);
			return null;
		}
	}

	/**
	 * Create a new email
	 * @param data Email data to create
	 */
	public async createEmail(data: MauticEmailCreateData): Promise<MauticEmail | null> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping createEmail');
			return null;
		}

		try {
			const response = await this.client.post<MauticEmailResponse>('/emails/new', data);
			return response.data.email;
		} catch (error) {
			this.handleError(error);
			return null;
		}
	}

	/**
	 * Update an existing email
	 * @param emailId Mautic email ID
	 * @param data Email data to update
	 */
	public async updateEmail(
		emailId: number,
		data: Partial<MauticEmailCreateData>
	): Promise<MauticEmail | null> {
		if (!this.initialized) {
			console.warn('Mautic service not initialized, skipping updateEmail');
			return null;
		}

		try {
			const response = await this.client.patch<MauticEmailResponse>(
				`/emails/${emailId}/edit`,
				data
			);
			return response.data.email;
		} catch (error) {
			this.handleError(error);
			return null;
		}
	}

	/**
	 * Handle and format API errors
	 */
	private handleError(error: unknown): void {
		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError<{ errors?: Array<{ message: string }> }>;

			const simplifiedError: SimplifiedError = {
				code: axiosError.code || 'UNKNOWN',
				status: axiosError.response?.status || 500,
				message: axiosError.message,
				errors: axiosError.response?.data?.errors ?? []
			};

			// Use first error message if available
			if (simplifiedError.errors[0]?.message) {
				simplifiedError.message = simplifiedError.errors[0].message;
			}

			console.error('Mautic API error:', simplifiedError);

			// Don't throw for non-critical operations - log and continue
			// This prevents authentication from being blocked by Mautic issues
		} else {
			console.error('Mautic unexpected error:', error);
		}
	}
}

// Export singleton instance
const mauticService = new Mautic();
export default mauticService;

// Also export class for testing purposes
export { Mautic };
