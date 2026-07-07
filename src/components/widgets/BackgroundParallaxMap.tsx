"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VsZG9tc21pdGgiLCJhIjoiY21wNGoya2o5MDNvbTJ1cHFjcmI4djRudCJ9' + '.55Khr0Cuwie_8YBv_QPfsA';

interface BackgroundParallaxMapProps {
  scrollProgress: number;
}

export const BackgroundParallaxMap: React.FC<BackgroundParallaxMapProps> = ({ scrollProgress }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-113.5200, 53.5150],
      zoom: 11.2,
      pitch: 15,
      bearing: -5,
      interactive: false,
      attributionControl: false,
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Update map camera based on scroll progress
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Linear interpolation helper
    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

    // Camera parameters
    const startLng = -113.5200;
    const endLng = -113.4300;
    
    const startLat = 53.5150;
    const endLat = 53.5650;

    const startZoom = 11.2;
    const endZoom = 12.3;

    const startPitch = 15;
    const endPitch = 35;

    const startBearing = -5;
    const endBearing = 15;

    const currentLng = lerp(startLng, endLng, scrollProgress);
    const currentLat = lerp(startLat, endLat, scrollProgress);
    const currentZoom = lerp(startZoom, endZoom, scrollProgress);
    const currentPitch = lerp(startPitch, endPitch, scrollProgress);
    const currentBearing = lerp(startBearing, endBearing, scrollProgress);

    // Jump immediately with zero animation duration to track scrolling synchronously
    map.jumpTo({
      center: [currentLng, currentLat],
      zoom: currentZoom,
      pitch: currentPitch,
      bearing: currentBearing,
    });
  }, [scrollProgress]);

  return (
    <>
      <div className="fixed inset-0 z-0 bg-slate-50 pointer-events-none" />
      <div 
        ref={mapContainerRef} 
        className="fixed inset-0 z-0 pointer-events-none select-none opacity-[0.05] saturate-0 brightness-[1.02] filter contrast-[0.95]"
        style={{ mixBlendMode: 'multiply' }}
      />
    </>
  );
};
