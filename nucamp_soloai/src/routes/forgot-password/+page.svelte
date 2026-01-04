<script lang="ts">
	import Meta from '$lib/components/Meta.svelte';
	import * as m from '$lib/paraglide/messages';
</script>

<Meta
	title={m.seo_forgot_password_title()}
	description={m.seo_forgot_password_description()}
	noindex={true}
/>

<main>
	<h1>Forgot Password</h1>
	<p>Enter your email to reset your password.</p>

	<section>
		<h2>Password Reset</h2>
		<p>This page will contain the password reset form.</p>
		<p>Better Auth password reset functionality will be added in future iterations.</p>
	</section>

	<nav>
		<p>Remember your password? <a href="/login">Sign in</a></p>
		<p><a href="/">Back to Home</a></p>
	</nav>
</main>
