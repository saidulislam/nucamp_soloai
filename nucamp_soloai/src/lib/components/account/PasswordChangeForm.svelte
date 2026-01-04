<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		onSuccess?: () => void;
		onCancel?: () => void;
	}

	let { onSuccess, onCancel }: Props = $props();

	// Form state
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Validation state
	let currentPasswordError = $state('');
	let newPasswordError = $state('');
	let confirmPasswordError = $state('');
	let currentPasswordTouched = $state(false);
	let newPasswordTouched = $state(false);
	let confirmPasswordTouched = $state(false);

	// Password strength indicator
	const passwordStrength = $derived(calculatePasswordStrength(newPassword));

	// Calculate password strength (0-4)
	function calculatePasswordStrength(password: string): number {
		if (!password) return 0;
		let strength = 0;
		if (password.length >= 8) strength++;
		if (password.length >= 12) strength++;
		if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
		if (/[0-9]/.test(password)) strength++;
		if (/[^A-Za-z0-9]/.test(password)) strength++;
		return Math.min(strength, 4);
	}

	// Get password strength label
	function getStrengthLabel(strength: number): string {
		switch (strength) {
			case 0:
				return m.account_password_strength_none();
			case 1:
				return m.account_password_strength_weak();
			case 2:
				return m.account_password_strength_fair();
			case 3:
				return m.account_password_strength_good();
			case 4:
				return m.account_password_strength_strong();
			default:
				return '';
		}
	}

	// Get password strength color class
	function getStrengthColorClass(strength: number): string {
		switch (strength) {
			case 1:
				return 'bg-error';
			case 2:
				return 'bg-warning';
			case 3:
				return 'bg-info';
			case 4:
				return 'bg-success';
			default:
				return 'bg-base-300';
		}
	}

	// Validate current password
	function validateCurrentPassword(): boolean {
		if (!currentPassword) {
			currentPasswordError = m.account_password_current_required();
			return false;
		}
		currentPasswordError = '';
		return true;
	}

	// Validate new password (minimum 8 characters)
	function validateNewPassword(): boolean {
		if (!newPassword) {
			newPasswordError = m.account_password_new_required();
			return false;
		}
		if (newPassword.length < 8) {
			newPasswordError = m.account_password_min_length();
			return false;
		}
		if (newPassword === currentPassword) {
			newPasswordError = m.account_password_same_as_current();
			return false;
		}
		newPasswordError = '';
		return true;
	}

	// Validate confirm password
	function validateConfirmPassword(): boolean {
		if (!confirmPassword) {
			confirmPasswordError = m.account_password_confirm_required();
			return false;
		}
		if (confirmPassword !== newPassword) {
			confirmPasswordError = m.account_password_mismatch();
			return false;
		}
		confirmPasswordError = '';
		return true;
	}

	// Handle blur events
	function handleCurrentPasswordBlur() {
		currentPasswordTouched = true;
		validateCurrentPassword();
	}

	function handleNewPasswordBlur() {
		newPasswordTouched = true;
		validateNewPassword();
		// Re-validate confirm if already touched
		if (confirmPasswordTouched) {
			validateConfirmPassword();
		}
	}

	function handleConfirmPasswordBlur() {
		confirmPasswordTouched = true;
		validateConfirmPassword();
	}

	// Dismiss messages
	function dismissError() {
		errorMessage = '';
	}

	function dismissSuccess() {
		successMessage = '';
	}

	// Map error codes to user-friendly messages
	function getErrorMessage(errorCode: string | undefined): string {
		switch (errorCode) {
			case 'INVALID_PASSWORD':
			case 'INVALID_CREDENTIALS':
				return m.account_password_error_invalid_current();
			case 'UNAUTHORIZED':
			case 'SESSION_EXPIRED':
				return m.account_password_error_session_expired();
			case 'RATE_LIMIT_EXCEEDED':
			case 'TOO_MANY_REQUESTS':
				return m.account_password_error_rate_limit();
			case 'PASSWORD_TOO_SHORT':
				return m.account_password_min_length();
			case 'INTERNAL_SERVER_ERROR':
			case 'SERVER_ERROR':
				return m.account_password_error_server();
			default:
				return m.account_password_error_generic();
		}
	}

	// Handle form submission
	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		// Validate all fields
		currentPasswordTouched = true;
		newPasswordTouched = true;
		confirmPasswordTouched = true;

		const isCurrentPasswordValid = validateCurrentPassword();
		const isNewPasswordValid = validateNewPassword();
		const isConfirmPasswordValid = validateConfirmPassword();

		if (!isCurrentPasswordValid || !isNewPasswordValid || !isConfirmPasswordValid) {
			return;
		}

		isLoading = true;
		errorMessage = '';
		successMessage = '';

		try {
			const result = await authClient.changePassword({
				currentPassword,
				newPassword
			});

			if (result.error) {
				errorMessage = getErrorMessage(result.error.code);
				return;
			}

			// Success - clear form and show success message
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			currentPasswordTouched = false;
			newPasswordTouched = false;
			confirmPasswordTouched = false;

			successMessage = m.account_password_success();

			// Auto-dismiss success message after 5 seconds
			setTimeout(() => {
				successMessage = '';
				onSuccess?.();
			}, 5000);
		} catch (error) {
			console.error('Password change error:', error);
			errorMessage = m.account_password_error_network();
		} finally {
			isLoading = false;
		}
	}

	// Handle cancel
	function handleCancel() {
		currentPassword = '';
		newPassword = '';
		confirmPassword = '';
		currentPasswordError = '';
		newPasswordError = '';
		confirmPasswordError = '';
		currentPasswordTouched = false;
		newPasswordTouched = false;
		confirmPasswordTouched = false;
		errorMessage = '';
		successMessage = '';
		onCancel?.();
	}

	// Computed classes for input states
	const currentPasswordInputClass = $derived(
		currentPasswordTouched && currentPasswordError ? 'input-error' : ''
	);
	const newPasswordInputClass = $derived(
		newPasswordTouched && newPasswordError ? 'input-error' : ''
	);
	const confirmPasswordInputClass = $derived(
		confirmPasswordTouched && confirmPasswordError ? 'input-error' : ''
	);

	// Form is disabled when loading
	const isFormDisabled = $derived(isLoading);

	// Check if form can be submitted
	const canSubmit = $derived(currentPassword && newPassword && confirmPassword && !isLoading);
</script>

<form
	onsubmit={handleSubmit}
	class="space-y-6"
	novalidate
	aria-busy={isLoading}
	data-testid="password-change-form"
>
	<!-- Success Message -->
	{#if successMessage}
		<div
			class="alert alert-success"
			role="status"
			aria-live="polite"
			data-testid="password-change-success"
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
			data-testid="password-change-error"
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

	<!-- Security Section -->
	<div class="space-y-4">
		<h3 class="text-lg font-medium">{m.account_password_security_title()}</h3>

		<!-- Current Password Field -->
		<div class="form-control w-full">
			<label class="label" for="current-password">
				<span class="label-text font-medium">{m.account_password_current_label()}</span>
			</label>
			<input
				type="password"
				id="current-password"
				name="currentPassword"
				bind:value={currentPassword}
				onblur={handleCurrentPasswordBlur}
				placeholder={m.account_password_current_placeholder()}
				class="input input-bordered w-full {currentPasswordInputClass}"
				autocomplete="current-password"
				disabled={isFormDisabled}
				aria-invalid={currentPasswordTouched && !!currentPasswordError}
				aria-describedby={currentPasswordError ? 'current-password-error' : undefined}
				data-testid="current-password-input"
			/>
			{#if currentPasswordTouched && currentPasswordError}
				<label class="label" for="current-password">
					<span id="current-password-error" class="label-text-alt text-error" role="alert">
						{currentPasswordError}
					</span>
				</label>
			{/if}
		</div>

		<!-- New Password Field -->
		<div class="form-control w-full">
			<label class="label" for="new-password">
				<span class="label-text font-medium">{m.account_password_new_label()}</span>
			</label>
			<input
				type="password"
				id="new-password"
				name="newPassword"
				bind:value={newPassword}
				onblur={handleNewPasswordBlur}
				placeholder={m.account_password_new_placeholder()}
				class="input input-bordered w-full {newPasswordInputClass}"
				autocomplete="new-password"
				disabled={isFormDisabled}
				minlength="8"
				aria-invalid={newPasswordTouched && !!newPasswordError}
				aria-describedby="new-password-help {newPasswordError ? 'new-password-error' : ''}"
				data-testid="new-password-input"
			/>
			<!-- Password Strength Indicator -->
			{#if newPassword}
				<div class="mt-2 space-y-1">
					<div class="flex gap-1">
						{#each Array(4) as _, i}
							<div
								class="h-1 flex-1 rounded-full transition-colors {i < passwordStrength
									? getStrengthColorClass(passwordStrength)
									: 'bg-base-300'}"
							></div>
						{/each}
					</div>
					<p id="new-password-help" class="label-text-alt text-base-content/60">
						{m.account_password_strength()}: {getStrengthLabel(passwordStrength)}
					</p>
				</div>
			{:else}
				<label class="label" for="new-password">
					<span id="new-password-help" class="label-text-alt text-base-content/60">
						{m.account_password_requirements()}
					</span>
				</label>
			{/if}
			{#if newPasswordTouched && newPasswordError}
				<label class="label" for="new-password">
					<span id="new-password-error" class="label-text-alt text-error" role="alert">
						{newPasswordError}
					</span>
				</label>
			{/if}
		</div>

		<!-- Confirm Password Field -->
		<div class="form-control w-full">
			<label class="label" for="confirm-password">
				<span class="label-text font-medium">{m.account_password_confirm_label()}</span>
			</label>
			<input
				type="password"
				id="confirm-password"
				name="confirmPassword"
				bind:value={confirmPassword}
				onblur={handleConfirmPasswordBlur}
				placeholder={m.account_password_confirm_placeholder()}
				class="input input-bordered w-full {confirmPasswordInputClass}"
				autocomplete="new-password"
				disabled={isFormDisabled}
				aria-invalid={confirmPasswordTouched && !!confirmPasswordError}
				aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
				data-testid="confirm-password-input"
			/>
			{#if confirmPasswordTouched && confirmPasswordError}
				<label class="label" for="confirm-password">
					<span id="confirm-password-error" class="label-text-alt text-error" role="alert">
						{confirmPasswordError}
					</span>
				</label>
			{/if}
		</div>
	</div>

	<!-- Form Actions -->
	<div class="flex flex-col sm:flex-row gap-3 pt-4">
		<button
			type="submit"
			class="btn btn-primary flex-1 sm:flex-none"
			disabled={!canSubmit}
			data-testid="password-change-submit"
		>
			{#if isLoading}
				<span class="loading loading-spinner loading-sm"></span>
				{m.account_password_changing()}
			{:else}
				{m.account_password_change()}
			{/if}
		</button>

		<button
			type="button"
			class="btn btn-ghost flex-1 sm:flex-none"
			onclick={handleCancel}
			disabled={isFormDisabled}
			data-testid="password-change-cancel"
		>
			{m.account_update_cancel()}
		</button>
	</div>
</form>
