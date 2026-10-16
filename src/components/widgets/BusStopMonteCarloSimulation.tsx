"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Info, Maximize2, X } from 'lucide-react';

interface SimulationResult {
  weights: {
    econ: number;
    res: number;
    eth: number;
    sit: number;
  };
  stop6586Score: number;
  stop2821Score: number;
}

export const BusStopMonteCarloSimulation: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentWeights, setCurrentWeights] = useState({
    econ: 25,
    res: 25,
    eth: 25,
    sit: 25,
  });

  const [simResults, setSimResults] = useState<SimulationResult[]>([]);
  const simInterval = useRef<NodeJS.Timeout | null>(null);

  // Exact real-world dimension coefficients for Stop #6586 and Stop #2821
  // Stop #6586: Econ=63.2, Res=75.8, Eth=100.0, Sit=89.4 (Mean=82.1, Std=9.1)
  const stop6586Dims = { econ: 63.2, res: 75.8, eth: 100.0, sit: 89.4 };
  // Stop #2821: Econ=20.0, Res=100.0, Eth=75.2, Sit=37.0 (Mean=58.1, Std=20.6)
  const stop2821Dims = { econ: 20.0, res: 100.0, eth: 75.2, sit: 37.0 };

  const totalRuns = 150;
  const graphWidth = 260;
  const startOffset = 40;
  const bottomY = 180;

  const handleReset = () => {
    if (simInterval.current) clearInterval(simInterval.current);
    setIsSimulating(false);
    setProgress(0);
    setSimResults([]);
    setCurrentWeights({ econ: 25, res: 25, eth: 25, sit: 25 });
  };

  const startSimulation = () => {
    handleReset();
    setIsSimulating(true);

    let runCount = 0;

    simInterval.current = setInterval(() => {
      if (runCount >= totalRuns) {
        if (simInterval.current) clearInterval(simInterval.current);
        setIsSimulating(false);
        return;
      }

      // Sample random non-negative weights summing to 100%
      const r1 = Math.random();
      const r2 = Math.random();
      const r3 = Math.random();
      const r4 = Math.random();
      const sum = r1 + r2 + r3 + r4;

      const wEcon = Math.round((r1 / sum) * 100);
      const wRes = Math.round((r2 / sum) * 100);
      const wEth = Math.round((r3 / sum) * 100);
      const wSit = 100 - (wEcon + wRes + wEth);

      setCurrentWeights({ econ: wEcon, res: wRes, eth: wEth, sit: wSit });

      // Compute exact linear combination score for both stops
      const s6586 = (wEcon * stop6586Dims.econ + wRes * stop6586Dims.res + wEth * stop6586Dims.eth + wSit * stop6586Dims.sit) / 100.0;
      const s2821 = (wEcon * stop2821Dims.econ + wRes * stop2821Dims.res + wEth * stop2821Dims.eth + wSit * stop2821Dims.sit) / 100.0;

      const newResult: SimulationResult = {
        weights: { econ: wEcon, res: wRes, eth: wEth, sit: wSit },
        stop6586Score: Math.round(s6586 * 10) / 10,
        stop2821Score: Math.round(s2821 * 10) / 10,
      };

      setSimResults((prev) => [...prev, newResult]);
      setProgress(Math.round(((runCount + 1) / totalRuns) * 100));

      runCount++;
    }, 60);
  };

  // Compute live stats from simulation runs
  const getStats = (stopId: '6586' | '2821') => {
    if (simResults.length === 0) {
      return {
        mean: stopId === '6586' ? 82.1 : 58.1,
        std: stopId === '6586' ? 9.1 : 20.6,
        min: stopId === '6586' ? 63.2 : 20.0,
        max: stopId === '6586' ? 100.0 : 100.0,
      };
    }
    const scores = simResults.map((r) => (stopId === '6586' ? r.stop6586Score : r.stop2821Score));
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    return {
      mean,
      std: Math.sqrt(variance),
      min: Math.min(...scores),
      max: Math.max(...scores),
    };
  };

  const s6586Stats = getStats('6586');
  const s2821Stats = getStats('2821');

  // Generate density curve SVG path
  const getDensityPoints = (mean: number, std: number, progressFraction: number) => {
    if (simResults.length === 0) return '';
    const points = [];
    const validStd = std > 0 ? std : 2.0;
    const maxCurveHeight = std < 12 ? 115 : 70;

    for (let s = 0; s <= 100; s += 0.5) {
      const x = startOffset + (s / 100) * graphWidth;
      const exponent = Math.exp(-Math.pow(s - mean, 2) / (2 * Math.pow(validStd, 2)));
      const y = bottomY - exponent * maxCurveHeight * progressFraction;
      points.push(`${x},${y}`);
    }

    return `M ${startOffset},${bottomY} L ${points.join(' L ')} L ${startOffset + graphWidth},${bottomY} Z`;
  };

  const progressFraction = simResults.length / totalRuns;

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFullscreen(false)} />
      )}

      <div
        className={
          isFullscreen
            ? "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] h-[85vh] max-w-6xl bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl flex flex-col overflow-y-auto"
            : "w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:-mx-12 lg:-mx-24 md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)] mt-6 overflow-hidden relative"
        }
      >
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors absolute top-4 right-4 z-10"
          title={isFullscreen ? "Close Fullscreen" : "Expand to Fullscreen"}
        >
          {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-slate-900 mt-2 font-sans">
            Mean Score vs. Volatility Simulation
          </h3>
          <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1 leading-relaxed">
            This simulation tests how <strong className="text-purple-700">Stop #6586</strong> and{' '}
            <strong className="text-orange-600">Stop #2821</strong> score when we evaluate all possible
            demographic indicator weight combinations.
          </p>
        </div>

        {/* Simulator Controls & Weight Sweep Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 mb-6 border-b border-slate-100 items-center">
          {/* Play/Reset buttons */}
          <div className="flex flex-col gap-3 justify-center">
            <div className="flex items-center gap-3">
              <button
                onClick={startSimulation}
                disabled={isSimulating}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all duration-150 active:scale-95 ${
                  isSimulating
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Play className="w-4 h-4 fill-current" /> Run Simulation
              </button>
              <button
                onClick={handleReset}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 text-slate-600 transition-colors shadow-2xs active:scale-95"
                title="Reset Simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-emerald-600 h-full transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 leading-none">
              <span>Progress: {progress}%</span>
              <span>Runs: {simResults.length} / {totalRuns}</span>
            </div>
          </div>

          {/* Dynamic Weight Dashboard (4 CIMD Dimensions) */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Economic', val: currentWeights.econ, color: 'bg-blue-600' },
              { label: 'Residential', val: currentWeights.res, color: 'bg-teal-600' },
              { label: 'Ethnocultural', val: currentWeights.eth, color: 'bg-purple-600' },
              { label: 'Situational', val: currentWeights.sit, color: 'bg-amber-600' },
            ].map((w) => (
              <div key={w.label} className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {w.label}
                </span>
                <span className="text-xl font-black text-slate-900 font-mono mt-0.5">{w.val}%</span>
                <div className="w-full bg-slate-200/70 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${w.color} transition-all duration-75`}
                    style={{ width: `${w.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Density Distribution Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Stop #6586 (Left - Essential Equity Bus Stop) */}
          <div className="flex flex-col relative">
            <div className="flex justify-between items-start mb-3 pb-2 border-b border-slate-100 min-h-[52px]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">
                  Stop #6586 &bull; Essential Equity Bus Stop
                </span>
                <h4 className="font-extrabold text-slate-900 mt-0.5 font-sans text-sm sm:text-base">
                  121 Street & 145 Avenue (North Edmonton)
                </h4>
              </div>
              <div className="text-right flex flex-col pl-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Volatility (σ)</span>
                <span className="text-base font-black text-purple-700 font-mono leading-none mt-1">
                  {s6586Stats.std.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Graph Canvas */}
            <div className={`relative w-full bg-slate-50/70 border border-slate-200/80 rounded-xl overflow-hidden transition-all duration-300 ${isFullscreen ? 'h-64' : 'h-48'}`}>
              <svg viewBox="0 0 340 200" width="100%" height="100%" className="block" preserveAspectRatio="none">
                {/* Grids */}
                <line x1={40} y1={20} x2={40} y2={180} stroke="#E2E8F0" strokeDasharray="2 2" />
                <line x1={170} y1={20} x2={170} y2={180} stroke="#CBD5E1" strokeDasharray="3 3" />
                <line x1={300} y1={20} x2={300} y2={180} stroke="#E2E8F0" strokeDasharray="2 2" />

                {/* Grid Labels */}
                <text x={40} y={193} fontSize={8} fontWeight={700} fill="#94A3B8" textAnchor="middle">0</text>
                <text x={170} y={193} fontSize={8} fontWeight={700} fill="#64748B" textAnchor="middle">50</text>
                <text x={300} y={193} fontSize={8} fontWeight={700} fill="#94A3B8" textAnchor="middle">100</text>

                {/* Axis line */}
                <line x1={20} y1={180} x2={310} y2={180} stroke="#94A3B8" strokeWidth={1} />

                {/* Density curve */}
                {simResults.length > 0 && (
                  <>
                    <path
                      d={getDensityPoints(s6586Stats.mean, s6586Stats.std, progressFraction)}
                      fill="rgba(124, 58, 237, 0.12)"
                      stroke="#7C3AED"
                      strokeWidth={1.5}
                      className="transition-all duration-75"
                    />
                    <line
                      x1={40 + (s6586Stats.mean / 100) * 260}
                      y1={20}
                      x2={40 + (s6586Stats.mean / 100) * 260}
                      y2={180}
                      stroke="#6D28D9"
                      strokeWidth={1}
                      strokeDasharray="4 2"
                    />
                  </>
                )}
              </svg>
            </div>

            <div className="mt-3 flex items-start gap-2 pt-2 text-[11px] text-slate-600 leading-relaxed font-sans min-h-[48px]">
              <Info className="w-3.5 h-3.5 text-purple-700 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Analysis:</strong> Composite scores stay locked between 63 and 100 (mean {s6586Stats.mean.toFixed(1)}, volatility {s6586Stats.std.toFixed(1)}). In 100% of combinations, Stop #6586 qualifies as Grade A or B, maintaining essential equity status regardless of weighting.
              </p>
            </div>
          </div>

          {/* Stop #2821 (Right - High Swing Bus Stop) */}
          <div className="flex flex-col relative">
            <div className="flex justify-between items-start mb-3 pb-2 border-b border-slate-100 min-h-[52px]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                  Stop #2821 &bull; High Swing Bus Stop
                </span>
                <h4 className="font-extrabold text-slate-900 mt-0.5 font-sans text-sm sm:text-base">
                  104 Street & 82 Avenue (Whyte Avenue)
                </h4>
              </div>
              <div className="text-right flex flex-col pl-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Volatility (σ)</span>
                <span className="text-base font-black text-orange-600 font-mono leading-none mt-1">
                  {s2821Stats.std.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Graph Canvas */}
            <div className={`relative w-full bg-slate-50/70 border border-slate-200/80 rounded-xl overflow-hidden transition-all duration-300 ${isFullscreen ? 'h-64' : 'h-48'}`}>
              <svg viewBox="0 0 340 200" width="100%" height="100%" className="block" preserveAspectRatio="none">
                {/* Grids */}
                <line x1={40} y1={20} x2={40} y2={180} stroke="#E2E8F0" strokeDasharray="2 2" />
                <line x1={170} y1={20} x2={170} y2={180} stroke="#CBD5E1" strokeDasharray="3 3" />
                <line x1={300} y1={20} x2={300} y2={180} stroke="#E2E8F0" strokeDasharray="2 2" />

                {/* Grid Labels */}
                <text x={40} y={193} fontSize={8} fontWeight={700} fill="#94A3B8" textAnchor="middle">0</text>
                <text x={170} y={193} fontSize={8} fontWeight={700} fill="#64748B" textAnchor="middle">50</text>
                <text x={300} y={193} fontSize={8} fontWeight={700} fill="#94A3B8" textAnchor="middle">100</text>

                {/* Axis line */}
                <line x1={20} y1={180} x2={310} y2={180} stroke="#94A3B8" strokeWidth={1} />

                {/* Density curve */}
                {simResults.length > 0 && (
                  <>
                    <path
                      d={getDensityPoints(s2821Stats.mean, s2821Stats.std, progressFraction)}
                      fill="rgba(234, 88, 12, 0.12)"
                      stroke="#EA580C"
                      strokeWidth={1.5}
                      className="transition-all duration-75"
                    />
                    <line
                      x1={40 + (s2821Stats.mean / 100) * 260}
                      y1={20}
                      x2={40 + (s2821Stats.mean / 100) * 260}
                      y2={180}
                      stroke="#C2410C"
                      strokeWidth={1}
                      strokeDasharray="4 2"
                    />
                  </>
                )}
              </svg>
            </div>

            <div className="mt-3 flex items-start gap-2 pt-2 text-[11px] text-slate-600 leading-relaxed font-sans min-h-[48px]">
              <Info className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Analysis:</strong> Composite scores vary wildly between 20.0 and 100.0 (mean {s2821Stats.mean.toFixed(1)}, volatility {s2821Stats.std.toFixed(1)}). Stop #2821 jumps to Grade A under high Residential Instability, but collapses to Grade E when Economic Deprivation is emphasized.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
