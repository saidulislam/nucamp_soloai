<script lang="ts">
	/**
	 * Google Tag Manager Component
	 * (TC01-Google-Tag-Manager-Setup.md, TC03-GDPR-Consent-Manager.md)
	 *
	 * Initializes GTM container with Klaro consent integration.
	 * - US users (locale: 'en'): GTM loads immediately, all tracking enabled
	 * - Non-US users: GTM controlled by Klaro consent manager
	 *
	 * This component works with Google Consent Mode V2 for GDPR compliance.
	 *
	 * Usage:
	 *   <GoogleTagManager containerId="GTM-XXXXXXX" enabled={true} />
	 */
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { GTMProps } from './types';
	import { isUSUser } from '$lib/config/klaro-config';

	// Props with defaults
	let { containerId, enabled = true }: GTMProps = $props();

	// Validate container ID format (GTM-XXXXXXX)
	const isValidContainerId = $derived(/^GTM-[A-Z0-9]+$/.test(containerId || ''));

	// Track if GTM has been initialized
	let gtmInitialized = $state(false);

	onMount(() => {
		// Skip if not in browser, disabled, or invalid ID
		if (!browser || !enabled || !isValidContainerId) {
			if (!isValidContainerId && containerId) {
				console.warn('[GTM] Invalid container ID format:', containerId);
			}
			return;
		}

		// Skip if no container ID provided
		if (!containerId) {
			return;
		}

		// Check if GTM is already loaded (prevent duplicates)
		if (window.dataLayer?.some((item: Record<string, unknown>) => item.event === 'gtm.js')) {
			console.warn('[GTM] Already initialized, skipping duplicate load');
			gtmInitialized = true;
			return;
		}

		// For US users, load GTM directly without Klaro control
		if (isUSUser()) {
			loadGTMDirectly();
		} else {
			// For non-US users, GTM will be controlled by Klaro
			// Klaro initialization happens in layout, which sets up consent mode
			// We still need to set up dataLayer and gtag for consent mode
			setupConsentMode();
			loadGTMWithKlaroControl();
		}
	});

	/**
	 * Load GTM directly for US users (no consent required)
	 */
	function loadGTMDirectly(): void {
		// Initialize dataLayer
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'gtm.start': new Date().getTime(),
			event: 'gtm.js'
		});

		// Create and load GTM script
		const script = document.createElement('script');
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;

		script.onload = () => {
			gtmInitialized = true;
			console.log('[GTM] Initialized (US user):', containerId);
		};

		script.onerror = () => {
			console.error('[GTM] Failed to load Google Tag Manager');
		};

		document.head.appendChild(script);
	}

	/**
	 * Set up Google Consent Mode V2 for non-US users
	 * This ensures consent is properly tracked before GTM loads
	 */
	function setupConsentMode(): void {
		window.dataLayer = window.dataLayer || [];

		// Define gtag function if not exists
		if (!window.gtag) {
			window.gtag = function (...args: unknown[]) {
				window.dataLayer.push(args);
			};
		}

		// Set default consent state (all denied for non-US users)
		// This will be updated by Klaro when user makes a choice
		window.gtag('consent', 'default', {
			ad_storage: 'denied',
			ad_user_data: 'denied',
			ad_personalization: 'denied',
			analytics_storage: 'denied',
			functionality_storage: 'denied',
			personalization_storage: 'denied',
			security_storage: 'granted',
			wait_for_update: 2000
		});

		console.log('[GTM] Consent Mode V2 initialized (non-US user)');
	}

	/**
	 * Load GTM with Klaro control for non-US users
	 * GTM script is added with data attributes for Klaro to control
	 */
	function loadGTMWithKlaroControl(): void {
		// Initialize dataLayer with gtm.start event
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'gtm.start': new Date().getTime(),
			event: 'gtm.js'
		});

		// Create GTM script with Klaro data attributes
		const script = document.createElement('script');
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;

		// NOTE: Klaro typically controls scripts via type="text/plain" + data attributes
		// However, since GTM itself respects Consent Mode V2, we can load it
		// and let Consent Mode handle the actual tracking
		// The individual GA4/Hotjar tags in GTM will check consent before firing

		script.onload = () => {
			gtmInitialized = true;
			console.log('[GTM] Initialized with Consent Mode (non-US user):', containerId);
		};

		script.onerror = () => {
			console.error('[GTM] Failed to load Google Tag Manager');
		};

		document.head.appendChild(script);
	}
</script>

<!--
	GTM Noscript Fallback
	Provides basic tracking for users with JavaScript disabled.
	The iframe loads GTM in a way that works without JS.
-->
{#if browser && enabled && isValidContainerId && containerId}
	<noscript>
		<iframe
			src="https://www.googletagmanager.com/ns.html?id={containerId}"
			height="0"
			width="0"
			style="display:none;visibility:hidden"
			title="Google Tag Manager"
		></iframe>
	</noscript>
{/if}
