/**
 * Mautic Service Data Models
 * Type definitions for Mautic API interactions
 *
 * @see MA02-Mautic-API-Auth.md
 */

/**
 * Data structure for creating or updating a Mautic contact
 */
export interface MauticUserData {
	email: string;
	firstname?: string;
	lastname?: string;
	ipAddress?: string;
	preferred_locale?: string; // Mautic's field for user's preferred language
	locale?: string; // User's current locale from Paraglide/Better Auth
	timezone?: string;
	mauticId?: number;
	last_active?: string;
	createdAt?: string;
	[key: string]: unknown; // Allow custom fields
}

/**
 * Simplified error structure for Mautic API errors
 */
export interface SimplifiedError {
	code: string;
	status: number;
	message: string;
	errors: MauticApiError[];
}

/**
 * Mautic API error structure
 */
export interface MauticApiError {
	message: string;
	code?: number;
	type?: string;
}

/**
 * Mautic contact response structure
 */
export interface MauticContactResponse {
	contact: {
		id: number;
		isPublished: boolean;
		dateAdded: string;
		dateModified: string;
		createdBy: number;
		createdByUser: string;
		modifiedBy: number;
		modifiedByUser: string;
		points: number;
		color: string | null;
		fields: {
			all: MauticContactFields;
			core: Record<string, MauticFieldValue>;
		};
		lastActive: string | null;
		owner: unknown | null;
		ipAddresses: MauticIpAddress[];
		tags: MauticTag[];
		utmtags: unknown[];
		stage: unknown | null;
		dateIdentified: string | null;
		preferredProfileImage: string | null;
	};
}

/**
 * Mautic contact fields
 */
export interface MauticContactFields {
	id: number;
	email: string;
	firstname?: string;
	lastname?: string;
	locale?: string;
	preferred_locale?: string;
	timezone?: string;
	[key: string]: unknown;
}

/**
 * Mautic field value structure
 */
export interface MauticFieldValue {
	id: string;
	label: string;
	alias: string;
	type: string;
	group: string;
	object: string;
	is_fixed: boolean;
	properties: unknown[];
	default_value: unknown;
	value: unknown;
	normalizedValue: unknown;
}

/**
 * Mautic IP address structure
 */
export interface MauticIpAddress {
	ip: string;
	ipDetails: {
		city: string;
		region: string;
		country: string;
		latitude: number;
		longitude: number;
		isp: string;
		organization: string;
		timezone: string;
	};
}

/**
 * Mautic tag structure
 */
export interface MauticTag {
	id: number;
	tag: string;
}

/**
 * Mautic contacts list response
 */
export interface MauticContactsListResponse {
	total: string;
	contacts: Record<string, MauticContactResponse['contact']>;
}

/**
 * Mautic webhook event types
 */
export type MauticWebhookEventType =
	| 'contact.identified'
	| 'contact.added'
	| 'contact.updated'
	| 'contact.deleted'
	| 'form.submitted'
	| 'email.opened'
	| 'email.clicked'
	| 'email.bounced'
	| 'page.hit';

/**
 * Mautic webhook payload structure
 */
export interface MauticWebhookPayload {
	'mautic.webhook_event': MauticWebhookEventType;
	'mautic.lead'?: MauticContactResponse['contact'];
	'mautic.form'?: {
		id: number;
		name: string;
		alias: string;
	};
	'mautic.email'?: {
		id: number;
		name: string;
		subject: string;
	};
	'mautic.page'?: {
		id: number;
		title: string;
		alias: string;
	};
	timestamp: string;
}

/**
 * Mautic segment response structure
 */
export interface MauticSegmentResponse {
	list: {
		id: number;
		isPublished: boolean;
		dateAdded: string;
		dateModified: string;
		createdBy: number;
		createdByUser: string;
		modifiedBy: number;
		modifiedByUser: string;
		name: string;
		publicName: string;
		alias: string;
		description: string | null;
		category: unknown | null;
		filters: MauticSegmentFilter[];
		isGlobal: boolean;
		isPreferenceCenter: boolean;
	};
}

/**
 * Mautic segment filter structure
 */
export interface MauticSegmentFilter {
	glue: string;
	field: string;
	object: string;
	type: string;
	operator: string;
	properties: {
		filter: unknown;
	};
}

/**
 * Mautic segments list response
 */
export interface MauticSegmentsListResponse {
	total: string;
	lists: Record<string, MauticSegmentResponse['list']>;
}

/**
 * Contact form submission data
 */
export interface ContactFormData {
	email: string;
	firstname?: string;
	lastname?: string;
	message?: string;
	subject?: string;
	phone?: string;
	company?: string;
	source?: string;
}

/**
 * Newsletter signup data
 */
export interface NewsletterSignupData {
	email: string;
	firstname?: string;
	lastname?: string;
	source?: string;
	locale?: string;
}

// =========================================================================
// Email Types (MA07-Email-Translations-Route.md)
// =========================================================================

/**
 * Mautic email response structure
 */
export interface MauticEmail {
	id: number;
	isPublished: boolean;
	dateAdded: string;
	dateModified: string;
	createdBy: number;
	createdByUser: string;
	modifiedBy: number;
	modifiedByUser: string;
	name: string;
	subject: string;
	fromAddress: string | null;
	fromName: string | null;
	replyToAddress: string | null;
	bccAddress: string | null;
	customHtml: string;
	plainText: string | null;
	template: string | null;
	emailType: 'template' | 'list';
	language: string;
	publishUp: string | null;
	publishDown: string | null;
	readCount: number;
	sentCount: number;
	revision: number;
	category: unknown | null;
	lists: unknown[];
	translationParent: MauticEmail | null;
	translationChildren: MauticEmail[];
	variantParent: unknown | null;
	variantChildren: unknown[];
	unsubscribeForm: unknown | null;
	dynamicContent: unknown[];
	utmTags: {
		utmSource: string | null;
		utmMedium: string | null;
		utmCampaign: string | null;
		utmContent: string | null;
	};
	preheaderText: string | null;
	headers: unknown[];
	assetAttachments: unknown[];
}

/**
 * Mautic email response wrapper
 */
export interface MauticEmailResponse {
	email: MauticEmail;
}

/**
 * Mautic emails list response
 */
export interface MauticEmailsListResponse {
	total: string;
	emails: Record<string, MauticEmail>;
}

/**
 * Data for creating a new email in Mautic
 */
export interface MauticEmailCreateData {
	name: string;
	subject: string;
	customHtml: string;
	plainText?: string;
	emailType: 'template' | 'list';
	language: string;
	isPublished?: boolean;
	fromName?: string;
	fromAddress?: string;
	replyToAddress?: string;
	preheaderText?: string;
	templateTranslationParent?: number; // For template emails
	segmentTranslationParent?: number; // For list emails
	lists?: number[];
	category?: number;
}

/**
 * Translation request body
 */
export interface TranslateEmailRequest {
	languages?: string[];
}

/**
 * Translation response item
 */
export interface TranslatedEmailResult {
	email: MauticEmail;
	language: string;
}
