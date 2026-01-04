<script lang="ts">
	import { goto } from '$app/navigation';
	import { signUp } from '$lib/auth/client';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		redirectTo?: string;
	}

	let { redirectTo = '/account' }: Props = $props();

	// Form state
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let isSuccess = $state(false);

	// Validation state
	let nameError = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let confirmPasswordError = $state('');
	let nameTouched = $state(false);
	let emailTouched = $state(false);
	let passwordTouched = $state(false);
	let confirmPasswordTouched = $state(false);

	// Email validation regex
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	// Validate name
	function validateName(): boolean {
		if (!name.trim()) {
			nameError = m.auth_signup_name_required();
			return false;
		}
		nameError = '';
		return true;
	}

	// Validate email
	function validateEmail(): boolean {
		if (!email.trim()) {
			emailError = m.auth_signup_email_required();
			return false;
		}
		if (!emailRegex.test(email)) {
			emailError = m.auth_signup_email_invalid();
			return false;
		}
		emailError = '';
		return true;
	}

	// Validate password
	function validatePassword(): boolean {
		if (!password) {
			passwordError = m.auth_signup_password_required();
			return false;
		}
		if (password.length < 8) {
			passwordError = m.auth_signup_password_min_length();
			return false;
		}
		passwordError = '';
		return true;
	}

	// Validate confirm password
	function validateConfirmPassword(): boolean {
		if (!confirmPassword) {
			confirmPasswordError = m.auth_signup_confirm_password_required();
			return false;
		}
		if (confirmPassword !== password) {
			confirmPasswordError = m.auth_signup_passwords_not_match();
			return false;
		}
		confirmPasswordError = '';
		return true;
	}

	// Handle blur events
	function handleNameBlur() {
		nameTouched = true;
		validateName();
	}

	function handleEmailBlur() {
		emailTouched = true;
		validateEmail();
	}

	function handlePasswordBlur() {
		passwordTouched = true;
		validatePassword();
		// Re-validate confirm password if it's been touched
		if (confirmPasswordTouched) {
			validateConfirmPassword();
		}
	}

	function handleConfirmPasswordBlur() {
		confirmPasswordTouched = true;
		validateConfirmPassword();
	}

	// Dismiss error message
	function dismissError() {
		errorMessage = '';
	}

	// Map Better Auth error codes to user-friendly messages
	function getErrorMessage(errorCode: string | undefined): string {
		switch (errorCode) {
			case 'USER_ALREADY_EXISTS':
			case 'EMAIL_ALREADY_IN_USE':
				return m.auth_signup_error_email_exists();
			case 'WEAK_PASSWORD':
				return m.auth_signup_error_weak_password();
			case 'INVALID_EMAIL':
				return m.auth_signup_email_invalid();
			case 'RATE_LIMIT_EXCEEDED':
			case 'TOO_MANY_REQUESTS':
				return m.auth_signup_error_rate_limit();
			case 'INTERNAL_SERVER_ERROR':
			case 'SERVER_ERROR':
				return m.auth_signup_error_server();
			default:
				return m.auth_signup_error_generic();
		}
	}

	// Handle form submission
	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		// Validate all fields
		nameTouched = true;
		emailTouched = true;
		passwordTouched = true;
		confirmPasswordTouched = true;

		const isNameValid = validateName();
		const isEmailValid = validateEmail();
		const isPasswordValid = validatePassword();
		const isConfirmPasswordValid = validateConfirmPassword();

		if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
			return;
		}

		isLoading = true;
		errorMessage = '';
		isSuccess = false;

		try {
			const result = await signUp.email({
				email: email.trim(),
				password,
				name: name.trim()
			});

			if (result.error) {
				// Handle specific error codes
				errorMessage = getErrorMessage(result.error.code);
				return;
			}

			// Success - show success message and redirect after delay
			isSuccess = true;

			// Clear sensitive data
			password = '';
			confirmPassword = '';

			// Redirect after showing success message
			setTimeout(async () => {
				await goto(redirectTo);
			}, 1500);
		} catch (error) {
			// Network or unexpected error
			console.error('Signup error:', error);
			errorMessage = m.auth_signup_error_network();
		} finally {
			isLoading = false;
		}
	}

	// Computed classes for input states
	const nameInputClass = $derived(nameTouched && nameError ? 'input-error' : '');
	const emailInputClass = $derived(emailTouched && emailError ? 'input-error' : '');
	const passwordInputClass = $derived(passwordTouched && passwordError ? 'input-error' : '');
	const confirmPasswordInputClass = $derived(
		confirmPasswordTouched && confirmPasswordError ? 'input-error' : ''
	);

	// Form is disabled when loading or on success
	const isFormDisabled = $derived(isLoading || isSuccess);
</script>

<form onsubmit={handleSubmit} class="space-y-4" novalidate aria-busy={isLoading}>
	<!-- Success Message -->
	{#if isSuccess}
		<div
			class="alert alert-success"
			role="status"
			aria-live="polite"
			data-testid="signup-success-message"
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
				<span class="font-medium">{m.auth_signup_success_welcome({ name: name })}</span>
				<span>{m.auth_signup_success()}</span>
			</div>
		</div>
	{/if}

	<!-- Name Field -->
	<div class="form-control w-full">
		<label class="label" for="name">
			<span class="label-text font-medium">{m.auth_signup_name_label()}</span>
		</label>
		<input
			type="text"
			id="name"
			name="name"
			bind:value={name}
			onblur={handleNameBlur}
			placeholder={m.auth_signup_name_placeholder()}
			class="input input-bordered w-full {nameInputClass}"
			autocomplete="name"
			disabled={isFormDisabled}
			aria-invalid={nameTouched && !!nameError}
			aria-describedby={nameError ? 'name-error' : undefined}
			data-testid="signup-name-input"
		/>
		{#if nameTouched && nameError}
			<label class="label" for="name">
				<span id="name-error" class="label-text-alt text-error" role="alert">
					{nameError}
				</span>
			</label>
		{/if}
	</div>

	<!-- Email Field -->
	<div class="form-control w-full">
		<label class="label" for="email">
			<span class="label-text font-medium">{m.auth_signup_email_label()}</span>
		</label>
		<input
			type="email"
			id="email"
			name="email"
			bind:value={email}
			onblur={handleEmailBlur}
			placeholder={m.auth_signup_email_placeholder()}
			class="input input-bordered w-full {emailInputClass}"
			autocomplete="email"
			disabled={isFormDisabled}
			aria-invalid={emailTouched && !!emailError}
			aria-describedby={emailError ? 'email-error' : undefined}
			data-testid="signup-email-input"
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
			<span class="label-text font-medium">{m.auth_signup_password_label()}</span>
		</label>
		<input
			type="password"
			id="password"
			name="password"
			bind:value={password}
			onblur={handlePasswordBlur}
			placeholder={m.auth_signup_password_placeholder()}
			class="input input-bordered w-full {passwordInputClass}"
			autocomplete="new-password"
			disabled={isFormDisabled}
			aria-invalid={passwordTouched && !!passwordError}
			aria-describedby={passwordError ? 'password-error' : undefined}
			data-testid="signup-password-input"
		/>
		{#if passwordTouched && passwordError}
			<label class="label" for="password">
				<span id="password-error" class="label-text-alt text-error" role="alert">
					{passwordError}
				</span>
			</label>
		{/if}
	</div>

	<!-- Confirm Password Field -->
	<div class="form-control w-full">
		<label class="label" for="confirm-password">
			<span class="label-text font-medium">{m.auth_signup_confirm_password_label()}</span>
		</label>
		<input
			type="password"
			id="confirm-password"
			name="confirm-password"
			bind:value={confirmPassword}
			onblur={handleConfirmPasswordBlur}
			placeholder={m.auth_signup_confirm_password_placeholder()}
			class="input input-bordered w-full {confirmPasswordInputClass}"
			autocomplete="new-password"
			disabled={isFormDisabled}
			aria-invalid={confirmPasswordTouched && !!confirmPasswordError}
			aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
			data-testid="signup-confirm-password-input"
		/>
		{#if confirmPasswordTouched && confirmPasswordError}
			<label class="label" for="confirm-password">
				<span id="confirm-password-error" class="label-text-alt text-error" role="alert">
					{confirmPasswordError}
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
			data-testid="signup-error-message"
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
				aria-label={m.auth_signup_error_dismiss()}
				data-testid="signup-error-dismiss"
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
		data-testid="signup-submit-button"
	>
		{#if isLoading}
			<span class="loading loading-spinner loading-sm"></span>
			{m.auth_signup_loading()}
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
			{m.auth_signup_success()}
		{:else}
			{m.auth_signup_submit()}
		{/if}
	</button>
</form>
