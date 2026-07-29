import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  BusStopRecord 
} from '@/components/widgets/BusStopDirectory';
import { GlobalNavMenu } from '@/components/widgets/GlobalNavMenu';
import { BusStopGradeLegend, BusStopGrade } from '@/components/widgets/BusStopGradeLegend';
import { BusStopDirectoryModal, CimdDimensionKey } from '@/components/widgets/BusStopDirectoryModal';
import { 
  Layers, 
  Box, 
  Menu, 
  X, 
  ChevronDown,
  BookOpen
} from 'lucide-react';

import { checkIsRegional } from '@/utils/regional';

const BusStopMap = dynamic(
  () => import('@/components/map/BusStopMap').then((m) => m.BusStopMap),
  { ssr: false }
);

import { PageView } from '@/components/widgets/GlobalNavMenu';

interface BusStopAnalysisProps {
  onNavigate?: (page: PageView) => void;
  initialSelectedStopId?: string | null;
}

export const BusStopAnalysis: React.FC<BusStopAnalysisProps> = ({ onNavigate, initialSelectedStopId = null }) => {
  const [stops, setStops] = useState<BusStopRecord[]>([]);
  const [daScores, setDaScores] = useState<Record<string, any>>({});
  const [selectedStopId, setSelectedStopId] = useState<string | null>(initialSelectedStopId);
  const [is3dEnabled, setIs3dEnabled] = useState<boolean>(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState<boolean>(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState<boolean>(false);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedGrades, setSelectedGrades] = useState<BusStopGrade[]>(['A', 'B', 'C', 'D', 'E', 'Regional']);
  
  // 4 CIMD Dimension Toggles
  const [activeDimensions, setActiveDimensions] = useState<CimdDimensionKey[]>(['econ', 'res', 'eth', 'sit']);

  // Load pre-computed Bus Stop Vulnerability asset
  useEffect(() => {
    fetch('/data/bus_stop_vulnerability.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.stops) {
          const mapped = data.stops.map((s: BusStopRecord) => {
            const regional = checkIsRegional(s.lat, s.lon);
            return {
              ...s,
              is_regional: regional
            };
          });
          setStops(mapped);
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

  // Toggle CIMD dimensions with auto-equal weight budgeting
  const handleToggleDimension = (dim: CimdDimensionKey) => {
    setActiveDimensions((prev) => {
      if (prev.includes(dim)) {
        if (prev.length === 1) return prev; // Keep at least 1 dimension selected
        return prev.filter((d) => d !== dim);
      }
      return [...prev, dim];
    });
  };

  const currentDimWeightPct = useMemo(() => {
    const len = activeDimensions.length || 4;
    return (100 / len).toFixed(len === 3 ? 1 : 0);
  }, [activeDimensions]);

  // Calculate dynamic grade counts
  const gradeCounts = useMemo(() => {
    const counts: Record<BusStopGrade, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, Regional: 0 };
    const numDims = activeDimensions.length || 4;
    const dimWeight = 1 / numDims;

    stops.forEach((s) => {
      if (s.is_regional) {
        counts['Regional']++;
        return;
      }

      let blendedScore = 0;
      if (s.das && s.das.length > 0) {
        s.das.forEach((da) => {
          let score = 0;
          if (activeDimensions.includes('econ')) score += (da.econ ?? 50) * dimWeight;
          if (activeDimensions.includes('res')) score += (da.res ?? 50) * dimWeight;
          if (activeDimensions.includes('eth')) score += (da.eth ?? 50) * dimWeight;
          if (activeDimensions.includes('sit')) score += (da.sit ?? 50) * dimWeight;

          blendedScore += score * ((da.pct || 0) / 100);
        });
      } else {
        blendedScore = s.equal_score;
      }

      let grade: BusStopGrade = 'C';
      if (blendedScore >= 80) grade = 'A';
      else if (blendedScore >= 65) grade = 'B';
      else if (blendedScore >= 50) grade = 'C';
      else if (blendedScore >= 35) grade = 'D';
      else grade = 'E';

      if (counts[grade] !== undefined) counts[grade]++;
    });

    return counts;
  }, [stops, activeDimensions]);

  const handleToggleGrade = (grade: BusStopGrade) => {
    setSelectedGrades((prev) => {
      if (prev.includes(grade)) {
        return prev.filter((g) => g !== grade);
      }
      return [...prev, grade];
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white text-slate-800 flex flex-col font-sans select-none [&_.mapboxgl-ctrl-bottom-left]:hidden [&_.mapboxgl-ctrl-attrib-inner]:hidden">
      {/* Standardized Global Navigation Menu */}
      <GlobalNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        onNavigate={onNavigate}
        activeItemIndex={4}
      />

      {/* Full-Page Bus Stop Directory Modal */}
      <BusStopDirectoryModal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
        stops={stops}
        selectedStopId={selectedStopId}
        activeDimensions={activeDimensions}
        onSelectStop={(id) => setSelectedStopId(id)}
      />

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

        {/* 4 CIMD Dimension Toggles with Auto-Equal Weighting */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl p-1 shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">
            CIMD Criteria ({currentDimWeightPct}% each):
          </span>

          {(
            [
              { key: 'econ', label: 'Economic' },
              { key: 'res', label: 'Residential' },
              { key: 'eth', label: 'Ethnocultural' },
              { key: 'sit', label: 'Situational' },
            ] as const
          ).map((dim) => {
            const isActive = activeDimensions.includes(dim.key);
            return (
              <button
                key={dim.key}
                onClick={() => handleToggleDimension(dim.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#1e3a8a] text-white shadow-xs'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {dim.label}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Full Directory Page Trigger Button */}
          <button
            onClick={() => onNavigate?.('bus-stop-directory')}
            className="px-3.5 py-1.5 rounded-xl bg-[#1e3a8a] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#152e6f] transition-all"
          >
            <BookOpen className="w-4 h-4" /> Bus Stop Directory
          </button>

          {/* 3D Feature Toggle */}
          <button
            onClick={() => setIs3dEnabled(!is3dEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              is3dEnabled
                ? 'bg-blue-50 border-blue-200 text-[#1e3a8a]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle 3D Buildings & Terrain"
          >
            <Box className="w-4 h-4" /> 3D
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Fullscreen Map Canvas */}
        <div className="flex-1 relative h-full w-full">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 space-y-3">
              <div className="w-8 h-8 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono font-medium">Loading 6,700+ GTFS Bus Stops...</p>
            </div>
          ) : (
            <>
              <BusStopMap
                stops={stops}
                daScores={daScores}
                selectedStopId={selectedStopId}
                mode="equal"
                is3dEnabled={is3dEnabled}
                selectedGrades={selectedGrades}
                activeDimensions={activeDimensions}
                showHeatmap={showHeatmap}
                onSelectStop={(id) => setSelectedStopId(id)}
              />

              {/* Floating Grade Legend & Minimizable Controls */}
              <div className="absolute bottom-6 left-6 z-30">
                <BusStopGradeLegend
                  selectedGrades={selectedGrades}
                  onToggleGrade={handleToggleGrade}
                  gradeCounts={gradeCounts}
                  showHeatmap={showHeatmap}
                  onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
                />
              </div>
            </>
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
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Vulnerability Rank</div>
                  {selectedStop.is_regional ? (
                    <div className="text-sm font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                      Regional Stop (Outside City)
                    </div>
                  ) : (
                    <div className="text-lg font-mono font-bold text-[#1e3a8a]">
                      {(selectedStop.equal_percentile ?? 0).toFixed(0)}th %ile
                      <span className="text-xs font-normal text-slate-500 ml-1.5 font-sans">
                        (Score: {selectedStop.equal_score.toFixed(1)})
                      </span>
                    </div>
                  )}
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
      </div>
    </div>
  );
};

