<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		user: {
			id: string;
			email: string;
			name: string;
			image: string | null;
		};
		onSuccess?: () => void;
		onCancel?: () => void;
	}

	let { user, onSuccess, onCancel }: Props = $props();

	// Form state - pre-populated with current user data
	let name = $state(user.name || '');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Validation state
	let nameError = $state('');
	let nameTouched = $state(false);

	// Track if form has changes
	const hasChanges = $derived(name !== (user.name || ''));

	// Validate name (1-100 characters)
	function validateName(): boolean {
		if (!name.trim()) {
			nameError = m.account_update_name_required();
			return false;
		}
		if (name.trim().length > 100) {
			nameError = m.account_update_name_too_long();
			return false;
		}
		nameError = '';
		return true;
	}

	// Handle name blur
	function handleNameBlur() {
		nameTouched = true;
		validateName();
	}

	// Dismiss error message
	function dismissError() {
		errorMessage = '';
	}

	// Dismiss success message
	function dismissSuccess() {
		successMessage = '';
	}

	// Map error codes to user-friendly messages
	function getErrorMessage(errorCode: string | undefined): string {
		switch (errorCode) {
			case 'UNAUTHORIZED':
			case 'SESSION_EXPIRED':
				return m.account_update_error_session_expired();
			case 'RATE_LIMIT_EXCEEDED':
			case 'TOO_MANY_REQUESTS':
				return m.account_update_error_rate_limit();
			case 'VALIDATION_ERROR':
				return m.account_update_error_validation();
			case 'INTERNAL_SERVER_ERROR':
			case 'SERVER_ERROR':
				return m.account_update_error_server();
			default:
				return m.account_update_error_generic();
		}
	}

	// Handle form submission
	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		// Validate all fields
		nameTouched = true;
		const isNameValid = validateName();

		if (!isNameValid) {
			return;
		}

		// Don't submit if no changes
		if (!hasChanges) {
			return;
		}

		isLoading = true;
		errorMessage = '';
		successMessage = '';

		try {
			const result = await authClient.updateUser({
				name: name.trim()
			});

			if (result.error) {
				errorMessage = getErrorMessage(result.error.code);
				return;
			}

			// Success
			successMessage = m.account_update_success();

			// Auto-dismiss success message after 5 seconds
			setTimeout(() => {
				successMessage = '';
				onSuccess?.();
			}, 5000);
		} catch (error) {
			console.error('Profile update error:', error);
			errorMessage = m.account_update_error_network();
		} finally {
			isLoading = false;
		}
	}

	// Handle cancel
	function handleCancel() {
		// Reset form to original values
		name = user.name || '';
		nameError = '';
		nameTouched = false;
		errorMessage = '';
		successMessage = '';
		onCancel?.();
	}

	// Computed classes for input states
	const nameInputClass = $derived(nameTouched && nameError ? 'input-error' : '');

	// Form is disabled when loading
	const isFormDisabled = $derived(isLoading);
</script>

<form
	onsubmit={handleSubmit}
	class="space-y-6"
	novalidate
	aria-busy={isLoading}
	data-testid="profile-update-form"
>
	<!-- Success Message -->
	{#if successMessage}
		<div
			class="alert alert-success"
			role="status"
			aria-live="polite"
			data-testid="profile-update-success"
		>
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
			<span class="flex-1">{successMessage}</span>
			<button
				type="button"
				onclick={dismissSuccess}
				class="btn btn-ghost btn-sm btn-circle"
				aria-label={m.account_update_dismiss()}
				data-testid="success-dismiss"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	{/if}

	<!-- Error Message -->
	{#if errorMessage}
		<div
			class="alert alert-error"
			role="alert"
			aria-live="assertive"
			data-testid="profile-update-error"
		>
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
			<span class="flex-1">{errorMessage}</span>
			<button
				type="button"
				onclick={dismissError}
				class="btn btn-ghost btn-sm btn-circle"
				aria-label={m.account_update_dismiss()}
				data-testid="error-dismiss"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	{/if}

	<!-- Personal Information Section -->
	<div class="space-y-4">
		<h3 class="text-lg font-medium">{m.account_update_personal_info()}</h3>

		<!-- Name Field -->
		<div class="form-control w-full">
			<label class="label" for="update-name">
				<span class="label-text font-medium">{m.account_update_name_label()}</span>
			</label>
			<input
				type="text"
				id="update-name"
				name="name"
				bind:value={name}
				onblur={handleNameBlur}
				placeholder={m.account_update_name_placeholder()}
				class="input input-bordered w-full {nameInputClass}"
				autocomplete="name"
				disabled={isFormDisabled}
				maxlength="100"
				aria-invalid={nameTouched && !!nameError}
				aria-describedby={nameError ? 'name-error' : undefined}
				data-testid="update-name-input"
			/>
			{#if nameTouched && nameError}
				<label class="label" for="update-name">
					<span id="name-error" class="label-text-alt text-error" role="alert">
						{nameError}
					</span>
				</label>
			{/if}
		</div>

		<!-- Email Field (Read-only for now) -->
		<div class="form-control w-full">
			<label class="label" for="update-email">
				<span class="label-text font-medium">{m.account_update_email_label()}</span>
			</label>
			<input
				type="email"
				id="update-email"
				name="email"
				value={user.email}
				class="input input-bordered w-full bg-base-200"
				disabled
				readonly
				data-testid="update-email-input"
			/>
			<label class="label" for="update-email">
				<span class="label-text-alt text-base-content/60">
					{m.account_update_email_readonly()}
				</span>
			</label>
		</div>
	</div>

	<!-- Form Actions -->
	<div class="flex flex-col sm:flex-row gap-3 pt-4">
		<button
			type="submit"
			class="btn btn-primary flex-1 sm:flex-none"
			disabled={isFormDisabled || !hasChanges}
			data-testid="profile-update-submit"
		>
			{#if isLoading}
				<span class="loading loading-spinner loading-sm"></span>
				{m.account_update_saving()}
			{:else}
				{m.account_update_save()}
			{/if}
		</button>

		<button
			type="button"
			class="btn btn-ghost flex-1 sm:flex-none"
			onclick={handleCancel}
			disabled={isFormDisabled}
			data-testid="profile-update-cancel"
		>
			{m.account_update_cancel()}
		</button>
	</div>
</form>
