<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	// Subscription tier types
	type SubscriptionTier = 'free' | 'pro' | 'enterprise';
	type AccountType = 'trial' | 'active' | 'suspended' | 'cancelled';

	interface Props {
		user: {
			emailVerified: boolean;
			createdAt: Date;
		};
		session: {
			createdAt: Date;
		};
		// Future subscription data - defaults provided for now
		subscriptionTier?: SubscriptionTier;
		accountType?: AccountType;
		nextBillingDate?: Date | null;
		usagePercentage?: number;
	}

	let {
		user,
		session,
		subscriptionTier = 'free',
		accountType = 'active',
		nextBillingDate = null,
		usagePercentage = 0
	}: Props = $props();

	// Format dates for display
	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatDateTime(date: Date): string {
		return new Date(date).toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Get subscription tier badge class and label
	function getTierBadgeClass(tier: SubscriptionTier): string {
		switch (tier) {
			case 'enterprise':
				return 'badge-primary';
			case 'pro':
				return 'badge-secondary';
			default:
				return 'badge-ghost';
		}
	}

	function getTierLabel(tier: SubscriptionTier): string {
		switch (tier) {
			case 'enterprise':
				return m.account_status_tier_enterprise();
			case 'pro':
				return m.account_status_tier_pro();
			default:
				return m.account_status_tier_free();
		}
	}

	// Get account type badge class and label
	function getAccountTypeBadgeClass(type: AccountType): string {
		switch (type) {
			case 'active':
				return 'badge-success';
			case 'trial':
				return 'badge-info';
			case 'suspended':
				return 'badge-error';
			case 'cancelled':
				return 'badge-warning';
			default:
				return 'badge-ghost';
		}
	}

	function getAccountTypeLabel(type: AccountType): string {
		switch (type) {
			case 'active':
				return m.account_status_type_active();
			case 'trial':
				return m.account_status_type_trial();
			case 'suspended':
				return m.account_status_type_suspended();
			case 'cancelled':
				return m.account_status_type_cancelled();
			default:
				return m.account_status_type_active();
		}
	}
</script>

<div class="card bg-base-100 shadow-lg" data-testid="account-status-card">
	<div class="card-body">
		<h2 class="card-title text-lg">{m.account_status_title()}</h2>

		<div class="space-y-4">
			<!-- Subscription Tier -->
			<div class="flex items-center justify-between" data-testid="subscription-tier">
				<span class="text-base-content/70">{m.account_status_subscription_tier()}</span>
				<span class="badge {getTierBadgeClass(subscriptionTier)} gap-1" data-testid="tier-badge">
					{#if subscriptionTier === 'enterprise'}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								fill-rule="evenodd"
								d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
								clip-rule="evenodd"
							/>
						</svg>
					{:else if subscriptionTier === 'pro'}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
							/>
						</svg>
					{/if}
					{getTierLabel(subscriptionTier)}
				</span>
			</div>

			<!-- Account Type -->
			<div class="flex items-center justify-between" data-testid="account-type">
				<span class="text-base-content/70">{m.account_status_account_type()}</span>
				<span
					class="badge {getAccountTypeBadgeClass(accountType)}"
					data-testid="account-type-badge"
				>
					{getAccountTypeLabel(accountType)}
				</span>
			</div>

			<!-- Email Verification Status -->
			<div class="flex items-center justify-between" data-testid="email-verification-status">
				<span class="text-base-content/70">{m.account_status_email_verified()}</span>
				{#if user.emailVerified}
					<span class="badge badge-success gap-1" data-testid="verified-badge">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
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
						{m.account_status_verified()}
					</span>
				{:else}
					<span class="badge badge-warning gap-1" data-testid="unverified-badge">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								fill-rule="evenodd"
								d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						{m.account_status_unverified()}
					</span>
				{/if}
			</div>

			<div class="divider my-2"></div>

			<!-- Usage Statistics (for paid plans) -->
			{#if subscriptionTier !== 'free' && usagePercentage > 0}
				<div class="space-y-2" data-testid="usage-stats">
					<div class="flex items-center justify-between">
						<span class="text-base-content/70">{m.account_status_usage()}</span>
						<span class="font-medium">{usagePercentage}%</span>
					</div>
					<progress
						class="progress progress-primary w-full"
						value={usagePercentage}
						max="100"
						aria-label={m.account_status_usage_progress()}
					></progress>
				</div>
			{/if}

			<!-- Next Billing Date (for paid plans) -->
			{#if nextBillingDate}
				<div class="flex items-center justify-between" data-testid="next-billing">
					<span class="text-base-content/70">{m.account_status_next_billing()}</span>
					<span class="font-medium">{formatDate(nextBillingDate)}</span>
				</div>
			{/if}

			<!-- Account Created -->
			<div class="flex items-center justify-between" data-testid="account-created">
				<span class="text-base-content/70">{m.account_status_member_since()}</span>
				<span class="font-medium">{formatDate(user.createdAt)}</span>
			</div>

			<!-- Last Login (Session Created) -->
			<div class="flex items-center justify-between" data-testid="last-login">
				<span class="text-base-content/70">{m.account_status_last_login()}</span>
				<span class="font-medium">{formatDateTime(session.createdAt)}</span>
			</div>

			<!-- Account Standing -->
			<div class="flex items-center justify-between" data-testid="account-standing">
				<span class="text-base-content/70">{m.account_status_standing()}</span>
				<span class="badge badge-success">{m.account_status_good_standing()}</span>
			</div>
		</div>
	</div>
</div>
