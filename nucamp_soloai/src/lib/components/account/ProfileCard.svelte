<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import ProfileUpdateForm from './ProfileUpdateForm.svelte';
	import PasswordChangeForm from './PasswordChangeForm.svelte';

	interface Props {
		user: {
			id: string;
			email: string;
			name: string;
			image: string | null;
			emailVerified: boolean;
			createdAt: Date;
		};
		onProfileUpdated?: () => void;
	}

	let { user, onProfileUpdated }: Props = $props();

	// Edit mode state
	let isEditing = $state(false);
	let activeTab = $state<'profile' | 'password'>('profile');

	// Get initials for avatar placeholder
	const initials = $derived(
		user.name
			? user.name
					.split(' ')
					.map((n) => n.charAt(0).toUpperCase())
					.slice(0, 2)
					.join('')
			: user.email.charAt(0).toUpperCase()
	);

	// Format member since date
	function formatMemberSince(date: Date): string {
		return new Date(date).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Get display name or fallback to email username
	const displayName = $derived(user.name || user.email.split('@')[0]);

	// Toggle edit mode
	function toggleEditMode() {
		isEditing = !isEditing;
		if (!isEditing) {
			activeTab = 'profile';
		}
	}

	// Handle profile update success
	function handleProfileSuccess() {
		// Trigger session refresh to get updated data
		onProfileUpdated?.();
	}

	// Handle password change success
	function handlePasswordSuccess() {
		// Stay in edit mode but show success
		activeTab = 'profile';
	}

	// Handle cancel
	function handleCancel() {
		isEditing = false;
		activeTab = 'profile';
	}
</script>

<div class="card bg-base-100 shadow-lg" data-testid="profile-card">
	<div class="card-body">
		<div class="flex items-center justify-between">
			<h2 class="card-title text-lg">{m.account_profile_title()}</h2>
			{#if isEditing}
				<button
					type="button"
					class="btn btn-ghost btn-sm gap-1"
					onclick={toggleEditMode}
					data-testid="close-edit-button"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
					{m.account_update_close()}
				</button>
			{/if}
		</div>

		{#if isEditing}
			<!-- Edit Mode -->
			<div class="mt-4" data-testid="profile-edit-mode">
				<!-- Tab Navigation -->
				<div class="tabs tabs-boxed mb-6" role="tablist">
					<button
						type="button"
						class="tab {activeTab === 'profile' ? 'tab-active' : ''}"
						onclick={() => (activeTab = 'profile')}
						role="tab"
						aria-selected={activeTab === 'profile'}
						aria-controls="profile-panel"
						data-testid="profile-tab"
					>
						{m.account_update_tab_profile()}
					</button>
					<button
						type="button"
						class="tab {activeTab === 'password' ? 'tab-active' : ''}"
						onclick={() => (activeTab = 'password')}
						role="tab"
						aria-selected={activeTab === 'password'}
						aria-controls="password-panel"
						data-testid="password-tab"
					>
						{m.account_update_tab_password()}
					</button>
				</div>

				<!-- Tab Panels -->
				{#if activeTab === 'profile'}
					<div id="profile-panel" role="tabpanel" aria-labelledby="profile-tab">
						<ProfileUpdateForm
							{user}
							onSuccess={handleProfileSuccess}
							onCancel={handleCancel}
						/>
					</div>
				{:else}
					<div id="password-panel" role="tabpanel" aria-labelledby="password-tab">
						<PasswordChangeForm onSuccess={handlePasswordSuccess} onCancel={handleCancel} />
					</div>
				{/if}
			</div>
		{:else}
			<!-- View Mode -->
			<div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
				<!-- Avatar with verification indicator -->
				<div class="relative" data-testid="profile-avatar">
					<div class="avatar placeholder">
						<div
							class="bg-primary text-primary-content w-20 h-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
						>
							{#if user.image}
								<img
									src={user.image}
									alt={user.name || m.account_profile_avatar_alt()}
									class="w-full h-full object-cover rounded-full"
								/>
							{:else}
								<span class="text-2xl font-semibold">{initials}</span>
							{/if}
						</div>
					</div>
					<!-- Verification badge on avatar -->
					{#if user.emailVerified}
						<div
							class="absolute -bottom-1 -right-1 bg-success text-success-content rounded-full p-1"
							title={m.account_profile_verified_tooltip()}
							data-testid="avatar-verified-badge"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
					{/if}
				</div>

				<!-- User Info -->
				<div class="flex-1 text-center sm:text-left space-y-2">
					<!-- Display Name -->
					<div>
						<p class="text-xl font-semibold" data-testid="profile-name">
							{displayName}
						</p>
						{#if !user.name}
							<p class="text-xs text-base-content/50">{m.account_profile_name_not_set()}</p>
						{/if}
					</div>

					<!-- Email with verification status -->
					<div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
						<p class="text-base-content/70" data-testid="profile-email">{user.email}</p>
						{#if user.emailVerified}
							<span class="badge badge-success badge-sm gap-1" data-testid="email-verified-badge">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3 w-3"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								{m.account_profile_email_verified()}
							</span>
						{:else}
							<span class="badge badge-warning badge-sm gap-1" data-testid="email-unverified-badge">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3 w-3"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								{m.account_profile_email_unverified()}
							</span>
						{/if}
					</div>

					<!-- Member Since -->
					<p class="text-sm text-base-content/60" data-testid="profile-member-since">
						{m.account_profile_member_since({ date: formatMemberSince(user.createdAt) })}
					</p>

					<!-- Edit Profile Button -->
					<div class="mt-4 pt-2">
						<button
							type="button"
							class="btn btn-outline btn-sm gap-2"
							onclick={toggleEditMode}
							data-testid="edit-profile-button"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
								/>
							</svg>
							{m.account_profile_edit()}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
