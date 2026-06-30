"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' + '.55Khr0Cuwie_8YBv_QPfsA';

export const CatchmentBarrierMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Detour coordinates points (high-fidelity street-snapped walking path)
    const detourCoords = [
      [-113.489041, 53.542998],
      [-113.489082, 53.543349],
      [-113.488272, 53.543418],
      [-113.48644, 53.543819],
      [-113.486196, 53.543236],
      [-113.485779, 53.543296],
      [-113.485768, 53.543262],
      [-113.485676, 53.543252],
      [-113.482293, 53.543851],
      [-113.482094, 53.54347],
      [-113.481836, 53.543602],
      [-113.48153, 53.542909],
      [-113.481026, 53.542973],
      [-113.480714, 53.54308],
      [-113.48017, 53.543111],
      [-113.480107, 53.542936],
      [-113.48029, 53.542906],
      [-113.479438, 53.540869],
      [-113.478974, 53.540956]
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
              [-113.489041, 53.542998], // Stop A
              [-113.478974, 53.540956], // Destination B
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
            coordinates: detourCoords,
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
        .setLngLat([-113.489041, 53.542998])
        .addTo(map);

      const destMarker = document.createElement('div');
      destMarker.className = 'w-5 h-5 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center text-[8px] font-black text-white shadow-md';
      destMarker.innerHTML = 'B';

      new mapboxgl.Marker(destMarker)
        .setLngLat([-113.478974, 53.540956])
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
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200/80 text-[9px] font-bold text-slate-650 flex flex-col gap-1.5 shadow-sm z-10">
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
