<script lang="ts">
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';
	import { useSession, signOutWithSync } from '$lib/auth/session';

	// Get reactive session store from Better Auth
	const session = useSession();

	// Local state
	let isDropdownOpen = $state(false);
	let isLoggingOut = $state(false);
	let logoutError = $state<string | null>(null);

	// Derive authentication state from session
	const isAuthenticated = $derived(!!$session.data?.user);
	const user = $derived($session.data?.user);
	const isLoading = $derived($session.isPending);

	function toggleUserMenu() {
		isDropdownOpen = !isDropdownOpen;
		logoutError = null; // Clear any previous error
	}

	function closeDropdown() {
		isDropdownOpen = false;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.auth-button-container')) {
			closeDropdown();
		}
	}

	async function handleLogout() {
		if (isLoggingOut) return; // Prevent double-clicking

		isLoggingOut = true;
		logoutError = null;
		closeDropdown();

		try {
			// Call Better Auth signOut with cross-tab sync
			await signOutWithSync();

			// Clear any local storage data
			if (typeof window !== 'undefined') {
				localStorage.removeItem('auth_session_event');
			}

			// Redirect to login with success indicator
			await goto('/login?logout=success');
		} catch (error) {
			console.error('Logout error:', error);
			logoutError = error instanceof Error ? error.message : m.logout_error_generic();

			// Attempt force logout on error
			try {
				if (typeof window !== 'undefined') {
					window.location.href = '/login?logout=forced';
				}
			} catch {
				// Last resort: show error
				isLoggingOut = false;
			}
		}
	}

	$effect(() => {
		if (isDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="auth-button-container">
	{#if isLoading}
		<!-- Loading state during session initialization -->
		<div class="flex items-center gap-2">
			<span class="loading loading-spinner loading-sm"></span>
		</div>
	{:else if isAuthenticated && user}
		<!-- Authenticated user menu -->
		<div class="dropdown dropdown-end">
			<button
				type="button"
				tabindex="0"
				onclick={toggleUserMenu}
				aria-label={m.user_menu()}
				aria-expanded={isDropdownOpen}
				aria-haspopup="true"
				class="btn btn-ghost flex items-center gap-2"
				disabled={isLoggingOut}
				data-testid="user-menu-button"
			>
				<div class="avatar placeholder">
					<div class="bg-primary text-primary-content w-8 rounded-full">
						{#if user.image}
							<img src={user.image} alt={user.name || 'User'} class="w-full h-full object-cover" />
						{:else}
							<span class="text-sm">{user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}</span>
						{/if}
					</div>
				</div>
				<span class="hidden md:inline">{user.name || user.email}</span>
			</button>

			{#if isDropdownOpen}
				<ul
					tabindex="0"
					role="menu"
					aria-label="User menu"
					class="menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
					data-testid="user-menu-dropdown"
				>
					<li>
						<a href="/account" role="menuitem" data-testid="account-link">{m.nav_account()}</a>
					</li>
					<li>
						<button
							type="button"
							role="menuitem"
							onclick={handleLogout}
							disabled={isLoggingOut}
							class="text-error hover:bg-error/10"
							data-testid="logout-button"
						>
							{#if isLoggingOut}
								<span class="loading loading-spinner loading-xs"></span>
								{m.logout_logging_out()}
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
										clip-rule="evenodd"
									/>
								</svg>
								{m.nav_logout()}
							{/if}
						</button>
					</li>
				</ul>
			{/if}
		</div>
	{:else}
		<!-- Unauthenticated user - show login/signup buttons -->
		<div class="flex items-center gap-2">
			<a href="/login" class="btn btn-ghost btn-sm" data-testid="login-button">{m.nav_login()}</a>
			<a href="/signup" class="btn btn-primary btn-sm" data-testid="signup-button">{m.nav_signup()}</a>
		</div>
	{/if}
</div>
