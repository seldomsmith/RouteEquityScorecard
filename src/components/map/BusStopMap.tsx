"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BusStopRecord } from '@/components/widgets/BusStopDirectory';
import { useRouteStore } from '@/store/routeStore';

mapboxgl.accessToken =
  'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' +
  '.55Khr0Cuwie_8YBv_QPfsA';

import { BusStopGrade } from '@/components/widgets/BusStopGradeLegend';

export type CimdDimensionKey = 'econ' | 'res' | 'eth' | 'sit';

interface PaletteColors {
  l1: string; // low (under 35)
  l2: string; // med-low (35-50)
  l3: string; // med (50-65)
  l4: string; // med-high (65-80)
  l5: string; // high (over 80)
}

const PALETTES: Record<string, PaletteColors> = {
  purple: { l1: '#FAF5FF', l2: '#DDD6FE', l3: '#C4B5FD', l4: '#A78BFA', l5: '#7C3AED' },
  teal: { l1: '#F0FDFA', l2: '#CCFBF1', l3: '#99F6E4', l4: '#5EEAD4', l5: '#0F766E' },
  emerald: { l1: '#F0FDF4', l2: '#DCFCE7', l3: '#BBF7D0', l4: '#86EFAC', l5: '#064E3B' },
  carbon: { l1: '#F8FAFC', l2: '#E2E8F0', l3: '#CBD5E1', l4: '#94A3B8', l5: '#0F172A' },
  divergent: { l1: '#059669', l2: '#10B981', l3: '#F59E0B', l4: '#EF4444', l5: '#991B1B' }, // Vibrant Emerald Green to Deep Crimson Red
  sunrise: { l1: '#FEF3C7', l2: '#FDE68A', l3: '#F472B6', l4: '#E11D48', l5: '#BE185D' }, // Yellow to Pink
  sunset: { l1: '#FFEDD5', l2: '#FED7AA', l3: '#F97316', l4: '#EA580C', l5: '#991B1B' } // Orange to Red
};

interface BusStopMapProps {
  stops: BusStopRecord[];
  daScores: Record<string, any>;
  selectedStopId: string | null;
  mode: 'equal' | 'economic';
  is3dEnabled: boolean;
  isDirectoryOpen?: boolean;
  selectedGrades?: BusStopGrade[];
  selectedRouteGrades?: BusStopGrade[];
  activeDimensions: CimdDimensionKey[];
  showHeatmap?: boolean;
  showRoutes?: boolean;
  showStops?: boolean;
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
  selectedRouteGrades = ['A', 'B', 'C', 'D', 'E', 'Regional'],
  activeDimensions,
  showHeatmap = true,
  showRoutes = false,
  showStops = true,
  onSelectStop
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const heatmapPalette = useRouteStore((s) => s.heatmapPalette);

  // Helper to push stops data into Mapbox source
  const updateStopsSource = (map: mapboxgl.Map, currentStops: BusStopRecord[], currentMode: 'equal' | 'economic', currentGrades: BusStopGrade[] = []) => {
    const source = map.getSource('bus-stops') as mapboxgl.GeoJSONSource;
    if (!source || currentStops.length === 0) return;

    // Filter stops by selectedGrades
    const filteredStops = currentStops.filter((s: any) => {
      const grade = s.is_regional ? 'Regional' : (s.dynamicGrade || 'C');
      return currentGrades ? currentGrades.includes(grade as BusStopGrade) : true;
    });

    const features: GeoJSON.Feature[] = filteredStops.map((s: any) => {
      const score = s.is_regional ? 0 : (s.dynamicScore ?? s.equal_score);
      const percentile = s.is_regional ? 0 : (s.dynamicPercentile ?? s.equal_percentile ?? score);
      const grade = s.is_regional ? 'Regional' : (s.dynamicGrade || 'C');

      return {
        type: 'Feature',
        properties: {
          stop_id: s.stop_id,
          stop_name: s.stop_name,
          score,
          percentile,
          grade,
          is_regional: s.is_regional ? 1 : 0,
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
      map.setLayoutProperty('da-fill', 'visibility', 'none');
      return;
    }

    map.setLayoutProperty('da-fill', 'visibility', 'visible');

    const numDims = activeDimensions.length || 4;
    const dimWeight = 1 / numDims;

    const matchExpr: any[] = ['match', ['get', 'DAUID']];
    const colors = PALETTES[heatmapPalette] || PALETTES.divergent;

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

        let color = colors.l1;
        if (score >= 80) color = colors.l5;
        else if (score >= 65) color = colors.l4;
        else if (score >= 50) color = colors.l3;
        else if (score >= 35) color = colors.l2;
        else color = colors.l1;

        matchExpr.push(daId, color);
      });
      matchExpr.push('rgba(0, 0, 0, 0)');
    } else if (currentDaScores && Object.keys(currentDaScores).length > 0) {
      // 1. Calculate active CIMD score for every DA
      const daEntries: { daId: string; score: number }[] = [];
      Object.entries(currentDaScores).forEach(([daId, scores]: [string, any]) => {
        let val = 0;
        if (activeDimensions.includes('econ')) val += (scores.econ ?? scores.economic ?? 50) * dimWeight;
        if (activeDimensions.includes('res')) val += (scores.res ?? 50) * dimWeight;
        if (activeDimensions.includes('eth')) val += (scores.eth ?? scores.economic ?? 50) * dimWeight;
        if (activeDimensions.includes('sit')) val += (scores.sit ?? scores.economic ?? 50) * dimWeight;
        daEntries.push({ daId, score: val });
      });

      // 2. Compute 5-Tier Quantile Breakpoints (20%, 40%, 60%, 80%) across city DAs
      daEntries.sort((a, b) => a.score - b.score);
      const N = daEntries.length || 1;
      const q20 = daEntries[Math.floor(N * 0.20)]?.score ?? 20;
      const q40 = daEntries[Math.floor(N * 0.40)]?.score ?? 40;
      const q60 = daEntries[Math.floor(N * 0.60)]?.score ?? 60;
      const q80 = daEntries[Math.floor(N * 0.80)]?.score ?? 80;

      // 3. Map high-contrast quantile colors
      daEntries.forEach(({ daId, score }) => {
        let color = colors.l1;
        if (score >= q80) color = colors.l5;       // Top 20% Highest Need -> Deep Crimson Red
        else if (score >= q60) color = colors.l4; // 60-80% -> Coral Red
        else if (score >= q40) color = colors.l3; // 40-60% -> Amber Yellow
        else if (score >= q20) color = colors.l2; // 20-40% -> Teal Green
        else color = colors.l1;                  // Bottom 20% Lowest Need -> Emerald Green

        matchExpr.push(daId, color);
      });
      matchExpr.push('#F8FAFC');
    } else {
      map.setPaintProperty('da-fill', 'fill-color', '#F8FAFC');
      return;
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
          'fill-opacity': 0.80,
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
          'fill-opacity': 0.25,
        },
      });

      map.addLayer({
        id: 'buffer-line',
        type: 'line',
        source: 'selected-buffer',
        paint: {
          'line-color': '#6D28D9',
          'line-width': 2.5,
        },
      });

      // 3. Add Transit Routes Line Source & Layer
      map.addSource('transit-routes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'transit-routes-lines',
        type: 'line',
        source: 'transit-routes',
        paint: {
          'line-width': 3,
          'line-color': [
            'case',
            ['==', ['get', 'is_regional'], 1], '#94A3B8', // Dark gray for regional routes
            [
              'match',
              ['get', 'grade'],
              'A', '#10B981',
              'B', '#3B82F6',
              'C', '#F59E0B',
              'D', '#F97316',
              'E', '#EF4444',
              '#3B82F6'
            ]
          ],
          'line-opacity': 0.85
        },
        layout: {
          'visibility': showRoutes ? 'visible' : 'none'
        }
      });

      // 4. Add Bus Stops Source & Circle Point Layer
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
        layout: {
          'visibility': showStops ? 'visible' : 'none'
        },
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

  // Update stops source, route lines source, and layer visibility when props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const targetStop = stops.find((s) => s.stop_id === selectedStopId) || null;

    const applyUpdates = () => {
      // 1. Update Bus Stops Layer & Visibility
      if (map.getLayer('bus-stop-points')) {
        map.setLayoutProperty('bus-stop-points', 'visibility', showStops ? 'visible' : 'none');
      }
      if (showStops) {
        updateStopsSource(map, stops, mode, selectedGrades);
      } else {
        const sSource = map.getSource('bus-stops') as mapboxgl.GeoJSONSource;
        if (sSource) sSource.setData({ type: 'FeatureCollection', features: [] });
      }

      // 2. Update DA Heatmap
      updateDaHeatmap(map, daScores, targetStop);

      // 3. Update Transit Routes Layer & Visibility
      if (map.getLayer('transit-routes-lines')) {
        map.setLayoutProperty('transit-routes-lines', 'visibility', showRoutes ? 'visible' : 'none');
      }

      if (showRoutes) {
        fetch('/data/golden_route_record.json')
          .then((res) => res.json())
          .then((data) => {
            if (!data || !data.routes) return;

            const numDims = activeDimensions.length || 4;
            const dimWeight = 1 / numDims;

            // 1. Process dynamic route scores directly from bus stop catchments serving each corridor
            const routeStopScores: Record<string, { totalScore: number; totalPop: number }> = {};

            stops.forEach((s) => {
              const eqScore = s.equal_score || 50;
              // If stop is served by routes or we match stop catchments
              const daList = s.das || [];
              let stopVal = 0;
              if (daList.length > 0) {
                daList.forEach((d: any) => {
                  let val = 0;
                  if (activeDimensions.includes('econ')) val += (d.econ ?? d.economic_score ?? 50) * dimWeight;
                  if (activeDimensions.includes('res')) val += (d.res ?? 50) * dimWeight;
                  if (activeDimensions.includes('eth')) val += (d.eth ?? 50) * dimWeight;
                  if (activeDimensions.includes('sit')) val += (d.sit ?? 50) * dimWeight;
                  stopVal += val * (d.pct / 100.0);
                });
              } else {
                stopVal = eqScore;
              }
              (s as any)._activeVal = stopVal;
            });

            const evaluatedRoutes = data.routes.map((r: any) => {
              const shortName = String(r.short_name || r.route_id || '').trim();

              // Regional route check — EXCLUDE St. Albert, Strathcona, Spruce Grove, Leduc, Beaumont
              // KEEP Route 747 (Airport Express) as municipal!
              const isRegional = 
                shortName !== '747' && (
                  shortName.startsWith('A') ||
                  shortName.startsWith('L') ||
                  shortName.startsWith('4') ||
                  ['201','202','203','204','208','211','401','411','413','414','540','560'].includes(shortName)
                );

              if (isRegional) {
                return { ...r, dynamicScore: 0, dynamicGrade: 'Regional', isRegional: true };
              }

              // Compute dynamic CIMD score across served DAs for this route
              let scoreSum = 0;
              let popSum = 0;
              if (r.da_metadata && r.da_metadata.length > 0) {
                r.da_metadata.forEach((daItem: any) => {
                  let s = 0;
                  if (activeDimensions.includes('econ')) s += (daItem.econ ?? daItem.economic ?? 50) * dimWeight;
                  if (activeDimensions.includes('res')) s += (daItem.res ?? 50) * dimWeight;
                  if (activeDimensions.includes('eth')) s += (daItem.eth ?? 50) * dimWeight;
                  if (activeDimensions.includes('sit')) s += (daItem.sit ?? 50) * dimWeight;

                  const p = daItem.pop || 100;
                  scoreSum += s * p;
                  popSum += p;
                });
              }

              const dynamicScore = popSum > 0 ? (scoreSum / popSum) : (r.pillar_1_vulnerability || 50);
              return { ...r, dynamicScore, isRegional: false };
            });

            // 2. Rank municipal routes: HIGH VULNERABILITY SCORE = GRADE A (Emerald Green)
            const municipalRoutes = evaluatedRoutes.filter((r: any) => !r.isRegional);
            municipalRoutes.sort((a: any, b: any) => b.dynamicScore - a.dynamicScore); // DESCENDING order so highest score = rank 0 (Grade A)
            const nMuni = municipalRoutes.length || 1;

            municipalRoutes.forEach((r: any, idx: number) => {
              const percentile = ((nMuni - 1 - idx) / (nMuni - 1 || 1)) * 100.0;
              let g = 'E';
              if (percentile >= 80.0) g = 'A';       // Top 20% highest vulnerability -> Grade A (Emerald Green)
              else if (percentile >= 60.0) g = 'B'; // Next 20% -> Grade B (Royal Blue)
              else if (percentile >= 40.0) g = 'C'; // Middle 20% -> Grade C (Amber)
              else if (percentile >= 20.0) g = 'D'; // Lower 20% -> Grade D (Orange)
              else g = 'E';                         // Lowest 20% vulnerability -> Grade E (Red)
              r.dynamicGrade = g;
            });

            // 3. Build Mapbox GeoJSON Features
            const routeFeatures = evaluatedRoutes
              .filter((r: any) => {
                const g = r.dynamicGrade || 'C';
                return selectedRouteGrades ? selectedRouteGrades.includes(g as any) : true;
              })
              .map((r: any) => ({
                type: 'Feature',
                properties: {
                  route_id: r.route_id,
                  short_name: r.short_name,
                  name: r.name,
                  grade: r.dynamicGrade || 'C',
                  is_regional: r.isRegional ? 1 : 0
                },
                geometry: {
                  type: 'LineString',
                  coordinates: (r.coords || []).map((c: any) => [c[1], c[0]])
                }
              }));

            const rSource = map.getSource('transit-routes') as mapboxgl.GeoJSONSource;
            if (rSource) {
              rSource.setData({
                type: 'FeatureCollection',
                features: routeFeatures
              });
            }
          })
          .catch((err) => console.error("Failed to load golden route records for map layer:", err));
      } else {
        const rSource = map.getSource('transit-routes') as mapboxgl.GeoJSONSource;
        if (rSource) {
          rSource.setData({
            type: 'FeatureCollection',
            features: []
          });
        }
      }
    };

    if (map.isStyleLoaded()) {
      applyUpdates();
    } else {
      map.once('load', applyUpdates);
    }
  }, [stops, mode, daScores, selectedGrades, selectedRouteGrades, selectedStopId, activeDimensions, showHeatmap, showRoutes, showStops, heatmapPalette]);

  // Handle Selected Stop & 400m Buffer Circle Rendering
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const renderBuffer = () => {
      const source = map.getSource('selected-buffer') as mapboxgl.GeoJSONSource;
      const targetStop = stops.find((s) => s.stop_id === selectedStopId) || null;

      updateDaHeatmap(map, daScores, targetStop);

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
  }, [selectedStopId, stops, daScores, mode, heatmapPalette]);

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
