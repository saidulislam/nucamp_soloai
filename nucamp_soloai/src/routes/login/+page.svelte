<script lang="ts">
	import Meta from '$lib/components/Meta.svelte';
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import SocialAuthButtons from '$lib/components/auth/SocialAuthButtons.svelte';
	import * as m from '$lib/paraglide/messages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Meta title={m.seo_login_title()} description={m.seo_login_description()} noindex={true} />

<div class="flex min-h-[60vh] items-center justify-center">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body">
			<!-- Page Header -->
			<div class="text-center">
				<h1 class="text-3xl font-bold">{m.login_page_title()}</h1>
				<p class="mt-2 text-base-content/70">{m.login_page_subtitle()}</p>
			</div>

			<!-- Login Form Section -->
			<section class="mt-8" aria-labelledby="login-form-heading">
				<h2 id="login-form-heading" class="sr-only">{m.login_form_heading()}</h2>
				<LoginForm redirectTo={data.redirectTo} />
			</section>

			<!-- Social Authentication Section -->
			<section class="mt-2" aria-labelledby="social-auth-heading">
				<h2 id="social-auth-heading" class="sr-only">Social login options</h2>
				<SocialAuthButtons redirectTo={data.redirectTo} />
			</section>

			<!-- Secondary Actions -->
			<nav class="mt-6 space-y-3 text-center" aria-label="Login page navigation">
				<!-- Sign Up Link -->
				<p class="text-sm text-base-content/70">
					{m.login_no_account()}
					<a
						href="/signup"
						class="link link-primary font-medium"
						data-testid="signup-link"
					>
						{m.login_signup_link()}
					</a>
				</p>

				<!-- Forgot Password Link -->
				<p class="text-sm text-base-content/70">
					{m.login_forgot_password()}
					<a
						href="/forgot-password"
						class="link link-secondary font-medium"
						data-testid="forgot-password-link"
					>
						{m.login_reset_link()}
					</a>
				</p>
			</nav>
		</div>
	</div>
</div>
