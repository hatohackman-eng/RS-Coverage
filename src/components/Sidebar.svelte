<script lang="ts">
	import { appState } from '../lib/state.svelte';
	import { Plus, Trash2, MapPin, Download, Upload, Search, Activity, Settings2, ChevronRight, Layers, Database, Info, X, Sun, Moon, Monitor } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let searchQuery = $state('');
	let innerWidth = $state(1024); // Default for SSR
	
	onMount(() => {
		innerWidth = window.innerWidth;
		const handleResize = () => innerWidth = window.innerWidth;
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});


	const filteredHospitals = $derived(
		appState.visibleHospitals.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function handleImport(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (ev) => {
				const result = ev.target?.result;
				if (typeof result === 'string') {
					appState.importData(result);
				}
			};
			reader.readAsText(file);
		}
	}

	function handleDensityImport(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (ev) => {
				const result = ev.target?.result;
				if (typeof result === 'string') {
					try {
						const data = JSON.parse(result);
						// Ask for property name if it's a new layer type
						const property = prompt('Enter GeoJSON property name for Density (e.g., density, pop):', 'density') || 'density';
						appState.addDensityLayer(file.name, data, property);
					} catch (e) {
						alert('Invalid GeoJSON');
					}
				}
			};
			reader.readAsText(file);
		}
	}
</script>

<aside 
	class="h-full flex bg-white border-r border-slate-200 z-50 dark:bg-black dark:border-slate-800 shadow-2xl lg:shadow-xl transition-all duration-300"
	style="width: {appState.ui.sidebarOpen ? (appState.ui.railExpanded ? (innerWidth >= 1024 ? '544px' : '524px') : (innerWidth >= 1024 ? '384px' : '364px')) : (appState.ui.railExpanded ? '224px' : '64px')}"
>
	<!-- Sidebar Rail (Main Navigation) -->
	<nav class="h-full flex flex-col bg-slate-50 border-r border-slate-100 dark:bg-black dark:border-slate-800 transition-all duration-300 shrink-0 {appState.ui.railExpanded ? 'w-56' : 'w-16'}">
		<!-- Navigation Items -->
		<div class="flex-1 flex flex-col items-center py-4 w-full overflow-y-auto no-scrollbar scroll-smooth">
			<button 
				onclick={() => {
					if (appState.ui.activeSidebarTab !== 'hospitals') {
						appState.ui.activeSidebarTab = 'hospitals';
						appState.ui.sidebarOpen = true;
					} else {
						appState.ui.sidebarOpen = !appState.ui.sidebarOpen;
					}
				}}
				class="group flex items-center justify-center p-0 transition-all w-full h-16 {appState.ui.activeSidebarTab === 'hospitals' ? 'bg-blue-600/10 text-blue-600 border-r-4 border-blue-600 dark:bg-blue-600/20' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'}"
				title="Hospitals Inventory"
			>
				<div class="flex items-center gap-4 px-4 w-full h-full justify-start">
					<div class="w-8 h-8 flex items-center justify-center shrink-0">
						<Activity class="w-7 h-7" />
					</div>
					{#if appState.ui.railExpanded}
						<span class="text-sm font-bold truncate">RS Inventory</span>
					{/if}
				</div>
			</button>

			<button 
				onclick={() => {
					if (appState.ui.activeSidebarTab !== 'layers') {
						appState.ui.activeSidebarTab = 'layers';
						appState.ui.sidebarOpen = true;
					} else {
						appState.ui.sidebarOpen = !appState.ui.sidebarOpen;
					}
				}}
				class="group flex items-center justify-center p-0 transition-all w-full h-16 {appState.ui.activeSidebarTab === 'layers' ? 'bg-blue-600/10 text-blue-600 border-r-4 border-blue-600 dark:bg-blue-600/20' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'}"
				title="Density Engines"
			>
				<div class="flex items-center gap-4 px-4 w-full h-full justify-start">
					<div class="w-8 h-8 flex items-center justify-center shrink-0">
						<Database class="w-7 h-7" />
					</div>
					{#if appState.ui.railExpanded}
						<span class="text-sm font-bold truncate">Density Mesh</span>
					{/if}
				</div>
			</button>
		</div>

		<!-- Main Rail Controls & Actions (Now at Bottom) -->
		<div class="mt-auto flex flex-col items-center border-t border-slate-100 dark:border-slate-800 w-full bg-slate-100/50 dark:bg-slate-950/20">
			<button 
				onclick={() => {
					if (appState.ui.activeSidebarTab !== 'settings') {
						appState.ui.activeSidebarTab = 'settings';
						appState.ui.sidebarOpen = true;
					} else {
						appState.ui.sidebarOpen = !appState.ui.sidebarOpen;
					}
				}}
				class="group flex items-center justify-center p-0 transition-all w-full h-16 {appState.ui.activeSidebarTab === 'settings' ? 'bg-blue-600/10 text-blue-600 border-r-4 border-blue-600 dark:bg-blue-600/20' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'}"
				title="System Configuration"
			>
				<div class="flex items-center gap-4 px-4 w-full h-full justify-start">
					<div class="w-8 h-8 flex items-center justify-center shrink-0">
						<Settings2 class="w-7 h-7" />
					</div>
					{#if appState.ui.railExpanded}
						<span class="text-sm font-bold truncate">Configuration</span>
					{/if}
				</div>
			</button>

			<button 
				onclick={() => {
					if (appState.ui.activeSidebarTab !== 'info') {
						appState.ui.activeSidebarTab = 'info';
						appState.ui.sidebarOpen = true;
					} else {
						appState.ui.sidebarOpen = !appState.ui.sidebarOpen;
					}
				}}
				class="group flex items-center justify-center p-0 transition-all w-full h-16 {appState.ui.activeSidebarTab === 'info' ? 'bg-blue-600/10 text-blue-600 border-r-4 border-blue-600 dark:bg-blue-600/20' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'}"
				title="Information"
			>
				<div class="flex items-center gap-4 px-4 w-full h-full justify-start">
					<div class="w-8 h-8 flex items-center justify-center shrink-0">
						<Info class="w-7 h-7" />
					</div>
					{#if appState.ui.railExpanded}
						<span class="text-sm font-bold truncate">Documentation</span>
					{/if}
				</div>
			</button>

			<button 
				onclick={() => appState.toggleTheme()}
				class="group flex items-center justify-center p-0 transition-all w-full h-16 text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
				title="Toggle Appearance"
			>
				<div class="flex items-center gap-4 px-4 w-full h-full justify-start">
					<div class="w-8 h-8 flex items-center justify-center shrink-0">
						{#if appState.ui.theme === 'dark'}
							<Sun class="w-7 h-7 text-amber-400" />
						{:else if appState.ui.theme === 'light'}
							<Moon class="w-7 h-7 text-blue-500" />
						{:else}
							<Monitor class="w-7 h-7 text-slate-400" />
						{/if}
					</div>
					{#if appState.ui.railExpanded}
						<span class="text-sm font-bold truncate uppercase tracking-widest text-[10px]">
							Ke: {appState.ui.theme === 'dark' ? 'Terang' : appState.ui.theme === 'light' ? 'Gelap' : 'Sistem'}
						</span>
					{/if}
				</div>
			</button>

			<!-- Expand/Compact Controls -->
			<div class="flex flex-col w-full border-t border-slate-100 dark:border-slate-800 pt-1 pb-2">
				<button 
					onclick={() => appState.ui.railExpanded = !appState.ui.railExpanded}
					class="group flex items-center justify-center p-0 transition-all w-full h-14 text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
					title={appState.ui.railExpanded ? 'Compact Sidebar' : 'Expand Sidebar'}
				>
					<div class="flex items-center gap-4 px-4 w-full h-full justify-start">
						<div class="w-8 h-8 flex items-center justify-center shrink-0">
							<ChevronRight class="w-6 h-6 transition-transform {appState.ui.railExpanded ? 'rotate-180' : ''}" />
						</div>
						{#if appState.ui.railExpanded}
							<span class="text-[10px] font-black uppercase tracking-[0.2em] truncate">Console View</span>
						{/if}
					</div>
				</button>
			</div>
		</div>
	</nav>

	<!-- Toggle Panel Handle (Floating outside) -->
	<button 
		onclick={() => appState.ui.sidebarOpen = !appState.ui.sidebarOpen}
		class="absolute -right-8 top-2 z-[100] w-8 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-xl flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-lg transition-all group overflow-hidden"
		title={appState.ui.sidebarOpen ? 'Collapse Panel' : 'Expand Panel'}
	>
		<div class="absolute left-0 w-1 h-8 bg-blue-600 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
		<ChevronRight class="w-4 h-4 transition-transform {appState.ui.sidebarOpen ? 'rotate-180' : ''}" />
	</button>

	<!-- Sidebar Content Area -->
	<div class="h-full flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 relative {appState.ui.sidebarOpen ? 'flex' : 'hidden'}">
		<!-- Submenu Header (Universal for all tabs) -->
		<div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/30 dark:bg-slate-900/10">
			<div>
				<h2 class="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
					{#if appState.ui.activeSidebarTab === 'hospitals'}RS Inventory{:else if appState.ui.activeSidebarTab === 'layers'}Density Engines{:else if appState.ui.activeSidebarTab === 'settings'}Configuration{:else}System Portal{/if}
				</h2>
				<p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
					Active Sub-Module
				</p>
			</div>
		</div>

		{#if appState.ui.activeSidebarTab === 'hospitals'}
			<!-- Region & Search Area -->
			<div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-black shrink-0 space-y-4">
				<!-- Region Selector -->
				<div>
					<p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Selected Region</p>
					<div class="grid grid-cols-3 gap-2">
						{#each appState.regions as region}
							<button 
								onclick={() => appState.selectRegion(region.id)}
								class="px-2 py-2 rounded-xl text-[10px] font-bold border transition-all {appState.ui.selectedRegionId === region.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700'}"
							>
								{region.name}
							</button>
						{/each}
					</div>
				</div>

				<div class="relative">
					<Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
					<input 
						type="text" 
						bind:value={searchQuery}
						placeholder="Filter by name..." 
						class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:bg-slate-800 dark:border-slate-700"
					/>
				</div>
			</div>

			<!-- RS List -->
			<div class="flex-1 overflow-y-auto custom-scrollbar no-scrollbar">
				<div class="p-4 space-y-3">
					{#if filteredHospitals.length === 0}
						<div class="py-12 px-6 text-center">
							<div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-slate-800">
								<Search class="w-6 h-6 text-slate-300" />
							</div>
							<p class="text-sm font-bold text-slate-400">No hospitals found</p>
							<p class="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-medium">Try a different search term or add points on the map</p>
						</div>
					{:else}
						{#each filteredHospitals as h (h.id)}
							<div 
								class="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/10 transition-all group dark:bg-black dark:border-slate-800 dark:hover:bg-blue-900/10 shadow-sm"
							>
								<div class="flex justify-between items-start mb-2">
									<div class="flex items-start gap-3 min-w-0">
										<div class="w-3 h-3 rounded-full mt-1 flex-shrink-0 shadow-sm" style="background-color: {h.color}"></div>
										<h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">{h.name}</h3>
									</div>
									<button 
										onclick={() => appState.deleteHospital(h.id)}
										class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
								
								<div class="grid grid-cols-2 gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">
									<span class="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg dark:bg-slate-800">
										<Activity class="w-3 h-3 text-blue-500" /> {h.radiusKm} KM
									</span>
									<span class="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg dark:bg-slate-800">
										<MapPin class="w-3 h-3 text-rose-500" /> {(Math.PI * h.radiusKm**2).toFixed(1)} KM²
									</span>
								</div>

								<div class="space-y-1.5">
									<div class="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tighter">
										<span>Coverage Radius</span>
										<span>{h.radiusKm}km</span>
									</div>
									<div class="flex gap-3 items-center">
										<input 
											type="range" min="1" max="50" step="0.5"
											value={h.radiusKm}
											oninput={(e) => appState.updateHospital(h.id, { radiusKm: Number(e.currentTarget.value) })}
											class="flex-1 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600 dark:bg-slate-800"
										/>
										<input 
											type="color" 
											value={h.color}
											oninput={(e) => appState.updateHospital(h.id, { color: e.currentTarget.value })}
											class="w-5 h-5 rounded-lg border-none bg-transparent cursor-pointer p-0 overflow-hidden shadow-sm"
										/>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{:else}
			<div class="flex-1 overflow-y-auto custom-scrollbar no-scrollbar scroll-smooth">
				<div class="p-6 space-y-6">
					{#if appState.ui.activeSidebarTab === 'layers'}
						<div class="space-y-4">
						{#each appState.densityLayers as layer (layer.id)}
							<div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl dark:bg-black dark:border-slate-800 relative group transition-all hover:bg-white hover:shadow-md">
								<div class="flex justify-between items-start mb-2">
									<div>
										<p class="text-sm font-bold text-slate-900 dark:text-white">{layer.name}</p>
										<p class="text-[10px] text-slate-500 font-medium mt-0.5">GeoJSON Source</p>
									</div>
									<button 
										onclick={() => appState.deleteDensityLayer(layer.id)} 
										class="text-slate-300 hover:text-rose-500 transition-colors"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
								<div class="flex items-center gap-2 mt-4 px-3 py-1.5 bg-white rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600 dark:bg-black dark:border-slate-800 dark:text-slate-400">
									<Database class="w-3 h-3" /> Attribute: <span class="text-blue-600">{layer.property}</span>
								</div>
							</div>
						{/each}

						<label class="flex flex-col items-center justify-center gap-3 w-full p-8 border-2 border-dashed border-slate-200 rounded-3xl text-sm text-slate-400 font-bold hover:bg-slate-50 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer dark:border-slate-800 dark:hover:bg-slate-800/50">
							<div class="p-4 bg-slate-100 rounded-2xl dark:bg-slate-800 group-hover:bg-blue-100 transition-colors">
								<Upload class="w-6 h-6 transition-transform group-hover:-translate-y-1" />
							</div>
							<span>Import Density Mesh</span>
							<p class="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none">GeoJSON Required</p>
							<input type="file" accept=".geojson,.json" onchange={handleDensityImport} class="hidden" />
						</label>
					</div>
				{:else}
					{#if appState.ui.activeSidebarTab === 'settings'}
							<div class="space-y-3">
								<button 
									onclick={() => appState.exportData()}
									class="flex items-center justify-between w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all font-bold group dark:bg-black dark:border-slate-800 dark:text-slate-400"
								>
									<div class="flex items-center gap-3">
										<div class="p-2 bg-slate-50 rounded-lg dark:bg-slate-800">
											<Download class="w-4 h-4" />
										</div>
										<span>Export GeoJSON Dataset</span>
									</div>
									<ChevronRight class="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
								</button>
								
								<label class="flex items-center justify-between w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all font-bold cursor-pointer group dark:bg-black dark:border-slate-800 dark:text-slate-400">
									<div class="flex items-center gap-3">
										<div class="p-2 bg-slate-50 rounded-lg dark:bg-slate-800">
											<Upload class="w-4 h-4" />
										</div>
										<span>Import External JSON</span>
									</div>
									<input type="file" onchange={handleImport} class="hidden" />
									<ChevronRight class="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
								</label>
							</div>
						{:else}
							<div class="space-y-6">
								<div class="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
									<h4 class="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
										<div class="w-1.5 h-1.5 bg-blue-600 rounded-full"></div> Analysis Logic
									</h4>
									<p class="text-xs text-slate-600 leading-relaxed dark:text-slate-400 font-medium">
										The analyzer uses geodesic calculations (WGS84) to determine coverage. Union operations are performed using Turf.js spatial join algorithms to ensure zero area redundancy in total calculations.
									</p>
								</div>
								
								<div class="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 dark:bg-slate-800/30 dark:border-slate-800">
									<h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
										<div class="w-1.5 h-1.5 bg-slate-400 rounded-full"></div> Data Privacy
									</h4>
									<p class="text-xs text-slate-600 leading-relaxed dark:text-slate-400 font-medium">
										All map data and analysis parameters are stored locally via IndexedDB. No coordinate data is transmitted to external servers for processing.
									</p>
								</div>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		{/if}
	</div>
</aside>


<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #e2e8f0;
		border-radius: 10px;
	}
	.dark .custom-scrollbar::-webkit-scrollbar-thumb {
		background: #1e293b;
	}
</style>
