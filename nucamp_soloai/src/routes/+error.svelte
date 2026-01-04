<script lang="ts">
	import { page } from '$app/stores';
	import Meta from '$lib/components/Meta.svelte';
	import * as m from '$lib/paraglide/messages';

	// Determine error type and messaging based on status code
	$: status = $page.status || 500;
	$: is404 = status === 404;
	$: is500 = status >= 500;

	// Get appropriate heading and message
	$: heading = is404
		? m.error_404_heading()
		: is500
			? m.error_500_heading()
			: m.error_generic_heading();

	$: message = is404
		? m.error_404_message()
		: is500
			? m.error_500_message()
			: m.error_generic_message();

	// Get appropriate page title for SEO
	$: pageTitle = is404 ? m.error_404_title() : m.error_page_title();
</script>

<Meta title={pageTitle} description={m.seo_error_description()} noindex={true} />

<div class="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
	<!-- Error Icon -->
	<div class="mb-8">
		{#if is404}
			<!-- 404 Icon -->
			<svg
				class="h-32 w-32 text-primary"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
		{:else}
			<!-- Generic Error Icon -->
			<svg
				class="h-32 w-32 text-error"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				></path>
			</svg>
		{/if}
	</div>

	<!-- Error Content -->
	<div class="text-center">
		<h1 class="mb-4 text-4xl font-bold">{heading}</h1>
		<p class="mb-2 text-lg opacity-70">
			{m.error_code({ code: status.toString() })}
		</p>
		<p class="mx-auto mb-8 max-w-md text-base-content/80">
			{message}
		</p>
	</div>

	<!-- Action Buttons -->
	<div class="flex flex-wrap items-center justify-center gap-4">
		<a href="/" class="btn btn-primary">
			<svg
				class="h-5 w-5"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
				></path>
			</svg>
			{m.error_back_home()}
		</a>

		{#if !is404}
			<button type="button" onclick={() => window.location.reload()} class="btn btn-ghost">
				<svg
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					></path>
				</svg>
				{m.error_try_again()}
			</button>
		{/if}

		<a href="/contact" class="btn btn-outline">
			{m.error_contact_support()}
		</a>
	</div>

	<!-- Helpful Links -->
	<div class="mt-12">
		<h2 class="mb-4 text-center text-lg font-semibold">{m.error_helpful_links()}</h2>
		<nav class="flex flex-wrap justify-center gap-4">
			<a href="/features" class="link-hover link">{m.nav_features()}</a>
			<a href="/pricing" class="link-hover link">{m.nav_pricing()}</a>
			<a href="/contact" class="link-hover link">{m.nav_contact()}</a>
		</nav>
	</div>
</div>
