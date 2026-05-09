<script lang="ts">
	import Map from '../components/Map.svelte';
	import Sidebar from '../components/Sidebar.svelte';
	import AnalysisPanel from '../components/AnalysisPanel.svelte';
	import { appState } from '../lib/state.svelte';
	import { HelpCircle, Activity, Globe, Database } from 'lucide-svelte';
	
	let showHelp = $state(false);
</script>

<svelte:head>
	<title>RS Coverage Analyzer | Professional Geo-Spatial Analysis</title>
</svelte:head>

<main class="h-screen w-screen flex flex-col overflow-hidden bg-white font-sans text-slate-800 dark:bg-black dark:text-slate-200 transition-colors duration-300">
	<!-- Top Navigation Bar -->
	<header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-30 shadow-sm dark:bg-black dark:border-slate-800 shrink-0">
		<div class="flex items-center gap-3">
			<div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
				<Activity class="w-5 h-5 text-white" />
			</div>
			<div class="hidden xs:block">
				<h1 class="text-sm sm:text-lg font-bold tracking-tight text-slate-900 leading-none dark:text-white uppercase tracking-tight">RS Analyzer <span class="text-blue-600/30 mx-1">|</span> {appState.regions.find(r => r.id === appState.ui.selectedRegionId)?.name || 'Jakarta'}</h1>
				<p class="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 opacity-70">Geo-Spatial v2.4</p>
			</div>
		</div>

		<div class="flex items-center gap-2 sm:gap-6">
			<div class="hidden md:flex gap-8 border-r border-slate-200 dark:border-slate-800 pr-6 mr-2">
				<div class="text-center">
					<p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Coverage</p>
					<p class="text-sm font-bold text-emerald-600">
						{(appState.analysisResults.totalCoverage / (appState.analysisResults.totalCoverage + appState.analysisResults.totalGap) * 100 || 0).toFixed(1)}%
					</p>
				</div>
				<div class="text-center">
					<p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Est. Families</p>
					<p class="text-sm font-bold text-slate-700 dark:text-slate-200">
						{Math.round(appState.analysisResults.totalPopulation).toLocaleString()}
					</p>
				</div>
			</div>
			
			<div class="flex items-center gap-1.5 sm:gap-2">
				<button 
					onclick={() => appState.runAnalysis()}
					disabled={appState.analysisResults.isAnalyzing}
					class="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] sm:text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
				>
					{#if appState.analysisResults.isAnalyzing}
						<div class="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
					{/if}
					RECALC
				</button>
				<button 
					onclick={() => showHelp = !showHelp}
					class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
				>
					<HelpCircle class="w-5 h-5" />
				</button>
			</div>
		</div>
	</header>

	<!-- App Workspace -->
	<div class="flex flex-1 overflow-hidden relative">
		<!-- Sidebar Container -->
		<div 
			class="h-full absolute inset-y-0 left-0 z-40 transition-transform duration-300 transform {(appState.ui.sidebarOpen || appState.ui.railExpanded) ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}"
		>
			<Sidebar />
		</div>
		
		<main class="flex-1 relative bg-slate-200 overflow-hidden">
			<Map />
			
			{#if showHelp}
				<div class="absolute inset-0 z-[2000] bg-slate-900/60 p-4 sm:p-8 flex items-center justify-center">
					<div class="bg-white rounded-3xl p-6 sm:p-10 max-w-lg shadow-2xl dark:bg-slate-900 border border-slate-800">
						<h2 class="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Usage Guide</h2>
						<ul class="space-y-4 sm:space-y-6 text-slate-600 dark:text-slate-400 text-[13px] sm:text-sm">
							<li class="flex gap-4">
								<div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-md">1</div>
								<div>
									<p class="font-bold text-slate-900 dark:text-white mb-0.5 sm:mb-1">Point Acquisition</p>
									<p>Tap the map to deploy hospital assets in specific locations.</p>
								</div>
							</li>
							<li class="flex gap-4">
								<div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-md">2</div>
								<div>
									<p class="font-bold text-slate-900 dark:text-white mb-0.5 sm:mb-1">Demographics</p>
									<p>Import GeoJSON density meshes for precision auditing.</p>
								</div>
							</li>
							<li class="flex gap-4">
								<div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-md">3</div>
								<div>
									<p class="font-bold text-slate-900 dark:text-white mb-0.5 sm:mb-1">Analytics</p>
									<p>Toggle side panels to analyze coverage gaps and population stats.</p>
								</div>
							</li>
						</ul>
						<button 
							onclick={() => showHelp = false}
							class="w-full mt-8 sm:mt-10 py-3 sm:py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl dark:bg-white dark:text-slate-900"
						>
							Initialize Workspace
						</button>
					</div>
				</div>
			{/if}
		</main>

		<!-- Analysis Panel Container -->
		<div 
			class="h-full absolute inset-y-0 right-0 z-40 transition-transform duration-300 transform {appState.ui.analysisOpen ? 'translate-x-0' : 'translate-x-full'}"
		>
			<AnalysisPanel />
		</div>
	</div>

	<!-- Bottom Status Bar -->
	<footer class="h-8 bg-slate-50 text-slate-500 border-t border-slate-100 px-4 sm:px-5 flex items-center justify-between text-[9px] sm:text-[10px] font-bold uppercase tracking-widest z-30 shrink-0 dark:bg-black dark:text-slate-600 dark:border-slate-900">
		<div class="flex items-center gap-3 sm:gap-5">
			<span class="flex items-center gap-1.5">
				<div class="w-1.5 h-1.5 rounded-full {appState.analysisResults.isAnalyzing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}"></div>
				<span class="hidden xs:inline">Engine</span> {appState.analysisResults.isAnalyzing ? 'Active' : 'Ready'}
			</span>
			<span class="hidden sm:flex items-center gap-1.5"><Globe class="w-3 h-3" /> WGS 84</span>
		</div>
		<div class="flex items-center gap-3 sm:gap-5">
			<span class="flex items-center gap-1.5"><Database class="w-3 h-3" /> SYNC</span>
			<span class="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-black border border-slate-300 dark:border-slate-700 hidden xs:inline">Offline</span>
		</div>
	</footer>
</main>

<style>
	:global(body) {
		overflow: hidden;
	}
	
	@media (max-width: 400px) {
		.xs\:block { display: block; }
		.xs\:inline { display: inline; }
	}
</style>
