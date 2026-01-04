<script lang="ts">
	interface Props {
		class?: string;
		size?: 'sm' | 'md' | 'lg';
	}

	let { class: className = '', size = 'sm' }: Props = $props();

	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6'
	};
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	class="text-success {sizeClasses[size]} {className}"
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
