<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Navigation from './Navigation.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import AuthButton from './AuthButton.svelte';
</script>

<header class="navbar sticky top-0 z-50 border-b border-base-300 bg-base-100 shadow-sm">
	<div class="navbar-start">
		<!-- Logo/Brand -->
		<a href="/" class="btn btn-ghost flex items-center gap-2 text-xl font-bold">
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
			<span class="hidden sm:inline">{m.brand_name()}</span>
		</a>
	</div>

	<!-- Center Navigation (Desktop) -->
	<div class="navbar-center hidden lg:flex">
		<Navigation />
	</div>

	<!-- Right Side: Mobile Menu + Language Switcher + Auth -->
	<div class="navbar-end gap-2">
		<div class="lg:hidden">
			<Navigation />
		</div>
		<LanguageSwitcher />
		<AuthButton />
	</div>
</header>
