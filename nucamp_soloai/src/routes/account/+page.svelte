<script lang="ts">
	import Meta from '$lib/components/Meta.svelte';
	import * as m from '$lib/paraglide/messages';
	import {
		ProfileCard,
		AccountStatus,
		QuickActions,
		BillingSection,
		AccountDashboardSkeleton
	} from '$lib/components/account';
	import { useSession } from '$lib/auth/session';

	interface Props {
		data: {
			user: {
				id: string;
				email: string;
				name: string;
				image: string | null;
				emailVerified: boolean;
				createdAt: Date;
				updatedAt: Date;
				locale: string | null;
				timezone: string | null;
				// Subscription fields (D04-Account-Billing.md)
				subscriptionTier: string | null;
				subscriptionStatus: string | null;
				subscriptionEndDate: Date | null;
				stripeCustomerId: string | null;
				stripeSubscriptionId: string | null;
				lemonSqueezyCustomerId: string | null;
				lemonSqueezySubscriptionId: string | null;
			};
			session: {
				id: string;
				createdAt: Date;
				expiresAt: Date;
				ipAddress: string | null;
				userAgent: string | null;
			};
		};
	}

	let { data }: Props = $props();

	// Get reactive session for real-time updates
	const session = useSession();

	// Handle profile update - refresh session to get updated user data
	async function handleProfileUpdated() {
		// The session will automatically update through Better Auth's reactive session
		// Force a page refresh to ensure server-side data is also refreshed
		window.location.reload();
	}

	// Loading and error states
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let retryCount = $state(0);
	const maxRetries = 3;

	// Derive loading state from session
	const isSessionLoading = $derived($session.isPending);

	// Check if we have valid data
	const hasValidData = $derived(data?.user && data?.session);

	// Retry mechanism with exponential backoff
	async function handleRetry() {
		if (retryCount >= maxRetries) {
			error = m.account_error_max_retries();
			return;
		}

		isLoading = true;
		error = null;
		retryCount++;

		// Exponential backoff: 1s, 2s, 4s
		const delay = Math.pow(2, retryCount - 1) * 1000;
		await new Promise((resolve) => setTimeout(resolve, delay));

		try {
			// Refresh page data
			window.location.reload();
		} catch {
			error = m.account_error_retry_failed();
			isLoading = false;
		}
	}

	// Reset error state
	function dismissError() {
		error = null;
		retryCount = 0;
	}
</script>

<Meta title={m.seo_account_title()} description={m.seo_account_description()} noindex={true} />

<!-- Loading State -->
{#if isSessionLoading || isLoading}
	<AccountDashboardSkeleton />

<!-- Error State -->
{:else if error || !hasValidData}
	<div class="space-y-6" data-testid="account-error-state">
		<!-- Page Header -->
		<div class="mb-8">
			<nav class="breadcrumbs text-sm mb-2" aria-label={m.account_breadcrumb_label()}>
				<ul>
					<li><a href="/">{m.nav_home()}</a></li>
					<li>{m.nav_account()}</li>
				</ul>
			</nav>

			<h1 class="text-3xl font-bold">{m.account_dashboard_title()}</h1>
		</div>

		<!-- Error Card -->
		<div class="card bg-base-100 shadow-lg" data-testid="error-card">
			<div class="card-body items-center text-center">
				<div class="text-error mb-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-16 w-16"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>

				<h2 class="card-title text-xl">{m.account_error_title()}</h2>
				<p class="text-base-content/70 max-w-md">
					{error || m.account_error_load_failed()}
				</p>

				<div class="card-actions mt-6 flex-col sm:flex-row gap-2">
					<button
						type="button"
						class="btn btn-primary gap-2"
						onclick={handleRetry}
						disabled={retryCount >= maxRetries}
						data-testid="retry-button"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								fill-rule="evenodd"
								d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
								clip-rule="evenodd"
							/>
						</svg>
						{m.account_error_retry()} ({maxRetries - retryCount} {m.account_error_attempts_left()})
					</button>

					<a href="/" class="btn btn-outline" data-testid="back-home-button">
						{m.error_back_home()}
					</a>
				</div>

				{#if retryCount > 0}
					<p class="text-sm text-base-content/50 mt-4">
						{m.account_error_retry_info()}
					</p>
				{/if}
			</div>
		</div>
	</div>

<!-- Dashboard Content -->
{:else}
	<div class="space-y-6" data-testid="account-dashboard">
		<!-- Page Header -->
		<div class="mb-8">
			<!-- Breadcrumb -->
			<nav class="breadcrumbs text-sm mb-2" aria-label={m.account_breadcrumb_label()}>
				<ul>
					<li><a href="/">{m.nav_home()}</a></li>
					<li>{m.nav_account()}</li>
				</ul>
			</nav>

			<!-- Page Title -->
			<h1 class="text-3xl font-bold" data-testid="account-page-title">
				{m.account_dashboard_title()}
			</h1>
			<p class="text-base-content/70 mt-1" data-testid="account-page-subtitle">
				{m.account_dashboard_subtitle()}
			</p>
		</div>

		<!-- Dashboard Grid -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Profile Card -->
			<ProfileCard user={data.user} onProfileUpdated={handleProfileUpdated} />

			<!-- Account Status -->
			<AccountStatus user={data.user} session={data.session} />

			<!-- Billing Section (spans full width on larger screens) -->
			<div class="lg:col-span-2">
				<BillingSection user={data.user} />
			</div>

			<!-- Quick Actions (spans full width on larger screens) -->
			<div class="lg:col-span-2">
				<QuickActions />
			</div>
		</div>
	</div>
{/if}
