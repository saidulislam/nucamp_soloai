<script lang="ts">
	import { fade } from 'svelte/transition';
	import { navigating, page } from '$app/stores';
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import SessionProvider from '$lib/components/SessionProvider.svelte';
	import GoogleTagManager from '$lib/components/tracking/GoogleTagManager.svelte';
	import { trackPageViewGA4, identifyUser } from '$lib/utils/tracking';
	import { env } from '$env/dynamic/public';
	import { authClient } from '$lib/auth/client';
	import { getLocale } from '$lib/paraglide/runtime';
	import { getKlaroConfig, isUSUser } from '$lib/config/klaro-config';

	// Import Klaro CSS for consent banner styling
	import 'klaro/dist/klaro.css';

	let { children: pageContent } = $props();

	// GTM Configuration (TC01-Google-Tag-Manager-Setup.md)
	// Determine GTM container ID based on environment
	const gtmId = $derived(
		env.PUBLIC_GTM_ID ||
			(browser && window.location.hostname === 'localhost'
				? env.PUBLIC_GTM_ID_DEV
				: env.PUBLIC_GTM_ID_PROD) ||
			''
	);
	const gtmEnabled = $derived(env.PUBLIC_GTM_ENABLED !== 'false');

	// User session for tracking (TC02-Google-Analytics-Hotjar-Setup.md)
	const sessionStore = authClient.useSession();
	const currentUser = $derived($sessionStore?.data?.user);

	// Identify user for GA4 and Hotjar when authenticated
	// This triggers dataLayer push and Hotjar identify call
	let lastIdentifiedUserId: string | null = null;
	$effect(() => {
		if (browser && currentUser && currentUser.id !== lastIdentifiedUserId) {
			const tier = (currentUser as { subscriptionTier?: string })?.subscriptionTier || 'free';
			const locale = getLocale();
			identifyUser(currentUser.id, tier, locale);
			lastIdentifiedUserId = currentUser.id;
		}
	});

	// ============================================================================
	// Klaro Consent Manager (TC03-GDPR-Consent-Manager.md)
	// ============================================================================

	// Initialize Klaro for non-US users
	onMount(async () => {
		if (!browser || !gtmEnabled) return;

		// Only show Klaro consent banner for non-US users
		if (!isUSUser()) {
			try {
				// Dynamic import to avoid SSR issues
				const Klaro = await import('klaro');

				// Get config with current locale
				const config = getKlaroConfig();

				// Set language based on Paraglide locale
				const locale = getLocale();
				config.lang = locale;

				// Initialize Klaro
				Klaro.default.setup(config);

				console.log('[Klaro] Initialized for non-US user (locale:', locale, ')');
			} catch (error) {
				console.error('[Klaro] Failed to initialize:', error);
			}
		} else {
			console.log('[Klaro] Skipped for US user - all tracking enabled');
		}
	});

	// Track page views on SPA navigation
	afterNavigate(({ to }) => {
		if (browser && gtmEnabled && to?.url) {
			// Small delay to ensure page title is updated
			setTimeout(() => {
				trackPageViewGA4(to.url.pathname, document.title);
			}, 100);
		}
	});

	// Detect if user prefers reduced motion
	let prefersReducedMotion = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
			prefersReducedMotion = mediaQuery.matches;

			// Listen for changes
			const handler = (e: MediaQueryListEvent) => {
				prefersReducedMotion = e.matches;
			};
			mediaQuery.addEventListener('change', handler);
			return () => mediaQuery.removeEventListener('change', handler);
		}
	});

	// Transition duration based on user preferences
	const transitionDuration = $derived(prefersReducedMotion ? 0 : 200);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Google Tag Manager (TC01-Google-Tag-Manager-Setup.md, TC03-GDPR-Consent-Manager.md) -->
<!-- GTM loads with Consent Mode V2 - for non-US users, consent is required before tracking -->
<GoogleTagManager containerId={gtmId} enabled={gtmEnabled} />

<!-- Klaro consent banner mounts here for non-US users -->
<div id="klaro"></div>

<SessionProvider>
	{#snippet children()}
		<div class="flex min-h-screen flex-col">
			<Header />

			<main class="flex-1">
				<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					{#key $navigating?.to?.url.pathname}
						<div
							class="page-transition"
							in:fade={{ duration: transitionDuration, delay: transitionDuration }}
						>
							{@render pageContent()}
						</div>
					{/key}
				</div>
			</main>

			<Footer />
		</div>
	{/snippet}
</SessionProvider>
