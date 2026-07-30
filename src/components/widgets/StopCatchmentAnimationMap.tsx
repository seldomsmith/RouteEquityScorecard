"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' + '.55Khr0Cuwie_8YBv_QPfsA';

interface StopCatchmentAnimationMapProps {
  routeData?: any;
  daGeoJson?: any;
}

export const StopCatchmentAnimationMap: React.FC<StopCatchmentAnimationMapProps> = ({
  routeData,
  daGeoJson
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Route 002 sample coordinates (Downtown to Capilano)
    const coords = routeData?.coords || [
      [53.541, -113.495],
      [53.543, -113.480],
      [53.546, -113.460],
      [53.548, -113.435],
      [53.550, -113.410]
    ];

    // Convert to [lng, lat]
    const lineCoordinates = coords.map((c: any) => [c[1], c[0]]);
    const center = lineCoordinates[Math.floor(lineCoordinates.length / 2)] || [-113.46, 53.545];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: center as [number, number],
      zoom: 12.5,
      pitch: 35,
      interactive: true,
      attributionControl: false
    });

    mapRef.current = map;

    map.on('load', () => {
      if (!mapRef.current) return;

      // Add DA boundaries source if available
      if (daGeoJson) {
        map.addSource('da-boundaries', {
          type: 'geojson',
          data: daGeoJson
        });

        map.addLayer({
          id: 'da-fill',
          type: 'fill',
          source: 'da-boundaries',
          paint: {
            'fill-color': '#94a3b8',
            'fill-opacity': 0.08
          }
        });

        map.addLayer({
          id: 'da-stroke',
          type: 'line',
          source: 'da-boundaries',
          paint: {
            'line-color': '#cbd5e1',
            'line-width': 0.5
          }
        });
      }

      // Add Route Line Source
      map.addSource('route-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: lineCoordinates
          }
        }
      });

      // Route casing
      map.addLayer({
        id: 'route-line-casing',
        type: 'line',
        source: 'route-line',
        paint: {
          'line-color': '#1e3a8a',
          'line-width': 8,
          'line-opacity': 0.4
        }
      });

      // Main route line
      map.addLayer({
        id: 'route-line-core',
        type: 'line',
        source: 'route-line',
        paint: {
          'line-color': '#2563eb',
          'line-width': 4
        }
      });

      // Add Bus Stop Points with 400m Walk Circles
      const stopFeatures = lineCoordinates.map((coord: number[], i: number) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coord
        },
        properties: {
          id: i,
          name: `Stop ${i + 1}`
        }
      }));

      map.addSource('stop-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: stopFeatures
        }
      });

      // 400m Walk Circles (visualized as translucent buffer dots)
      map.addLayer({
        id: 'stop-catchment-circles',
        type: 'circle',
        source: 'stop-points',
        paint: {
          'circle-radius': 32, // Approximately 400m visual catchment
          'circle-color': '#3b82f6',
          'circle-opacity': 0.18,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#2563eb'
        }
      });

      // Bus Stop Dots
      map.addLayer({
        id: 'stop-point-dots',
        type: 'circle',
        source: 'stop-points',
        paint: {
          'circle-radius': 5,
          'circle-color': '#ffffff',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#1d4ed8'
        }
      });
    });

    return () => map.remove();
  }, [routeData, daGeoJson]);

  return (
    <div className="w-full my-6 rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 relative">
      <div ref={mapContainerRef} className="w-full h-[340px] md:h-[400px]" />
      
      {/* Visual Overlay Label */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-800">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
        <span>Route 002: 400m Bus Stop Walk Catchments</span>
      </div>
    </div>
  );
};
