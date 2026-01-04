<script lang="ts">
	import Meta from '$lib/components/Meta.svelte';
	import * as m from '$lib/paraglide/messages';
	import { generateWebsiteSchema, generateOrganizationSchema } from '$lib/utils/seo';

	const structuredData = [generateWebsiteSchema(), generateOrganizationSchema()];
</script>

<Meta
	title={m.seo_home_title()}
	description={m.seo_home_description()}
	structuredData={structuredData}
/>

<main data-testid="home-page">
	<h1 data-testid="home-title">Welcome to SoloAI SaaS</h1>
	<p>Your AI-powered business solution platform.</p>
	<nav data-testid="home-nav">
		<ul>
			<li><a href="/features" data-testid="features-link">Features</a></li>
			<li><a href="/pricing" data-testid="pricing-link">Pricing</a></li>
			<li><a href="/contact" data-testid="contact-link">Contact</a></li>
			<li><a href="/login" data-testid="home-login-link">Login</a></li>
			<li><a href="/signup" data-testid="home-signup-link">Sign Up</a></li>
		</ul>
	</nav>
</main>
