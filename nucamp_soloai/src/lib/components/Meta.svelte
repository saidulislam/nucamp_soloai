<script lang="ts">
	import { page } from '$app/stores';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { SEOConfig } from '$lib/utils/seo';
	import {
		DEFAULT_SEO,
		generateCanonicalUrl,
		generateOgImageUrl,
		generateRobotsContent,
		generateTitle,
		sanitizeDescription
	} from '$lib/utils/seo';

	interface Props {
		title: string;
		description: string;
		canonical?: string;
		ogImage?: string;
		ogType?: SEOConfig['ogType'];
		twitterCard?: SEOConfig['twitterCard'];
		noindex?: boolean;
		nofollow?: boolean;
		structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
	}

	let {
		title,
		description,
		canonical,
		ogImage,
		ogType = 'website',
		twitterCard = 'summary_large_image',
		noindex = false,
		nofollow = false,
		structuredData
	}: Props = $props();

	const locale = getLocale();
	const fullTitle = generateTitle(title);
	const sanitizedDescription = sanitizeDescription(description);
	const canonicalUrl = canonical || generateCanonicalUrl($page.url.pathname, locale);
	const ogImageUrl = generateOgImageUrl(ogImage);
	const robotsContent = generateRobotsContent({ noindex, nofollow });
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{fullTitle}</title>
	<meta name="title" content={fullTitle} />
	<meta name="description" content={sanitizedDescription} />
	<meta name="robots" content={robotsContent} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Language and Locale -->
	<meta property="og:locale" content={locale} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={ogType} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={sanitizedDescription} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:site_name" content={DEFAULT_SEO.siteName} />

	<!-- Twitter -->
	<meta property="twitter:card" content={twitterCard} />
	<meta property="twitter:url" content={canonicalUrl} />
	<meta property="twitter:title" content={fullTitle} />
	<meta property="twitter:description" content={sanitizedDescription} />
	<meta property="twitter:image" content={ogImageUrl} />
	{#if DEFAULT_SEO.twitterHandle}
		<meta property="twitter:site" content={DEFAULT_SEO.twitterHandle} />
		<meta property="twitter:creator" content={DEFAULT_SEO.twitterHandle} />
	{/if}

	<!-- Structured Data (JSON-LD) -->
	{#if structuredData}
		{#if Array.isArray(structuredData)}
			{#each structuredData as schema}
				{@html `<script type="application/ld+json">${JSON.stringify(schema)}</script>`}
			{/each}
		{:else}
			{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
		{/if}
	{/if}
</svelte:head>
