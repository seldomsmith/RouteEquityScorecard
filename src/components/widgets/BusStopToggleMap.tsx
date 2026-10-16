"use client";

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Maximize2, Minimize2 } from 'lucide-react';

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

function formatOrdinal(val: number): string {
  const rounded = Math.round(val);
  const j = rounded % 10;
  const k = rounded % 100;
  if (j === 1 && k !== 11) return `${rounded}st`;
  if (j === 2 && k !== 12) return `${rounded}nd`;
  if (j === 3 && k !== 13) return `${rounded}rd`;
  return `${rounded}th`;
}

export const BusStopToggleMap: React.FC<BusStopToggleMapProps> = ({
  stopA,
  stopB,
  daGeoJson,
}) => {
  // Multi-state selection: stores array of active stop IDs ['6586'] or ['6586', '1745']
  const [selectedStopIds, setSelectedStopIds] = useState<string[]>([stopA.stop_id]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const isStopAActive = selectedStopIds.includes(stopA.stop_id);
  const isStopBActive = selectedStopIds.includes(stopB.stop_id);
  const areBothActive = isStopAActive && isStopBActive;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [stopA.lon, stopA.lat],
      zoom: 14.2,
      attributionControl: false,
    });

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

      // 2. Add both stops to the map
      [stopA, stopB].forEach((stop) => {
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
                    grade: stop.equal_grade,
                    score: stop.equal_score,
                  },
                },
              ],
            },
          });

          // 400m radius walking buffer approximation
          map.addLayer({
            id: `stop-buffer-${stop.stop_id}`,
            type: 'circle',
            source: `stop-source-${stop.stop_id}`,
            layout: {
              visibility: selectedStopIds.includes(stop.stop_id) ? 'visible' : 'none',
            },
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

          // Center stop marker
          map.addLayer({
            id: `stop-dot-${stop.stop_id}`,
            type: 'circle',
            source: `stop-source-${stop.stop_id}`,
            layout: {
              visibility: selectedStopIds.includes(stop.stop_id) ? 'visible' : 'none',
            },
            paint: {
              'circle-radius': 7,
              'circle-color': '#ffffff',
              'circle-stroke-width': 3,
              'circle-stroke-color': circleStroke,
            },
          });

          // Click handler to open popup
          map.on('click', `stop-dot-${stop.stop_id}`, () => {
            new mapboxgl.Popup({ offset: 12, closeButton: false })
              .setLngLat([stop.lon, stop.lat])
              .setHTML(
                `<div style="font-family: sans-serif; padding: 4px 6px;">
                  <strong style="color: #0f172a; font-size: 12px;">Stop #${stop.stop_id}</strong><br/>
                  <span style="font-size: 11px; color: #475569;">${stop.stop_name}</span><br/>
                  <span style="font-size: 11px; font-weight: bold; color: ${circleStroke};">Grade ${stop.equal_grade} • ${stop.equal_score.toFixed(1)} Score</span>
                </div>`
              )
              .addTo(map);
          });
        }
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [stopA, stopB, daGeoJson]);

  // Synchronize layer visibility whenever selectedStopIds updates
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    [stopA, stopB].forEach((stop) => {
      const isSelected = selectedStopIds.includes(stop.stop_id);
      const visibility = isSelected ? 'visible' : 'none';

      if (map.getLayer(`stop-buffer-${stop.stop_id}`)) {
        map.setLayoutProperty(`stop-buffer-${stop.stop_id}`, 'visibility', visibility);
      }
      if (map.getLayer(`stop-dot-${stop.stop_id}`)) {
        map.setLayoutProperty(`stop-dot-${stop.stop_id}`, 'visibility', visibility);
      }
    });
  }, [selectedStopIds, stopA, stopB]);

  // Handle Multi-Stop Toggle interaction
  const handleToggleStop = (targetStopId: string) => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const isCurrentlyActive = selectedStopIds.includes(targetStopId);

    if (isCurrentlyActive) {
      // If user clicks a stop that is already active:
      // If it is the ONLY stop active, re-center on it
      if (selectedStopIds.length === 1) {
        const stop = targetStopId === stopA.stop_id ? stopA : stopB;
        map.flyTo({
          center: [stop.lon, stop.lat],
          zoom: 14.4,
          speed: 1.2,
          curve: 1.4,
          essential: true,
        });
        return;
      }

      // Otherwise, toggle it OFF, leaving the other stop active
      const remainingId = selectedStopIds.find((id) => id !== targetStopId)!;
      setSelectedStopIds([remainingId]);
      const remainingStop = remainingId === stopA.stop_id ? stopA : stopB;
      map.flyTo({
        center: [remainingStop.lon, remainingStop.lat],
        zoom: 14.4,
        speed: 1.2,
        curve: 1.4,
        essential: true,
      });
    } else {
      // User clicked the inactive stop -> now BOTH stops are active!
      setSelectedStopIds([stopA.stop_id, stopB.stop_id]);

      // Automatically fit bounds to show both stops across Edmonton
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([stopA.lon, stopA.lat]);
      bounds.extend([stopB.lon, stopB.lat]);
      map.fitBounds(bounds, {
        padding: { top: 90, bottom: 80, left: 70, right: 70 },
        maxZoom: 13,
        speed: 1.2,
      });
    }
  };

  // Handle Resize on Fullscreen toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-xl shadow-2xl' : 'h-[540px]'
      }`}
    >
      {/* Interactive Stop Switcher Controls (Header Bar) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-2.5 pointer-events-none">
        {/* Toggle Pills Container */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/90 shadow-sm pointer-events-auto">
          {/* Stop A Toggle Pill */}
          <button
            onClick={() => handleToggleStop(stopA.stop_id)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2.5 ${
              isStopAActive
                ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-700'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/70'
            }`}
            title={isStopAActive && isStopBActive ? 'Click to focus on Stop #6586 only' : 'Toggle Stop #6586'}
          >
            <span
              className={`w-5 h-5 rounded flex items-center justify-center font-mono font-black text-[10px] ${
                isStopAActive ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              A
            </span>
            <div className="text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span>Stop #{stopA.stop_id}</span>
                <span className="text-[10px] opacity-80">({formatOrdinal(stopA.equal_percentile)})</span>
              </div>
              <div className="text-[10px] font-normal opacity-85 truncate max-w-[130px]">
                {stopA.stop_name}
              </div>
            </div>
          </button>

          {/* Stop B Toggle Pill */}
          <button
            onClick={() => handleToggleStop(stopB.stop_id)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2.5 ${
              isStopBActive
                ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-700'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/70'
            }`}
            title={isStopAActive && isStopBActive ? 'Click to focus on Stop #1745 only' : 'Toggle Stop #1745'}
          >
            <span
              className={`w-5 h-5 rounded flex items-center justify-center font-mono font-black text-[10px] ${
                isStopBActive ? 'bg-white text-rose-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              E
            </span>
            <div className="text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span>Stop #{stopB.stop_id}</span>
                <span className="text-[10px] opacity-80">({formatOrdinal(stopB.equal_percentile)})</span>
              </div>
              <div className="text-[10px] font-normal opacity-85 truncate max-w-[130px]">
                {stopB.stop_name}
              </div>
            </div>
          </button>
        </div>

        {/* Right utility control: Fullscreen Button only */}
        <div className="pointer-events-auto">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white/95 backdrop-blur-md hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mapbox Viewport */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Bottom Floating Spatial HUD Indicator */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-md text-xs flex flex-wrap items-center gap-4 text-slate-700 pointer-events-auto">
        <div className="flex items-center gap-2">
          {areBothActive ? (
            <>
              <div className="flex items-center -space-x-1">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-600 bg-emerald-500/20" />
                <span className="w-3.5 h-3.5 rounded-full border-2 border-rose-600 bg-rose-500/20" />
              </div>
              <span className="font-semibold text-[11px]">
                400m Walking Buffers (Both Stops Active)
              </span>
            </>
          ) : isStopAActive ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-600 bg-emerald-500/20" />
              <span className="font-semibold text-[11px]">
                400m Walking Buffer (Stop #{stopA.stop_id} &bull; High Need)
              </span>
            </>
          ) : (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-rose-600 bg-rose-500/20" />
              <span className="font-semibold text-[11px]">
                400m Walking Buffer (Stop #{stopB.stop_id} &bull; Low Need)
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-0.5 border-t border-dashed border-slate-500" />
          <span className="font-semibold text-[11px]">Census Dissemination Boundaries</span>
        </div>
      </div>
    </div>
  );
};
