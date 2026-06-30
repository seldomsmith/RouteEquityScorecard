"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' + '.55Khr0Cuwie_8YBv_QPfsA';

interface OdtExplainerMapProps {
  odtGeoJson: any;
  routeData: any; // e.g. Route 727 coords
}

export const OdtExplainerMap: React.FC<OdtExplainerMapProps> = ({ odtGeoJson, routeData }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !odtGeoJson) return;

    // Default center at Heritage Valley/Chappelle sector
    const defaultCenter: [number, number] = [-113.56, 53.42];
    
    // Initialize Mapbox instance
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: defaultCenter,
      zoom: 11.5,
      interactive: false, // Disables scroll wheel zooming conflicts in scrollytelling
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      if (!mapRef.current) return;

      // 1. Add ODT Zones source
      mapRef.current.addSource('odt-explainer-zones', {
        type: 'geojson',
        data: odtGeoJson,
      });

      // Fill layer
      mapRef.current.addLayer({
        id: 'odt-explainer-fill',
        type: 'fill',
        source: 'odt-explainer-zones',
        paint: {
          'fill-color': '#0D9488', // Teal
          'fill-opacity': 0.18,
        },
      });

      // Border layer
      mapRef.current.addLayer({
        id: 'odt-explainer-line',
        type: 'line',
        source: 'odt-explainer-zones',
        paint: {
          'line-color': '#0F766E',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });

      // 2. Add Route 727 geometry if available
      if (routeData && routeData.coords && routeData.coords.length > 1) {
        const coordinates = routeData.coords.map((c: any) => [c[1], c[0]]);
        
        mapRef.current.addSource('odt-explainer-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {
              short_name: routeData.short_name,
              name: routeData.name,
            },
            geometry: {
              type: 'LineString',
              coordinates,
            },
          },
        });

        // Fixed route line
        mapRef.current.addLayer({
          id: 'odt-explainer-route-line',
          type: 'line',
          source: 'odt-explainer-route',
          paint: {
            'line-color': '#2E4057', // Dark navy
            'line-width': 4.5,
            'line-opacity': 0.85,
          },
        });

        // Route casing for visual pop
        mapRef.current.addLayer({
          id: 'odt-explainer-route-casing',
          type: 'line',
          source: 'odt-explainer-route',
          paint: {
            'line-color': '#FFFFFF',
            'line-width': 1.5,
            'line-opacity': 0.9,
          },
        }, 'odt-explainer-route-line'); // Place casing beneath main line
      }
    });

    return () => {
      map.remove();
    };
  }, [odtGeoJson, routeData]);

  return (
    <div className="relative w-full h-64 border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-50">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-200 text-[9px] font-semibold text-slate-600 flex flex-col gap-1 shadow-sm select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 bg-teal-500 opacity-60 rounded-sm inline-block" />
          <span>Active ODT Zones (Chappelle/Allard)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 border-t-4 border-slate-700 inline-block" />
          <span>Route 727 (Fixed feeder connection)</span>
        </div>
      </div>
    </div>
  );
};
