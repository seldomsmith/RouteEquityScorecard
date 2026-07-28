"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BusStopRecord } from '@/components/widgets/BusStopDirectory';

mapboxgl.accessToken =
  'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' +
  '.55Khr0Cuwie_8YBv_QPfsA';

interface BusStopMapProps {
  stops: BusStopRecord[];
  daScores: Record<string, any>;
  selectedStopId: string | null;
  mode: 'equal' | 'economic';
  is3dEnabled: boolean;
  onSelectStop: (stopId: string | null) => void;
}

export const BusStopMap: React.FC<BusStopMapProps> = ({
  stops,
  daScores,
  selectedStopId,
  mode,
  is3dEnabled,
  onSelectStop
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [hoveredStop, setHoveredStop] = useState<BusStopRecord | null>(null);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-113.4938, 53.5444],
      zoom: 11.5,
      pitch: is3dEnabled ? 45 : 0,
      bearing: is3dEnabled ? -15 : 0,
    });

    mapRef.current = map;

    // Create Popup instance
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'bus-stop-hover-popup',
      maxWidth: '320px',
    });

    map.on('load', () => {
      // 1. Add DA Boundaries Source & Layer
      map.addSource('da-boundaries', {
        type: 'geojson',
        data: '/data/da_boundaries_simple.geojson',
      });

      map.addLayer({
        id: 'da-fill',
        type: 'fill',
        source: 'da-boundaries',
        paint: {
          'fill-color': '#0F172A',
          'fill-opacity': 0.4,
        },
      });

      map.addLayer({
        id: 'da-line',
        type: 'line',
        source: 'da-boundaries',
        paint: {
          'line-color': '#334155',
          'line-width': 0.5,
          'line-opacity': 0.5,
        },
      });

      // 2. Add 400m Buffer Source & Layers for Selected Stop
      map.addSource('selected-buffer', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'buffer-fill',
        type: 'fill',
        source: 'selected-buffer',
        paint: {
          'fill-color': '#06B6D4',
          'fill-opacity': 0.22,
        },
      });

      map.addLayer({
        id: 'buffer-line',
        type: 'line',
        source: 'selected-buffer',
        paint: {
          'line-color': '#22D3EE',
          'line-width': 2.5,
          'line-dasharray': [2, 2],
        },
      });

      // 3. Add Bus Stops Source & Layer
      map.addSource('bus-stops', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'bus-stop-points',
        type: 'circle',
        source: 'bus-stops',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9, 2.5,
            12, 4.5,
            15, 8.5,
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'score'],
            20, '#10B981', // Emerald (Low)
            40, '#F59E0B', // Amber (Mod)
            65, '#F97316', // Orange (High)
            85, '#EF4444', // Red (Very High)
          ],
          'circle-opacity': 0.9,
          'circle-stroke-width': 0,
        },
      });

      // 4. 3D Buildings Layer
      map.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 13,
        paint: {
          'fill-extrusion-color': '#1E293B',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': is3dEnabled ? 0.6 : 0.0,
        },
      });

      // Map Click Handler for selecting stops
      map.on('click', 'bus-stop-points', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          if (props && props.stop_id) {
            onSelectStop(String(props.stop_id));
          }
        }
      });

      // Hover Tooltip Handlers
      map.on('mousemove', 'bus-stop-points', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';
          const props = e.features[0].properties;
          if (props && props.stop_id) {
            const stopId = String(props.stop_id);
            const targetStop = stops.find((s) => s.stop_id === stopId);
            if (targetStop && popupRef.current) {
              const score = mode === 'equal' ? targetStop.equal_score : targetStop.economic_score;
              const daList = targetStop.das;

              // Generate SVG Pie Chart HTML
              const pieSvg = generatePieChartSvg(daList);

              const contentHtml = `
                <div class="p-3 bg-slate-950/95 backdrop-blur-md border border-cyan-500/40 rounded-xl text-slate-100 shadow-2xl space-y-2 text-xs">
                  <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <div>
                      <span class="font-mono text-[11px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40">#${targetStop.stop_id}</span>
                      <div class="font-bold text-slate-100 text-xs mt-1 truncate max-w-[180px]">${targetStop.stop_name}</div>
                    </div>
                    <div class="text-right">
                      <div class="font-mono font-bold text-sm text-cyan-300">${score.toFixed(1)}</div>
                      <div class="text-[9px] uppercase tracking-wider text-slate-400">Score</div>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <div class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">400m DA Catchment Breakdown</div>
                    <div class="flex items-center gap-3">
                      <div class="flex-shrink-0">${pieSvg}</div>
                      <div class="flex-1 space-y-1 text-[11px]">
                        ${daList.slice(0, 3).map((d, i) => `
                          <div class="flex items-center justify-between text-slate-300">
                            <span class="flex items-center gap-1">
                              <span class="w-2 h-2 rounded-full inline-block" style="background-color: ${PIE_COLORS[i % PIE_COLORS.length]}"></span>
                              DA ${d.da_id}
                            </span>
                            <span class="font-mono font-semibold text-slate-200">${d.pct}%</span>
                          </div>
                        `).join('')}
                        ${daList.length > 3 ? `<div class="text-[10px] text-slate-500">+${daList.length - 3} more DAs</div>` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              `;

              popupRef.current
                .setLngLat([targetStop.lon, targetStop.lat])
                .setHTML(contentHtml)
                .addTo(map);
            }
          }
        }
      });

      map.on('mouseleave', 'bus-stop-points', () => {
        map.getCanvas().style.cursor = '';
        if (popupRef.current) {
          popupRef.current.remove();
        }
      });
    });

    return () => {
      map.remove();
    };
  }, [stops]);

  // Update 3D Camera & Extrusions
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    map.easeTo({
      pitch: is3dEnabled ? 45 : 0,
      bearing: is3dEnabled ? -15 : 0,
      duration: 1000,
    });

    if (map.getLayer('3d-buildings')) {
      map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', is3dEnabled ? 0.6 : 0.0);
    }
  }, [is3dEnabled]);

  // Update Bus Stop GeoJSON source & DA Heatmap when stops or mode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || stops.length === 0) return;

    // Build GeoJSON FeatureCollection for Stops
    const features: GeoJSON.Feature[] = stops.map((s) => ({
      type: 'Feature',
      properties: {
        stop_id: s.stop_id,
        stop_name: s.stop_name,
        score: mode === 'equal' ? s.equal_score : s.economic_score,
      },
      geometry: {
        type: 'Point',
        coordinates: [s.lon, s.lat],
      },
    }));

    const source = map.getSource('bus-stops') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features,
      });
    }

    // Update DA Choropleth colors based on mode
    if (map.getLayer('da-fill') && daScores) {
      const matchExpr: any[] = ['match', ['get', 'DAUID']];
      Object.entries(daScores).forEach(([daId, scores]: [string, any]) => {
        const val = mode === 'equal' ? scores.equal : scores.economic;
        let color = '#0F172A';
        if (val >= 75) color = '#7F1D1D';
        else if (val >= 60) color = '#991B1B';
        else if (val >= 45) color = '#92400E';
        else if (val >= 30) color = '#065F46';
        else color = '#064E3B';

        matchExpr.push(daId, color);
      });
      matchExpr.push('#0F172A'); // fallback

      map.setPaintProperty('da-fill', 'fill-color', matchExpr);
    }
  }, [stops, mode, daScores]);

  // Handle Selected Stop & 400m Buffer Circle Rendering
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('selected-buffer') as mapboxgl.GeoJSONSource;

    if (!selectedStopId) {
      if (source) source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const targetStop = stops.find((s) => s.stop_id === selectedStopId);
    if (!targetStop) return;

    // Pan map smoothly to selected stop
    map.flyTo({
      center: [targetStop.lon, targetStop.lat],
      zoom: 15.0,
      duration: 1200,
    });

    // Create 400m geodesic polygon buffer in GeoJSON coordinates
    const centerLon = targetStop.lon;
    const centerLat = targetStop.lat;
    const radiusMeters = 400.0;

    const coords: number[][] = [];
    const points = 64;
    for (let i = 0; i <= points; i++) {
      const angle = (i * 360) / points;
      const rad = (angle * Math.PI) / 180;
      const dx = (radiusMeters * Math.cos(rad)) / (111320 * Math.cos((centerLat * Math.PI) / 180));
      const dy = (radiusMeters * Math.sin(rad)) / 110574;
      coords.push([centerLon + dx, centerLat + dy]);
    }

    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [coords],
            },
          },
        ],
      });
    }
  }, [selectedStopId, stops]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

const PIE_COLORS = ['#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

function generatePieChartSvg(das: Array<{ da_id: string; pct: number }>): string {
  if (!das || das.length === 0) return '';
  const size = 48;
  const radius = 20;
  const center = size / 2;

  let cumulativeAngle = 0;
  const paths: string[] = [];

  das.forEach((d, idx) => {
    const sliceAngle = (d.pct / 100) * 360;
    if (sliceAngle <= 0) return;

    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    const x1 = center + radius * Math.cos((startAngle - 90) * (Math.PI / 180));
    const y1 = center + radius * Math.sin((startAngle - 90) * (Math.PI / 180));
    const x2 = center + radius * Math.cos((endAngle - 90) * (Math.PI / 180));
    const y2 = center + radius * Math.sin((endAngle - 90) * (Math.PI / 180));

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;
    const color = PIE_COLORS[idx % PIE_COLORS.length];

    if (sliceAngle >= 359.9) {
      paths.push(`<circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" />`);
    } else {
      paths.push(`
        <path d="M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${color}" />
      `);
    }
  });

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="drop-shadow-md">
      ${paths.join('')}
    </svg>
  `;
}
