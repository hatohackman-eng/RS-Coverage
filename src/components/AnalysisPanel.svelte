<script lang="ts">
	import { appState } from '../lib/state.svelte';
	import { AlertTriangle, ChevronLeft } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let density = $state(appState.populationDensity);
	let innerWidth = $state(1024);

	onMount(() => {
		innerWidth = window.innerWidth;
		const handleResize = () => innerWidth = window.innerWidth;
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	const analysisTranslateX = $derived.by(() => {
		if (!appState.ui.analysisOpen) return '0';
		if (innerWidth >= 640) return '-16rem';
		return '-85vw';
	});

	$effect(() => {
		appState.populationDensity = density;
	});
</script>

<aside 
	class="relative flex flex-col bg-white border-l border-slate-200 z-20 dark:bg-black dark:border-slate-800 shadow-xl lg:shadow-sm transition-all duration-300 {appState.ui.analysisOpen ? 'w-[85vw] sm:w-64' : 'w-0'}"
>
	<!-- Panel Header -->
	<div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/30 dark:bg-black min-w-[16rem] {appState.ui.analysisOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-200">
		<div>
			<h2 class="text-xl font-black text-slate-900 tracking-tight dark:text-white leading-none mb-1.5 uppercase">Insights</h2>
			<p class="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-80">Spatial Results</p>
		</div>
	</div>

	<!-- Toggle Panel Handle (Floating outside) -->
	<button 
		onclick={() => appState.ui.analysisOpen = !appState.ui.analysisOpen}
		class="absolute -left-8 top-2 z-[100] w-8 h-12 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-l-xl flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-lg transition-all group overflow-hidden"
		title={appState.ui.analysisOpen ? 'Collapse Panel' : 'Expand Panel'}
	>
		<div class="absolute right-0 w-1 h-8 bg-blue-600 rounded-l opacity-0 group-hover:opacity-100 transition-opacity"></div>
		<ChevronLeft class="w-4 h-4 transition-transform {appState.ui.analysisOpen ? 'rotate-180' : ''}" />
	</button>

	<div class="p-5 flex-1 overflow-y-auto min-w-[16rem] bg-slate-50/20 dark:bg-black/20 {appState.ui.analysisOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-200">
		
		<!-- Coverage Card -->
		<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 dark:bg-black dark:border-slate-800 text-slate-900 dark:text-slate-100">
			<p class="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Covered Area</p>
			<div class="flex items-baseline gap-1.5">
				<span class="text-2xl font-bold text-slate-900 dark:text-slate-100">{appState.analysisResults.totalCoverage.toFixed(1)}</span>
				<span class="text-xs font-medium text-slate-500">km²</span>
			</div>
			<div class="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden dark:bg-slate-800">
				<div 
					class="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
					style="width: {(appState.analysisResults.totalCoverage / (appState.analysisResults.totalCoverage + appState.analysisResults.totalGap) * 100 || 0)}%"
				></div>
			</div>
		</div>

		<!-- Population Card -->
		<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 dark:bg-black dark:border-slate-800">
			<p class="text-[10px] text-slate-400 font-bold uppercase mb-1">Estimated Families</p>
			<div class="flex items-baseline gap-2">
				<span class="text-2xl font-bold text-emerald-600">~{Math.round(appState.analysisResults.totalPopulation).toLocaleString()}</span>
			</div>
			<p class="text-[10px] text-slate-400 mt-1 font-medium">Families {appState.densityLayers.length > 0 && appState.ui.showDensityLayer ? '(Layer-Adjusted)' : `(Avg. ${appState.populationDensity}/km²)`}</p>
		</div>

		<!-- Gap Analysis Section -->
		<div class="space-y-4">
			<h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
				<AlertTriangle class="w-3 h-3 text-rose-500" /> Gap Analysis
			</h3>
			
			{#if appState.analysisResults.totalGap > 0}
				<div class="p-3 bg-rose-50 border border-rose-100 rounded-xl dark:bg-rose-900/10 dark:border-rose-900/20">
					<div class="flex items-center gap-2 mb-1.5">
						<div class="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
						<p class="text-[11px] font-bold text-rose-800 dark:text-rose-400">Identified Coverage Gap</p>
					</div>
					<p class="text-[10px] text-rose-700 leading-relaxed dark:text-rose-300/80">
						Area of {appState.analysisResults.totalGap.toFixed(1)} km² is currently unserved by existing facilities.
					</p>
				</div>
			{:else}
				<div class="p-3 bg-slate-100 border border-slate-200 rounded-xl text-[10px] text-slate-500 italic text-center dark:bg-slate-800/50 dark:border-slate-800">
					No significant gaps detected in this area.
				</div>
			{/if}

			<div class="p-3 bg-white border border-slate-200 rounded-xl dark:bg-black dark:border-slate-800 text-slate-900 dark:text-slate-200">
				<div class="flex items-center gap-2 mb-1.5">
					<div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
					<p class="text-[11px] font-bold text-slate-800 dark:text-slate-200">Network Overlap</p>
				</div>
				<p class="text-[10px] text-slate-500 leading-relaxed">
					Calculated with Euclidean distance geometry.
				</p>
			</div>
		</div>
	</div>

	<!-- Density Control Footer -->
	<div class="p-5 bg-slate-50/50 border-t border-slate-100 dark:bg-black dark:border-slate-800 min-w-[16rem]">
		<div class="flex justify-between items-center mb-3">
			<span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Density Preset</span>
			<span class="text-[10px] font-bold text-blue-600 uppercase">Interactive</span>
		</div>
		<div class="flex items-center gap-3">
			<div class="flex-1">
				<input 
					type="range" min="10" max="1000" step="10"
					bind:value={density}
					class="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600 dark:bg-slate-800"
				/>
			</div>
			<span class="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-300">{density}</span>
		</div>
	</div>
</aside>
