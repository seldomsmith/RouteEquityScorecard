"use client";

import React from 'react';
import { RouteWaterfall } from './RouteWaterfall';
import { BorderGlow } from './BorderGlow';
import { InteractiveGlowText } from './widgets/InteractiveGlowText';

interface LandingPageProps {
  onTellMeHow: () => void;
  onJumpIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onTellMeHow, onJumpIn }) => {
  return (
    <main className="min-h-screen w-full flex-grow flex flex-col items-center justify-center px-4 md:px-8 py-12 md:py-24 relative overflow-hidden bg-slate-50 font-sans">
      {/* Route Waterfall Animated Background */}
      <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <RouteWaterfall opacity={0.35} />
      </div>

      {/* SVG Subway Line Background (Original Fallback - Commented for Revertability)
      <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg className="w-full h-full opacity-30" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 800">
          <path d="M-100 200 L 300 200 L 500 400 L 1100 400 L 1300 600 L 1540 600" fill="none" stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" />
          <circle cx="300" cy="200" fill="white" r="8" stroke="#22c55e" strokeWidth="4" />
          <circle cx="500" cy="400" fill="white" r="8" stroke="#22c55e" strokeWidth="4" />
          <circle cx="1100" cy="400" fill="white" r="8" stroke="#22c55e" strokeWidth="4" />
          <circle cx="1300" cy="600" fill="white" r="8" stroke="#22c55e" strokeWidth="4" />

          <path d="M400 -100 L 400 300 L 600 500 L 600 900" fill="none" stroke="#eab308" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" />
          <circle cx="400" cy="100" fill="white" r="8" stroke="#eab308" strokeWidth="4" />
          <circle cx="400" cy="300" fill="white" r="8" stroke="#eab308" strokeWidth="4" />
          <circle cx="600" cy="500" fill="white" r="8" stroke="#eab308" strokeWidth="4" />
          <circle cx="600" cy="700" fill="white" r="8" stroke="#eab308" strokeWidth="4" />

          <path d="M-100 600 L 200 600 L 400 400 L 1200 400 L 1400 200 L 1540 200" fill="none" stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" />
          <circle cx="200" cy="600" fill="white" r="8" stroke="#ef4444" strokeWidth="4" />
          <circle cx="400" cy="400" fill="white" r="8" stroke="#ef4444" strokeWidth="4" />
          <circle cx="1200" cy="400" fill="white" r="8" stroke="#ef4444" strokeWidth="4" />
          <circle cx="1400" cy="200" fill="white" r="8" stroke="#ef4444" strokeWidth="4" />

          <path d="M1000 -100 L 1000 200 L 800 400 L 800 600 L 600 800 L -100 800" fill="none" stroke="#3b82f6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" />
          <circle cx="1000" cy="200" fill="white" r="8" stroke="#3b82f6" strokeWidth="4" />
          <circle cx="800" cy="400" fill="white" r="8" stroke="#3b82f6" strokeWidth="4" />
          <circle cx="800" cy="600" fill="white" r="8" stroke="#3b82f6" strokeWidth="4" />
          <circle cx="600" cy="800" fill="white" r="8" stroke="#3b82f6" strokeWidth="4" />

          <circle cx="400" cy="400" fill="white" r="12" stroke="#1f2937" strokeWidth="4" />
          <circle cx="800" cy="400" fill="white" r="12" stroke="#1f2937" strokeWidth="4" />
          <circle cx="600" cy="500" fill="white" r="12" stroke="#1f2937" strokeWidth="4" />
        </svg>
      </div>
      */}

      {/* Main Center Title Card wrapped in BorderGlow */}
      <BorderGlow
        animated
        edgeSensitivity={40}
        glowRadius={40}
        glowIntensity={0.8}
        coneSpread={22}
        borderRadius={56} // Matches desktop md:rounded-[3.5rem] (56px)
        backgroundColor="#2563eb" // Original bg-blue-600 color
        glowColor="220 70 50" // Slate blue/indigo HSL glow
        colors={['#1e40af', '#3b82f6', '#1d4ed8', '#1e3a8a']} // Deep blues and indigos monochromatic theme
        className="relative z-10 w-full max-w-5xl mx-auto rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl transition-all duration-300"
      >
        <div className="w-full p-10 md:p-20 flex flex-col items-center justify-center text-center relative">
          {/* Glow Spheres */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-900 opacity-20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center w-full gap-8">
            <header className="flex flex-col gap-4 w-full justify-center">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none text-center w-full">
                <InteractiveGlowText text="ETS Route Equity&#10;Scorecard" />
              </h1>
            </header>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mt-6 w-full sm:w-auto">
              <button
                onClick={onTellMeHow}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-blue-900 font-bold text-lg hover:bg-slate-50 transition-all duration-200 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50 active:scale-95"
              >
                Read Methodology
              </button>
              <button
                onClick={onJumpIn}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-950 text-white font-bold text-lg hover:bg-blue-900 transition-all duration-200 shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-950/50 active:scale-95"
              >
                View Scorecard
              </button>
            </div>
          </div>
        </div>
      </BorderGlow>
    </main>
  );
};
