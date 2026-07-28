"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  BusStopRecord, 
  BusStopDirectory 
} from '@/components/widgets/BusStopDirectory';
import LineSidebar from '@/components/widgets/LineSidebar';
import { 
  Layers, 
  Box, 
  Menu, 
  X, 
  MapPin,
  ChevronDown
} from 'lucide-react';

const BusStopMap = dynamic(
  () => import('@/components/map/BusStopMap').then((m) => m.BusStopMap),
  { ssr: false }
);

interface BusStopAnalysisProps {
  onNavigate?: (page: 'landing' | 'dashboard' | 'scrollytelling' | 'scrollytelling-two-pillar' | 'directory' | 'bus-stop-analysis') => void;
}

export const BusStopAnalysis: React.FC<BusStopAnalysisProps> = ({ onNavigate }) => {
  const [stops, setStops] = useState<BusStopRecord[]>([]);
  const [daScores, setDaScores] = useState<Record<string, any>>({});
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [mode, setMode] = useState<'equal' | 'economic'>('equal');
  const [is3dEnabled, setIs3dEnabled] = useState<boolean>(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState<boolean>(true);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load pre-computed Bus Stop Vulnerability asset
  useEffect(() => {
    fetch('/data/bus_stop_vulnerability.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.stops) {
          setStops(data.stops);
          setDaScores(data.da_scores || {});
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load bus_stop_vulnerability.json:', err);
        setLoading(false);
      });
  }, []);

  const selectedStop = stops.find((s) => s.stop_id === selectedStopId);

  const menuItems = [
    'Directory',
    'Explain this to me!',
    'Dashboard',
    'Landing Page',
    'Bus Stop Analysis'
  ];

  const handleMenuItemClick = (index: number, label: string) => {
    setIsNavMenuOpen(false);
    if (label === 'Directory') {
      onNavigate?.('directory');
    } else if (label === 'Explain this to me!') {
      onNavigate?.('scrollytelling');
    } else if (label === 'Dashboard') {
      onNavigate?.('dashboard');
    } else if (label === 'Landing Page') {
      onNavigate?.('landing');
    } else if (label === 'Bus Stop Analysis') {
      onNavigate?.('bus-stop-analysis');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white text-slate-800 flex flex-col font-sans select-none [&_.mapboxgl-ctrl-bottom-left]:hidden [&_.mapboxgl-ctrl-attrib-inner]:hidden">
      {/* Frosted Overlay Navigation Menu (Identical to Main Dashboard) */}
      {isNavMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md transition-all duration-300 flex items-start justify-start p-6 md:p-10"
          onClick={() => setIsNavMenuOpen(false)}
        >
          {/* Menu Dropdown Container */}
          <div 
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <span className="text-xs font-black uppercase tracking-widest text-[#1e3a8a]">
                Navigation Menu
              </span>
              <button 
                onClick={() => setIsNavMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <LineSidebar
              items={menuItems}
              accentColor="#1e3a8a"
              textColor="#1e3a8a"
              markerColor="#94a3b8"
              showIndex={true}
              showMarker={true}
              proximityRadius={110}
              maxShift={46}
              falloff="smooth"
              markerLength={55}
              markerGap={28}
              tickScale={0.08}
              scaleTick={true}
              itemGap={13}
              fontSize={1.1}
              smoothing={800}
              defaultActive={4}
              onItemClick={handleMenuItemClick}
            />
          </div>
        </div>
      )}

      {/* Header Bar matching main dashboard exact layout */}
      <header className="relative z-40 h-14 bg-white border-b border-slate-100 px-5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">
            ETS ROUTE EQUITY SCORECARD
          </h1>

          {/* Menu Button matching Sidebar design exactly */}
          <button
            onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
            className="px-3 py-1.5 text-[10px] font-bold text-[#1e3a8a] bg-blue-50/80 hover:bg-blue-100/80 rounded-md border border-blue-200/80 transition-all uppercase tracking-wider shadow-xs flex items-center gap-1.5"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>MENU</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isNavMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Floating Right Controls */}
        <div className="flex items-center gap-2">
          {/* CIMD Mode Toggle */}
          <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => setMode('equal')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                mode === 'equal'
                  ? 'bg-[#1e3a8a] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CIMD Equal (25%)
            </button>
            <button
              onClick={() => setMode('economic')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                mode === 'economic'
                  ? 'bg-[#1e3a8a] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              100% Economic
            </button>
          </div>

          {/* 3D Feature Toggle */}
          <button
            onClick={() => setIs3dEnabled(!is3dEnabled)}
            className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              is3dEnabled
                ? 'bg-blue-50 border-blue-200 text-[#1e3a8a]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle 3D Buildings & Terrain"
          >
            <Box className="w-4 h-4" /> 3D
          </button>

          {/* Directory Toggle Button */}
          <button
            onClick={() => setIsDirectoryOpen(!isDirectoryOpen)}
            className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              isDirectoryOpen
                ? 'bg-blue-50 border-blue-200 text-[#1e3a8a]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" /> Directory
          </button>
        </div>
      </header>

      {/* Main Content Area: Flex container where map takes 100% width when directory is hidden */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Fullscreen Map Canvas */}
        <div className="flex-1 relative h-full w-full">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 space-y-3">
              <div className="w-8 h-8 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono font-medium">Loading 6,700+ GTFS Bus Stops...</p>
            </div>
          ) : (
            <BusStopMap
              stops={stops}
              daScores={daScores}
              selectedStopId={selectedStopId}
              mode={mode}
              is3dEnabled={is3dEnabled}
              onSelectStop={(id) => setSelectedStopId(id)}
            />
          )}

          {/* Banner for Selected Stop */}
          {selectedStop && (
            <div className="absolute top-4 left-4 z-30 max-w-sm bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 shadow-2xl text-xs space-y-2 text-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-[#1e3a8a] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                    Stop #{selectedStop.stop_id}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{selectedStop.stop_name}</h3>
                </div>
                <button
                  onClick={() => setSelectedStopId(null)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Vulnerability Score</div>
                  <div className="text-lg font-mono font-bold text-[#1e3a8a]">
                    {(mode === 'equal' ? selectedStop.equal_score : selectedStop.economic_score).toFixed(1)} / 100
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">400m Buffer DAs</div>
                  <div className="text-xs font-bold text-slate-800">{selectedStop.das.length} Dissemination Areas</div>
                </div>
              </div>

              <div className="space-y-1 border-t border-slate-100 pt-2 text-[11px]">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Proportional DA Overlap</div>
                {selectedStop.das.map((d) => (
                  <div key={d.da_id} className="flex items-center justify-between text-slate-700">
                    <span className="font-medium">DA {d.da_id}</span>
                    <span className="font-mono font-bold text-[#1e3a8a]">{d.pct}% ({d.equal_score.toFixed(0)} score)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Right Directory Sidebar */}
        {isDirectoryOpen && (
          <BusStopDirectory
            stops={stops}
            selectedStopId={selectedStopId}
            mode={mode}
            onSelectStop={(id) => setSelectedStopId(id)}
          />
        )}
      </div>
    </div>
  );
};
