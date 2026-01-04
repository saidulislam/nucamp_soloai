<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import Meta from '$lib/components/Meta.svelte';
	import { authClient } from '$lib/auth/client';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

	// ============================================================================
	// Props - Data from server load function
	// ============================================================================

	let { data } = $props();

	// ============================================================================
	// Payment Provider Configuration
	// ============================================================================

	// Stripe Price IDs loaded from server (ST06-Configure-Stripe-Products.md)
	// These are configured via environment variables on the server
	const stripePriceIds = $derived(data.stripePriceIds);

	// LemonSqueezy Variant IDs for non-US users (all other locales)
	// Configured from LemonSqueezy dashboard - Nexasphere store
	const LEMONSQUEEZY_VARIANT_IDS = {
		pro: 'ecda3e3b-b6eb-4c95-a0eb-960a5b666df9', // Nexasphere Pro - $29/month
		enterprise: '4e54e3c9-d88e-4658-a32b-4563599b6218' // Nexasphere Enterprise - $79/month
	};

	// ============================================================================
	// State
	// ============================================================================

	let isLoading = $state<string | null>(null); // Track which tier is loading
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	// Get session data
	const sessionStore = authClient.useSession();
	const currentUser = $derived($sessionStore?.data?.user);
	const isAuthenticated = $derived(!!currentUser);
	const currentTier = $derived((currentUser as { subscriptionTier?: string })?.subscriptionTier || 'free');

	// ============================================================================
	// Payment Provider Selection (Locale-Based)
	// ============================================================================

	// Determine payment provider based on Paraglide locale
	// US users (locale: 'en') use Stripe, all others use LemonSqueezy
	const isUSUser = $derived(getLocale() === 'en');
	const paymentProvider = $derived(isUSUser ? 'stripe' : 'lemonsqueezy');

	// Check for success/canceled query params on mount
	$effect(() => {
		if (browser) {
			const success = $page.url.searchParams.get('success');
			const canceled = $page.url.searchParams.get('canceled');

			if (success === 'true') {
				successMessage = m.pricing_success_message();
				// Clear the query params after showing the message
				setTimeout(() => {
					window.history.replaceState({}, '', '/pricing');
				}, 100);
			} else if (canceled === 'true') {
				errorMessage = m.pricing_canceled_message();
				setTimeout(() => {
					window.history.replaceState({}, '', '/pricing');
				}, 100);
			}
		}
	});

	// ============================================================================
	// Checkout Handler (Routes to Stripe or LemonSqueezy based on locale)
	// ============================================================================

	async function handleCheckout(tier: 'pro' | 'enterprise') {
		if (isLoading) return; // Prevent double-clicks

		// Check if user is authenticated
		if (!isAuthenticated) {
			// Redirect to login with return URL
			window.location.href = `/login?redirectTo=${encodeURIComponent('/pricing')}`;
			return;
		}

		isLoading = tier;
		errorMessage = null;

		try {
			let response: Response;

			if (isUSUser) {
				// Use Stripe for US users (locale: 'en')
				// Get price ID from server-loaded configuration (defaults to monthly)
				const priceId = stripePriceIds[tier]?.monthly || '';

				if (!priceId) {
					throw new Error(`Price not configured for ${tier} tier`);
				}

				response = await fetch('/api/stripe/checkout', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ priceId, tier })
				});
			} else {
				// Use LemonSqueezy for non-US users (all other locales)
				const variantId = LEMONSQUEEZY_VARIANT_IDS[tier];
				response = await fetch('/api/lemonsqueezy/checkout', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ variantId, tier })
				});
			}

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || m.pricing_checkout_error());
			}

			// Redirect to checkout page (Stripe or LemonSqueezy hosted)
			if (data.url) {
				window.location.href = data.url;
			} else {
				throw new Error('No checkout URL returned');
			}
		} catch (error) {
			console.error('Checkout error:', error);
			errorMessage = error instanceof Error ? error.message : m.pricing_checkout_error();
			isLoading = null;
		}
		// Don't reset isLoading on success - page will navigate away
	}

	// Dismiss messages
	function dismissError() {
		errorMessage = null;
	}

	function dismissSuccess() {
		successMessage = null;
	}

	// Feature lists for each tier
	const freeFeatures = [
		m.pricing_free_feature_1(),
		m.pricing_free_feature_2(),
		m.pricing_free_feature_3(),
		m.pricing_free_feature_4()
	];

	const proFeatures = [
		m.pricing_pro_feature_1(),
		m.pricing_pro_feature_2(),
		m.pricing_pro_feature_3(),
		m.pricing_pro_feature_4(),
		m.pricing_pro_feature_5()
	];

	const enterpriseFeatures = [
		m.pricing_enterprise_feature_1(),
		m.pricing_enterprise_feature_2(),
		m.pricing_enterprise_feature_3(),
		m.pricing_enterprise_feature_4(),
		m.pricing_enterprise_feature_5(),
		m.pricing_enterprise_feature_6()
	];
</script>

<Meta title={m.seo_pricing_title()} description={m.seo_pricing_description()} />

<main class="min-h-screen bg-base-200 py-12" data-testid="pricing-page">
	<div class="container mx-auto px-4">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="text-4xl font-bold text-base-content md:text-5xl" data-testid="pricing-title">
				{m.pricing_page_title()}
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-base-content/70">
				{m.pricing_page_subtitle()}
			</p>
		</div>

		<!-- Success/Error Messages -->
		{#if successMessage}
			<div class="alert alert-success mx-auto mb-8 max-w-3xl">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>{successMessage}</span>
				<button type="button" class="btn btn-ghost btn-sm" onclick={dismissSuccess}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		{/if}

		{#if errorMessage}
			<div class="alert alert-error mx-auto mb-8 max-w-3xl">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>{errorMessage}</span>
				<button type="button" class="btn btn-ghost btn-sm" onclick={dismissError}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		{/if}

		<!-- Pricing Cards -->
		<div class="mx-auto grid max-w-6xl gap-8 md:grid-cols-3" data-testid="pricing-cards">
			<!-- Free Tier -->
			<div class="card bg-base-100 shadow-xl" data-testid="free-tier-card">
				<div class="card-body">
					<h2 class="card-title text-2xl">{m.pricing_free_tier()}</h2>
					<p class="text-base-content/70">{m.pricing_free_description()}</p>

					<div class="my-6">
						<span class="text-4xl font-bold">{m.pricing_free_price()}</span>
						<span class="text-base-content/60">{m.pricing_per_month()}</span>
					</div>

					<div class="divider"></div>

					<div class="space-y-3">
						<p class="font-semibold">{m.pricing_features_included()}</p>
						{#each freeFeatures as feature}
							<div class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-success"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								<span>{feature}</span>
							</div>
						{/each}
					</div>

					<div class="card-actions mt-6 justify-center">
						{#if currentTier === 'free'}
							<button type="button" class="btn btn-disabled btn-block">
								{m.pricing_current_plan()}
							</button>
						{:else}
							<a href="/signup" class="btn btn-outline btn-block">
								{m.pricing_get_started()}
							</a>
						{/if}
					</div>
				</div>
			</div>

			<!-- Pro Tier (Most Popular) -->
			<div class="card bg-primary text-primary-content shadow-xl ring-4 ring-primary/50" data-testid="pro-tier-card">
				<div class="card-body">
					<div class="badge badge-secondary mb-2">{m.pricing_most_popular()}</div>
					<h2 class="card-title text-2xl">{m.pricing_pro_tier()}</h2>
					<p class="opacity-80">{m.pricing_pro_description()}</p>

					<div class="my-6">
						<span class="text-4xl font-bold">{m.pricing_pro_price()}</span>
						<span class="opacity-70">{m.pricing_per_month()}</span>
					</div>

					<div class="divider before:bg-primary-content/30 after:bg-primary-content/30"></div>

					<div class="space-y-3">
						<p class="font-semibold">{m.pricing_features_included()}</p>
						{#each proFeatures as feature}
							<div class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								<span>{feature}</span>
							</div>
						{/each}
					</div>

					<div class="card-actions mt-6 justify-center">
						{#if currentTier === 'pro'}
							<button type="button" class="btn btn-disabled btn-block">
								{m.pricing_current_plan()}
							</button>
						{:else}
							<button
								type="button"
								class="btn btn-secondary btn-block"
								disabled={isLoading !== null}
								onclick={() => handleCheckout('pro')}
							data-testid="pro-checkout-button"
							>
								{#if isLoading === 'pro'}
									<span class="loading loading-spinner loading-sm"></span>
									{m.pricing_loading()}
								{:else}
									{m.pricing_choose_plan()}
								{/if}
							</button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Enterprise Tier -->
			<div class="card bg-base-100 shadow-xl" data-testid="enterprise-tier-card">
				<div class="card-body">
					<h2 class="card-title text-2xl">{m.pricing_enterprise_tier()}</h2>
					<p class="text-base-content/70">{m.pricing_enterprise_description()}</p>

					<div class="my-6">
						<span class="text-4xl font-bold">{m.pricing_enterprise_price()}</span>
						<span class="text-base-content/60">{m.pricing_per_month()}</span>
					</div>

					<div class="divider"></div>

					<div class="space-y-3">
						<p class="font-semibold">{m.pricing_features_included()}</p>
						{#each enterpriseFeatures as feature}
							<div class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-success"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								<span>{feature}</span>
							</div>
						{/each}
					</div>

					<div class="card-actions mt-6 justify-center">
						{#if currentTier === 'enterprise'}
							<button type="button" class="btn btn-disabled btn-block">
								{m.pricing_current_plan()}
							</button>
						{:else}
							<button
								type="button"
								class="btn btn-primary btn-block"
								disabled={isLoading !== null}
								onclick={() => handleCheckout('enterprise')}
							data-testid="enterprise-checkout-button"
							>
								{#if isLoading === 'enterprise'}
									<span class="loading loading-spinner loading-sm"></span>
									{m.pricing_loading()}
								{:else}
									{m.pricing_choose_plan()}
								{/if}
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- FAQ Section -->
		<div class="mx-auto mt-20 max-w-3xl">
			<h2 class="mb-8 text-center text-3xl font-bold">{m.pricing_faq_title()}</h2>

			<div class="space-y-4">
				<div class="collapse collapse-arrow bg-base-100">
					<input type="radio" name="faq-accordion" checked />
					<div class="collapse-title text-lg font-medium">
						{m.pricing_faq_cancel_q()}
					</div>
					<div class="collapse-content">
						<p>{m.pricing_faq_cancel_a()}</p>
					</div>
				</div>

				<div class="collapse collapse-arrow bg-base-100">
					<input type="radio" name="faq-accordion" />
					<div class="collapse-title text-lg font-medium">
						{m.pricing_faq_upgrade_q()}
					</div>
					<div class="collapse-content">
						<p>{m.pricing_faq_upgrade_a()}</p>
					</div>
				</div>

				<div class="collapse collapse-arrow bg-base-100">
					<input type="radio" name="faq-accordion" />
					<div class="collapse-title text-lg font-medium">
						{m.pricing_faq_payment_q()}
					</div>
					<div class="collapse-content">
						<p>{m.pricing_faq_payment_a()}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Back to Home -->
		<div class="mt-12 text-center">
			<a href="/" class="link link-primary">{m.error_back_home()}</a>
		</div>
	</div>
</main>
