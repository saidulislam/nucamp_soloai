<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import CheckIcon from '$lib/components/ui/CheckIcon.svelte';
</script>

<div class="card bg-base-100 shadow-lg" data-testid="subscription-overview-card">
	<div class="card-body">
		<h2 class="card-title text-lg">{m.account_subscription_title()}</h2>

		<!-- Current Plan Info -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p class="text-base-content/70 text-sm">{m.account_subscription_current_plan()}</p>
				<p class="text-xl font-semibold" data-testid="current-plan-name">
					{m.account_subscription_free_plan()}
				</p>
			</div>

			<a href="/pricing" class="btn btn-primary" data-testid="upgrade-plan-link">
				{m.account_subscription_upgrade()}
			</a>
		</div>

		<div class="divider my-2"></div>

		<!-- Plan Features -->
		<div class="space-y-2">
			<p class="font-medium text-sm">{m.account_subscription_includes()}</p>
			<ul class="space-y-1 text-sm text-base-content/70">
				<li class="flex items-center gap-2">
					<CheckIcon />
					{m.account_subscription_feature_basic()}
				</li>
				<li class="flex items-center gap-2">
					<CheckIcon />
					{m.account_subscription_feature_limited()}
				</li>
				<li class="flex items-center gap-2">
					<CheckIcon />
					{m.account_subscription_feature_community()}
				</li>
			</ul>
		</div>

		<!-- Future: Billing integration placeholder -->
		<div
			class="mt-4 rounded-lg bg-base-200 p-4 text-center text-sm text-base-content/60"
			data-testid="billing-placeholder"
		>
			<p>{m.account_subscription_billing_coming_soon()}</p>
		</div>
	</div>
</div>
