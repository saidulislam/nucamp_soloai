<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { BillingOverview } from './index';
	import { BillingHistory } from './index';
	import { PaymentMethod } from './index';
	import { SubscriptionActions } from './index';
	import {
		type SubscriptionData,
		type PaymentMethodData,
		type BillingHistoryItem,
		type BillingOverviewResponse,
		type BillingHistoryResponse,
		type PortalSessionResponse,
		getSubscriptionDataFromUser
	} from '$lib/billing/types';

	interface Props {
		user: {
			id: string;
			subscriptionTier?: string | null;
			subscriptionStatus?: string | null;
			subscriptionEndDate?: Date | null;
			stripeCustomerId?: string | null;
			stripeSubscriptionId?: string | null;
			lemonSqueezyCustomerId?: string | null;
			lemonSqueezySubscriptionId?: string | null;
		};
	}

	let { user }: Props = $props();

	// State
	let isLoadingSubscription = $state(true);
	let isLoadingHistory = $state(true);
	let subscription = $state<SubscriptionData | null>(null);
	let paymentMethod = $state<PaymentMethodData | null>(null);
	let nextBillingAmount = $state<number | null>(null);
	let currency = $state('USD');
	let historyItems = $state<BillingHistoryItem[]>([]);
	let historyHasMore = $state(false);
	let error = $state<string | null>(null);

	// Fetch subscription data on mount
	$effect(() => {
		fetchSubscriptionData();
		fetchBillingHistory();
	});

	// Fetch subscription overview
	async function fetchSubscriptionData() {
		isLoadingSubscription = true;
		error = null;

		try {
			const response = await fetch('/api/billing/subscription');

			if (!response.ok) {
				throw new Error('Failed to fetch subscription data');
			}

			const data: BillingOverviewResponse = await response.json();
			subscription = data.subscription;
			paymentMethod = data.paymentMethod;
			nextBillingAmount = data.nextBillingAmount;
			currency = data.currency;
		} catch (err) {
			console.error('Error fetching subscription:', err);
			// Fall back to user data
			subscription = getSubscriptionDataFromUser(user);
			error = m.billing_error_fetch_subscription();
		} finally {
			isLoadingSubscription = false;
		}
	}

	// Fetch billing history
	async function fetchBillingHistory() {
		isLoadingHistory = true;

		try {
			const response = await fetch('/api/billing/history');

			if (!response.ok) {
				throw new Error('Failed to fetch billing history');
			}

			const data: BillingHistoryResponse = await response.json();
			historyItems = data.items;
			historyHasMore = data.hasMore;
		} catch (err) {
			console.error('Error fetching billing history:', err);
			historyItems = [];
		} finally {
			isLoadingHistory = false;
		}
	}

	// Load more history
	async function loadMoreHistory() {
		if (!historyHasMore) return;

		isLoadingHistory = true;

		try {
			const response = await fetch(`/api/billing/history?offset=${historyItems.length}`);

			if (!response.ok) {
				throw new Error('Failed to fetch more billing history');
			}

			const data: BillingHistoryResponse = await response.json();
			historyItems = [...historyItems, ...data.items];
			historyHasMore = data.hasMore;
		} catch (err) {
			console.error('Error loading more history:', err);
		} finally {
			isLoadingHistory = false;
		}
	}

	// Handle subscription cancellation
	async function handleCancel() {
		const response = await fetch('/api/billing/cancel', {
			method: 'POST'
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Failed to cancel subscription');
		}

		// Refresh subscription data
		await fetchSubscriptionData();
	}

	// Handle opening billing portal
	async function handlePortal() {
		const response = await fetch('/api/billing/portal', {
			method: 'POST'
		});

		if (!response.ok) {
			throw new Error('Failed to open billing portal');
		}

		const data: PortalSessionResponse = await response.json();

		// Redirect to portal
		window.location.href = data.url;
	}

	// Handle updating payment method (opens portal)
	async function handleUpdatePayment() {
		await handlePortal();
	}

	// Use fallback subscription from user data if API fails
	const displaySubscription = $derived(subscription ?? getSubscriptionDataFromUser(user));
</script>

<div class="space-y-6" data-testid="billing-section">
	<!-- Error Alert -->
	{#if error}
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
				/>
			</svg>
			<span>{error}</span>
			<button type="button" class="btn btn-sm" onclick={fetchSubscriptionData}>
				{m.error_try_again()}
			</button>
		</div>
	{/if}

	<!-- Billing Overview and Payment Method Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<BillingOverview
			subscription={displaySubscription}
			{nextBillingAmount}
			{currency}
			isLoading={isLoadingSubscription}
		/>

		<PaymentMethod
			{paymentMethod}
			isLoading={isLoadingSubscription}
			onUpdateClick={displaySubscription.provider ? handleUpdatePayment : undefined}
		/>
	</div>

	<!-- Subscription Actions -->
	<SubscriptionActions
		subscription={displaySubscription}
		onCancel={displaySubscription.provider ? handleCancel : undefined}
		onPortal={displaySubscription.provider ? handlePortal : undefined}
		isLoading={isLoadingSubscription}
	/>

	<!-- Billing History -->
	<BillingHistory
		items={historyItems}
		hasMore={historyHasMore}
		isLoading={isLoadingHistory}
		onLoadMore={loadMoreHistory}
	/>
</div>
