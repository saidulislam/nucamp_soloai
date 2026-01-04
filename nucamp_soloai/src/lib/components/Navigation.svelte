<script lang="ts">
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages';

	interface NavLink {
		href: string;
		label: string;
	}

	let isMobileMenuOpen = $state(false);

	// Main navigation links
	const publicLinks: NavLink[] = [
		{ href: '/', label: m.nav_home() },
		{ href: '/features', label: m.nav_features() },
		{ href: '/pricing', label: m.nav_pricing() },
		{ href: '/contact', label: m.nav_contact() }
	];

	// Legal links for mobile menu
	const legalLinks: NavLink[] = [
		{ href: '/privacy', label: m.nav_privacy() },
		{ href: '/terms', label: m.nav_terms() }
	];

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

	function isActive(href: string): boolean {
		if (href === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(href);
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.navigation')) {
			closeMobileMenu();
		}
	}

	$effect(() => {
		if (isMobileMenuOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<nav class="navigation">
	<!-- Desktop Navigation -->
	<ul class="menu menu-horizontal hidden items-center gap-2 lg:flex">
		{#each publicLinks as link}
			<li>
				<a
					href={link.href}
					class="text-sm font-medium transition-colors {isActive(link.href)
						? 'active bg-primary/10 text-primary'
						: 'hover:bg-base-200'}"
				>
					{link.label}
				</a>
			</li>
		{/each}
	</ul>

	<!-- Mobile Menu Dropdown -->
	<div class="dropdown dropdown-end lg:hidden">
		<button
			type="button"
			tabindex="0"
			role="button"
			onclick={toggleMobileMenu}
			aria-label={m.menu_toggle()}
			aria-expanded={isMobileMenuOpen}
			class="btn btn-ghost btn-square"
		>
			{#if isMobileMenuOpen}
				<!-- Close Icon -->
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
			{:else}
				<!-- Hamburger Icon -->
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					></path>
				</svg>
			{/if}
		</button>
		{#if isMobileMenuOpen}
			<ul
				tabindex="0"
				class="menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow-lg"
			>
				<!-- Main Navigation Links -->
				{#each publicLinks as link}
					<li>
						<a
							href={link.href}
							onclick={closeMobileMenu}
							class="{isActive(link.href) ? 'active bg-primary/10' : ''}"
						>
							{link.label}
						</a>
					</li>
				{/each}

				<!-- Divider -->
				<li class="menu-title mt-2">
					<span class="text-xs opacity-60">{m.footer_legal()}</span>
				</li>

				<!-- Legal Links -->
				{#each legalLinks as link}
					<li>
						<a
							href={link.href}
							onclick={closeMobileMenu}
							class="{isActive(link.href) ? 'active bg-primary/10' : ''}"
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</nav>
