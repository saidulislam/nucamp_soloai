<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { type BillingHistoryItem, formatCurrency, formatBillingDate } from '$lib/billing/types';

	interface Props {
		items: BillingHistoryItem[];
		hasMore?: boolean;
		isLoading?: boolean;
		onLoadMore?: () => void;
	}

	let { items, hasMore = false, isLoading = false, onLoadMore }: Props = $props();

	// Get status badge class
	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'paid':
				return 'badge-success';
			case 'pending':
				return 'badge-warning';
			case 'failed':
				return 'badge-error';
			case 'refunded':
				return 'badge-info';
			default:
				return 'badge-ghost';
		}
	}

	// Get status display name
	function getStatusDisplayName(status: string): string {
		switch (status) {
			case 'paid':
				return m.billing_history_status_paid();
			case 'pending':
				return m.billing_history_status_pending();
			case 'failed':
				return m.billing_history_status_failed();
			case 'refunded':
				return m.billing_history_status_refunded();
			default:
				return status;
		}
	}
</script>

<div class="card bg-base-100 shadow-lg" data-testid="billing-history-card">
	<div class="card-body">
		<h2 class="card-title text-lg">{m.billing_history_title()}</h2>

		{#if isLoading && items.length === 0}
			<!-- Loading skeleton -->
			<div class="space-y-3 animate-pulse">
				{#each [1, 2, 3] as _}
					<div class="flex items-center justify-between rounded-lg bg-base-200 p-4">
						<div class="space-y-2">
							<div class="h-4 w-32 rounded bg-base-300"></div>
							<div class="h-3 w-24 rounded bg-base-300"></div>
						</div>
						<div class="h-6 w-16 rounded bg-base-300"></div>
					</div>
				{/each}
			</div>
		{:else if items.length === 0}
			<!-- Empty state -->
			<div
				class="flex flex-col items-center justify-center py-8 text-center"
				data-testid="billing-history-empty"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-12 w-12 text-base-content/30"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
					/>
				</svg>
				<p class="mt-4 text-base-content/60">{m.billing_history_empty()}</p>
				<p class="text-sm text-base-content/40">{m.billing_history_empty_description()}</p>
			</div>
		{:else}
			<!-- History list -->
			<div class="space-y-3" data-testid="billing-history-list">
				{#each items as item (item.id)}
					<div
						class="flex items-center justify-between rounded-lg bg-base-200 p-4"
						data-testid="billing-history-item"
					>
						<div class="space-y-1">
							<p class="font-medium">{item.description}</p>
							<p class="text-sm text-base-content/60">
								{formatBillingDate(item.date)}
							</p>
						</div>

						<div class="flex items-center gap-3">
							<span class="font-semibold">
								{formatCurrency(item.amount, item.currency)}
							</span>
							<span class="badge {getStatusBadgeClass(item.status)}">
								{getStatusDisplayName(item.status)}
							</span>

							{#if item.invoicePdfUrl || item.invoiceUrl}
								<a
									href={item.invoicePdfUrl || item.invoiceUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-ghost btn-sm"
									aria-label={m.billing_download_invoice()}
									data-testid="download-invoice-btn"
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
											d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
								</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Load more button -->
			{#if hasMore}
				<div class="mt-4 text-center">
					<button
						type="button"
						class="btn btn-outline btn-sm"
						onclick={onLoadMore}
						disabled={isLoading}
						data-testid="load-more-btn"
					>
						{#if isLoading}
							<span class="loading loading-spinner loading-sm"></span>
						{/if}
						{m.billing_history_load_more()}
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
