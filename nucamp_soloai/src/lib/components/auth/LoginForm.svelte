<script lang="ts">
	import { goto } from '$app/navigation';
	import { signIn } from '$lib/auth/client';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		redirectTo?: string;
	}

	let { redirectTo = '/account' }: Props = $props();

	// Form state
	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let isSuccess = $state(false);
	let userName = $state('');

	// Validation state
	let emailError = $state('');
	let passwordError = $state('');
	let emailTouched = $state(false);
	let passwordTouched = $state(false);

	// Email validation regex
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	// Validate email
	function validateEmail(): boolean {
		if (!email.trim()) {
			emailError = m.auth_login_email_required();
			return false;
		}
		if (!emailRegex.test(email)) {
			emailError = m.auth_login_email_invalid();
			return false;
		}
		emailError = '';
		return true;
	}

	// Validate password
	function validatePassword(): boolean {
		if (!password) {
			passwordError = m.auth_login_password_required();
			return false;
		}
		passwordError = '';
		return true;
	}

	// Handle email blur
	function handleEmailBlur() {
		emailTouched = true;
		validateEmail();
	}

	// Handle password blur
	function handlePasswordBlur() {
		passwordTouched = true;
		validatePassword();
	}

	// Dismiss error message
	function dismissError() {
		errorMessage = '';
	}

	// Map Better Auth error codes to user-friendly messages
	function getErrorMessage(errorCode: string | undefined): string {
		switch (errorCode) {
			case 'INVALID_EMAIL_OR_PASSWORD':
			case 'INVALID_CREDENTIALS':
				return m.auth_login_error_invalid_credentials();
			case 'USER_BANNED':
			case 'ACCOUNT_LOCKED':
				return m.auth_login_error_account_locked();
			case 'USER_NOT_FOUND':
				return m.auth_login_error_user_not_found();
			case 'EMAIL_NOT_VERIFIED':
				return m.auth_login_error_email_not_verified();
			case 'RATE_LIMIT_EXCEEDED':
			case 'TOO_MANY_REQUESTS':
				return m.auth_login_error_rate_limit();
			case 'INTERNAL_SERVER_ERROR':
			case 'SERVER_ERROR':
				return m.auth_login_error_server();
			default:
				return m.auth_login_error_generic();
		}
	}

	// Handle form submission
	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		// Validate all fields
		emailTouched = true;
		passwordTouched = true;
		const isEmailValid = validateEmail();
		const isPasswordValid = validatePassword();

		if (!isEmailValid || !isPasswordValid) {
			return;
		}

		isLoading = true;
		errorMessage = '';
		isSuccess = false;

		try {
			const result = await signIn.email({
				email: email.trim(),
				password
			});

			if (result.error) {
				// Handle specific error codes
				errorMessage = getErrorMessage(result.error.code);
				return;
			}

			// Success - show success message and redirect after delay
			isSuccess = true;
			userName = result.data?.user?.name || '';

			// Clear password for security
			password = '';

			// Redirect after showing success message
			setTimeout(async () => {
				await goto(redirectTo);
			}, 1500);
		} catch (error) {
			// Network or unexpected error
			console.error('Login error:', error);
			errorMessage = m.auth_login_error_network();
		} finally {
			isLoading = false;
		}
	}

	// Computed classes for input states
	const emailInputClass = $derived(
		emailTouched && emailError ? 'input-error' : ''
	);
	const passwordInputClass = $derived(
		passwordTouched && passwordError ? 'input-error' : ''
	);

	// Form is disabled when loading or on success
	const isFormDisabled = $derived(isLoading || isSuccess);
</script>

<form
	onsubmit={handleSubmit}
	class="space-y-6"
	novalidate
	aria-busy={isLoading}
>
	<!-- Success Message -->
	{#if isSuccess}
		<div
			class="alert alert-success"
			role="status"
			aria-live="polite"
			data-testid="login-success-message"
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
			<div class="flex flex-col">
				{#if userName}
					<span class="font-medium">{m.auth_login_success_welcome({ name: userName })}</span>
				{/if}
				<span>{m.auth_login_success()}</span>
			</div>
		</div>
	{/if}

	<!-- Email Field -->
	<div class="form-control w-full">
		<label class="label" for="email">
			<span class="label-text font-medium">{m.auth_login_email_label()}</span>
		</label>
		<input
			type="email"
			id="email"
			name="email"
			bind:value={email}
			onblur={handleEmailBlur}
			placeholder={m.auth_login_email_placeholder()}
			class="input input-bordered w-full {emailInputClass}"
			autocomplete="email"
			disabled={isFormDisabled}
			aria-invalid={emailTouched && !!emailError}
			aria-describedby={emailError ? 'email-error' : undefined}
			data-testid="login-email-input"
		/>
		{#if emailTouched && emailError}
			<label class="label" for="email">
				<span id="email-error" class="label-text-alt text-error" role="alert">
					{emailError}
				</span>
			</label>
		{/if}
	</div>

	<!-- Password Field -->
	<div class="form-control w-full">
		<label class="label" for="password">
			<span class="label-text font-medium">{m.auth_login_password_label()}</span>
		</label>
		<input
			type="password"
			id="password"
			name="password"
			bind:value={password}
			onblur={handlePasswordBlur}
			placeholder={m.auth_login_password_placeholder()}
			class="input input-bordered w-full {passwordInputClass}"
			autocomplete="current-password"
			disabled={isFormDisabled}
			aria-invalid={passwordTouched && !!passwordError}
			aria-describedby={passwordError ? 'password-error' : undefined}
			data-testid="login-password-input"
		/>
		{#if passwordTouched && passwordError}
			<label class="label" for="password">
				<span id="password-error" class="label-text-alt text-error" role="alert">
					{passwordError}
				</span>
			</label>
		{/if}
	</div>

	<!-- Error Message with Dismiss Button -->
	{#if errorMessage}
		<div
			class="alert alert-error"
			role="alert"
			aria-live="assertive"
			data-testid="login-error-message"
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
				aria-label={m.auth_login_error_dismiss()}
				data-testid="login-error-dismiss"
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

	<!-- Submit Button -->
	<button
		type="submit"
		class="btn btn-primary w-full"
		disabled={isFormDisabled}
		data-testid="login-submit-button"
	>
		{#if isLoading}
			<span class="loading loading-spinner loading-sm"></span>
			{m.auth_login_loading()}
		{:else if isSuccess}
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
					d="M5 13l4 4L19 7"
				/>
			</svg>
			{m.auth_login_success()}
		{:else}
			{m.auth_login_submit()}
		{/if}
	</button>
</form>
