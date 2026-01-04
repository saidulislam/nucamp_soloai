<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { initCrossTabSync, cleanupCrossTabSync } from '$lib/auth/session';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		// Initialize cross-tab session synchronization
		initCrossTabSync();

		// Cleanup on component unmount
		return () => {
			cleanupCrossTabSync();
		};
	});
</script>

{@render children()}
