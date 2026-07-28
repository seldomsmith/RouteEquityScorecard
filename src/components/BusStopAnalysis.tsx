"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  BusStopRecord, 
  BusStopDirectory 
} from '@/components/widgets/BusStopDirectory';
import { 
  Layers, 
  Box, 
  Menu, 
  X, 
  MapPin
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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 text-slate-800 flex flex-col font-sans select-none">
      {/* Header Navigation Bar (Light Theme matching main dashboard header) */}
      <header className="relative z-40 h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {/* Main Navigation Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-sm"
              title="Navigation Menu"
            >
              {isNavMenuOpen ? <X className="w-4 h-4 text-sky-600" /> : <Menu className="w-4 h-4 text-sky-600" />}
            </button>

            {isNavMenuOpen && (
              <div className="absolute top-12 left-0 w-64 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-xl p-2 shadow-2xl space-y-1 text-xs z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Navigation</div>
                <button
                  onClick={() => { setIsNavMenuOpen(false); onNavigate?.('landing'); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors flex items-center justify-between"
                >
                  Landing Overview <span>→</span>
                </button>
                <button
                  onClick={() => { setIsNavMenuOpen(false); onNavigate?.('dashboard'); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors flex items-center justify-between"
                >
                  Route Scorecard Dashboard <span>→</span>
                </button>
                <button
                  onClick={() => { setIsNavMenuOpen(false); onNavigate?.('scrollytelling'); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors flex items-center justify-between"
                >
                  Interactive Story Walkthrough <span>→</span>
                </button>
                <button
                  onClick={() => { setIsNavMenuOpen(false); onNavigate?.('bus-stop-analysis'); }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-sky-50 text-sky-700 font-bold border border-sky-200 flex items-center justify-between"
                >
                  Bus Stop Analysis <span>✓</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center shadow-md shadow-sky-600/20">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                ETS Route Scorecard
                <span className="text-[10px] bg-sky-100 text-sky-700 border border-sky-300 px-2 py-0.5 rounded-full font-mono font-bold">
                  Bus Stop Analysis
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">400m Spatial Catchment Proportional Vulnerability</p>
            </div>
          </div>
        </div>

        {/* Floating Top Controls */}
        <div className="flex items-center gap-2">
          {/* CIMD Mode Toggle */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setMode('equal')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                mode === 'equal'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CIMD Equal (25%)
            </button>
            <button
              onClick={() => setMode('economic')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                mode === 'economic'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              100% Economic
            </button>
          </div>

          {/* 3D Feature Toggle */}
          <button
            onClick={() => setIs3dEnabled(!is3dEnabled)}
            className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              is3dEnabled
                ? 'bg-sky-50 border-sky-300 text-sky-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle 3D Buildings & Terrain"
          >
            <Box className="w-4 h-4" /> 3D
          </button>

          {/* Directory Toggle Button */}
          <button
            onClick={() => setIsDirectoryOpen(!isDirectoryOpen)}
            className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isDirectoryOpen
                ? 'bg-sky-50 border-sky-300 text-sky-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" /> Directory
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Fullscreen Map Canvas */}
        <div className="flex-1 relative h-full">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 space-y-3">
              <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono font-medium">Loading 6,700+ GTFS Bus Stops & Catchment Calculations...</p>
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
                  <span className="font-mono text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-bold">
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
                  <div className="text-lg font-mono font-bold text-sky-700">
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
                    <span className="font-mono font-bold text-sky-700">{d.pct}% ({d.equal_score.toFixed(0)} score)</span>
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
