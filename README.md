# RS Coverage Analyzer

A simple, powerful web application for analyzing hospital coverage radius, detecting overlaps, and finding gap areas.

## Features
- **Interactive Map**: Built with Leaflet.js and OpenStreetMap.
- **Geospatial Analysis**: Real-time calculations using Turf.js.
- **Runes Powered**: Built with Svelte 5 for reactive, high-performance UI.
- **Offline First**: Uses localforage (IndexedDB) and PWA support.
- **Import/Export**: Support for GeoJSON/JSON data.

## Getting Started
1. Run `npm install`
2. Run `npm run dev`
3. Open `http://localhost:3000`

## Analysis Logic
- **Union**: Calculates the combined reach of all selected hospitals.
- **Gaps**: Identifies areas within a 5km buffer of your hospital network that are currently unserved.
- **Population Estimate**: Uses a configurable density factor to estimate how many families are within the coverage area.
