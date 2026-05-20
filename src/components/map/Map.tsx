"use client";

import React, { useEffect, useRef, useState } from 'react';
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

function getFeatureCenter(feature: any): [number, number] | null {
  if (!feature || !feature.geometry) return null;
  const { type, coordinates } = feature.geometry;
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  const processRing = (ring: any) => {
    if (!Array.isArray(ring)) return;
    ring.forEach((coord) => {
      if (Array.isArray(coord) && coord.length >= 2) {
        sumLng += coord[0];
        sumLat += coord[1];
        count++;
      }
    });
  };

  if (type === 'Polygon') {
    coordinates.forEach(processRing);
  } else if (type === 'MultiPolygon') {
    coordinates.forEach((polygon: any) => {
      if (Array.isArray(polygon)) {
        polygon.forEach(processRing);
      }
    });
  } else if (type === 'Point') {
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      return [coordinates[0], coordinates[1]];
    }
  }

  if (count > 0) {
    return [sumLng / count, sumLat / count];
  }
  return null;
}

const MapInner = ({ systemPopServed, routes }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const routesAdded = useRef(false);
  const setSelectedRoute = useRouteStore((s) => s.setSelectedRoute);
  const selectedRoute = useRouteStore((s) => s.selectedRoute);
  const selectedGrade = useRouteStore((s) => s.selectedGrade);
  const setSelectedGrade = useRouteStore((s) => s.setSelectedGrade);
  const selectedDa = useRouteStore((s) => s.selectedDa);
  const setSelectedDa = useRouteStore((s) => s.setSelectedDa);

  const [daGeoJson, setDaGeoJson] = useState<any>(null);

  // Fetch DA boundaries GeoJSON once
  useEffect(() => {
    fetch('/data/da_boundaries_simple.geojson')
      .then((res) => res.json())
      .then((data) => {
        setDaGeoJson(data);
      })
      .catch((err) => console.error("❌ Failed to load DA boundaries", err));
  }, []);

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

      // Add DA Heatmap source and layer FIRST so it sits underneath route lines
      map.current!.addSource('da-heatmap', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current!.addLayer({
        id: 'da-heatmap-layer',
        type: 'fill',
        source: 'da-heatmap',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'vulnerability_index'],
            -2.0, '#E2E8F0', // Neutral low vulnerability
            -0.5, '#A7F3D0', // Cool light emerald
            0.0,  '#FEF08A', // Average yellow
            1.0,  '#FDBA74', // High orange
            2.5,  '#F87171'  // Extreme red
          ],
          'fill-opacity': 0.55,
          'fill-outline-color': 'rgba(255, 255, 255, 0.4)',
        },
      });

      // Add Selected DA source and layers for highlight & visual pop
      map.current!.addSource('selected-da', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current!.addLayer({
        id: 'selected-da-fill',
        type: 'fill',
        source: 'selected-da',
        paint: {
          'fill-color': '#F59E0B', // Amber color fill
          'fill-opacity': 0.25,
        },
      });

      map.current!.addLayer({
        id: 'selected-da-highlight',
        type: 'line',
        source: 'selected-da',
        paint: {
          'line-color': '#D97706', // Strong amber stroke outline
          'line-width': 4.5,
          'line-opacity': 0.95,
        },
      });

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

      // Hover tooltip for routes
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

      // Hover tooltip for DAs
      const daPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });
      map.current!.on('mouseenter', 'da-heatmap-layer', (e) => {
        if (e.features?.[0]) {
          map.current!.getCanvas().style.cursor = 'pointer';
          const props = e.features[0].properties!;
          const vIndex = Number(props.vulnerability_index || 0).toFixed(2);
          const pop = Number(props.pop || 0).toLocaleString();
          const lowInc = Number(props.low_income_pct || 0).toFixed(1);
          const minority = Number(props.minority_pct || 0).toFixed(1);
          const senior = Number(props.senior_pct || 0).toFixed(1);
          const loneParent = Number(props.lone_parent_pct || 0).toFixed(1);
          const recentImmigrant = Number(props.recent_immigrant_pct || 0).toFixed(1);
          const youth = Number(props.youth_pct || 0).toFixed(1);
          
          daPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font:600 12px Inter,sans-serif;color:#1E293B;margin-bottom:4px;font-weight:bold;">DA: ${props.DAUID}</div>
              <div style="font:500 10px Inter,sans-serif;color:#475569;display:grid;grid-template-columns:auto auto;gap:4px 8px;">
                <span>Vulnerability Index:</span><strong style="color:#0F766E">${vIndex}</strong>
                <span>Population:</span><strong>${pop}</strong>
                <span>Low Income:</span><strong>${lowInc}%</strong>
                <span>Minority:</span><strong>${minority}%</strong>
                <span>Seniors:</span><strong>${senior}%</strong>
                <span>Lone Parents:</span><strong>${loneParent}%</strong>
                <span>Recent Immigrants:</span><strong>${recentImmigrant}%</strong>
                <span>Youth:</span><strong>${youth}%</strong>
              </div>
            `)
            .addTo(map.current!);
        }
      });
      map.current!.on('mouseleave', 'da-heatmap-layer', () => {
        map.current!.getCanvas().style.cursor = '';
        daPopup.remove();
      });

      routesAdded.current = true;
    };

    if (map.current.isStyleLoaded()) {
      addRoutes();
    } else {
      map.current.on('load', addRoutes);
    }
  }, [routes, setSelectedRoute]);

  // ⚡ Reactive GeoJSON update — hot-swap route data when weights change
  // This runs AFTER initial setup (routesAdded.current === true) and only
  // updates the GeoJSON source data, not the layers or event handlers.
  useEffect(() => {
    if (!map.current || !routesAdded.current || !routes.length) return;

    try {
      const source = map.current.getSource('routes') as mapboxgl.GeoJSONSource;
      if (!source) return;

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
            coordinates: r.coords.map((c) => [c[1], c[0]]),
          },
        }));

      source.setData({ type: 'FeatureCollection', features });
    } catch (e) {
      // Source might not exist yet during initial load
    }
  }, [routes]);

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

  // ⚡ Reactive DA zoom and highlight - triggers Mapbox flyTo when selectedDa changes
  useEffect(() => {
    if (!map.current || !routesAdded.current || !daGeoJson) return;

    try {
      const source = map.current.getSource('selected-da') as mapboxgl.GeoJSONSource;
      if (!source) return;

      if (!selectedDa) {
        // Clear highlight if no DA is selected
        source.setData({ type: 'FeatureCollection', features: [] });
        return;
      }

      // Find the selected DA feature
      const feature = daGeoJson.features.find((f: any) => f.properties?.DAUID === selectedDa);
      if (!feature) {
        console.warn(`DA ${selectedDa} feature not found in geojson`);
        return;
      }

      // Update the geojson source to draw the highlight
      source.setData({
        type: 'FeatureCollection',
        features: [feature]
      });

      // Calculate centroid/center of the selected DA
      const center = getFeatureCenter(feature);
      if (center) {
        console.log(`🗺️ Flying to selected DA ${selectedDa} center:`, center);
        map.current.flyTo({
          center,
          zoom: 14.5,
          essential: true,
          duration: 2000, // Smooth 2s transition
        });
      }
    } catch (e) {
      console.warn("Could not update selected DA highlight or flyTo", e);
    }
  }, [selectedDa, daGeoJson]);

  // ⚡ Reactive DA Heatmap overlay — updates DA geometry highlighting when a route is isolated
  useEffect(() => {
    if (!map.current || !routesAdded.current || !daGeoJson) return;

    try {
      const source = map.current.getSource('da-heatmap') as mapboxgl.GeoJSONSource;
      if (!source) return;

      if (!selectedRoute) {
        // Clear overlay if no route is selected
        source.setData({ type: 'FeatureCollection', features: [] });
        return;
      }

      // Find the selected route
      const selectedRouteData = routes.find((r) => r.route_id === selectedRoute);
      if (!selectedRouteData || !selectedRouteData.da_data || selectedRouteData.da_data.length === 0) {
        source.setData({ type: 'FeatureCollection', features: [] });
        return;
      }

      // Create a lookup map of served DAs
      const daMap = new Map(selectedRouteData.da_data.map((d: any) => [d.id, d]));

      // Filter and enrich the geojson features
      const servedDaFeatures = daGeoJson.features
        .filter((f: any) => daMap.has(f.properties?.DAUID))
        .map((f: any) => {
          const daInfo = daMap.get(f.properties.DAUID)!;
          return {
            ...f,
            properties: {
              ...f.properties,
              vulnerability_index: daInfo.vulnerability_index,
              pop: daInfo.pop,
              low_income_pct: daInfo.low_income_pct,
              minority_pct: daInfo.minority_pct,
              senior_pct: daInfo.senior_pct,
              lone_parent_pct: daInfo.lone_parent_pct,
              recent_immigrant_pct: daInfo.recent_immigrant_pct,
              youth_pct: daInfo.youth_pct,
            },
          };
        });

      source.setData({ type: 'FeatureCollection', features: servedDaFeatures });
    } catch (e) {
      console.warn("Could not update DA Heatmap data source", e);
    }
  }, [selectedRoute, routes, daGeoJson]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Resize map when entering/exiting fullscreen
  useEffect(() => {
    if (map.current) {
      setTimeout(() => map.current?.resize(), 100);
    }
  }, [isFullscreen]);

  return (
    <div 
      className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}
      style={!isFullscreen ? { width: '100%', height: '100%', position: 'relative', minHeight: '300px' } : {}}
    >
      <div 
        ref={mapContainer} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
      />
      
      {/* Top Left: Clear Selections (Route and/or DA) */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
        {selectedRoute && (
          <button
            onClick={() => setSelectedRoute(null)}
            className="bg-brand-rose-500 hover:bg-brand-rose-600 text-white rounded-full p-2 shadow-lg transition-transform hover:scale-105 flex items-center justify-center group self-start"
            title="Clear Route Selection"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-xs pl-0 group-hover:pl-2">
              Clear Route Selection
            </span>
          </button>
        )}

        {selectedDa && (
          <button
            onClick={() => setSelectedDa(null)}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-full p-2 shadow-lg transition-transform hover:scale-105 flex items-center justify-center group self-start"
            title="Clear DA Selection"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-xs pl-0 group-hover:pl-2">
              Clear DA {selectedDa}
            </span>
          </button>
        )}
      </div>

      {/* Top Right: Stats & Fullscreen Toggle */}
      <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-white/90 backdrop-blur-md border border-slate-200 text-slate-600 hover:text-slate-900 p-2 rounded-lg shadow-sm transition-all flex items-center gap-2 text-xs font-bold"
        >
          {isFullscreen ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              Exit Fullscreen
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              Fullscreen Map
            </>
          )}
        </button>

        <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-lg mt-1 text-right min-w-[180px]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Population Served</p>
            <p className="text-3xl font-black text-slate-900 tabular-nums">
              {systemPopServed !== null ? systemPopServed.toLocaleString() : "..."}
            </p>
        </div>
      </div>

      {/* Clickable Map Legend */}
      <div className="absolute bottom-6 right-6 z-10 bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-lg flex flex-col gap-2 min-w-[140px]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Grade Filter
          </span>
          {selectedGrade && (
            <button
              onClick={() => setSelectedGrade(null)}
              className="text-[8px] font-semibold text-brand-rose-500 hover:text-brand-rose-600 uppercase tracking-wider"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {(['A', 'B', 'C', 'D', 'E'] as const).map((g) => {
            const isActive = selectedGrade === g;
            return (
              <button
                key={g}
                onClick={() => setSelectedGrade(isActive ? null : g)}
                className={`flex items-center gap-2 text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all border text-left
                  ${isActive 
                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                    : 'text-slate-600 bg-white/50 border-slate-100 hover:bg-slate-50'
                  }`}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: GRADE_COLORS[g] }}
                />
                Grade {g}
              </button>
            );
          })}
        </div>

        {/* Heatmap Legend (only visible when a route is isolated and heatmap is shown) */}
        {selectedRoute && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Served DA Equity
            </span>
            <div className="h-2 w-full rounded-full" style={{ background: 'linear-gradient(to right, #E2E8F0, #A7F3D0, #FEF08A, #FDBA74, #F87171)' }} />
            <div className="flex justify-between text-[8px] font-mono text-slate-400">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapInner;
