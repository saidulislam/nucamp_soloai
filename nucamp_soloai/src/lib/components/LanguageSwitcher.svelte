<script lang="ts">
	import { getLocale, locales, setLocale } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	let isOpen = $state(false);
	let currentLocale = $state(getLocale());

	const languageNames: Record<string, string> = {
		en: 'English',
		es: 'Español',
		fr: 'Français',
		de: 'Deutsch',
		it: 'Italiano',
		pt: 'Português',
		hi: 'हिन्दी',
		ur: 'اردو',
		ar: 'العربية',
		ru: 'Русский',
		fi: 'Suomi',
		nb: 'Norsk'
	};

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function switchLanguage(locale: (typeof locales)[number]) {
		setLocale(locale);
		currentLocale = locale;
		closeDropdown();
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.language-switcher')) {
			closeDropdown();
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="language-switcher dropdown dropdown-end" data-testid="language-switcher">
	<button
		type="button"
		tabindex="0"
		role="button"
		onclick={toggleDropdown}
		aria-label={m.language_switcher_label()}
		class="btn btn-ghost btn-sm flex items-center gap-2"
		data-testid="language-switcher-button"
	>
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
				d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
			></path>
		</svg>
		<span class="hidden sm:inline">{languageNames[currentLocale]}</span>
	</button>

	{#if isOpen}
		<ul
			tabindex="0"
			class="menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
			data-testid="language-dropdown"
		>
			{#each locales as locale}
				<li>
					<button
						type="button"
						onclick={() => switchLanguage(locale)}
						class="{locale === currentLocale ? 'active' : ''}"
					>
						{languageNames[locale] || locale}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
