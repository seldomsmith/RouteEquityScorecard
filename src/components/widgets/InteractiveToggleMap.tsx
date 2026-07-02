"use client";

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' + '.55Khr0Cuwie_8YBv_QPfsA';

interface InteractiveToggleMapProps {
  route2Data: any;
  route3Data: any;
  daGeoJson: any;
  allRoutesData?: any[];
  mode: 'vulnerability' | 'opportunity' | 'monopoly';
}

const ROUTE_CENTERS = {
  '002': { center: [-113.435, 53.535] as [number, number], zoom: 11.2 }, // Balanced center coordinates for Route 002
  '003': { center: [-113.525, 53.548] as [number, number], zoom: 12.0 },
};

const GRADE_COLORS = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#eab308', // Transit yellow
  D: '#F97316',
  E: '#EF4444',
};

const GRADE_HEATMAP_COLORS = {
  A: ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#34D399', '#059669', '#064E3B'],
  B: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#60A5FA', '#2563EB', '#1E3A8A'],
  C: ['#FEFDF0', '#FEF9C3', '#FEF08A', '#FDE047', '#CA8A04', '#713F12'], // Yellow heatmap gradient
  D: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FB923C', '#EA580C', '#7C2D12'],
  E: ['#FEF2F2', '#FEE2E2', '#FCA5A5', '#F87171', '#DC2626', '#7F1D1D'],
};

export const InteractiveToggleMap: React.FC<InteractiveToggleMapProps> = ({
  route2Data,
  route3Data,
  daGeoJson,
  allRoutesData,
  mode,
}) => {
  const [activeRouteId, setActiveRouteId] = useState<'002' | '003'>('002');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const activeRouteData = activeRouteId === '002' ? route2Data : route3Data;
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current || !route2Data || !route3Data || !daGeoJson) return;

    const coordinates = route2Data.coords.map((c: any) => [c[1], c[0]]);
    const initialBounds = coordinates.reduce(
      (acc: any, coord: any) => [
        [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
        [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])],
      ],
      [[coordinates[0][0], coordinates[0][1]], [coordinates[0][0], coordinates[0][1]]]
    );

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      bounds: initialBounds as mapboxgl.LngLatBoundsLike,
      fitBoundsOptions: { padding: 40 },
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
      // Calculate bounds dynamically matching ExplainerMap's auto-bounding logic to ensure perfectly centered alignment
      const coordinates = activeRouteData.coords.map((c: any) => [c[1], c[0]]);
      const bounds = coordinates.reduce(
        (acc: any, coord: any) => {
          return [
            [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
            [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])],
          ];
        },
        [[coordinates[0][0], coordinates[0][1]], [coordinates[0][0], coordinates[0][1]]]
      );

      mapRef.current.fitBounds(bounds as mapboxgl.LngLatBoundsLike, {
        padding: 40,
        linear: true,
        duration: 800
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
        'line-color': activeRouteId === '003' ? '#eab308' : GRADE_COLORS[grade],
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

      // Use a consistent blue/indigo sequential color scale for vulnerability map representation
      // that matches the legend gradient from light slate-blue to deep indigo
      const vulnerabilityColors = ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#60A5FA', '#2563EB', '#1E3A8A'];
      map.addLayer({
        id: 'da-heatmap-layer',
        type: 'fill',
        source: 'served-das-source',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'vulnerability_index'],
            0, vulnerabilityColors[0],
            20, vulnerabilityColors[1],
            40, vulnerabilityColors[2],
            60, vulnerabilityColors[3],
            80, vulnerabilityColors[4],
            100, vulnerabilityColors[5],
          ],
          'fill-opacity': 0.55,
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
      let altLines: any[] = [];
      
      if (allRoutesData && allRoutesData.length > 0) {
        altLines = allRoutesData
          .filter(r => r.route_id !== activeRouteId && r.coords && r.coords.length > 0)
          .map(r => ({
            type: 'Feature',
            properties: { name: r.short_name || r.name || r.route_id },
            geometry: {
              type: 'LineString',
              coordinates: r.coords.map((c: number[]) => [c[1], c[0]])
            }
          }));
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
          'line-width': 3,
          'line-opacity': 0.8,
        },
      }, 'active-route-casing');

      map.addLayer({
        id: 'monopoly-alternative-lines',
        type: 'line',
        source: 'monopoly-alternatives-source',
        paint: {
          'line-color': '#94A3B8', // Silver/Grey
          'line-width': 1.5,
          'line-opacity': 0.4,
        },
      }, 'active-route-casing');

      // Add labels for the routes
      map.addLayer({
        id: 'monopoly-alternative-labels',
        type: 'symbol',
        source: 'monopoly-alternatives-source',
        layout: {
          'symbol-placement': 'line',
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 10,
          'text-offset': [0, 1],
          'text-max-angle': 30,
          'symbol-spacing': 250,
        },
        paint: {
          'text-color': '#64748b',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        }
      }, 'active-route-casing');
      
      // We also highlight the Dissemination Areas (DAs) based on Monopoly
      const servedDaIds = new Set(activeRouteData.da_metadata.map((d: any) => String(d.id)));
      const daMap = new Map(activeRouteData.da_metadata.map((d: any) => [String(d.id), d]));
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
                ? 'bg-yellow-500 border-yellow-500 text-white shadow-sm shadow-yellow-500/20'
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
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200/80 text-[9px] font-semibold text-slate-650 flex flex-col gap-1.5 shadow-sm max-w-[200px] z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1.5 rounded-sm inline-block" style={{ backgroundColor: activeRouteId === '002' ? '#3B82F6' : '#F59E0B' }} />
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
