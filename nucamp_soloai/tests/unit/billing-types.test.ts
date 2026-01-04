/**
 * Unit tests for billing types and utility functions
 * (TS03-Vitest-Unit-Testing.md)
 */

import { describe, it, expect } from 'vitest';
import {
	getSubscriptionDataFromUser,
	hasActiveSubscription,
	canCancelSubscription,
	canUpgrade,
	formatCurrency,
	formatBillingDate,
	STATUS_BADGE_COLORS,
	TIER_BADGE_COLORS,
	type SubscriptionData
} from '$lib/billing/types';

describe('getSubscriptionDataFromUser', () => {
	it('should return free tier with active status for empty user', () => {
		const user = {};
		const result = getSubscriptionDataFromUser(user);

		expect(result.tier).toBe('free');
		expect(result.status).toBe('active');
		expect(result.provider).toBeNull();
		expect(result.currentPeriodEnd).toBeNull();
		expect(result.cancelAtPeriodEnd).toBe(false);
	});

	it('should detect Stripe provider from subscription ID', () => {
		const user = {
			subscriptionTier: 'pro',
			subscriptionStatus: 'active',
			stripeSubscriptionId: 'sub_123'
		};
		const result = getSubscriptionDataFromUser(user);

		expect(result.provider).toBe('stripe');
		expect(result.tier).toBe('pro');
	});

	it('should detect LemonSqueezy provider from subscription ID', () => {
		const user = {
			subscriptionTier: 'enterprise',
			subscriptionStatus: 'active',
			lemonSqueezySubscriptionId: 'ls_123'
		};
		const result = getSubscriptionDataFromUser(user);

		expect(result.provider).toBe('lemonsqueezy');
		expect(result.tier).toBe('enterprise');
	});

	it('should set cancelAtPeriodEnd when status is cancelled', () => {
		const user = {
			subscriptionTier: 'pro',
			subscriptionStatus: 'cancelled'
		};
		const result = getSubscriptionDataFromUser(user);

		expect(result.cancelAtPeriodEnd).toBe(true);
	});

	it('should set trialEnd for trial status', () => {
		const endDate = new Date('2024-12-31');
		const user = {
			subscriptionTier: 'pro',
			subscriptionStatus: 'trial',
			subscriptionEndDate: endDate
		};
		const result = getSubscriptionDataFromUser(user);

		expect(result.trialEnd).toEqual(endDate);
	});
});

describe('hasActiveSubscription', () => {
	it('should return false for free tier', () => {
		const subscription: SubscriptionData = {
			tier: 'free',
			status: 'active',
			provider: null,
			currentPeriodEnd: null,
			cancelAtPeriodEnd: false,
			trialEnd: null
		};

		expect(hasActiveSubscription(subscription)).toBe(false);
	});

	it('should return true for active pro subscription', () => {
		const subscription: SubscriptionData = {
			tier: 'pro',
			status: 'active',
			provider: 'stripe',
			currentPeriodEnd: new Date(),
			cancelAtPeriodEnd: false,
			trialEnd: null
		};

		expect(hasActiveSubscription(subscription)).toBe(true);
	});

	it('should return true for trial subscription', () => {
		const subscription: SubscriptionData = {
			tier: 'pro',
			status: 'trial',
			provider: 'stripe',
			currentPeriodEnd: null,
			cancelAtPeriodEnd: false,
			trialEnd: new Date()
		};

		expect(hasActiveSubscription(subscription)).toBe(true);
	});

	it('should return false for cancelled subscription', () => {
		const subscription: SubscriptionData = {
			tier: 'pro',
			status: 'cancelled',
			provider: 'stripe',
			currentPeriodEnd: new Date(),
			cancelAtPeriodEnd: true,
			trialEnd: null
		};

		expect(hasActiveSubscription(subscription)).toBe(false);
	});
});

describe('canCancelSubscription', () => {
	it('should return true for active paid subscription', () => {
		const subscription: SubscriptionData = {
			tier: 'pro',
			status: 'active',
			provider: 'stripe',
			currentPeriodEnd: new Date(),
			cancelAtPeriodEnd: false,
			trialEnd: null
		};

		expect(canCancelSubscription(subscription)).toBe(true);
	});

	it('should return false for free tier', () => {
		const subscription: SubscriptionData = {
			tier: 'free',
			status: 'active',
			provider: null,
			currentPeriodEnd: null,
			cancelAtPeriodEnd: false,
			trialEnd: null
		};

		expect(canCancelSubscription(subscription)).toBe(false);
	});

	it('should return false if already set to cancel at period end', () => {
		const subscription: SubscriptionData = {
			tier: 'pro',
			status: 'active',
			provider: 'stripe',
			currentPeriodEnd: new Date(),
			cancelAtPeriodEnd: true,
			trialEnd: null
		};

		expect(canCancelSubscription(subscription)).toBe(false);
	});
});

describe('canUpgrade', () => {
	it('should return true for free tier', () => {
		const subscription: SubscriptionData = {
			tier: 'free',
			status: 'active',
			provider: null,
			currentPeriodEnd: null,
			cancelAtPeriodEnd: false,
			trialEnd: null
		};

		expect(canUpgrade(subscription)).toBe(true);
	});

	it('should return true for pro tier', () => {
		const subscription: SubscriptionData = {
			tier: 'pro',
			status: 'active',
			provider: 'stripe',
			currentPeriodEnd: new Date(),
			cancelAtPeriodEnd: false,
			trialEnd: null
		};

		expect(canUpgrade(subscription)).toBe(true);
	});

	it('should return false for enterprise tier', () => {
		const subscription: SubscriptionData = {
			tier: 'enterprise',
			status: 'active',
			provider: 'stripe',
			currentPeriodEnd: new Date(),
			cancelAtPeriodEnd: false,
			trialEnd: null
		};

		expect(canUpgrade(subscription)).toBe(false);
	});
});

describe('formatCurrency', () => {
	it('should format USD amounts correctly', () => {
		expect(formatCurrency(2900)).toBe('$29.00');
		expect(formatCurrency(9900)).toBe('$99.00');
	});

	it('should handle different currencies', () => {
		expect(formatCurrency(2900, 'EUR')).toMatch(/€|EUR/);
		expect(formatCurrency(2900, 'GBP')).toMatch(/£|GBP/);
	});

	it('should handle zero amount', () => {
		expect(formatCurrency(0)).toBe('$0.00');
	});
});

describe('formatBillingDate', () => {
	it('should return dash for null date', () => {
		expect(formatBillingDate(null)).toBe('-');
	});

	it('should format date correctly', () => {
		// Use a date with explicit time to avoid timezone issues
		const date = new Date(2024, 11, 25, 12, 0, 0); // December 25, 2024 at noon
		const result = formatBillingDate(date, 'en');
		expect(result).toContain('December');
		expect(result).toContain('25');
		expect(result).toContain('2024');
	});
});

describe('Badge color constants', () => {
	it('should have colors for all subscription statuses', () => {
		expect(STATUS_BADGE_COLORS.active).toBe('badge-success');
		expect(STATUS_BADGE_COLORS.trial).toBe('badge-info');
		expect(STATUS_BADGE_COLORS.past_due).toBe('badge-warning');
		expect(STATUS_BADGE_COLORS.cancelled).toBe('badge-error');
		expect(STATUS_BADGE_COLORS.suspended).toBe('badge-error');
	});

	it('should have colors for all subscription tiers', () => {
		expect(TIER_BADGE_COLORS.free).toBe('badge-ghost');
		expect(TIER_BADGE_COLORS.pro).toBe('badge-primary');
		expect(TIER_BADGE_COLORS.enterprise).toBe('badge-secondary');
	});
});
