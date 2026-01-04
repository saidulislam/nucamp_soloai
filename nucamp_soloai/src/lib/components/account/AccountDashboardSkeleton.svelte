<script lang="ts">
	import * as m from '$lib/paraglide/messages';
</script>

<div class="space-y-6 animate-pulse" data-testid="account-dashboard-skeleton">
	<!-- Page Header Skeleton -->
	<div class="mb-8">
		<!-- Breadcrumb Skeleton -->
		<div class="flex gap-2 mb-2">
			<div class="h-4 w-12 bg-base-300 rounded"></div>
			<div class="h-4 w-4 bg-base-300 rounded"></div>
			<div class="h-4 w-16 bg-base-300 rounded"></div>
		</div>

		<!-- Title Skeleton -->
		<div class="h-9 w-64 bg-base-300 rounded mb-2"></div>
		<div class="h-5 w-96 bg-base-300 rounded"></div>
	</div>

	<!-- Dashboard Grid Skeleton -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Profile Card Skeleton -->
		<div class="card bg-base-100 shadow-lg" data-testid="profile-card-skeleton">
			<div class="card-body">
				<div class="h-6 w-24 bg-base-300 rounded mb-4"></div>

				<div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
					<!-- Avatar Skeleton -->
					<div class="w-20 h-20 rounded-full bg-base-300"></div>

					<!-- User Info Skeleton -->
					<div class="flex-1 text-center sm:text-left space-y-3">
						<div class="h-7 w-40 bg-base-300 rounded mx-auto sm:mx-0"></div>
						<div class="h-5 w-56 bg-base-300 rounded mx-auto sm:mx-0"></div>
						<div class="h-4 w-48 bg-base-300 rounded mx-auto sm:mx-0"></div>
						<div class="h-8 w-28 bg-base-300 rounded mx-auto sm:mx-0 mt-4"></div>
					</div>
				</div>
			</div>
		</div>

		<!-- Account Status Skeleton -->
		<div class="card bg-base-100 shadow-lg" data-testid="account-status-skeleton">
			<div class="card-body">
				<div class="h-6 w-32 bg-base-300 rounded mb-4"></div>

				<div class="space-y-4">
					{#each Array(6) as _, i}
						<div class="flex items-center justify-between">
							<div class="h-5 w-28 bg-base-300 rounded"></div>
							<div class="h-5 w-20 bg-base-300 rounded"></div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Subscription Overview Skeleton -->
		<div class="lg:col-span-2">
			<div class="card bg-base-100 shadow-lg" data-testid="subscription-skeleton">
				<div class="card-body">
					<div class="h-6 w-28 bg-base-300 rounded mb-4"></div>

					<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div class="h-4 w-24 bg-base-300 rounded mb-2"></div>
							<div class="h-7 w-32 bg-base-300 rounded"></div>
						</div>
						<div class="h-10 w-32 bg-base-300 rounded"></div>
					</div>

					<div class="divider my-2"></div>

					<div class="space-y-2">
						<div class="h-4 w-36 bg-base-300 rounded"></div>
						{#each Array(3) as _}
							<div class="flex items-center gap-2">
								<div class="h-4 w-4 bg-base-300 rounded"></div>
								<div class="h-4 w-40 bg-base-300 rounded"></div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Quick Actions Skeleton -->
		<div class="lg:col-span-2">
			<div class="card bg-base-100 shadow-lg" data-testid="quick-actions-skeleton">
				<div class="card-body">
					<div class="h-6 w-28 bg-base-300 rounded mb-4"></div>

					<div class="h-4 w-32 bg-base-300 rounded mb-3"></div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each Array(4) as _}
							<div class="h-12 bg-base-300 rounded"></div>
						{/each}
					</div>

					<div class="divider my-4"></div>

					<div class="h-4 w-36 bg-base-300 rounded mb-3"></div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
						{#each Array(4) as _}
							<div class="h-8 bg-base-300 rounded"></div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Screen reader loading announcement -->
	<div class="sr-only" role="status" aria-live="polite">
		{m.account_loading()}
	</div>
</div>
