"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { RoutePoint } from '@/components/charts/EquityQuadrant';
import { useRouteStore } from '@/store/routeStore';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' + '.55Khr0Cuwie_8YBv_QPfsA';

const GRADE_COLORS: Record<string, string> = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#F97316',
  E: '#EF4444',
};

interface MapProps {
  systemPopServed: number | null;
  routes: RoutePoint[];
}

const MapInner = ({ systemPopServed, routes }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const routesAdded = useRef(false);
  const setSelectedRoute = useRouteStore((s) => s.setSelectedRoute);
  const selectedRoute = useRouteStore((s) => s.selectedRoute);

  // Initialize the map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log('🗺️ Initializing Mapbox GL...');
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-113.4938, 53.5461],
      zoom: 11,
      projection: { name: 'mercator' }
    });

    map.current.on('load', () => {
      console.log('🗺️ ✅ Mapbox loaded!');
      setTimeout(() => map.current?.resize(), 100);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add route geometries when data arrives
  useEffect(() => {
    if (!map.current || !routes.length || routesAdded.current) return;

    const addRoutes = () => {
      if (!map.current) return;

      // Build GeoJSON from route coords
      const features = routes
        .filter((r) => r.coords && r.coords.length > 1)
        .map((r) => ({
          type: 'Feature' as const,
          properties: {
            route_id: r.route_id,
            name: r.name,
            short_name: r.short_name,
            grade: r.grade,
            composite_score: r.composite_score,
          },
          geometry: {
            type: 'LineString' as const,
            // Coords in golden record are [lat, lng] — Mapbox needs [lng, lat]
            coordinates: r.coords.map((c) => [c[1], c[0]]),
          },
        }));

      console.log(`🗺️ Drawing ${features.length} routes on map`);

      map.current!.addSource('routes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });

      // Base route lines
      map.current!.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'routes',
        paint: {
          'line-color': [
            'match', ['get', 'grade'],
            'A', GRADE_COLORS.A,
            'B', GRADE_COLORS.B,
            'C', GRADE_COLORS.C,
            'D', GRADE_COLORS.D,
            'E', GRADE_COLORS.E,
            '#94A3B8'
          ],
          'line-width': 2.5,
          'line-opacity': 0.7,
        },
      });

      // Highlighted route (initially hidden)
      map.current!.addLayer({
        id: 'routes-highlight',
        type: 'line',
        source: 'routes',
        paint: {
          'line-color': '#0F766E',
          'line-width': 5,
          'line-opacity': 0.9,
        },
        filter: ['==', 'route_id', ''],
      });

      // Click handler
      map.current!.on('click', 'routes-line', (e) => {
        if (e.features?.[0]) {
          const id = e.features[0].properties?.route_id;
          setSelectedRoute(id || null);
        }
      });

      // Hover cursor
      map.current!.on('mouseenter', 'routes-line', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', 'routes-line', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      // Hover tooltip
      const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 15 });
      map.current!.on('mouseenter', 'routes-line', (e) => {
        if (e.features?.[0]) {
          const props = e.features[0].properties!;
          popup
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font:600 12px Inter,sans-serif;color:#1E293B">${props.short_name} — ${props.name}</div><div style="font:500 10px Inter,sans-serif;color:#64748B">Grade ${props.grade} · Score ${Number(props.composite_score).toFixed(1)}</div>`)
            .addTo(map.current!);
        }
      });
      map.current!.on('mouseleave', 'routes-line', () => popup.remove());

      routesAdded.current = true;
    };

    if (map.current.isStyleLoaded()) {
      addRoutes();
    } else {
      map.current.on('load', addRoutes);
    }
  }, [routes, setSelectedRoute]);

  // Update highlight when selectedRoute changes
  useEffect(() => {
    if (!map.current || !routesAdded.current) return;
    try {
      map.current.setFilter('routes-highlight', ['==', 'route_id', selectedRoute || '']);
      
      // Dim unselected routes when one is selected
      map.current.setPaintProperty('routes-line', 'line-opacity', selectedRoute ? 0.25 : 0.7);
    } catch (e) {
      // Layer might not exist yet
    }
  }, [selectedRoute]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', minHeight: '300px' }}>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <div className="absolute top-6 right-6 z-10 bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-lg">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Population Served</p>
          <p className="text-3xl font-black text-slate-900 tabular-nums">
            {systemPopServed !== null ? systemPopServed.toLocaleString() : "..."}
          </p>
      </div>
    </div>
  );
};

export default MapInner;
