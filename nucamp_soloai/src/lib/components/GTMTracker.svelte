<script lang="ts">
	/**
	 * @deprecated This component has been replaced by the tracking module.
	 *
	 * Please use instead:
	 * - GoogleTagManager.svelte from '$lib/components/tracking/GoogleTagManager.svelte'
	 * - Tracking utilities from '$lib/utils/tracking'
	 *
	 * See TC01-Google-Tag-Manager-Setup.md for the new implementation.
	 *
	 * This file is kept for backwards compatibility but should be removed
	 * once all references are updated.
	 */

	// Re-export the new component for backwards compatibility
	import GoogleTagManager from '$lib/components/tracking/GoogleTagManager.svelte';
	import { env } from '$env/dynamic/public';

	const containerId = env.PUBLIC_GTM_ID || '';
	const enabled = env.PUBLIC_GTM_ENABLED !== 'false';
</script>

<!--
	@deprecated - This wrapper provides backwards compatibility.
	Use GoogleTagManager from '$lib/components/tracking/GoogleTagManager.svelte' directly.
-->
<GoogleTagManager {containerId} {enabled} />
