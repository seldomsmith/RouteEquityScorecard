"use client";

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Maximize2, Minimize2, Split, Eye } from 'lucide-react';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' + '.55Khr0Cuwie_8YBv_QPfsA';

interface BusStopItem {
  stop_id: string;
  stop_name: string;
  lat: number;
  lon: number;
  equal_score: number;
  equal_percentile: number;
  equal_grade: string;
  das: Array<{ da_id: string; pct: number; equal_score: number }>;
}

interface BusStopToggleMapProps {
  stopA: BusStopItem;
  stopB: BusStopItem;
  daGeoJson?: any;
}

export const BusStopToggleMap: React.FC<BusStopToggleMapProps> = ({
  stopA,
  stopB,
  daGeoJson,
}) => {
  const [viewMode, setViewMode] = useState<'toggle' | 'split'>('toggle');
  const [activeStopId, setActiveStopId] = useState<string>(stopA.stop_id);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const singleMapContainerRef = useRef<HTMLDivElement>(null);
  const splitMapContainerA = useRef<HTMLDivElement>(null);
  const splitMapContainerB = useRef<HTMLDivElement>(null);

  const singleMapRef = useRef<mapboxgl.Map | null>(null);
  const mapARef = useRef<mapboxgl.Map | null>(null);
  const mapBRef = useRef<mapboxgl.Map | null>(null);

  const activeStop = activeStopId === stopA.stop_id ? stopA : stopB;

  // Helper to add DA boundaries and stop buffer to a mapbox instance
  const setupStopMapLayers = (map: mapboxgl.Map, stop: BusStopItem) => {
    map.on('load', () => {
      // 1. Add DA boundaries if available
      if (daGeoJson) {
        if (!map.getSource('da-boundaries')) {
          map.addSource('da-boundaries', {
            type: 'geojson',
            data: daGeoJson,
          });

          map.addLayer({
            id: 'da-fill',
            type: 'fill',
            source: 'da-boundaries',
            paint: {
              'fill-color': '#64748b',
              'fill-opacity': 0.08,
            },
          });

          map.addLayer({
            id: 'da-lines',
            type: 'line',
            source: 'da-boundaries',
            paint: {
              'line-color': '#94a3b8',
              'line-width': 0.75,
              'line-dasharray': [2, 2],
            },
          });
        }
      }

      // 2. Add 400m Buffer circle & Stop point
      const isGradeA = stop.equal_grade === 'A';
      const circleColor = isGradeA ? '#10b981' : '#ef4444';
      const circleStroke = isGradeA ? '#059669' : '#dc2626';

      if (!map.getSource(`stop-source-${stop.stop_id}`)) {
        map.addSource(`stop-source-${stop.stop_id}`, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [stop.lon, stop.lat],
                },
                properties: {
                  stop_id: stop.stop_id,
                  name: stop.stop_name,
                },
              },
            ],
          },
        });

        // 400m circle buffer approximation
        map.addLayer({
          id: `stop-buffer-${stop.stop_id}`,
          type: 'circle',
          source: `stop-source-${stop.stop_id}`,
          paint: {
            'circle-radius': [
              'interpolate',
              ['exponential', 2],
              ['zoom'],
              11, 14,
              12, 28,
              13, 56,
              14, 112,
              15, 224,
            ],
            'circle-color': circleColor,
            'circle-opacity': 0.22,
            'circle-stroke-width': 2,
            'circle-stroke-color': circleStroke,
          },
        });

        // Center dot
        map.addLayer({
          id: `stop-dot-${stop.stop_id}`,
          type: 'circle',
          source: `stop-source-${stop.stop_id}`,
          paint: {
            'circle-radius': 6,
            'circle-color': '#ffffff',
            'circle-stroke-width': 3,
            'circle-stroke-color': circleStroke,
          },
        });
      }
    });
  };

  // Mount/Update Single Toggle Map
  useEffect(() => {
    if (viewMode !== 'toggle' || !singleMapContainerRef.current) return;

    if (!singleMapRef.current) {
      const map = new mapboxgl.Map({
        container: singleMapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [activeStop.lon, activeStop.lat],
        zoom: 14.2,
        attributionControl: false,
      });

      setupStopMapLayers(map, stopA);
      setupStopMapLayers(map, stopB);
      singleMapRef.current = map;
    } else {
      singleMapRef.current.flyTo({
        center: [activeStop.lon, activeStop.lat],
        zoom: 14.2,
        speed: 1.2,
        curve: 1.4,
      });
    }
  }, [viewMode, activeStopId, activeStop]);

  // Mount Split Maps
  useEffect(() => {
    if (viewMode !== 'split') return;

    if (splitMapContainerA.current && !mapARef.current) {
      const mapA = new mapboxgl.Map({
        container: splitMapContainerA.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [stopA.lon, stopA.lat],
        zoom: 14,
        attributionControl: false,
      });
      setupStopMapLayers(mapA, stopA);
      mapARef.current = mapA;
    }

    if (splitMapContainerB.current && !mapBRef.current) {
      const mapB = new mapboxgl.Map({
        container: splitMapContainerB.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [stopB.lon, stopB.lat],
        zoom: 14,
        attributionControl: false,
      });
      setupStopMapLayers(mapB, stopB);
      mapBRef.current = mapB;
    }
  }, [viewMode]);

  // Handle Resize on Mode / Fullscreen toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      singleMapRef.current?.resize();
      mapARef.current?.resize();
      mapBRef.current?.resize();
    }, 200);
    return () => clearTimeout(timer);
  }, [viewMode, isFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-slate-900 border border-slate-200 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'h-[520px]'
      }`}
    >
      {/* Control Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Toggle Mode & Stop Switcher */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md pointer-events-auto">
          <button
            onClick={() => setViewMode('toggle')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'toggle'
                ? 'bg-[#1e3a8a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Toggled View
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'split'
                ? 'bg-[#1e3a8a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Split className="w-3.5 h-3.5" /> Side-by-Side View
          </button>
        </div>

        {/* If in Toggle Mode, show Stop Selection Pills */}
        {viewMode === 'toggle' && (
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md pointer-events-auto">
            <button
              onClick={() => setActiveStopId(stopA.stop_id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeStopId === stopA.stop_id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Stop #{stopA.stop_id}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/15 font-mono">
                Grade {stopA.equal_grade}
              </span>
            </button>

            <button
              onClick={() => setActiveStopId(stopB.stop_id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeStopId === stopB.stop_id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Stop #{stopB.stop_id}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/15 font-mono">
                Grade {stopB.equal_grade}
              </span>
            </button>
          </div>
        )}

        {/* Fullscreen Button */}
        <div className="pointer-events-auto">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white/95 backdrop-blur-md hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 shadow-md transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Map Viewports */}
      {viewMode === 'toggle' ? (
        <div ref={singleMapContainerRef} className="w-full h-full relative" />
      ) : (
        <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-300">
          <div className="relative w-full h-full">
            <div className="absolute top-16 left-4 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-900">
              Stop #{stopA.stop_id} ({stopA.stop_name}) &bull; <span className="text-emerald-600">Grade {stopA.equal_grade}</span>
            </div>
            <div ref={splitMapContainerA} className="w-full h-full" />
          </div>

          <div className="relative w-full h-full">
            <div className="absolute top-16 left-4 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-900">
              Stop #{stopB.stop_id} ({stopB.stop_name}) &bull; <span className="text-rose-600">Grade {stopB.equal_grade}</span>
            </div>
            <div ref={splitMapContainerB} className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Bottom Floating Spatial HUD Indicator */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200 shadow-lg text-xs flex items-center gap-4 text-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 bg-emerald-500/20" />
          <span className="font-semibold text-[11px]">400m Walking Buffer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-0.5 border-t border-dashed border-slate-500" />
          <span className="font-semibold text-[11px]">Census Dissemination Boundaries</span>
        </div>
      </div>
    </div>
  );
};
