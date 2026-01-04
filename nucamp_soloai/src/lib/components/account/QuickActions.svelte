<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { LogoutButton } from './index';
</script>

<div class="card bg-base-100 shadow-lg" data-testid="quick-actions-card">
	<div class="card-body">
		<h2 class="card-title text-lg">{m.account_quick_actions_title()}</h2>

		<!-- Primary Actions -->
		<div class="mb-4">
			<p class="text-sm text-base-content/60 mb-3">{m.account_quick_actions_primary()}</p>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<!-- Edit Profile -->
				<button
					type="button"
					class="btn btn-outline justify-start gap-2"
					disabled
					data-testid="edit-profile-button"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
						/>
					</svg>
					{m.account_quick_actions_edit_profile()}
				</button>

				<!-- Manage Billing -->
				<a
					href="/pricing"
					class="btn btn-outline justify-start gap-2"
					data-testid="manage-billing-link"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
							clip-rule="evenodd"
						/>
					</svg>
					{m.account_quick_actions_manage_billing()}
				</a>

				<!-- Change Password -->
				<button
					type="button"
					class="btn btn-outline justify-start gap-2"
					disabled
					data-testid="change-password-button"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
							clip-rule="evenodd"
						/>
					</svg>
					{m.account_quick_actions_change_password()}
				</button>

				<!-- Security Settings -->
				<button
					type="button"
					class="btn btn-outline justify-start gap-2"
					disabled
					data-testid="security-settings-button"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					{m.account_quick_actions_security()}
				</button>
			</div>
		</div>

		<div class="divider my-2"></div>

		<!-- Secondary Actions -->
		<div class="mb-4">
			<p class="text-sm text-base-content/60 mb-3">{m.account_quick_actions_secondary()}</p>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<!-- Download Data -->
				<button
					type="button"
					class="btn btn-ghost btn-sm justify-start gap-2"
					disabled
					data-testid="download-data-button"
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
							d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
					{m.account_quick_actions_download_data()}
				</button>

				<!-- Preferences -->
				<button
					type="button"
					class="btn btn-ghost btn-sm justify-start gap-2"
					disabled
					data-testid="preferences-button"
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
							d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
							clip-rule="evenodd"
						/>
					</svg>
					{m.account_quick_actions_preferences()}
				</button>

				<!-- Help & Support -->
				<a
					href="/contact"
					class="btn btn-ghost btn-sm justify-start gap-2"
					data-testid="help-support-link"
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
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
							clip-rule="evenodd"
						/>
					</svg>
					{m.account_quick_actions_help()}
				</a>

				<!-- Delete Account -->
				<button
					type="button"
					class="btn btn-ghost btn-sm justify-start gap-2 text-error hover:bg-error/10"
					disabled
					data-testid="delete-account-button"
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
							d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
					{m.account_quick_actions_delete_account()}
				</button>
			</div>
		</div>

		<div class="divider my-2"></div>

		<!-- Logout Button -->
		<div class="flex justify-end">
			<LogoutButton variant="outline" showConfirmation={true} />
		</div>
	</div>
</div>
