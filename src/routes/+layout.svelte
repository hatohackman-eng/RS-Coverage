<script lang="ts">
	import '../index.css';
	let { children } = $props();
</script>

<div class="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 dark:bg-black dark:text-slate-100 transition-colors duration-300">
	{@render children()}
</div>

<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
		padding: 0;
	}

	/* Leaflet styles fix */
	:global(.leaflet-container) {
		height: 100%;
		width: 100%;
		z-index: 1;
	}
</style>
