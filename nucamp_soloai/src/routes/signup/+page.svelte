<script lang="ts">
	import Meta from '$lib/components/Meta.svelte';
	import SignupForm from '$lib/components/auth/SignupForm.svelte';
	import SocialAuthButtons from '$lib/components/auth/SocialAuthButtons.svelte';
	import * as m from '$lib/paraglide/messages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Meta title={m.seo_signup_title()} description={m.seo_signup_description()} noindex={true} />

<div class="flex min-h-[60vh] items-center justify-center">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body">
			<!-- Page Header -->
			<div class="text-center">
				<h1 class="text-3xl font-bold">{m.signup_page_title()}</h1>
				<p class="mt-2 text-base-content/70">{m.signup_page_subtitle()}</p>
			</div>

			<!-- Signup Form Section -->
			<section class="mt-8" aria-labelledby="signup-form-heading">
				<h2 id="signup-form-heading" class="sr-only">{m.signup_form_heading()}</h2>
				<SignupForm redirectTo={data.redirectTo} />
			</section>

			<!-- Social Authentication Section -->
			<section class="mt-2" aria-labelledby="social-signup-heading">
				<h2 id="social-signup-heading" class="sr-only">{m.auth_signup_social_heading()}</h2>
				<SocialAuthButtons redirectTo={data.redirectTo} />
			</section>

			<!-- Secondary Actions -->
			<nav class="mt-6 space-y-3 text-center" aria-label="Signup page navigation">
				<!-- Login Link -->
				<p class="text-sm text-base-content/70">
					{m.signup_already_have_account()}
					<a
						href="/login"
						class="link link-primary font-medium"
						data-testid="login-link"
					>
						{m.signup_login_link()}
					</a>
				</p>
			</nav>
		</div>
	</div>
</div>
