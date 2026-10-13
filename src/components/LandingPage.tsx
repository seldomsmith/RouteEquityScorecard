import React, { useState } from 'react';
import { RouteWaterfall } from './RouteWaterfall';
import { BorderGlow } from './BorderGlow';
import { GlobalNavMenu, PageView } from './widgets/GlobalNavMenu';
import { Menu, ChevronDown } from 'lucide-react';

interface LandingPageProps {
  onTellMeHow?: () => void;
  onJumpIn?: () => void;
  onNavigate?: (page: PageView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onTellMeHow, onJumpIn, onNavigate }) => {
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const handleGo = (page: PageView) => {
    if (onNavigate) {
      onNavigate(page);
    } else if (page === 'dashboard' && onJumpIn) {
      onJumpIn();
    } else if (page === 'scrollytelling' && onTellMeHow) {
      onTellMeHow();
    }
  };

  return (
    <main className="min-h-screen w-full flex-grow flex flex-col items-center justify-center px-4 md:px-8 py-12 md:py-24 relative overflow-hidden bg-slate-50 font-sans">
      {/* Standardized Global Navigation Menu */}
      <GlobalNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        onNavigate={onNavigate}
        activeItemIndex={0}
      />

      {/* Top Left Menu Trigger */}
      <div className="absolute top-6 left-6 z-40">
        <button
          onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
          className="px-3.5 py-2 text-xs font-bold text-[#1e3a8a] bg-white/90 hover:bg-white backdrop-blur-md rounded-xl border border-slate-200/80 transition-all uppercase tracking-wider shadow-md flex items-center gap-2"
        >
          <Menu className="w-4 h-4" />
          <span>MENU</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isNavMenuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {/* Route Waterfall Animated Background */}
      <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <RouteWaterfall opacity={0.35} />
      </div>

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
        <div className="w-full p-8 md:p-16 lg:p-20 flex flex-col items-center justify-center text-center relative">
          {/* Glow Spheres */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-900 opacity-20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center w-full gap-8">
            <header className="flex flex-col gap-3 w-full justify-center">
              <span className="text-xs sm:text-sm font-black tracking-widest text-blue-200 uppercase">
                Edmonton Transit Service Equity Platform
              </span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none text-center w-full pb-2 text-white title-lift-effect cursor-default">
                Transit Equity<br />Scorecard
              </h1>
            </header>

            {/* Tiered Hub Navigation Container */}
            <div className="w-full max-w-3xl mt-4 flex flex-col gap-6">
              {/* Primary Dashboards Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Route Dashboard Column */}
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => handleGo('dashboard')}
                    className="w-full py-4 px-6 rounded-2xl bg-white text-blue-900 font-extrabold text-base sm:text-lg hover:bg-slate-50 transition-all duration-200 shadow-xl border border-white/80 focus:outline-none focus:ring-4 focus:ring-white/50 active:scale-[0.98] text-center"
                  >
                    Route Report and Dashboard
                  </button>
                  <button
                    onClick={() => handleGo('scrollytelling')}
                    className="text-xs sm:text-sm font-semibold text-blue-100 hover:text-white underline underline-offset-4 decoration-blue-300/60 hover:decoration-white transition-colors py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    Explain the Route Equity Scorecard to Me!
                  </button>
                </div>

                {/* Bus Stop Dashboard Column */}
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => handleGo('bus-stop-analysis')}
                    className="w-full py-4 px-6 rounded-2xl bg-blue-950 text-white font-extrabold text-base sm:text-lg hover:bg-blue-900 transition-all duration-200 shadow-xl border border-blue-800/80 focus:outline-none focus:ring-4 focus:ring-blue-950/50 active:scale-[0.98] text-center"
                  >
                    Bus Stop Dashboard
                  </button>
                  <button
                    onClick={() => handleGo('bus-stop-scrollytelling')}
                    className="text-xs sm:text-sm font-semibold text-blue-100 hover:text-white underline underline-offset-4 decoration-blue-300/60 hover:decoration-white transition-colors py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    Explain the Bus Stop Equity Dashboard to me!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BorderGlow>

      {/* SVG filter for the ink stamp texture */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <filter id="ink-stamp-distress">
          <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="displaced" />
        </filter>
      </svg>

      {/* DRAFT Ink Stamp */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none select-none z-30"
        style={{
          top: '32px',
          right: '32px',
          transform: 'rotate(30deg)',
          filter: 'url(#ink-stamp-distress)',
        }}
      >
        <span
          style={{
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '0.18em',
            color: '#e04313', // Red-orange stamp color matching the image
            border: '4px solid #e04313',
            borderRadius: '6px',
            padding: '4px 14px',
            display: 'inline-block',
            textTransform: 'uppercase',
            mixBlendMode: 'multiply',
            background: 'transparent',
            lineHeight: 1.1,
          }}
        >
          DRAFT V2.0
        </span>
      </div>
    </main>
  );
};
