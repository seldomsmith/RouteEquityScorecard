"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' + '.55Khr0Cuwie_8YBv_QPfsA';

export const CatchmentBarrierMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Detour coordinates points
    const detourCoords = [
      [-113.489, 53.543], // Start Stop A
      [-113.489, 53.546], 
      [-113.478, 53.546], 
      [-113.478, 53.543], 
      [-113.479, 53.541], // Destination B
    ];

    const bounds = detourCoords.reduce(
      (acc: any, coord: any) => [
        [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
        [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])],
      ],
      [[detourCoords[0][0], detourCoords[0][1]], [detourCoords[0][0], detourCoords[0][1]]]
    );

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      bounds: bounds as mapboxgl.LngLatBoundsLike,
      fitBoundsOptions: { padding: 40 },
      interactive: false,
      attributionControl: false,
    });

    map.on('load', () => {
      // 1. Direct theoretical straight-line corridor path (Green)
      map.addSource('theoretical-direct-path', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [-113.489, 53.543], // Stop A (Grierson Hill edge)
              [-113.479, 53.541], // Destination B (River Bank valley landing - 400m direct straight-line)
            ],
          },
          properties: {},
        },
      });

      map.addLayer({
        id: 'theoretical-line-casing',
        type: 'line',
        source: 'theoretical-direct-path',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 6,
        },
      });

      map.addLayer({
        id: 'theoretical-line',
        type: 'line',
        source: 'theoretical-direct-path',
        paint: {
          'line-color': '#10B981', // Emerald green
          'line-width': 3,
          'line-dasharray': [2, 2],
        },
      });

      // 2. Real-world detour route around Grierson Hill physical barrier (Red)
      map.addSource('real-detour-path', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [-113.489, 53.543], // Start Stop A
              [-113.489, 53.546], // Detour North along 95th Street
              [-113.478, 53.546], // Cross bridge walkway
              [-113.478, 53.543], // Detour South back down
              [-113.479, 53.541], // Destination B (1.2km walk detour)
            ],
          },
          properties: {},
        },
      });

      map.addLayer({
        id: 'real-detour-casing',
        type: 'line',
        source: 'real-detour-path',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 6,
        },
      });

      map.addLayer({
        id: 'real-detour-line',
        type: 'line',
        source: 'real-detour-path',
        paint: {
          'line-color': '#EF4444', // Red detour line
          'line-width': 3,
        },
      });

      // 3. Mark Stop A (Start) and Destination B
      const startMarker = document.createElement('div');
      startMarker.className = 'w-5 h-5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[8px] font-black text-white shadow-md';
      startMarker.innerHTML = 'A';

      new mapboxgl.Marker(startMarker)
        .setLngLat([-113.489, 53.543])
        .addTo(map);

      const destMarker = document.createElement('div');
      destMarker.className = 'w-5 h-5 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center text-[8px] font-black text-white shadow-md';
      destMarker.innerHTML = 'B';

      new mapboxgl.Marker(destMarker)
        .setLngLat([-113.479, 53.541])
        .addTo(map);
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4 md:-mx-12 lg:-mx-24 md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)] mt-2">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <span className="text-xs font-black text-blue-900 uppercase tracking-widest block">North Saskatchewan River Valley Pedestrian Barrier</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
            Comparing ideal spatial distance vs. actual walking detour paths in Edmonton
          </span>
        </div>
      </div>

      <div className="relative w-full h-[280px] rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200/80 text-[9px] font-bold text-slate-650 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#10B981] inline-block" />
            <span>Theoretical Direct Walk (400m Buffer)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#EF4444] inline-block" />
            <span>Actual Detour Walking Route (1.2km Walk)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
