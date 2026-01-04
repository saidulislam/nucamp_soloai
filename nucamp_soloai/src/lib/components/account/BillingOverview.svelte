<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import {
		type SubscriptionData,
		STATUS_BADGE_COLORS,
		TIER_BADGE_COLORS,
		formatCurrency,
		formatBillingDate,
		hasActiveSubscription
	} from '$lib/billing/types';

	interface Props {
		subscription: SubscriptionData;
		nextBillingAmount: number | null;
		currency?: string;
		isLoading?: boolean;
	}

	let { subscription, nextBillingAmount, currency = 'USD', isLoading = false }: Props = $props();

	// Get status badge color
	const statusBadgeClass = $derived(STATUS_BADGE_COLORS[subscription.status] || 'badge-ghost');
	const tierBadgeClass = $derived(TIER_BADGE_COLORS[subscription.tier] || 'badge-ghost');

	// Format tier name for display
	function getTierDisplayName(tier: string): string {
		switch (tier) {
			case 'free':
				return m.account_status_tier_free();
			case 'pro':
				return m.account_status_tier_pro();
			case 'enterprise':
				return m.account_status_tier_enterprise();
			default:
				return tier;
		}
	}

	// Format status name for display
	function getStatusDisplayName(status: string): string {
		switch (status) {
			case 'active':
				return m.account_status_type_active();
			case 'trial':
				return m.account_status_type_trial();
			case 'past_due':
				return m.billing_status_past_due();
			case 'cancelled':
				return m.account_status_type_cancelled();
			case 'suspended':
				return m.account_status_type_suspended();
			default:
				return status;
		}
	}

	// Check if we should show billing info
	const showBillingInfo = $derived(hasActiveSubscription(subscription));
</script>

<div class="card bg-base-100 shadow-lg" data-testid="billing-overview-card">
	<div class="card-body">
		<h2 class="card-title text-lg">{m.billing_overview_title()}</h2>

		{#if isLoading}
			<!-- Loading skeleton -->
			<div class="space-y-4 animate-pulse">
				<div class="flex justify-between">
					<div class="h-4 w-24 rounded bg-base-300"></div>
					<div class="h-6 w-16 rounded bg-base-300"></div>
				</div>
				<div class="flex justify-between">
					<div class="h-4 w-32 rounded bg-base-300"></div>
					<div class="h-6 w-20 rounded bg-base-300"></div>
				</div>
			</div>
		{:else}
			<!-- Subscription Info -->
			<div class="space-y-4">
				<!-- Current Plan -->
				<div class="flex items-center justify-between">
					<span class="text-base-content/70">{m.account_subscription_current_plan()}</span>
					<span class="badge {tierBadgeClass} badge-lg font-semibold" data-testid="tier-badge">
						{getTierDisplayName(subscription.tier)}
					</span>
				</div>

				<!-- Status -->
				<div class="flex items-center justify-between">
					<span class="text-base-content/70">{m.billing_status_label()}</span>
					<span class="badge {statusBadgeClass}" data-testid="status-badge">
						{getStatusDisplayName(subscription.status)}
					</span>
				</div>

				{#if showBillingInfo}
					<!-- Next Billing Date -->
					{#if subscription.currentPeriodEnd}
						<div class="flex items-center justify-between">
							<span class="text-base-content/70">{m.account_status_next_billing()}</span>
							<span class="font-medium" data-testid="next-billing-date">
								{formatBillingDate(subscription.currentPeriodEnd)}
							</span>
						</div>
					{/if}

					<!-- Next Billing Amount -->
					{#if nextBillingAmount !== null && !subscription.cancelAtPeriodEnd}
						<div class="flex items-center justify-between">
							<span class="text-base-content/70">{m.billing_next_amount()}</span>
							<span class="font-medium" data-testid="next-billing-amount">
								{formatCurrency(nextBillingAmount, currency)}
							</span>
						</div>
					{/if}

					<!-- Trial End Notice -->
					{#if subscription.status === 'trial' && subscription.trialEnd}
						<div class="alert alert-info">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								class="h-6 w-6 shrink-0 stroke-current"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
							<span>
								{m.billing_trial_ends({ date: formatBillingDate(subscription.trialEnd) })}
							</span>
						</div>
					{/if}

					<!-- Cancellation Notice -->
					{#if subscription.cancelAtPeriodEnd}
						<div class="alert alert-warning">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 shrink-0 stroke-current"
								fill="none"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								></path>
							</svg>
							<span>
								{m.billing_cancellation_notice({
									date: formatBillingDate(subscription.currentPeriodEnd)
								})}
							</span>
						</div>
					{/if}
				{/if}

				<!-- Free Plan Info -->
				{#if subscription.tier === 'free'}
					<div class="divider my-2"></div>
					<div class="space-y-2">
						<p class="font-medium text-sm">{m.account_subscription_includes()}</p>
						<ul class="space-y-1 text-sm text-base-content/70">
							<li class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-success"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								{m.account_subscription_feature_basic()}
							</li>
							<li class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-success"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								{m.account_subscription_feature_limited()}
							</li>
							<li class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-success"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								{m.account_subscription_feature_community()}
							</li>
						</ul>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
