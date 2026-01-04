<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import type { PaymentMethodData } from '$lib/billing/types';

	interface Props {
		paymentMethod: PaymentMethodData | null;
		isLoading?: boolean;
		onUpdateClick?: () => void;
	}

	let { paymentMethod, isLoading = false, onUpdateClick }: Props = $props();

	// Get card brand icon/name
	function getBrandDisplay(brand: string | null): string {
		if (!brand) return m.billing_payment_card();
		const brandLower = brand.toLowerCase();
		switch (brandLower) {
			case 'visa':
				return 'Visa';
			case 'mastercard':
				return 'Mastercard';
			case 'amex':
			case 'american express':
				return 'American Express';
			case 'discover':
				return 'Discover';
			case 'diners':
				return 'Diners Club';
			case 'jcb':
				return 'JCB';
			case 'unionpay':
				return 'UnionPay';
			default:
				return brand;
		}
	}

	// Format expiry date
	function formatExpiry(month: number | null, year: number | null): string {
		if (month === null || year === null) return '';
		const monthStr = month.toString().padStart(2, '0');
		const yearStr = year.toString().slice(-2);
		return `${monthStr}/${yearStr}`;
	}

	// Check if card is expiring soon (within 3 months)
	function isExpiringSoon(month: number | null, year: number | null): boolean {
		if (month === null || year === null) return false;
		const now = new Date();
		const expiryDate = new Date(year, month - 1);
		const threeMonthsFromNow = new Date();
		threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
		return expiryDate <= threeMonthsFromNow && expiryDate >= now;
	}

	// Check if card is expired
	function isExpired(month: number | null, year: number | null): boolean {
		if (month === null || year === null) return false;
		const now = new Date();
		const expiryDate = new Date(year, month);
		return expiryDate < now;
	}

	const expiringSoon = $derived(
		paymentMethod ? isExpiringSoon(paymentMethod.expiryMonth, paymentMethod.expiryYear) : false
	);
	const expired = $derived(
		paymentMethod ? isExpired(paymentMethod.expiryMonth, paymentMethod.expiryYear) : false
	);
</script>

<div class="card bg-base-100 shadow-lg" data-testid="payment-method-card">
	<div class="card-body">
		<h2 class="card-title text-lg">{m.billing_payment_method_title()}</h2>

		{#if isLoading}
			<!-- Loading skeleton -->
			<div class="flex items-center gap-4 animate-pulse">
				<div class="h-10 w-16 rounded bg-base-300"></div>
				<div class="space-y-2">
					<div class="h-4 w-32 rounded bg-base-300"></div>
					<div class="h-3 w-20 rounded bg-base-300"></div>
				</div>
			</div>
		{:else if paymentMethod}
			<!-- Payment method display -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<!-- Card icon -->
					<div
						class="flex h-12 w-16 items-center justify-center rounded-lg bg-base-200"
						aria-hidden="true"
					>
						{#if paymentMethod.type === 'card'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-8 w-8 text-base-content/60"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
								/>
							</svg>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-8 w-8 text-base-content/60"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						{/if}
					</div>

					<!-- Card details -->
					<div>
						<p class="font-medium" data-testid="payment-method-brand">
							{getBrandDisplay(paymentMethod.brand)}
							{#if paymentMethod.last4}
								<span class="text-base-content/70">
									{m.billing_card_ending({ last4: paymentMethod.last4 })}
								</span>
							{/if}
						</p>
						{#if paymentMethod.expiryMonth && paymentMethod.expiryYear}
							<p
								class="text-sm {expired
									? 'text-error'
									: expiringSoon
										? 'text-warning'
										: 'text-base-content/60'}"
								data-testid="payment-method-expiry"
							>
								{m.billing_card_expires({
									date: formatExpiry(paymentMethod.expiryMonth, paymentMethod.expiryYear)
								})}
								{#if expired}
									<span class="badge badge-error badge-sm ml-2">{m.billing_card_expired()}</span>
								{:else if expiringSoon}
									<span class="badge badge-warning badge-sm ml-2"
										>{m.billing_card_expiring_soon()}</span
									>
								{/if}
							</p>
						{/if}
					</div>
				</div>

				<!-- Update button -->
				{#if onUpdateClick}
					<button
						type="button"
						class="btn btn-outline btn-sm"
						onclick={onUpdateClick}
						data-testid="update-payment-btn"
					>
						{m.billing_update_payment_method()}
					</button>
				{/if}
			</div>

			<!-- Expired card warning -->
			{#if expired}
				<div class="alert alert-error mt-4">
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
					<span>{m.billing_card_expired_warning()}</span>
				</div>
			{/if}
		{:else}
			<!-- No payment method -->
			<div
				class="flex flex-col items-center justify-center py-6 text-center"
				data-testid="no-payment-method"
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
						d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
					/>
				</svg>
				<p class="mt-4 text-base-content/60">{m.billing_no_payment_method()}</p>
				<p class="text-sm text-base-content/40">{m.billing_no_payment_method_description()}</p>
			</div>
		{/if}
	</div>
</div>
