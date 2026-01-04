/**
 * Billing types for subscription and payment management
 * (D04-Account-Billing.md)
 */

// Subscription tier types
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// Subscription status types
export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'cancelled' | 'suspended';

// Payment provider types
export type PaymentProvider = 'stripe' | 'lemonsqueezy' | null;

// Subscription data structure
export interface SubscriptionData {
	tier: SubscriptionTier;
	status: SubscriptionStatus;
	provider: PaymentProvider;
	currentPeriodEnd: Date | null;
	cancelAtPeriodEnd: boolean;
	trialEnd: Date | null;
}

// Payment method data
export interface PaymentMethodData {
	type: 'card' | 'bank' | 'paypal' | 'unknown';
	last4: string | null;
	brand: string | null;
	expiryMonth: number | null;
	expiryYear: number | null;
	isDefault: boolean;
}

// Invoice/billing history item
export interface BillingHistoryItem {
	id: string;
	date: Date;
	amount: number;
	currency: string;
	status: 'paid' | 'pending' | 'failed' | 'refunded';
	description: string;
	invoiceUrl: string | null;
	invoicePdfUrl: string | null;
}

// Billing overview response
export interface BillingOverviewResponse {
	subscription: SubscriptionData;
	paymentMethod: PaymentMethodData | null;
	nextBillingAmount: number | null;
	currency: string;
}

// Billing history response
export interface BillingHistoryResponse {
	items: BillingHistoryItem[];
	hasMore: boolean;
	totalCount: number;
}

// Portal session response
export interface PortalSessionResponse {
	url: string;
	provider: PaymentProvider;
}

// API error response
export interface BillingErrorResponse {
	error: string;
	code: string;
	details?: string;
}

// Subscription plan pricing
export interface PlanPricing {
	tier: SubscriptionTier;
	name: string;
	monthlyPrice: number;
	yearlyPrice: number;
	currency: string;
	features: string[];
}

// Status badge configuration
export interface StatusBadgeConfig {
	status: SubscriptionStatus;
	label: string;
	colorClass: string;
}

// Subscription status to badge color mapping
export const STATUS_BADGE_COLORS: Record<SubscriptionStatus, string> = {
	active: 'badge-success',
	trial: 'badge-info',
	past_due: 'badge-warning',
	cancelled: 'badge-error',
	suspended: 'badge-error'
};

// Tier badge configuration
export const TIER_BADGE_COLORS: Record<SubscriptionTier, string> = {
	free: 'badge-ghost',
	pro: 'badge-primary',
	enterprise: 'badge-secondary'
};

// Helper function to get subscription data from user object
export function getSubscriptionDataFromUser(user: {
	subscriptionTier?: string | null;
	subscriptionStatus?: string | null;
	subscriptionEndDate?: Date | null;
	stripeSubscriptionId?: string | null;
	lemonSqueezySubscriptionId?: string | null;
}): SubscriptionData {
	const tier = (user.subscriptionTier || 'free') as SubscriptionTier;
	const status = (user.subscriptionStatus || 'active') as SubscriptionStatus;

	// Determine provider based on subscription IDs
	let provider: PaymentProvider = null;
	if (user.stripeSubscriptionId) {
		provider = 'stripe';
	} else if (user.lemonSqueezySubscriptionId) {
		provider = 'lemonsqueezy';
	}

	return {
		tier,
		status,
		provider,
		currentPeriodEnd: user.subscriptionEndDate ?? null,
		cancelAtPeriodEnd: status === 'cancelled',
		trialEnd: status === 'trial' ? (user.subscriptionEndDate ?? null) : null
	};
}

// Helper to check if user has active paid subscription
export function hasActiveSubscription(subscription: SubscriptionData): boolean {
	return (
		subscription.tier !== 'free' &&
		(subscription.status === 'active' || subscription.status === 'trial')
	);
}

// Helper to check if subscription can be cancelled
export function canCancelSubscription(subscription: SubscriptionData): boolean {
	return (
		hasActiveSubscription(subscription) &&
		subscription.status !== 'cancelled' &&
		!subscription.cancelAtPeriodEnd
	);
}

// Helper to check if user can upgrade
export function canUpgrade(subscription: SubscriptionData): boolean {
	return subscription.tier !== 'enterprise';
}

// Helper to format currency amount
export function formatCurrency(amount: number, currency: string = 'USD'): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency.toUpperCase()
	}).format(amount / 100); // Stripe/LS use cents
}

// Helper to format date for billing display
export function formatBillingDate(date: Date | null, locale: string = 'en'): string {
	if (!date) return '-';
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(new Date(date));
}
