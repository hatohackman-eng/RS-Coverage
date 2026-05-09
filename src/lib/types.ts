export interface Hospital {
	id: string;
	name: string;
	lat: number;
	lng: number;
	radiusKm: number;
	notes: string;
	color: string;
	regionId?: string;
}

export interface AnalysisStats {
	totalHospitals: number;
	totalCoverageArea: number; // km2
	totalGapArea: number; // km2
	coveragePercentage: number;
}
