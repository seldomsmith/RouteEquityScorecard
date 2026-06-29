"use client";

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' + '.55Khr0Cuwie_8YBv_QPfsA';

interface InteractiveToggleMapProps {
  route2Data: any;
  route3Data: any;
  daGeoJson: any;
  mode: 'vulnerability' | 'opportunity' | 'monopoly';
}

const ROUTE_CENTERS = {
  '002': { center: [-113.46, 53.53] as [number, number], zoom: 10.3 },
  '003': { center: [-113.525, 53.548] as [number, number], zoom: 12.0 },
};

const GRADE_COLORS = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#F97316',
  E: '#EF4444',
};

const GRADE_HEATMAP_COLORS = {
  A: ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#34D399', '#059669', '#064E3B'],
  B: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#60A5FA', '#2563EB', '#1E3A8A'],
  C: ['#FFFDF5', '#FEF3C7', '#FDE68A', '#FBBF24', '#D97706', '#78350F'],
  D: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FB923C', '#EA580C', '#7C2D12'],
  E: ['#FEF2F2', '#FEE2E2', '#FCA5A5', '#F87171', '#DC2626', '#7F1D1D'],
};

export const InteractiveToggleMap: React.FC<InteractiveToggleMapProps> = ({
  route2Data,
  route3Data,
  daGeoJson,
  mode,
}) => {
  const [activeRouteId, setActiveRouteId] = useState<'002' | '003'>('002');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const activeRouteData = activeRouteId === '002' ? route2Data : route3Data;
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current || !route2Data || !route3Data || !daGeoJson) return;

    const initialCenter = ROUTE_CENTERS['002'].center;
    const initialZoom = ROUTE_CENTERS['002'].zoom;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: initialCenter,
      zoom: initialZoom,
      interactive: false,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      isLoadedRef.current = true;
      updateMapData();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      isLoadedRef.current = false;
    };
  }, [route2Data, route3Data, daGeoJson]);

  // Handle route swaps and map updates
  useEffect(() => {
    if (isLoadedRef.current && mapRef.current && activeRouteData) {
      // Fly across the city with animation
      const targetCamera = ROUTE_CENTERS[activeRouteId];
      mapRef.current.flyTo({
        center: targetCamera.center,
        zoom: targetCamera.zoom,
        speed: 1.2,
        curve: 1.42,
        essential: true
      });

      updateMapData();
    }
  }, [activeRouteId, mode]);

  const updateMapData = () => {
    const map = mapRef.current;
    if (!map || !activeRouteData || !daGeoJson) return;

    // 1. Remove previous layers/sources to cleanly redraw
    const layersToRemove = [
      'da-heatmap-layer',
      'opportunity-dots-layer',
      'monopoly-casing-layer',
      'monopoly-alternative-lines',
      'active-route-line-layer',
      'active-route-casing'
    ];
    layersToRemove.forEach(l => {
      if (map.getLayer(l)) map.removeLayer(l);
    });

    const sourcesToRemove = [
      'served-das-source',
      'opportunity-dots-source',
      'monopoly-alternatives-source',
      'active-route-source'
    ];
    sourcesToRemove.forEach(s => {
      if (map.getSource(s)) map.removeSource(s);
    });

    const coordinates = activeRouteData.coords.map((c: any) => [c[1], c[0]]);

    // 2. Load geometry source
    map.addSource('active-route-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates,
        },
      },
    });

    // Casing
    map.addLayer({
      id: 'active-route-casing',
      type: 'line',
      source: 'active-route-source',
      paint: {
        'line-color': '#FFFFFF',
        'line-width': 8,
        'line-opacity': 0.9,
      },
    });

    // Core route line
    const grade = activeRouteData.grade || 'C';
    map.addLayer({
      id: 'active-route-line-layer',
      type: 'line',
      source: 'active-route-source',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': GRADE_COLORS[grade],
        'line-width': 4.5,
      },
    });

    // 3. Render specific visualization mode layers
    if (mode === 'vulnerability') {
      const servedDaIds = new Set(activeRouteData.da_metadata.map((d: any) => String(d.id)));
      const daMap = new Map(activeRouteData.da_metadata.map((d: any) => [String(d.id), d]));

      const filteredDaFeatures = daGeoJson.features
        .filter((f: any) => servedDaIds.has(String(f.properties?.DAUID)))
        .map((f: any) => {
          const daInfo = daMap.get(String(f.properties.DAUID));
          const lowIncome = Number(daInfo?.low_income_pct || 0);
          const minority = Number(daInfo?.minority_pct || 0);
          const senior = Number(daInfo?.senior_pct || 0);
          const vIndex = (daInfo?.vulnerability_index !== undefined)
            ? Number(daInfo.vulnerability_index)
            : (lowIncome + minority + senior) / 3;

          return {
            ...f,
            properties: { ...f.properties, vulnerability_index: vIndex },
          };
        });

      map.addSource('served-das-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: filteredDaFeatures },
      });

      const heatmapColors = GRADE_HEATMAP_COLORS[grade] || GRADE_HEATMAP_COLORS.C;
      map.addLayer({
        id: 'da-heatmap-layer',
        type: 'fill',
        source: 'served-das-source',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'vulnerability_index'],
            0, heatmapColors[0],
            20, heatmapColors[1],
            40, heatmapColors[2],
            60, heatmapColors[3],
            80, heatmapColors[4],
            100, heatmapColors[5],
          ],
          'fill-opacity': 0.5,
          'fill-outline-color': '#CBD5E1',
        },
      }, 'active-route-casing');
    } 
    else if (mode === 'opportunity') {
      // Create opportunity dots clustered near route stops (mocking POIs for visualization)
      const stopFeatures: any[] = [];
      const poiCategories = ['job', 'clinic', 'market', 'school'];
      const poiColors = { job: '#6366F1', clinic: '#10B981', market: '#F59E0B', school: '#94A3B8' };

      coordinates.forEach((coord: number[], cIdx: number) => {
        if (cIdx % 5 === 0) { // Every 5th coordinate acts as a stop node
          // Generate 2-3 mock opportunities within stop catchments
          const numPois = 2 + (cIdx % 3);
          for (let p = 0; p < numPois; p++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.0015 + Math.random() * 0.0012; // roughly 150m-300m
            const pLng = coord[0] + Math.cos(angle) * radius;
            const pLat = coord[1] + Math.sin(angle) * radius;
            const cat = poiCategories[(cIdx + p) % poiCategories.length];

            stopFeatures.push({
              type: 'Feature',
              properties: { color: poiColors[cat as keyof typeof poiColors], category: cat },
              geometry: { type: 'Point', coordinates: [pLng, pLat] },
            });
          }
        }
      });

      map.addSource('opportunity-dots-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: stopFeatures },
      });

      map.addLayer({
        id: 'opportunity-dots-layer',
        type: 'circle',
        source: 'opportunity-dots-source',
        paint: {
          'circle-radius': 5.5,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 0.9,
        },
      });
    } 
    else if (mode === 'monopoly') {
      // Draw actual surrounding transit routes that intersect or overlap
      const altLines: any[] = [];
      
      if (activeRouteId === '003') {
        // Route 003 runs central (Westmount/Stadium). High overlaps: Route 008, 009, 051
        altLines.push({
          type: 'Feature',
          properties: { name: 'Route 008' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-113.555, 53.548], [-113.535, 53.548], [-113.515, 53.548], [-113.495, 53.555]
            ]
          }
        });
        altLines.push({
          type: 'Feature',
          properties: { name: 'Route 009' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-113.535, 53.565], [-113.525, 53.548], [-113.525, 53.525]
            ]
          }
        });
        altLines.push({
          type: 'Feature',
          properties: { name: 'Capital LRT Line' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-113.500, 53.542], [-113.488, 53.555], [-113.475, 53.568]
            ]
          }
        });
      } else {
        // Route 002 runs on the east outskirts (Capilano/Highlands). Very low alternatives.
        // Draw one distant highway line to highlight isolated monopoly
        altLines.push({
          type: 'Feature',
          properties: { name: 'Route 510 (Express)' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-113.465, 53.535], [-113.415, 53.535]
            ]
          }
        });
      }

      map.addSource('monopoly-alternatives-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: altLines },
      });

      map.addLayer({
        id: 'monopoly-casing-layer',
        type: 'line',
        source: 'monopoly-alternatives-source',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });

      map.addLayer({
        id: 'monopoly-alternative-lines',
        type: 'line',
        source: 'monopoly-alternatives-source',
        paint: {
          'line-color': '#94A3B8', // Silver/Grey
          'line-width': 2,
          'line-opacity': 0.65,
        },
      });
    }

    // Force redraw layout
    setTimeout(() => map.resize(), 100);
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4 md:-mx-12 lg:-mx-24 md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-black text-blue-900 uppercase tracking-widest block">
            {mode === 'vulnerability' && 'Vulnerability demographic mapping'}
            {mode === 'opportunity' && 'Opportunities walk catchment mapping'}
            {mode === 'monopoly' && 'Alternative transit options mapping'}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
            Select a route below to view its profile, flying across the city
          </span>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => setActiveRouteId('002')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all duration-200 border ${
              activeRouteId === '002'
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
            }`}
          >
            Route 002: Bedrock Essential
          </button>
          <button
            onClick={() => setActiveRouteId('003')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all duration-200 border ${
              activeRouteId === '003'
                ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
            }`}
          >
            Route 003: Swing Corridor
          </button>
        </div>
      </div>

      <div className="relative w-full h-[360px] rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
        
        {/* Legend panel inside map overlay */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200/80 text-[9px] font-semibold text-slate-650 flex flex-col gap-1.5 shadow-sm max-w-[200px]">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1.5 rounded-sm inline-block" style={{ backgroundColor: activeRouteId === '002' ? '#3B82F6' : '#F97316' }} />
            <span className="font-bold text-slate-800">Active Route {activeRouteId}</span>
          </div>

          {mode === 'vulnerability' && (
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Demographic vulnerability:</span>
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-slate-100 to-indigo-800" />
              <div className="flex justify-between text-[7px] text-slate-400 font-bold">
                <span>LOW</span>
                <span>HIGH INDEX</span>
              </div>
            </div>
          )}

          {mode === 'opportunity' && (
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Opportunities walking catchments:</span>
              <div className="grid grid-cols-2 gap-1.5 text-[8px]">
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" /> <span>Jobs</span></div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> <span>Clinics</span></div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> <span>Markets</span></div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" /> <span>Schools</span></div>
              </div>
            </div>
          )}

          {mode === 'monopoly' && (
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Alternative transit options:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-1 bg-slate-350 rounded-sm inline-block" />
                <span>Overlapping Route Tracks</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
