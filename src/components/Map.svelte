<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { appState } from '../lib/state.svelte';
	import type { Hospital } from '../lib/types';
	import { Layers, MapPin, Circle, Merge, Zap, Users, MousePointer2 } from 'lucide-svelte';

	let mapElement: HTMLDivElement;
	let L: any;
	let map: any;
	let markersLayer: any;
	let circlesLayer: any;
	let unionLayer: any;
	let gapLayer: any;
	let densityLayer: any;

	let layerMenuOpen = $state(false);

	// React to region changes
	$effect(() => {
		if (map && appState.ui.selectedRegionId) {
			const region = appState.regions.find(r => r.id === appState.ui.selectedRegionId);
			if (region) {
				map.setView(region.center, region.zoom, { animate: true, duration: 1 });
			}
		}
	});

	onMount(async () => {
		if (browser) {
			L = await import('leaflet');
			
			// Fix default icon path issues
			delete (L.Icon.Default.prototype as any)._getIconUrl;
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
				iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
				shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
			});

			map = L.map(mapElement, {
				preferCanvas: true,
				zoomControl: false,
				attributionControl: false,
				fadeAnimation: true,
				zoomAnimation: true,
				markerZoomAnimation: true,
				inertia: true,
				inertiaDeceleration: 3000,
				easeLinearity: 0.1
			}).setView([-6.2, 106.8], 11);

			// Modern Theme Tiles with dynamic switching
			const lightTiles = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
			const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
			
			const baseLayer = L.tileLayer(appState.ui.theme === 'dark' ? darkTiles : lightTiles, {
				subdomains: 'abcd',
				maxZoom: 20
			}).addTo(map);

			// Listen for theme changes to update map tiles
			$effect.root(() => {
				$effect(() => {
					const url = appState.ui.theme === 'dark' ? darkTiles : lightTiles;
					baseLayer.setUrl(url);
					
					// Update density layer colors based on theme if needed
					if (densityLayer) {
						densityLayer.setStyle((feature: any) => {
							const val = feature.properties?.[appState.densityLayers[0]?.property] || 0;
							const colors = appState.ui.theme === 'dark' 
								? ['#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc']
								: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985'];
							const color = val > 2000 ? colors[0] : val > 1500 ? colors[1] : val > 1000 ? colors[2] : val > 500 ? colors[3] : val > 200 ? colors[4] : colors[5];
							return {
								fillColor: color,
								fillOpacity: 0.3,
								color: appState.ui.theme === 'dark' ? '#4f46e5' : '#0ea5e9',
								weight: 0.5
							};
						});
					}
				});
			});

			// Add attribution back in a custom position if needed or just keep it minimal
			L.control.attribution({ position: 'bottomleft' }).addTo(map);

			// Ensure map container size is correctly calculated after initial DOM layout
			setTimeout(() => {
				if (map) map.invalidateSize({ animate: true });
			}, 100);
			
			setTimeout(() => {
				if (map) map.invalidateSize({ animate: true });
			}, 1000);

			markersLayer = L.layerGroup().addTo(map);
			circlesLayer = L.canvasRenderer ? L.layerGroup().addTo(map) : L.layerGroup().addTo(map);
			
			unionLayer = L.geoJSON(null, {
				style: { 
					color: '#60a5fa', 
					weight: 1.5, 
					fillColor: '#3b82f6',
					fillOpacity: 0.15,
					dashArray: '5, 5'
				}
			}).addTo(map);

			gapLayer = L.geoJSON(null, {
				style: { 
					color: '#f87171', 
					weight: 1, 
					fillColor: '#ef4444', 
					fillOpacity: 0.2 
				}
			}).addTo(map);

			densityLayer = L.geoJSON(null, {
				style: (feature: any) => {
					const val = feature.properties?.[appState.densityLayers[0]?.property] || 0;
					// Use a better color ramp
					const colors = ['#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc'];
					const color = val > 2000 ? colors[0] : val > 1500 ? colors[1] : val > 1000 ? colors[2] : val > 500 ? colors[3] : val > 200 ? colors[4] : colors[5];
					return {
						fillColor: color,
						fillOpacity: 0.3,
						color: '#4f46e5',
						weight: 0.5
					};
				}
			}).addTo(map);

			map.on('click', (e: any) => {
				const { lat, lng } = e.latlng;
				appState.addHospital({
					name: `RS Baru ${appState.hospitals.length + 1}`,
					lat,
					lng,
					radiusKm: 5,
					notes: '',
					color: '#34d399'
				});
			});
		}
	});

	// Markers and Circles management
	const markersMap = new Map<string, any>();
	const circlesMap = new Map<string, any>();

	// React to hospital data changes
	$effect(() => {
		if (!map || !L) return;
		
		// Get current IDs
		const currentIds = new Set(appState.visibleHospitals.map(h => h.id));

		// Remove old markers and circles
		for (const [id, marker] of markersMap.entries()) {
			if (!currentIds.has(id)) {
				markersLayer.removeLayer(marker);
				markersMap.delete(id);
			}
		}
		for (const [id, circle] of circlesMap.entries()) {
			if (!currentIds.has(id)) {
				circlesLayer.removeLayer(circle);
				circlesMap.delete(id);
			}
		}

		if (appState.ui.showMarkers) {
			appState.visibleHospitals.forEach((h) => {
				let marker = markersMap.get(h.id);
				
				if (!marker) {
					// Create new custom marker (Pin style)
					const icon = L.divIcon({
						className: 'custom-hospital-marker',
						html: `
							<div class="marker-pin" style="background-color: ${h.color}">
								<div class="marker-dot"></div>
							</div>
						`,
						iconSize: [30, 42],
						iconAnchor: [15, 42]
					});

					marker = L.marker([h.lat, h.lng], { 
						icon,
						draggable: true 
					})
					.bindPopup(`<b>${h.name}</b><br>Radius: ${h.radiusKm} km`)
					.addTo(markersLayer);
					
					marker.on('dragend', (e: any) => {
						const { lat, lng } = e.target.getLatLng();
						appState.updateHospital(h.id, { lat, lng });
					});

					markersMap.set(h.id, marker);
				} else {
					marker.setLatLng([h.lat, h.lng]);
					marker.setPopupContent(`<b>${h.name}</b><br>Radius: ${h.radiusKm} km`);
					
					// Update color if pin-specific style needs it
					const el = marker.getElement();
					if (el) {
						const pin = el.querySelector('.marker-pin');
						if (pin) pin.style.backgroundColor = h.color;
					}
				}
			});
		} else {
			markersLayer.clearLayers();
			markersMap.clear();
		}

		if (appState.ui.showCircles) {
			appState.visibleHospitals.forEach((h) => {
				let circle = circlesMap.get(h.id);
				if (!circle) {
					circle = L.circle([h.lat, h.lng], {
						radius: h.radiusKm * 1000,
						color: h.color,
						fillColor: h.color,
						fillOpacity: 0.05,
						weight: 1.5,
						dashArray: '3, 4'
					}).addTo(circlesLayer);
					circlesMap.set(h.id, circle);
				} else {
					circle.setLatLng([h.lat, h.lng]);
					circle.setRadius(h.radiusKm * 1000);
					circle.setStyle({ color: h.color, fillColor: h.color });
				}
			});
		} else {
			circlesLayer.clearLayers();
			circlesMap.clear();
		}
	});

	// React to analysis results
	$effect(() => {
		if (!map || !L) return;

		unionLayer.clearLayers();
		if (appState.ui.showUnion && appState.analysisResults.union) {
			unionLayer.addData(appState.analysisResults.union);
		}

		gapLayer.clearLayers();
		if (appState.ui.showGaps && appState.analysisResults.gaps) {
			gapLayer.addData(appState.analysisResults.gaps);
		}

		densityLayer.clearLayers();
		if (appState.ui.showDensityLayer && appState.densityLayers.length > 0) {
			densityLayer.addData(appState.densityLayers[0].data);
		}
	});

	const mapControlsTranslateX = $derived.by(() => {
		if (!appState.ui.analysisOpen) return '0';
		if (innerWidth >= 640) return '-16rem';
		return '0'; // On mobile, we might want different behavior, but for now let's keep it simple
	});

	// React to UI changes that affect map container size
	$effect(() => {
		if (map && (appState.ui.sidebarOpen || appState.ui.analysisOpen)) {
			// Trigger multiple invalidations during the transition for a smoother look
			const intervals = [50, 150, 300, 450];
			intervals.forEach(ms => {
				setTimeout(() => map && map.invalidateSize({ animate: true }), ms);
			});
		}
	});

	let innerWidth = $state(1024);
	let resizeObserver: ResizeObserver;
	onMount(() => {
		innerWidth = window.innerWidth;
		const handleResize = () => innerWidth = window.innerWidth;
		window.addEventListener('resize', handleResize);
		
		if (mapElement) {
			resizeObserver = new ResizeObserver(() => {
				if (map) map.invalidateSize();
			});
			resizeObserver.observe(mapElement);
		}

		return () => {
			window.removeEventListener('resize', handleResize);
			if (resizeObserver) resizeObserver.disconnect();
		};
	});

	onDestroy(() => {
		if (map) map.remove();
	});
</script>

<style>
	:global(.custom-hospital-marker) {
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	
	:global(.marker-pin) {
		width: 30px;
		height: 30px;
		border-radius: 50% 50% 50% 0;
		background: #3b82f6;
		position: absolute;
		transform: rotate(-45deg);
		left: 50%;
		top: 50%;
		margin: -15px 0 0 -15px;
		border: 2px solid white;
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5);
		filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
	}

	:global(.marker-pin::after) {
		content: '';
		width: 14px;
		height: 14px;
		margin: 8px 0 0 8px;
		background: white;
		position: absolute;
		border-radius: 50%;
	}

	:global(.marker-dot) {
		content: '';
		width: 14px;
		height: 14px;
		margin: 8px 0 0 8px;
		background: white;
		position: absolute;
		border-radius: 50%;
	}

	:global(.custom-hospital-marker:hover) {
		transform: scale(1.2) translateY(-5px);
		z-index: 1000 !important;
	}

	@keyframes pulse-ring {
		0% { transform: scale(.8); opacity: .8; }
		80%, 100% { transform: scale(3.5); opacity: 0; }
	}
</style>

<div class="relative h-full w-full">
	<div bind:this={mapElement} class="h-full w-full"></div>
	
	<!-- Map Status Overlay (Top Center) -->
	<div class="absolute top-6 left-1/2 -translate-x-1/2 z-[500] px-4 pointer-events-none w-full flex justify-center">
		<div class="flex items-center gap-3 px-4 py-2 bg-white/70 dark:bg-black/70 backdrop-blur-2xl text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl border border-white/20 dark:border-slate-800/50 pointer-events-auto group">
			<div class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse"></div>
			<div class="flex items-center gap-2">
				<span class="opacity-50 font-bold">Console</span> 
				<span class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
				<span class="text-slate-900 dark:text-white">Surface Trigger</span>
			</div>
		</div>
	</div>
	
	<!-- Map Actions Overlay (Bottom Right) -->
	<div 
		class="absolute bottom-10 right-4 z-[500] flex flex-col items-end gap-3 transition-transform duration-300"
		style="transform: translateX({mapControlsTranslateX})"
	>
		<!-- Google Maps Style Layer Button -->
		<div class="relative">
			<button 
				onclick={() => layerMenuOpen = !layerMenuOpen}
				class="w-12 h-12 sm:w-14 sm:h-14 bg-white/80 dark:bg-black/80 backdrop-blur-xl shadow-2xl rounded-2xl flex items-center justify-center border border-white/40 dark:border-slate-800 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
				title="Infrastructure View"
			>
				<div class="absolute inset-x-0 bottom-0 h-1 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
				<Layers class="w-6 h-6 sm:w-7 sm:h-7 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
				{#if layerMenuOpen}
					<div class="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></div>
				{/if}
			</button>

			{#if layerMenuOpen}
				<div 
					transition:fly={{ y: 12, duration: 300, opacity: 0 }}
					class="absolute bottom-full right-0 mb-4 p-5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2rem] border border-white/50 dark:border-slate-800/50 w-72 sm:w-80"
				>
					<div class="flex items-center justify-between mb-5 px-1 track">
						<h3 class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Infrastructure Views</h3>
						<div class="w-6 h-0.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
					</div>
					
					<div class="grid grid-cols-2 gap-3.5">
						<button 
							onclick={() => appState.ui.showMarkers = !appState.ui.showMarkers}
							class="flex flex-col items-center gap-3 p-3 rounded-2xl transition-all {appState.ui.showMarkers ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'} border"
						>
							<div class="p-2 rounded-xl {appState.ui.showMarkers ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 shadow-sm'} ">
								<MapPin class="w-5 h-5" />
							</div>
							<span class="text-[10px] font-bold uppercase tracking-tight">Markers</span>
						</button>

						<button 
							onclick={() => appState.ui.showCircles = !appState.ui.showCircles}
							class="flex flex-col items-center gap-3 p-3 rounded-2xl transition-all {appState.ui.showCircles ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'} border"
						>
							<div class="p-2 rounded-xl {appState.ui.showCircles ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 shadow-sm'} ">
								<Circle class="w-5 h-5" />
							</div>
							<span class="text-[10px] font-bold uppercase tracking-tight">Vectors</span>
						</button>

						<button 
							onclick={() => appState.ui.showUnion = !appState.ui.showUnion}
							class="flex flex-col items-center gap-3 p-3 rounded-2xl transition-all {appState.ui.showUnion ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'} border"
						>
							<div class="p-2 rounded-xl {appState.ui.showUnion ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 shadow-sm'} ">
								<Merge class="w-5 h-5" />
							</div>
							<span class="text-[10px] font-bold uppercase tracking-tight">Coverage</span>
						</button>

						<button 
							onclick={() => appState.ui.showGaps = !appState.ui.showGaps}
							class="flex flex-col items-center gap-3 p-3 rounded-2xl transition-all {appState.ui.showGaps ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'} border"
						>
							<div class="p-2 rounded-xl {appState.ui.showGaps ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-700 shadow-sm'} ">
								<Zap class="w-5 h-5" />
							</div>
							<span class="text-[10px] font-bold uppercase tracking-tight">Gaps</span>
						</button>
					</div>

					<div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
						<button 
							onclick={() => appState.ui.showDensityLayer = !appState.ui.showDensityLayer}
							class="w-full flex items-center justify-between p-3 rounded-2xl transition-all {appState.ui.showDensityLayer ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'} border"
						>
							<div class="flex items-center gap-3">
								<div class="p-2 rounded-xl {appState.ui.showDensityLayer ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-700 shadow-sm'} ">
									<Users class="w-4 h-4" />
								</div>
								<span class="text-[10px] font-bold uppercase tracking-widest">Population Mesh</span>
							</div>
							<div class="w-8 h-4 bg-slate-200 rounded-full relative transition-colors {appState.ui.showDensityLayer ? 'bg-emerald-500' : ''}">
								<div class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform {appState.ui.showDensityLayer ? 'translate-x-4' : ''}"></div>
							</div>
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
