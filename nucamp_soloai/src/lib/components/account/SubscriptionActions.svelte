<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import {
		type SubscriptionData,
		canCancelSubscription,
		canUpgrade,
		hasActiveSubscription,
		formatBillingDate
	} from '$lib/billing/types';

	interface Props {
		subscription: SubscriptionData;
		onCancel?: () => Promise<void>;
		onPortal?: () => Promise<void>;
		isLoading?: boolean;
	}

	let { subscription, onCancel, onPortal, isLoading = false }: Props = $props();

	// Local state for modals and loading
	let showCancelModal = $state(false);
	let isCancelling = $state(false);
	let isOpeningPortal = $state(false);
	let cancelError = $state<string | null>(null);

	// Derived states
	const canCancel = $derived(canCancelSubscription(subscription));
	const canUpgradePlan = $derived(canUpgrade(subscription));
	const hasActiveSub = $derived(hasActiveSubscription(subscription));

	// Handle cancel subscription
	async function handleCancel() {
		if (!onCancel) return;

		isCancelling = true;
		cancelError = null;

		try {
			await onCancel();
			showCancelModal = false;
		} catch (error) {
			cancelError =
				error instanceof Error ? error.message : m.billing_cancel_error_generic();
		} finally {
			isCancelling = false;
		}
	}

	// Handle open portal
	async function handlePortal() {
		if (!onPortal) return;

		isOpeningPortal = true;

		try {
			await onPortal();
		} catch (error) {
			console.error('Portal error:', error);
		} finally {
			isOpeningPortal = false;
		}
	}

	// Close cancel modal
	function closeCancelModal() {
		if (!isCancelling) {
			showCancelModal = false;
			cancelError = null;
		}
	}

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showCancelModal && !isCancelling) {
			closeCancelModal();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="card bg-base-100 shadow-lg" data-testid="subscription-actions-card">
	<div class="card-body">
		<h2 class="card-title text-lg">{m.billing_actions_title()}</h2>

		{#if isLoading}
			<!-- Loading skeleton -->
			<div class="flex flex-wrap gap-3 animate-pulse">
				<div class="h-10 w-32 rounded bg-base-300"></div>
				<div class="h-10 w-32 rounded bg-base-300"></div>
				<div class="h-10 w-32 rounded bg-base-300"></div>
			</div>
		{:else}
			<div class="flex flex-wrap gap-3">
				<!-- Upgrade Button (for free or lower tiers) -->
				{#if canUpgradePlan}
					<a
						href="/pricing"
						class="btn btn-primary"
						data-testid="upgrade-btn"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 10l7-7m0 0l7 7m-7-7v18"
							/>
						</svg>
						{subscription.tier === 'free'
							? m.account_subscription_upgrade()
							: m.billing_change_plan()}
					</a>
				{/if}

				<!-- Manage Billing Portal Button (for paid subscriptions) -->
				{#if hasActiveSub && onPortal}
					<button
						type="button"
						class="btn btn-outline"
						onclick={handlePortal}
						disabled={isOpeningPortal}
						data-testid="manage-billing-btn"
					>
						{#if isOpeningPortal}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						{/if}
						{m.billing_manage_billing()}
					</button>
				{/if}

				<!-- Cancel Subscription Button -->
				{#if canCancel && onCancel}
					<button
						type="button"
						class="btn btn-outline btn-error"
						onclick={() => (showCancelModal = true)}
						data-testid="cancel-subscription-btn"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
						{m.billing_cancel_subscription()}
					</button>
				{/if}

				<!-- Reactivate notice for cancelled subscriptions -->
				{#if subscription.cancelAtPeriodEnd}
					<div class="w-full mt-2">
						<p class="text-sm text-base-content/60">
							{m.billing_reactivate_notice()}
						</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Cancel Confirmation Modal -->
{#if showCancelModal}
	<div class="modal modal-open" role="dialog" aria-modal="true" data-testid="cancel-modal">
		<div class="modal-box">
			<h3 class="font-bold text-lg">{m.billing_cancel_modal_title()}</h3>

			<div class="py-4 space-y-4">
				<p class="text-base-content/70">{m.billing_cancel_modal_message()}</p>

				{#if subscription.currentPeriodEnd}
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
						<span>
							{m.billing_cancel_modal_access_until({
								date: formatBillingDate(subscription.currentPeriodEnd)
							})}
						</span>
					</div>
				{/if}

				{#if cancelError}
					<div class="alert alert-error">
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
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{cancelError}</span>
					</div>
				{/if}
			</div>

			<div class="modal-action">
				<button
					type="button"
					class="btn btn-ghost"
					onclick={closeCancelModal}
					disabled={isCancelling}
				>
					{m.billing_cancel_modal_keep()}
				</button>
				<button
					type="button"
					class="btn btn-error"
					onclick={handleCancel}
					disabled={isCancelling}
					data-testid="confirm-cancel-btn"
				>
					{#if isCancelling}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					{m.billing_cancel_modal_confirm()}
				</button>
			</div>
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={closeCancelModal}></div>
	</div>
{/if}
