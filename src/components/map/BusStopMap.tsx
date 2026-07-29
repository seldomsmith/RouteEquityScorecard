"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BusStopRecord } from '@/components/widgets/BusStopDirectory';

mapboxgl.accessToken =
  'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' +
  '.55Khr0Cuwie_8YBv_QPfsA';

import { BusStopGrade } from '@/components/widgets/BusStopGradeLegend';

export type CimdDimensionKey = 'econ' | 'res' | 'eth' | 'sit';

interface BusStopMapProps {
  stops: BusStopRecord[];
  daScores: Record<string, any>;
  selectedStopId: string | null;
  mode: 'equal' | 'economic';
  is3dEnabled: boolean;
  isDirectoryOpen?: boolean;
  selectedGrades?: BusStopGrade[];
  activeDimensions?: CimdDimensionKey[];
  showHeatmap?: boolean;
  onSelectStop: (stopId: string | null) => void;
}

const PIE_COLORS = ['#0284C7', '#2563EB', '#7C3AED', '#DB2777', '#D97706', '#059669'];

export const BusStopMap: React.FC<BusStopMapProps> = ({
  stops,
  daScores,
  selectedStopId,
  mode,
  is3dEnabled,
  isDirectoryOpen,
  selectedGrades = ['A', 'B', 'C', 'D', 'E', 'Regional'],
  activeDimensions = ['econ', 'res', 'eth', 'sit'],
  showHeatmap = true,
  onSelectStop
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef.current = useRef<mapboxgl.Popup | null>(null);
  const isLoadedRef = useRef<boolean>(false);

  // Helper to push stops data into Mapbox source
  const updateStopsSource = (map: mapboxgl.Map, currentStops: BusStopRecord[], currentMode: 'equal' | 'economic', currentGrades: BusStopGrade[] = []) => {
    const source = map.getSource('bus-stops') as mapboxgl.GeoJSONSource;
    if (!source || currentStops.length === 0) return;

    // Filter stops by selectedGrades
    const filteredStops = currentStops.filter((s) => {
      const grade = (currentMode === 'equal' 
        ? (s.is_regional ? 'Regional' : (s.equal_grade || 'C'))
        : (s.is_regional ? 'Regional' : (s.economic_grade || 'C'))) as BusStopGrade;
      return currentGrades ? currentGrades.includes(grade) : true;
    });

    const features: GeoJSON.Feature[] = filteredStops.map((s) => {
      const score = currentMode === 'equal' ? s.equal_score : s.economic_score;
      const rawPercentile = currentMode === 'equal' ? s.equal_percentile : s.economic_percentile;
      const percentile = (rawPercentile !== undefined && rawPercentile !== null) ? rawPercentile : score;
      const grade = currentMode === 'equal' 
        ? (s.equal_grade || (s.is_regional ? 'Regional' : 'C'))
        : (s.economic_grade || (s.is_regional ? 'Regional' : 'C'));

      return {
        type: 'Feature',
        properties: {
          stop_id: s.stop_id,
          stop_name: s.stop_name,
          score,
          percentile,
          grade: s.is_regional ? 'Regional' : grade,
          is_regional: (s.is_regional || grade === 'Regional') ? 1 : 0,
        },
        geometry: {
          type: 'Point',
          coordinates: [s.lon, s.lat],
        },
      };
    });

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  };

  // Helper to update DA heatmap fill colors (supporting full-map base layer and selected stop 400m isolation)
  const updateDaHeatmap = (
    map: mapboxgl.Map, 
    currentDaScores: Record<string, any>, 
    targetStop?: BusStopRecord | null
  ) => {
    if (!map.getLayer('da-fill')) return;

    if (!showHeatmap) {
      map.setPaintProperty('da-fill', 'fill-color', 'rgba(0, 0, 0, 0)');
      return;
    }

    const numDims = activeDimensions.length || 4;
    const dimWeight = 1 / numDims;

    const matchExpr: any[] = ['match', ['get', 'DAUID']];

    if (targetStop && targetStop.das && targetStop.das.length > 0) {
      // Isolate heatmap to selected stop's 400m catchment DAs
      targetStop.das.forEach((daItem) => {
        const daId = String(daItem.da_id);
        const daItemAny = daItem as any;
        
        let score = 0;
        if (activeDimensions.includes('econ')) score += (daItemAny.econ ?? 50) * dimWeight;
        if (activeDimensions.includes('res')) score += (daItemAny.res ?? 50) * dimWeight;
        if (activeDimensions.includes('eth')) score += (daItemAny.eth ?? 50) * dimWeight;
        if (activeDimensions.includes('sit')) score += (daItemAny.sit ?? 50) * dimWeight;

        let color = '#E2E8F0';
        if (score >= 80) color = '#059669';      // Deep Emerald Green (High Equity)
        else if (score >= 65) color = '#10B981'; // Emerald Green
        else if (score >= 50) color = '#3B82F6'; // Royal Blue
        else if (score >= 35) color = '#F59E0B'; // Amber
        else color = '#CBD5E1';                  // Pale Slate (Low Equity)

        matchExpr.push(daId, color);
      });
      matchExpr.push('rgba(0, 0, 0, 0)');
    } else {
      // Default Base Layer Light Heatmap across all city DAs based on active CIMD criteria
      Object.entries(currentDaScores).forEach(([daId, scores]: [string, any]) => {
        let val = 0;
        if (activeDimensions.includes('econ')) val += (scores.econ ?? scores.economic ?? 50) * dimWeight;
        if (activeDimensions.includes('res')) val += (scores.res ?? 50) * dimWeight;
        if (activeDimensions.includes('eth')) val += (scores.eth ?? 50) * dimWeight;
        if (activeDimensions.includes('sit')) val += (scores.sit ?? 50) * dimWeight;

        let color = '#F8FAFC';
        if (val >= 80) color = '#A7F3D0';      // Soft Mint Green
        else if (val >= 65) color = '#BAE6FD'; // Light Blue
        else if (val >= 50) color = '#FEF08A'; // Soft Yellow
        else if (val >= 35) color = '#FED7AA'; // Soft Orange
        else color = '#F1F5F9';                  // Very Light Baseline Slate

        matchExpr.push(daId, color);
      });
      matchExpr.push('#F8FAFC');
    }

    map.setPaintProperty('da-fill', 'fill-color', matchExpr);
  };

  // Initialize Mapbox map (Light Theme)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11', // Matching main dashboard light map
      center: [-113.4938, 53.5444],
      zoom: 11.5,
      pitch: is3dEnabled ? 45 : 0,
      bearing: is3dEnabled ? -15 : 0,
    });

    mapRef.current = map;

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'bus-stop-hover-popup',
      maxWidth: '320px',
    });

    map.on('load', () => {
      isLoadedRef.current = true;

      // 1. Add DA Boundaries Source & Fill Layer
      map.addSource('da-boundaries', {
        type: 'geojson',
        data: '/data/da_boundaries_simple.geojson',
      });

      map.addLayer({
        id: 'da-fill',
        type: 'fill',
        source: 'da-boundaries',
        paint: {
          'fill-color': '#F8FAFC',
          'fill-opacity': 0.45,
        },
      });

      map.addLayer({
        id: 'da-line',
        type: 'line',
        source: 'da-boundaries',
        paint: {
          'line-color': '#94A3B8',
          'line-width': 0.6,
          'line-opacity': 0.5,
        },
      });

      // 2. Add Selected Stop 400m Buffer Source & Layers
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
          'fill-color': '#7C3AED',
          'fill-opacity': 0.0,
        },
      });

      map.addLayer({
        id: 'buffer-line',
        type: 'line',
        source: 'selected-buffer',
        paint: {
          'line-color': '#7C3AED',
          'line-width': 1.5,
        },
      });

      // 3. Add Bus Stops Source & Circle Point Layer
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
            9, 3,
            12, 5,
            15, 8.5,
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'is_regional'], 1], '#94A3B8', // Regional stops grayed out (Slate-400)
            [
              'match',
              ['get', 'grade'],
              'A', '#10B981', // Grade A: Emerald Green
              'B', '#3B82F6', // Grade B: Royal Blue
              'C', '#F59E0B', // Grade C: Amber Yellow
              'D', '#F97316', // Grade D: Orange
              'E', '#EF4444', // Grade E: Red
              '#10B981'       // Fallback Emerald
            ]
          ],
          'circle-opacity': [
            'case',
            ['==', ['get', 'is_regional'], 1], 0.45,
            0.85
          ],
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
          'fill-extrusion-color': '#CBD5E1',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': is3dEnabled ? 0.6 : 0.0,
        },
      });

      // Initial data push on map load
      if (stops.length > 0) {
        updateStopsSource(map, stops, mode, selectedGrades);
        updateDaHeatmap(map, daScores, mode);
      }

      // Click handler
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
              const percentile = mode === 'equal' 
                ? (targetStop.equal_percentile ?? null)
                : (targetStop.economic_percentile ?? null);
              const daList = targetStop.das;
              const pieSvg = generatePieChartSvg(daList);

              const contentHtml = `
                <div class="p-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl text-slate-900 shadow-xl space-y-2 text-xs">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div>
                      <span class="font-mono text-[11px] text-[#1e3a8a] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">#${targetStop.stop_id}</span>
                      <div class="font-bold text-slate-800 text-xs mt-1 truncate max-w-[180px]">${targetStop.stop_name}</div>
                    </div>
                    <div class="text-right">
                      ${targetStop.is_regional ? `
                        <div class="font-mono font-bold text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Regional</div>
                        <div class="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">Outside City</div>
                      ` : `
                        <div class="font-mono font-bold text-sm text-[#1e3a8a]">${percentile !== null ? `${percentile.toFixed(0)}th %ile` : score.toFixed(1)}</div>
                        <div class="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Score: ${score.toFixed(1)}</div>
                      `}
                    </div>
                  </div>

                  <div class="space-y-1">
                    <div class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">400m DA Catchment Overlap</div>
                    <div class="flex items-center gap-3">
                      <div class="flex-shrink-0">${pieSvg}</div>
                      <div class="flex-1 space-y-1 text-[11px]">
                        ${daList.slice(0, 3).map((d, i) => `
                          <div class="flex items-center justify-between text-slate-700">
                            <span class="flex items-center gap-1 font-medium">
                              <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${PIE_COLORS[i % PIE_COLORS.length]}"></span>
                              DA ${d.da_id}
                            </span>
                            <span class="font-mono font-bold text-slate-900">${d.pct}%</span>
                          </div>
                        `).join('')}
                        ${daList.length > 3 ? `<div class="text-[10px] text-slate-400">+${daList.length - 3} more DAs</div>` : ''}
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
  }, []);

  // Handle Mapbox canvas resize when directory sidebar toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.resize();
    const timer = setTimeout(() => {
      map.resize();
    }, 310);

    return () => clearTimeout(timer);
  }, [isDirectoryOpen]);

  // Update camera 3D settings
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

  // Update stops source and DA heatmap when props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const targetStop = stops.find((s) => s.stop_id === selectedStopId) || null;

    if (map.isStyleLoaded()) {
      updateStopsSource(map, stops, mode, selectedGrades);
      updateDaHeatmap(map, daScores, mode, targetStop);
    } else {
      map.once('load', () => {
        updateStopsSource(map, stops, mode, selectedGrades);
        updateDaHeatmap(map, daScores, mode, targetStop);
      });
    }
  }, [stops, mode, daScores, selectedGrades, selectedStopId]);

  // Handle Selected Stop & 400m Buffer Circle Rendering
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const renderBuffer = () => {
      const source = map.getSource('selected-buffer') as mapboxgl.GeoJSONSource;
      const targetStop = stops.find((s) => s.stop_id === selectedStopId) || null;

      updateDaHeatmap(map, daScores, mode, targetStop);

      if (!selectedStopId || !targetStop) {
        if (source) source.setData({ type: 'FeatureCollection', features: [] });
        return;
      }

      map.flyTo({
        center: [targetStop.lon, targetStop.lat],
        zoom: 15.0,
        duration: 1200,
      });

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
    };

    if (map.isStyleLoaded()) {
      renderBuffer();
    } else {
      map.once('load', renderBuffer);
    }
  }, [selectedStopId, stops, daScores, mode]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

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
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="drop-shadow-sm">
      ${paths.join('')}
    </svg>
  `;
}
