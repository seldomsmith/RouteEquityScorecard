"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { RoutePoint } from '@/components/charts/EquityQuadrant';
import { useRouteStore, MetricKey } from '@/store/routeStore';
import { METRICS } from '@/components/charts/EquityMatrix';
import { mapStabilityClass } from '@/utils/stability';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' + '.55Khr0Cuwie_8YBv_QPfsA';

const GRADE_COLORS: Record<string, string> = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#F97316',
  E: '#EF4444',
};

const STABILITY_COLORS: Record<string, string> = {
  'Essential Equity Routes': '#3B82F6', // Blue
  'Low Equity-Priority Routes': '#10B981', // Emerald
  'High Swing Routes': '#EF4444', // Red
  'Moderate Swing Routes': '#F59E0B', // Yellow
};

const METRIC_GRADIENTS: Record<MetricKey, string> = {
  composite: 'linear-gradient(to right, #F0FDFA, #CCFBF1, #99F6E4, #2DD4BF, #0D9488, #0F766E)',
  low_income_pct: 'linear-gradient(to right, #FEF2F2, #FEE2E2, #FCA5A5, #F87171, #EF4444, #B91C1C)',
  minority_pct: 'linear-gradient(to right, #FFFBEB, #FEF3C7, #FDE68A, #FBBF24, #F59E0B, #B45309)',
  senior_pct: 'linear-gradient(to right, #F5F3FF, #EDE9FE, #DDD6FE, #A78BFA, #8B5CF6, #6D28D9)',
  lone_parent_pct: 'linear-gradient(to right, #FDF2F8, #FCE7F3, #FBCFE8, #F472B6, #EC4899, #BE185D)',
  recent_immigrant_pct: 'linear-gradient(to right, #ECFDF5, #D1FAE5, #A7F3D0, #34D399, #059669, #047857)',
  youth_pct: 'linear-gradient(to right, #EEF2FF, #E0E7FF, #C7D2FE, #818CF8, #6366F1, #4338CA)',
};

const GRADE_GRADIENTS: Record<string, string> = {
  A: 'linear-gradient(to right, #ECFDF5, #D1FAE5, #A7F3D0, #34D399, #059669, #064E3B)',
  B: 'linear-gradient(to right, #EFF6FF, #DBEAFE, #BFDBFE, #60A5FA, #2563EB, #1E3A8A)',
  C: 'linear-gradient(to right, #FFFDF5, #FEF3C7, #FDE68A, #FBBF24, #D97706, #78350F)',
  D: 'linear-gradient(to right, #FFF7ED, #FFEDD5, #FED7AA, #FB923C, #EA580C, #7C2D12)',
  E: 'linear-gradient(to right, #FEF2F2, #FEE2E2, #FCA5A5, #F87171, #DC2626, #7F1D1D)',
};

function getHeatmapPropertyKey(metric: MetricKey): string {
  return metric === 'composite' ? 'vulnerability_index' : metric;
}

function getGradeHeatmapFillColorExpression(grade: string, metric: MetricKey): any[] {
  const prop = getHeatmapPropertyKey(metric);
  switch (grade) {
    case 'A':
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#ECFDF5',
        20,  '#D1FAE5',
        40,  '#A7F3D0',
        60,  '#34D399',
        80,  '#059669',
        100, '#064E3B'
      ];
    case 'B':
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#EFF6FF',
        20,  '#DBEAFE',
        40,  '#BFDBFE',
        60,  '#60A5FA',
        80,  '#2563EB',
        100, '#1E3A8A'
      ];
    case 'C':
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#FFFDF5',
        20,  '#FEF3C7',
        40,  '#FDE68A',
        60,  '#FBBF24',
        80,  '#D97706',
        100, '#78350F'
      ];
    case 'D':
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#FFF7ED',
        20,  '#FFEDD5',
        40,  '#FED7AA',
        60,  '#FB923C',
        80,  '#EA580C',
        100, '#7C2D12'
      ];
    case 'E':
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#FEF2F2',
        20,  '#FEE2E2',
        40,  '#FCA5A5',
        60,  '#F87171',
        80,  '#DC2626',
        100, '#7F1D1D'
      ];
    default:
      return getHeatmapFillColorExpression(metric);
  }
}


function getHeatmapFillColorExpression(metric: MetricKey): any[] {
  const prop = getHeatmapPropertyKey(metric);
  switch (metric) {
    case 'composite':
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#F0FDFA',
        20,  '#CCFBF1',
        40,  '#99F6E4',
        60,  '#2DD4BF',
        80,  '#0D9488',
        100, '#0F766E'
      ];
    case 'low_income_pct':
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#FEF2F2',
        20,  '#FEE2E2',
        40,  '#FCA5A5',
        60,  '#F87171',
        80,  '#EF4444',
        100, '#B91C1C'
      ];
    case 'minority_pct':
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#FFFBEB',
        20,  '#FEF3C7',
        40,  '#FDE68A',
        60,  '#FBBF24',
        80,  '#F59E0B',
        100, '#B45309'
      ];
    case 'senior_pct':
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#F5F3FF',
        20,  '#EDE9FE',
        40,  '#DDD6FE',
        60,  '#A78BFA',
        80,  '#8B5CF6',
        100, '#6D28D9'
      ];
    case 'lone_parent_pct':
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#FDF2F8',
        20,  '#FCE7F3',
        40,  '#FBCFE8',
        60,  '#F472B6',
        80,  '#EC4899',
        100, '#BE185D'
      ];
    case 'recent_immigrant_pct':
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#ECFDF5',
        20,  '#D1FAE5',
        40,  '#A7F3D0',
        60,  '#34D399',
        80,  '#059669',
        100, '#047857'
      ];
    case 'youth_pct':
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#EEF2FF',
        20,  '#E0E7FF',
        40,  '#C7D2FE',
        60,  '#818CF8',
        80,  '#6366F1',
        100, '#4338CA'
      ];
    default:
      return [
        'interpolate', ['linear'], ['get', prop],
        0,   '#F8FAFC',
        100, '#64748B'
      ];
  }
}

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
  const activeMetric = useRouteStore((s) => s.activeMetric);
  
  const mapFilterMode = useRouteStore((s) => s.mapFilterMode);
  const selectedStabilityClasses = useRouteStore((s) => s.selectedStabilityClasses);
  const toggleStabilityClass = useRouteStore((s) => s.toggleStabilityClass);
  const disabledWeights = useRouteStore((s) => s.disabledWeights);
  const is2PillarActive = disabledWeights.includes('resilience') && disabledWeights.includes('monopoly');
  const [is3DEnabled, setIs3DEnabled] = useState(false);



  const selectedRouteData = routes.find((r) => r.route_id === selectedRoute);
  const selectedRouteGrade = selectedRouteData?.grade || null;
  
  const activeMetricRef = useRef<MetricKey>(activeMetric);
  useEffect(() => {
    activeMetricRef.current = activeMetric;
  }, [activeMetric]);

  const mapFilterModeRef = useRef(mapFilterMode);
  useEffect(() => {
    mapFilterModeRef.current = mapFilterMode;
  }, [mapFilterMode]);

  const [daGeoJson, setDaGeoJson] = useState<any>(null);
  const [odtGeoJson, setOdtGeoJson] = useState<any>(null);
  const [showOdtZones, setShowOdtZones] = useState(true);

  // Fetch DA boundaries GeoJSON once
  useEffect(() => {
    fetch('/data/da_boundaries_simple.geojson')
      .then((res) => res.json())
      .then((data) => {
        setDaGeoJson(data);
      })
      .catch((err) => console.error("❌ Failed to load DA boundaries", err));
  }, []);

  // Fetch ODT boundaries GeoJSON once
  useEffect(() => {
    fetch('/data/odt_zones.geojson')
      .then((res) => res.json())
      .then((data) => {
        setOdtGeoJson(data);
      })
      .catch((err) => console.error("❌ Failed to load ODT boundaries", err));
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
      projection: { name: 'mercator' },
      cooperativeGestures: false
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
            stability_class: mapStabilityClass((r as any).stability_class || 'Moderate Stability'),
            stability_class_2_pillar: mapStabilityClass((r as any).stability_class_2_pillar || 'Moderate Stability'),
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

      // Add ODT Zones source and layers
      map.current!.addSource('odt-zones', {
        type: 'geojson',
        data: odtGeoJson || { type: 'FeatureCollection', features: [] },
      });

      map.current!.addLayer({
        id: 'odt-zones-fill',
        type: 'fill',
        source: 'odt-zones',
        paint: {
          'fill-color': '#0D9488',
          'fill-opacity': 0.12,
        },
        layout: {
          visibility: showOdtZones ? 'visible' : 'none',
        },
      });

      map.current!.addLayer({
        id: 'odt-zones-line',
        type: 'line',
        source: 'odt-zones',
        paint: {
          'line-color': '#0F766E',
          'line-width': 1.5,
          'line-dasharray': [3, 3],
        },
        layout: {
          visibility: showOdtZones ? 'visible' : 'none',
        },
      });

      map.current!.addLayer({
        id: 'da-heatmap-layer',
        type: 'fill',
        source: 'da-heatmap',
        paint: {
          'fill-color': getHeatmapFillColorExpression(activeMetric),
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

      map.current!.addSource('isochrone', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current!.addLayer({
        id: 'isochrone-fill',
        type: 'fill',
        source: 'isochrone',
        paint: {
          'fill-color': '#0F766E',
          'fill-opacity': 0.18,
        },
      });

      map.current!.addLayer({
        id: 'isochrone-line',
        type: 'line',
        source: 'isochrone',
        paint: {
          'line-color': '#0F766E',
          'line-width': 1.5,
          'line-opacity': 0.7,
          'line-dasharray': [2, 2],
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
          'line-color': [
            'match', ['get', 'grade'],
            'A', GRADE_COLORS.A,
            'B', GRADE_COLORS.B,
            'C', GRADE_COLORS.C,
            'D', GRADE_COLORS.D,
            'E', GRADE_COLORS.E,
            '#94A3B8'
          ],
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
          const state = useRouteStore.getState();
          const isStability = state.mapFilterMode === 'stability';
          const is2P = state.disabledWeights.includes('resilience') && state.disabledWeights.includes('monopoly');
          const stabilityClass = is2P ? props.stability_class_2_pillar : props.stability_class;
          const detailText = isStability
            ? `${stabilityClass} · Score ${Number(props.composite_score).toFixed(1)}`
            : `Grade ${props.grade} · Score ${Number(props.composite_score).toFixed(1)}`;
          popup
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font:600 12px Inter,sans-serif;color:#1E293B">${props.short_name} — ${props.name}</div><div style="font:500 10px Inter,sans-serif;color:#64748B">${detailText}</div>`)
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
          const currentMetric = activeMetricRef.current;
          
          const vIndex = Number(props.vulnerability_index || 0).toFixed(1);
          const pop = Number(props.pop || 0).toLocaleString();
          const lowInc = Number(props.low_income_pct || 0).toFixed(1);
          const minority = Number(props.minority_pct || 0).toFixed(1);
          const senior = Number(props.senior_pct || 0).toFixed(1);
          const loneParent = Number(props.lone_parent_pct || 0).toFixed(1);
          const recentImmigrant = Number(props.recent_immigrant_pct || 0).toFixed(1);
          const youth = Number(props.youth_pct || 0).toFixed(1);

          const getHighlightStyle = (key: string) => {
            if (key === currentMetric) {
              const m = METRICS.find(item => item.key === key);
              const color = m ? m.color : '#0F766E';
              return `style="color:${color};font-weight:bold;background-color:rgba(0,0,0,0.04);padding:1px 4px;border-radius:3px;"`;
            }
            return '';
          };

          const getLabelStyle = (key: string) => {
            if (key === currentMetric) {
              return `style="font-weight:700;color:#1E293B;"`;
            }
            return '';
          };

          daPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font:600 12px Inter,sans-serif;color:#1E293B;margin-bottom:6px;font-weight:bold;border-bottom:1px solid #E2E8F0;padding-bottom:4px;">DA: ${props.DAUID} ${props.neighbourhood ? `(${props.neighbourhood})` : ''}</div>
              <div style="font:500 10px Inter,sans-serif;color:#475569;display:grid;grid-template-columns:auto auto;gap:4px 12px;align-items:center;">
                <span ${getLabelStyle('composite')}>Transit Vulnerability (V_i):</span>
                <strong ${getHighlightStyle('composite')}>${vIndex}</strong>
                
                <span>Population:</span>
                <strong>${pop}</strong>
                
                <div style="grid-column: span 2; border-top: 1px solid #F1F5F9; margin: 2px 0;"></div>

                <span ${getLabelStyle('low_income_pct')}>Low Income:</span>
                <strong ${getHighlightStyle('low_income_pct')}>${lowInc}%</strong>
                
                <span ${getLabelStyle('minority_pct')}>Visible Minority:</span>
                <strong ${getHighlightStyle('minority_pct')}>${minority}%</strong>
                
                <span ${getLabelStyle('senior_pct')}>Seniors:</span>
                <strong ${getHighlightStyle('senior_pct')}>${senior}%</strong>
                
                <span ${getLabelStyle('lone_parent_pct')}>Lone Parents:</span>
                <strong ${getHighlightStyle('lone_parent_pct')}>${loneParent}%</strong>
                
                <span ${getLabelStyle('recent_immigrant_pct')}>Recent Immigrants:</span>
                <strong ${getHighlightStyle('recent_immigrant_pct')}>${recentImmigrant}%</strong>
                
                <span ${getLabelStyle('youth_pct')}>Youth (15-24):</span>
                <strong ${getHighlightStyle('youth_pct')}>${youth}%</strong>
              </div>
            `)
            .addTo(map.current!);
        }
      });
      map.current!.on('mouseleave', 'da-heatmap-layer', () => {
        map.current!.getCanvas().style.cursor = '';
        daPopup.remove();
      });

      // Hover tooltip for ODT Zones
      const odtPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });
      map.current!.on('mouseenter', 'odt-zones-fill', (e) => {
        if (e.features?.[0]) {
          map.current!.getCanvas().style.cursor = 'pointer';
          const props = e.features[0].properties!;
          odtPopup
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font:700 11px Inter,sans-serif;color:#0F766E;text-transform:uppercase;letter-spacing:0.05em">On Demand Transit Zone</div><div style="font:600 12px Inter,sans-serif;color:#1E293B">${props.neighbourhood || 'Edmonton Area'}</div>`)
            .addTo(map.current!);
        }
      });
      map.current!.on('mouseleave', 'odt-zones-fill', () => {
        map.current!.getCanvas().style.cursor = '';
        odtPopup.remove();
      });

      routesAdded.current = true;
    };

    if (map.current.isStyleLoaded()) {
      addRoutes();
    } else {
      map.current.on('load', addRoutes);
    }
  }, [routes, setSelectedRoute]);

  // Reactive Effect to Toggle 3D View (Pitch, Bearing, and Buildings Extrusion)
  useEffect(() => {
    if (!map.current) return;
    try {
      if (is3DEnabled) {
        map.current.easeTo({
          pitch: 45,
          bearing: -15,
          duration: 1000
        });

        if (!map.current.getLayer('3d-buildings')) {
          map.current.addLayer({
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': '#e2e8f0',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.55,
            },
          });
        }
      } else {
        map.current.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 1000
        });

        if (map.current.getLayer('3d-buildings')) {
          map.current.removeLayer('3d-buildings');
        }
      }
    } catch (err) {
      console.warn('Error applying 3D map transformations:', err);
    }
  }, [is3DEnabled]);


  // Toggle ODT Zones layer visibility
  useEffect(() => {
    if (!map.current) return;
    const visibility = showOdtZones ? 'visible' : 'none';
    try {
      if (map.current.getLayer('odt-zones-fill')) {
        map.current.setLayoutProperty('odt-zones-fill', 'visibility', visibility);
      }
      if (map.current.getLayer('odt-zones-line')) {
        map.current.setLayoutProperty('odt-zones-line', 'visibility', visibility);
      }
    } catch (e) {
      console.warn('Could not toggle ODT layer visibility:', e);
    }
  }, [showOdtZones]);

  // Update ODT Zones source when geojson is loaded
  useEffect(() => {
    if (!map.current || !odtGeoJson) return;
    try {
      const source = map.current.getSource('odt-zones') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(odtGeoJson);
      }
    } catch (e) {
      // Source might not exist yet during style load
    }
  }, [odtGeoJson]);

  // ⚡ Reactive DA Heatmap paint update — transitions color scales on activeMetric toggle, route selection, or grade change
  useEffect(() => {
    if (!map.current || !routesAdded.current) return;
    try {
      const paintExpression = selectedRouteGrade
        ? getGradeHeatmapFillColorExpression(selectedRouteGrade, activeMetric)
        : getHeatmapFillColorExpression(activeMetric);

      map.current.setPaintProperty(
        'da-heatmap-layer',
        'fill-color',
        paintExpression
      );
    } catch (e) {
      console.warn("Could not update fill-color paint property", e);
    }
  }, [activeMetric, selectedRouteGrade]);

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
            stability_class: mapStabilityClass((r as any).stability_class || 'Moderate Stability'),
            stability_class_2_pillar: mapStabilityClass((r as any).stability_class_2_pillar || 'Moderate Stability'),
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

  // ⚡ Dynamic Isochrone Loader & Style Matcher
  useEffect(() => {
    if (!map.current || !routesAdded.current) return;

    const source = map.current.getSource('isochrone') as mapboxgl.GeoJSONSource;
    if (!source) return;

    if (!selectedRoute) {
      // No route selected, clear isochrone geometry
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    let active = true;

    // Fetch walk catchment isochrone GeoJSON dynamically
    fetch(`/data/isochrones/${selectedRoute}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Isochrone not found for route ${selectedRoute}`);
        return res.json();
      })
      .then((data) => {
        if (active) {
          source.setData(data);
          
          // Apply dynamic grade color matching immediately
          const gradeColor = selectedRouteGrade ? (GRADE_COLORS[selectedRouteGrade] || '#0F766E') : '#0F766E';
          map.current!.setPaintProperty('isochrone-fill', 'fill-color', gradeColor);
          map.current!.setPaintProperty('isochrone-line', 'line-color', gradeColor);
        }
      })
      .catch((err) => {
        if (active) {
          console.warn(`[Isochrone] Could not load or parse isochrone for route ${selectedRoute}:`, err);
          source.setData({ type: 'FeatureCollection', features: [] });
        }
      });

    return () => {
      active = false;
    };
  }, [selectedRoute, selectedRouteGrade]);

  // Hot-swap route colors when filter mode changes or 2-pillar mode shifts
  useEffect(() => {
    if (!map.current || !routesAdded.current) return;
    try {
      const stabilityKey = is2PillarActive ? 'stability_class_2_pillar' : 'stability_class';
      const lineExpr = mapFilterMode === 'stability'
        ? [
            'match', ['get', stabilityKey],
            'Essential Equity Routes', STABILITY_COLORS['Essential Equity Routes'],
            'Low Equity-Priority Routes', STABILITY_COLORS['Low Equity-Priority Routes'],
            'High Swing Routes', STABILITY_COLORS['High Swing Routes'],
            'Moderate Swing Routes', STABILITY_COLORS['Moderate Swing Routes'],
            '#94A3B8'
          ]
        : [
            'match', ['get', 'grade'],
            'A', GRADE_COLORS.A,
            'B', GRADE_COLORS.B,
            'C', GRADE_COLORS.C,
            'D', GRADE_COLORS.D,
            'E', GRADE_COLORS.E,
            '#94A3B8'
          ];
      
      map.current.setPaintProperty('routes-line', 'line-color', lineExpr);
      map.current.setPaintProperty('routes-highlight', 'line-color', lineExpr);
    } catch (e) {
      console.warn("Could not update route line color paint property", e);
    }
  }, [mapFilterMode, is2PillarActive]);

  // Apply filters (Grade or Stability) to map layers
  useEffect(() => {
    if (!map.current || !routesAdded.current) return;
    try {
      const stabilityKey = is2PillarActive ? 'stability_class_2_pillar' : 'stability_class';
      if (mapFilterMode === 'stability') {
        if (selectedStabilityClasses.length > 0) {
          map.current.setFilter('routes-line', ['in', ['get', stabilityKey], ['literal', selectedStabilityClasses]]);
          map.current.setFilter('routes-highlight', [
            'all',
            ['==', ['get', 'route_id'], selectedRoute || ''],
            ['in', ['get', stabilityKey], ['literal', selectedStabilityClasses]]
          ]);
        } else {
          map.current.setFilter('routes-line', null);
          map.current.setFilter('routes-highlight', ['==', ['get', 'route_id'], selectedRoute || '']);
        }
      } else {
        if (selectedGrade) {
          map.current.setFilter('routes-line', ['==', ['get', 'grade'], selectedGrade]);
          map.current.setFilter('routes-highlight', [
            'all',
            ['==', ['get', 'route_id'], selectedRoute || ''],
            ['==', ['get', 'grade'], selectedGrade],
          ]);
        } else {
          map.current.setFilter('routes-line', null);
          map.current.setFilter('routes-highlight', ['==', ['get', 'route_id'], selectedRoute || '']);
        }
      }
    } catch (e) {
      // Layers may not exist yet on first render
    }
  }, [selectedGrade, selectedRoute, mapFilterMode, selectedStabilityClasses, is2PillarActive]);

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
      // Both keys are coerced to string — GeoJSON DAUID is numeric, da_data.id is already a string.
      const daMap = new Map(selectedRouteData.da_data.map((d: any) => [String(d.id), d]));

      console.log(`[Heatmap] Route ${selectedRoute} has ${selectedRouteData.da_data.length} DAs. Sample id: ${selectedRouteData.da_data[0]?.id}`);

      // Filter and enrich the geojson features
      const servedDaFeatures = daGeoJson.features
        .filter((f: any) => daMap.has(String(f.properties?.DAUID)))
        .map((f: any) => {
          const daInfo = daMap.get(String(f.properties.DAUID))!;
          
          // Compute dynamic fallback for vulnerability_index if undefined
          const lowIncome = Number(daInfo.low_income_pct || 0);
          const minority = Number(daInfo.minority_pct || 0);
          const senior = Number(daInfo.senior_pct || 0);
          
          const vIndex = (daInfo.vulnerability_index !== undefined && daInfo.vulnerability_index !== null)
            ? Number(daInfo.vulnerability_index)
            : (lowIncome + minority + senior) / 3;

          return {
            ...f,
            properties: {
              ...f.properties,
              vulnerability_index: vIndex,
              pop: Number(daInfo.pop || 0),
              low_income_pct: lowIncome,
              minority_pct: minority,
              senior_pct: senior,
              lone_parent_pct: Number(daInfo.lone_parent_pct || 0),
              recent_immigrant_pct: Number(daInfo.recent_immigrant_pct || 0),
              youth_pct: Number(daInfo.youth_pct || 0),
              neighbourhood: String((daInfo as any).neighbourhood || ''),
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
        <div className="flex gap-2">
          <button
            onClick={() => setIs3DEnabled(!is3DEnabled)}
            className={`backdrop-blur-md border p-2 rounded-lg shadow-sm transition-all flex items-center gap-2 text-xs font-bold ${
              is3DEnabled
                ? 'bg-slate-800 border-slate-800 text-white hover:bg-slate-900'
                : 'bg-white/90 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle 3D View"
          >
            <span className={is3DEnabled ? 'text-white' : 'text-slate-600'}>3D</span>
          </button>

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
        </div>


        <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-lg mt-1 text-right min-w-[180px]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Population Served</p>
            <p className="text-3xl font-black text-slate-900 tabular-nums">
              {systemPopServed !== null ? systemPopServed.toLocaleString() : "..."}
            </p>
        </div>
      </div>

      {/* Clickable Map Legend */}
      <div className="absolute bottom-6 right-6 z-10 bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-lg flex flex-col gap-2 min-w-[140px]">
        {mapFilterMode === 'grade' ? (
          <>
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
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Stability Filter
              </span>
              {selectedStabilityClasses.length > 0 && (
                <button
                  onClick={() => useRouteStore.setState({ selectedStabilityClasses: [] })}
                  className="text-[8px] font-semibold text-brand-rose-500 hover:text-brand-rose-600 uppercase tracking-wider"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {([
                { name: 'Essential Equity Routes', key: 'Essential Equity Routes' },
                { name: 'Low Equity-Priority Routes', key: 'Low Equity-Priority Routes' },
                { name: 'High Swing Routes', key: 'High Swing Routes' },
                { name: 'Moderate Swing Routes', key: 'Moderate Swing Routes' }
              ] as const).map((cls) => {
                const isActive = selectedStabilityClasses.includes(cls.key);
                return (
                  <button
                    key={cls.key}
                    onClick={() => toggleStabilityClass(cls.key)}
                    className={`flex items-center gap-2 text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all border text-left
                      ${isActive 
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'text-slate-600 bg-white/50 border-slate-100 hover:bg-slate-50'
                      }`}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: STABILITY_COLORS[cls.key] }}
                    />
                    {cls.name}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* On Demand Transit Toggle */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
          <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-slate-600">
            <input 
              type="checkbox"
              checked={showOdtZones}
              onChange={(e) => setShowOdtZones(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-brand-teal-600 focus:ring-brand-teal-500 cursor-pointer"
            />
            ODT Zones Overlay
          </label>
        </div>

        {/* Heatmap Legend (only visible when a route is isolated and heatmap is shown) */}
        {selectedRoute && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
              {METRICS.find((m) => m.key === activeMetric)?.label || 'Served DA Equity'}
            </span>
            <div 
              className="h-2 w-full rounded-full border border-slate-200/50" 
              style={{ background: selectedRouteGrade ? (GRADE_GRADIENTS[selectedRouteGrade] || METRIC_GRADIENTS[activeMetric]) : METRIC_GRADIENTS[activeMetric] }} 
            />
            <div className="flex justify-between text-[8px] font-mono text-slate-400">
              <span>0% (Low)</span>
              <span>100% (High)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapInner;
