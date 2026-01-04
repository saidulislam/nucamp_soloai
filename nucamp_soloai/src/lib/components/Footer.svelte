<script lang="ts">
	import { browser } from '$app/environment';
	import * as m from '$lib/paraglide/messages';
	import { isUSUser } from '$lib/config/klaro-config';

	const currentYear = new Date().getFullYear();

	// Check if current user requires consent (non-US users)
	const showCookieSettings = $derived(browser && !isUSUser());

	const companyLinks = [
		{ href: '/', label: m.nav_home() },
		{ href: '/features', label: m.nav_features() },
		{ href: '/pricing', label: m.nav_pricing() }
	];

	const legalLinks = [
		{ href: '/privacy', label: m.nav_privacy() },
		{ href: '/terms', label: m.nav_terms() }
	];

	const supportLinks = [{ href: '/contact', label: m.nav_contact() }];

	/**
	 * Open Klaro cookie settings modal
	 * (TC03-GDPR-Consent-Manager.md)
	 */
	async function openCookieSettings(): Promise<void> {
		if (!browser) return;

		try {
			const Klaro = await import('klaro');
			Klaro.default.show(undefined, true);
		} catch (error) {
			console.error('[Footer] Failed to open Klaro settings:', error);
		}
	}
</script>

<footer class="footer footer-center bg-base-200 p-10 text-base-content">
	<div class="grid w-full max-w-7xl grid-flow-col gap-4 md:grid-cols-4">
		<!-- Brand Section -->
		<div class="md:col-span-1">
			<div class="flex items-center gap-2">
				<div class="avatar placeholder">
					<div class="bg-primary text-primary-content w-10 rounded-lg">
						<svg
							class="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							></path>
						</svg>
					</div>
				</div>
				<span class="text-lg font-bold">{m.brand_name()}</span>
			</div>
			<p class="mt-2 text-sm opacity-70">{m.brand_tagline()}</p>
		</div>

		<!-- Company Links -->
		<div>
			<span class="footer-title">{m.footer_company()}</span>
			{#each companyLinks as link}
				<a href={link.href} class="link-hover link">{link.label}</a>
			{/each}
		</div>

		<!-- Legal Links -->
		<div>
			<span class="footer-title">{m.footer_legal()}</span>
			{#each legalLinks as link}
				<a href={link.href} class="link-hover link">{link.label}</a>
			{/each}
			<!-- Cookie Settings button (TC03-GDPR-Consent-Manager.md) -->
			<!-- Only shown for non-US users who require GDPR consent -->
			{#if showCookieSettings}
				<button
					type="button"
					class="link-hover link text-left"
					onclick={openCookieSettings}
					aria-label={m.cookie_settings?.() || 'Cookie Settings'}
				>
					{m.cookie_settings?.() || 'Cookie Settings'}
				</button>
			{/if}
		</div>

		<!-- Support Links -->
		<div>
			<span class="footer-title">{m.footer_support()}</span>
			{#each supportLinks as link}
				<a href={link.href} class="link-hover link">{link.label}</a>
			{/each}
		</div>
	</div>

	<!-- Copyright -->
	<div class="w-full border-t border-base-300 pt-4">
		<p class="text-sm opacity-70">
			{m.footer_copyright({ year: currentYear.toString() })}
		</p>
	</div>
</footer>
