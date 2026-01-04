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

<main>
	<h1>Welcome to SoloAI SaaS</h1>
	<p>Your AI-powered business solution platform.</p>
	<nav>
		<ul>
			<li><a href="/features">Features</a></li>
			<li><a href="/pricing">Pricing</a></li>
			<li><a href="/contact">Contact</a></li>
			<li><a href="/login">Login</a></li>
			<li><a href="/signup">Sign Up</a></li>
		</ul>
	</nav>
</main>
