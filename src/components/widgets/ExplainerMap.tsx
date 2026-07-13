"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' + '.55Khr0Cuwie_8YBv_QPfsA';

interface ExplainerMapProps {
  routeId: string;
  routeCoords: number[][]; // [lat, lng] list
  servedDas: any[];
  daGeoJson: any;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
}

const GRADE_COLORS = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#F97316',
  E: '#EF4444',
};

// Interpolation colors for serving DA heatmaps matching the route's grade
const GRADE_HEATMAP_COLORS = {
  A: ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#34D399', '#059669', '#064E3B'],
  B: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#60A5FA', '#2563EB', '#1E3A8A'],
  C: ['#FFFDF5', '#FEF3C7', '#FDE68A', '#FBBF24', '#D97706', '#78350F'],
  D: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FB923C', '#EA580C', '#7C2D12'],
  E: ['#FEF2F2', '#FEE2E2', '#FCA5A5', '#F87171', '#DC2626', '#7F1D1D'],
};

export const ExplainerMap: React.FC<ExplainerMapProps> = ({
  routeId,
  routeCoords,
  servedDas,
  daGeoJson,
  grade,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !routeCoords.length || !daGeoJson) return;

    // Convert coords to Mapbox [lng, lat]
    const coordinates = routeCoords.map((c) => [c[1], c[0]]);

    // Calculate bounds to focus the camera
    const bounds = coordinates.reduce(
      (acc, coord) => {
        return [
          [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
          [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])],
        ];
      },
      [[coordinates[0][0], coordinates[0][1]], [coordinates[0][0], coordinates[0][1]]]
    );

    // Initialize Mapbox instance
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      bounds: bounds as mapboxgl.LngLatBoundsLike,
      fitBoundsOptions: { padding: 40 },
      interactive: false, // Static look, disables scrolling conflicts inside the explainer flow
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      if (!mapRef.current) return;

      // 1. Add DA heatmaps served by this route
      const servedDaIds = new Set(servedDas.map((d) => String(d.id)));
      const daMap = new Map(servedDas.map((d) => [String(d.id), d]));

      const filteredDaFeatures = daGeoJson.features
        .filter((f: any) => servedDaIds.has(String(f.properties?.DAUID)))
        .map((f: any) => {
          const daInfo = daMap.get(String(f.properties.DAUID));
          const lowIncome = Number(daInfo?.low_income_pct || 0);
          const minority = Number(daInfo?.minority_pct || 0);
          const senior = Number(daInfo?.senior_pct || 0);
          
          const vIndex = (daInfo?.vulnerability_index !== undefined && daInfo?.vulnerability_index !== null)
            ? Number(daInfo.vulnerability_index)
            : (lowIncome + minority + senior) / 3;

          return {
            ...f,
            properties: {
              ...f.properties,
              vulnerability_index: vIndex,
            },
          };
        });

      map.addSource(`served-das-${routeId}`, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: filteredDaFeatures,
        },
      });

      const heatmapColors = GRADE_HEATMAP_COLORS[grade] || GRADE_HEATMAP_COLORS.C;

      map.addLayer({
        id: `da-heatmap-layer-${routeId}`,
        type: 'fill',
        source: `served-das-${routeId}`,
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
          'fill-opacity': 0.45,
          'fill-outline-color': '#94A3B8',
        },
      });

      // 2. Add Route Geometry Line
      map.addSource(`route-line-${routeId}`, {
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

      map.addLayer({
        id: `route-line-layer-${routeId}`,
        type: 'line',
        source: `route-line-${routeId}`,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': GRADE_COLORS[grade] || '#64748B',
          'line-width': 5,
        },
      });
      
      // Ensure resize handles any layout adjustments
      setTimeout(() => {
        if (mapRef.current) map.resize();
      }, 150);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [routeId, routeCoords, servedDas, daGeoJson, grade]);

  return (
    <div className="w-full h-80 relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner mt-4 bg-slate-100">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      {/* Route Badge Overlay */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm pointer-events-none uppercase tracking-wider flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GRADE_COLORS[grade] }} />
        Route {routeId} Map Profile
      </div>
    </div>
  );
};
