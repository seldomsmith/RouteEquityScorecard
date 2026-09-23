"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' + '.55Khr0Cuwie_8YBv_QPfsA';

interface StopCatchmentAnimationMapProps {
  routeData?: any;
  daGeoJson?: any;
}

// Distance from point P to line segment AB in meters
function distanceToSegmentMeters(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const midLat = ((ay + by) / 2) * (Math.PI / 180);
  const cosLat = Math.cos(midLat);

  // Convert degrees delta to approximate meters
  const dx = (bx - ax) * 111320 * cosLat;
  const dy = (by - ay) * 110574;
  const dpx = (px - ax) * 111320 * cosLat;
  const dpy = (py - ay) * 110574;

  const segLenSq = dx * dx + dy * dy;
  if (segLenSq === 0) {
    return Math.sqrt(dpx * dpx + dpy * dpy);
  }

  const t = Math.max(0, Math.min(1, (dpx * dx + dpy * dy) / segLenSq));
  const projX = ax * 111320 * cosLat + t * dx;
  const projY = ay * 110574 + t * dy;

  const curX = px * 111320 * cosLat;
  const curY = py * 110574;

  const distX = curX - projX;
  const distY = curY - projY;
  return Math.sqrt(distX * distX + distY * distY);
}

// Check minimum distance from point to a polyline
function minDistanceToPolylineMeters(
  point: [number, number], // [lon, lat]
  lineCoords: [number, number][] // array of [lon, lat]
): number {
  let minD = Infinity;
  for (let i = 0; i < lineCoords.length - 1; i++) {
    const d = distanceToSegmentMeters(
      point[0],
      point[1],
      lineCoords[i][0],
      lineCoords[i][1],
      lineCoords[i + 1][0],
      lineCoords[i + 1][1]
    );
    if (d < minD) {
      minD = d;
      if (minD < 5) break; // Early exit if right on the line
    }
  }
  return minD;
}

export const StopCatchmentAnimationMap: React.FC<StopCatchmentAnimationMapProps> = ({
  routeData,
  daGeoJson
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Route coordinates ([lat, lng])
    const coords = routeData?.coords || [
      [53.541, -113.495],
      [53.543, -113.480],
      [53.546, -113.460],
      [53.548, -113.435],
      [53.550, -113.410]
    ];

    // Convert to [lng, lat] for Mapbox
    const lineCoordinates: [number, number][] = coords.map((c: any) => [c[1], c[0]]);

    // Calculate bounding box for clean centering
    const bounds = new mapboxgl.LngLatBounds();
    lineCoordinates.forEach((c) => bounds.extend(c));

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      bounds: bounds,
      fitBoundsOptions: { padding: 45, maxZoom: 13.5 },
      interactive: true,
      attributionControl: false
    });

    mapRef.current = map;

    // Popup for hover inspection
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: 'stop-catchment-tooltip'
    });

    map.on('load', () => {
      if (!mapRef.current) return;

      // 1. Add DA boundaries source if available
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

      // 2. Add Route Line Source & Layers
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

      // 3. Add Bus Stop Points Source (empty initially, populated from real dataset)
      map.addSource('stop-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // 400m Walk Circles (visualized as calibrated buffer circles)
      map.addLayer({
        id: 'stop-catchment-circles',
        type: 'circle',
        source: 'stop-points',
        paint: {
          // Dynamic scaling: ~400m walk catchment radius across typical zoom levels
          'circle-radius': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            10, 8,
            12, 28,
            13, 56,
            14, 112,
            15, 224
          ],
          'circle-color': '#3b82f6',
          'circle-opacity': 0.16,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#2563eb'
        }
      });

      // Actual Bus Stop Core Dots
      map.addLayer({
        id: 'stop-point-dots',
        type: 'circle',
        source: 'stop-points',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 3,
            12, 4.5,
            14, 6
          ],
          'circle-color': '#ffffff',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#1d4ed8'
        }
      });

      // Interactive hover tooltips for stops
      map.on('mouseenter', 'stop-point-dots', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const coordinates = (e.features?.[0]?.geometry as any)?.coordinates?.slice();
        const props = e.features?.[0]?.properties;

        if (coordinates && props) {
          popup
            .setLngLat(coordinates as [number, number])
            .setHTML(
              `<div class="p-2 text-xs font-sans text-slate-800">
                <div class="font-bold text-blue-900">${props.name || 'Bus Stop'}</div>
                <div class="text-[10px] text-slate-500 font-mono mt-0.5">Stop #${props.stop_id || props.id}</div>
                <div class="text-[10px] text-blue-700 font-semibold mt-1">400m Walk Catchment</div>
              </div>`
            )
            .addTo(map);
        }
      });

      map.on('mouseleave', 'stop-point-dots', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      // 4. Load Actual Bus Stops from /data/bus_stop_vulnerability.json
      fetch('/data/bus_stop_vulnerability.json')
        .then((res) => res.json())
        .then((data) => {
          if (!mapRef.current) return;
          const stopSource = mapRef.current.getSource('stop-points') as mapboxgl.GeoJSONSource;
          if (!stopSource) return;

          const allStops = data?.stops || [];
          if (allStops.length === 0) return;

          // Bounding box filter with a buffer (~0.015 degrees)
          let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
          lineCoordinates.forEach(([lng, lat]) => {
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          });

          const pad = 0.008; // ~800m lat/lng bounding padding
          const candidateStops = allStops.filter((s: any) =>
            s.lon >= minLng - pad &&
            s.lon <= maxLng + pad &&
            s.lat >= minLat - pad &&
            s.lat <= maxLat + pad
          );

          // Served DAs set for Route 002 if available
          const servedDaSet = new Set(
            (routeData?.da_list || routeData?.da_metadata || []).map((d: any) =>
              String(d.da_id || d)
            )
          );

          // Keep stops that are within 38m of Route 002's street corridor line
          // AND either intersect Route 002's DAs or lie directly along the route line
          const routeStops = candidateStops.filter((s: any) => {
            const dist = minDistanceToPolylineMeters([s.lon, s.lat], lineCoordinates);
            if (dist > 38) return false;

            if (servedDaSet.size > 0 && s.das && s.das.length > 0) {
              const intersectsRouteDa = s.das.some((d: any) => servedDaSet.has(String(d.da_id)));
              if (!intersectsRouteDa && dist > 20) return false;
            }

            return true;
          });

          // Build actual GeoJSON features
          const features = routeStops.map((s: any) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [s.lon, s.lat]
            },
            properties: {
              id: s.stop_id,
              stop_id: s.stop_id,
              name: s.stop_name || `Stop ${s.stop_id}`,
              score: s.equal_score || 0
            }
          }));

          // If features found, update source
          if (features.length > 0) {
            stopSource.setData({
              type: 'FeatureCollection',
              features
            });
          }
        })
        .catch((err) => {
          console.error("Failed to load actual bus stops for Route 002 catchment map:", err);
        });
    });

    return () => {
      popup.remove();
      map.remove();
    };
  }, [routeData, daGeoJson]);

  return (
    <div className="w-full my-6 rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 relative">
      <div ref={mapContainerRef} className="w-full h-[340px] md:h-[400px]" />
      
      {/* Visual Overlay Label */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-800 pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
        <span>Route 002: 400m Bus Stop Walk Catchments</span>
      </div>
    </div>
  );
};
