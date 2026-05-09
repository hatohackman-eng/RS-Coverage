import { browser } from '$app/environment';
import localforage from 'localforage';
import type { Hospital } from './types';
import * as turf from '@turf/turf';

// Initialize localforage
if (browser) {
	localforage.config({
		name: 'RS-Coverage-Analyzer',
		storeName: 'hospitals'
	});
}

class AppState {
	hospitals = $state<Hospital[]>([]);
	
	visibleHospitals = $derived(
		this.hospitals.filter(h => !h.regionId || h.regionId === this.ui.selectedRegionId)
	);

	ui = $state({
		sidebarOpen: true,
		railExpanded: false,
		analysisOpen: true,
		showDensityLayer: false,
		activeSidebarTab: 'hospitals' as 'hospitals' | 'layers' | 'settings' | 'info',
		theme: 'dark' as 'light' | 'dark' | 'system',
		showMarkers: true,
		showCircles: true,
		showUnion: true,
		showGaps: false,
		selectedRegionId: 'jakarta'
	});

	regions = [
		{ id: 'jakarta', name: 'Jakarta', center: [-6.2088, 106.8456] as [number, number], zoom: 11 },
		{ id: 'lampung', name: 'Lampung', center: [-5.4292, 105.2611] as [number, number], zoom: 12 },
		{ id: 'surabaya', name: 'Surabaya', center: [-7.2575, 112.7521] as [number, number], zoom: 12 },
	];

	selectRegion(id: string) {
		const region = this.regions.find(r => r.id === id);
		if (region) {
			this.ui.selectedRegionId = id;
			// Seed if no hospitals for this region
			const hasHospitals = this.hospitals.some(h => h.regionId === id);
			if (!hasHospitals) {
				this.seedHospitals(id);
			}
			this.runAnalysis();
			this.saveData();
		}
	}

	seedHospitals(regionId: string) {
		if (regionId === 'jakarta') {
			this.addHospital({ name: 'RS Pusat Nasional', lat: -6.19, lng: 106.82, radiusKm: 8, color: '#3b82f6', notes: 'Main Hub', regionId });
			this.addHospital({ name: 'RS Jakarta Selatan', lat: -6.25, lng: 106.81, radiusKm: 6, color: '#10b981', notes: 'Branch', regionId });
		} else if (regionId === 'lampung') {
			this.addHospital({ name: 'RS Umum Lampung', lat: -5.41, lng: 105.25, radiusKm: 10, color: '#f59e0b', notes: 'Regional Center', regionId });
			this.addHospital({ name: 'RS Metro Lampung', lat: -5.11, lng: 105.30, radiusKm: 7, color: '#3b82f6', notes: 'North Node', regionId });
		}
	}

	toggleTheme() {
		if (this.ui.theme === 'light') this.ui.theme = 'dark';
		else if (this.ui.theme === 'dark') this.ui.theme = 'system';
		else this.ui.theme = 'light';
		this.applyTheme();
		this.saveData();
	}

	applyTheme() {
		if (typeof document !== 'undefined') {
			let actualTheme = this.ui.theme;
			if (actualTheme === 'system') {
				actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
			}

			if (actualTheme === 'dark') {
				document.documentElement.classList.add('dark');
				document.documentElement.style.backgroundColor = '#000000';
				document.documentElement.style.colorScheme = 'dark';
			} else {
				document.documentElement.classList.remove('dark');
				document.documentElement.style.backgroundColor = '#ffffff';
				document.documentElement.style.colorScheme = 'light';
			}
		}
	}

	densityLayers = $state<{
		id: string;
		name: string;
		data: any; // GeoJSON
		property: string; // The property name for density (e.g., 'pop_density')
	}[]>([]);

	populationDensity = $state(250); // families per km2 (Global fallback)

	analysisResults = $state({
		union: null as any,
		gaps: null as any,
		overlaps: [] as any[],
		totalCoverage: 0,
		totalGap: 0,
		totalPopulation: 0,
		isAnalyzing: false
	});

	constructor() {
		if (browser) {
			this.loadData();
			this.applyTheme();
		}
	}

	async loadData() {
		const saved = await localforage.getItem<Hospital[]>('hospitals');
		const savedLayers = await localforage.getItem<any[]>('densityLayers');
		const savedTheme = await localforage.getItem<'light' | 'dark' | 'system'>('theme');
		const savedRegion = await localforage.getItem<string>('selectedRegionId');

		if (savedTheme) {
			this.ui.theme = savedTheme;
		}
		this.applyTheme(); // Call early to avoid flash

		if (saved) {
			this.hospitals = saved;
		} else {
			this.seedHospitals(this.ui.selectedRegionId);
		}

		if (savedLayers) {
			this.densityLayers = savedLayers;
		}

		if (savedRegion) {
			this.ui.selectedRegionId = savedRegion;
		}

		this.runAnalysis();
	}

	async saveData() {
		if (browser) {
			await localforage.setItem('hospitals', $state.snapshot(this.hospitals));
			await localforage.setItem('densityLayers', $state.snapshot(this.densityLayers));
			await localforage.setItem('theme', this.ui.theme);
			await localforage.setItem('selectedRegionId', this.ui.selectedRegionId);
		}
	}

	addDensityLayer(name: string, data: any, property: string) {
		const id = crypto.randomUUID();
		this.densityLayers.push({ id, name, data, property });
		this.saveData();
		this.runAnalysis();
	}

	deleteDensityLayer(id: string) {
		this.densityLayers = this.densityLayers.filter(l => l.id !== id);
		this.saveData();
		this.runAnalysis();
	}

	addHospital(h: Omit<Hospital, 'id'>) {
		const id = crypto.randomUUID();
		const regionId = h.regionId || this.ui.selectedRegionId;
		this.hospitals.push({ ...h, id, regionId });
		this.saveData();
		this.runAnalysis();
	}

	updateHospital(id: string, updates: Partial<Hospital>) {
		const index = this.hospitals.findIndex((h) => h.id === id);
		if (index !== -1) {
			this.hospitals[index] = { ...this.hospitals[index], ...updates };
			this.saveData();
			this.runAnalysis();
		}
	}

	deleteHospital(id: string) {
		this.hospitals = this.hospitals.filter((h) => h.id !== id);
		this.saveData();
		this.runAnalysis();
	}

	private analysisDebounceTimer: any;
	
	runAnalysis() {
		if (this.analysisDebounceTimer) clearTimeout(this.analysisDebounceTimer);
		this.analysisResults.isAnalyzing = true;
		this.analysisDebounceTimer = setTimeout(() => this.executeAnalysis(), 500);
	}

	private async executeAnalysis() {
		if (this.visibleHospitals.length === 0) {
			this.analysisResults = {
				union: null,
				gaps: null,
				overlaps: [],
				totalCoverage: 0,
				totalGap: 0,
				totalPopulation: 0,
				isAnalyzing: false
			};
			return;
		}

		try {
			const circles = $state.snapshot(this.visibleHospitals).map((h) => {
				return turf.circle([h.lng, h.lat], h.radiusKm, {
					steps: 40, // Reduced steps for performance
					units: 'kilometers',
					properties: { id: h.id, name: h.name }
				});
			});

			if (circles.length === 0) return;

			// 1. Calculate Union efficiently
			let union: any = circles[0];
			if (circles.length > 1) {
				const collection = turf.featureCollection(circles);
				union = turf.union(collection) || union;
			}
			
			this.analysisResults.union = union;
			this.analysisResults.totalCoverage = turf.area(union) / 1000000;

			// 2. Population Calculation (Optimized)
			let estimatedPop = 0;
			const activeLayer = $state.snapshot(this.densityLayers[0]);

			if (activeLayer && this.ui.showDensityLayer) {
				const unionBbox = turf.bbox(union);
				const unionBboxPoly = turf.bboxPolygon(unionBbox);

				turf.featureEach(activeLayer.data, (zone) => {
					// Quick BBOX check before heavy intersection
					const zoneBbox = turf.bbox(zone);
					const zoneBboxPoly = turf.bboxPolygon(zoneBbox);
					
					if (turf.booleanIntersects(unionBboxPoly, zoneBboxPoly)) {
						const intersect = turf.intersect(turf.featureCollection([union, zone as any]));
						if (intersect) {
							const areaKm2 = turf.area(intersect) / 1000000;
							const density = (zone.properties as any)?.[activeLayer.property] || this.populationDensity;
							estimatedPop += areaKm2 * density;
						}
					}
				});
			} else {
				estimatedPop = this.analysisResults.totalCoverage * this.populationDensity;
			}
			
			this.analysisResults.totalPopulation = estimatedPop;

			// 3. Calculate Gap Area
			const bbox = turf.bbox(union); // Use union bbox instead of circles
			const polyBbox = turf.bboxPolygon(bbox);
			const paddedBbox = turf.buffer(polyBbox, 10, { units: 'kilometers' });
			
			if (paddedBbox) {
				const gaps = turf.difference(turf.featureCollection([paddedBbox, union]));
				this.analysisResults.gaps = gaps;
				this.analysisResults.totalGap = gaps ? (turf.area(gaps) / 1000000) : 0;
			}

		} catch (e) {
			console.error('Analysis error:', e);
		} finally {
			this.analysisResults.isAnalyzing = false;
		}
	}

	exportData() {
		const data = JSON.stringify($state.snapshot(this.hospitals), null, 2);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'rs-coverage-data.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	importData(json: string) {
		try {
			const data = JSON.parse(json);
			if (Array.isArray(data)) {
				this.hospitals = data;
				this.saveData();
				this.runAnalysis();
			}
		} catch (e) {
			alert('Invalid JSON data');
		}
	}
}

export const appState = new AppState();
