<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { goto } from '$app/navigation';
	import { signOutWithSync } from '$lib/auth/session';

	interface Props {
		/** Button variant: 'primary', 'outline', 'ghost', 'error' */
		variant?: 'primary' | 'outline' | 'ghost' | 'error';
		/** Button size: 'sm', 'md', 'lg' */
		size?: 'sm' | 'md' | 'lg';
		/** Show confirmation modal before logout */
		showConfirmation?: boolean;
		/** Show icon with text */
		showIcon?: boolean;
		/** Redirect URL after logout */
		redirectTo?: string;
		/** Callback on successful logout */
		onSuccess?: () => void;
		/** Callback on logout error */
		onError?: (error: Error) => void;
		/** Custom class names */
		class?: string;
	}

	let {
		variant = 'error',
		size = 'md',
		showConfirmation = true,
		showIcon = true,
		redirectTo = '/login',
		onSuccess,
		onError,
		class: className = ''
	}: Props = $props();

	// State
	let isModalOpen = $state(false);
	let isLoggingOut = $state(false);
	let error = $state<string | null>(null);
	let retryCount = $state(0);
	const maxRetries = 3;

	// Button class based on variant
	const variantClasses: Record<string, string> = {
		primary: 'btn-primary',
		outline: 'btn-outline btn-error',
		ghost: 'btn-ghost text-error hover:bg-error/10',
		error: 'btn-error'
	};

	// Button size classes
	const sizeClasses: Record<string, string> = {
		sm: 'btn-sm',
		md: '',
		lg: 'btn-lg'
	};

	const buttonClass = $derived(
		`btn ${variantClasses[variant]} ${sizeClasses[size]} gap-2 ${className}`.trim()
	);

	// Open confirmation modal or trigger logout directly
	function handleClick() {
		if (showConfirmation) {
			openModal();
		} else {
			performLogout();
		}
	}

	// Open modal
	function openModal() {
		isModalOpen = true;
		error = null;
	}

	// Close modal
	function closeModal() {
		if (!isLoggingOut) {
			isModalOpen = false;
			error = null;
			retryCount = 0;
		}
	}

	// Perform logout with retry support
	async function performLogout() {
		if (isLoggingOut) return;

		isLoggingOut = true;
		error = null;

		try {
			// Call Better Auth signOut with cross-tab sync
			await signOutWithSync();

			// Clear any local storage data
			if (typeof window !== 'undefined') {
				// Clear auth-related localStorage items
				localStorage.removeItem('auth_session_event');
			}

			// Call success callback
			onSuccess?.();

			// Close modal if open
			isModalOpen = false;

			// Redirect to destination with success message
			await goto(`${redirectTo}?logout=success`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : m.logout_error_generic();
			error = errorMessage;
			retryCount++;

			// Call error callback
			onError?.(err instanceof Error ? err : new Error(errorMessage));

			// If max retries reached, attempt force logout
			if (retryCount >= maxRetries) {
				await forceLogout();
			}
		} finally {
			isLoggingOut = false;
		}
	}

	// Force logout when normal logout fails
	async function forceLogout() {
		try {
			// Clear all authentication state manually
			if (typeof window !== 'undefined') {
				localStorage.removeItem('auth_session_event');
				// Clear any cookies by redirecting
			}

			// Navigate to login regardless
			await goto(`${redirectTo}?logout=forced`);
		} catch {
			// Last resort: hard redirect
			if (typeof window !== 'undefined') {
				window.location.href = redirectTo;
			}
		}
	}

	// Handle retry
	function handleRetry() {
		performLogout();
	}

	// Handle keyboard escape to close modal
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isModalOpen && !isLoggingOut) {
			closeModal();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Logout Button -->
<button
	type="button"
	class={buttonClass}
	onclick={handleClick}
	disabled={isLoggingOut}
	aria-label={m.nav_logout()}
	data-testid="logout-button"
>
	{#if isLoggingOut && !showConfirmation}
		<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
	{:else if showIcon}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			viewBox="0 0 20 20"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fill-rule="evenodd"
				d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
				clip-rule="evenodd"
			/>
		</svg>
	{/if}
	{isLoggingOut && !showConfirmation ? m.logout_logging_out() : m.nav_logout()}
</button>

<!-- Confirmation Modal -->
{#if isModalOpen}
	<div
		class="modal modal-open"
		role="dialog"
		aria-modal="true"
		aria-labelledby="logout-modal-title"
		data-testid="logout-confirmation-modal"
	>
		<div class="modal-box">
			<h3 class="font-bold text-lg" id="logout-modal-title">
				{m.account_logout_modal_title()}
			</h3>

			<p class="py-4 text-base-content/70">
				{m.account_logout_modal_message()}
			</p>

			<!-- Error Display -->
			{#if error}
				<div class="alert alert-error mb-4" role="alert" data-testid="logout-error">
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
					<div>
						<p>{error}</p>
						{#if retryCount < maxRetries}
							<p class="text-sm mt-1">
								{m.logout_retry_hint({ remaining: maxRetries - retryCount })}
							</p>
						{:else}
							<p class="text-sm mt-1">{m.logout_force_hint()}</p>
						{/if}
					</div>
				</div>
			{/if}

			<div class="modal-action">
				<button
					type="button"
					class="btn btn-ghost"
					onclick={closeModal}
					disabled={isLoggingOut}
					data-testid="logout-cancel-button"
				>
					{m.account_logout_modal_cancel()}
				</button>

				{#if error && retryCount < maxRetries}
					<button
						type="button"
						class="btn btn-warning gap-2"
						onclick={handleRetry}
						disabled={isLoggingOut}
						data-testid="logout-retry-button"
					>
						{#if isLoggingOut}
							<span class="loading loading-spinner loading-sm"></span>
						{/if}
						{m.error_try_again()}
					</button>
				{:else}
					<button
						type="button"
						class="btn btn-error gap-2"
						onclick={performLogout}
						disabled={isLoggingOut}
						data-testid="logout-confirm-button"
					>
						{#if isLoggingOut}
							<span class="loading loading-spinner loading-sm"></span>
						{/if}
						{isLoggingOut ? m.logout_logging_out() : m.account_logout_modal_confirm()}
					</button>
				{/if}
			</div>
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={closeModal}></div>
	</div>
{/if}
