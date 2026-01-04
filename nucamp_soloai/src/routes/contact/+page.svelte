<script lang="ts">
	import Meta from '$lib/components/Meta.svelte';
	import * as m from '$lib/paraglide/messages';
</script>

<Meta title={m.seo_contact_title()} description={m.seo_contact_description()} />

<main>
	<h1>Contact Us</h1>
	<p>We'd love to hear from you. Get in touch with our team.</p>

	<section>
		<h2>Contact Form</h2>
		<p>This page will include a contact form integrated with Mautic for lead management.</p>
		<p>Form functionality will be added in future iterations.</p>
	</section>

	<nav>
		<a href="/">Back to Home</a>
	</nav>
</main>
