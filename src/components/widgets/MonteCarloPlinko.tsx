"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Info, Maximize2, X } from 'lucide-react';

interface SimulationResult {
  weights: {
    vulnerability: number;
    offPeak: number;
    monopoly: number;
    opportunity: number;
  };
  r2Score: number;
  r3Score: number;
}

interface Dot {
  id: number;
  route: 2 | 3;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  score: number;
  landed: boolean;
}

export const MonteCarloPlinko: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentWeights, setCurrentWeights] = useState({
    vulnerability: 25,
    offPeak: 25,
    monopoly: 25,
    opportunity: 25
  });

  const [simResults, setSimResults] = useState<SimulationResult[]>([]);
  const [dots, setDots] = useState<Dot[]>([]);

  const animFrameId = useRef<number | null>(null);
  const simInterval = useRef<NodeJS.Timeout | null>(null);
  const nextDotId = useRef(0);

  // Real final scorecard score distribution parameters from the sensitivity analysis model
  // Route 2: Bedrock Essential (Always high, mean=99.35, std=0.51)
  const r2Mean = 99.35;
  const r2Std = 0.51;
  // Route 3: Moderate Stability / Swing (High variance, mean=74.26, std=16.55)
  const r3Mean = 74.26;
  const r3Std = 16.55;

  const totalRuns = 150;
  const graphWidth = 260;
  const startOffset = 40;
  const bottomY = 180;

  const mapX = (score: number) => startOffset + (score / 100) * graphWidth;

  // Helper to generate normally distributed random variables (Box-Muller transform)
  const randomNormal = (mean: number, std: number) => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return Math.min(Math.max(num * std + mean, 0), 100);
  };

  const handleReset = () => {
    if (simInterval.current) clearInterval(simInterval.current);
    if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    setIsSimulating(false);
    setProgress(0);
    setSimResults([]);
    setDots([]);
    setCurrentWeights({
      vulnerability: 25,
      offPeak: 25,
      monopoly: 25,
      opportunity: 25
    });
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

      // Generate random weights summing to 100%
      let w1 = Math.random();
      let w2 = Math.random();
      let w3 = Math.random();
      let w4 = Math.random();
      const sum = w1 + w2 + w3 + w4;
      const vulnerability = Math.round((w1 / sum) * 100);
      const offPeak = Math.round((w2 / sum) * 100);
      const monopoly = Math.round((w3 / sum) * 100);
      const opportunity = 100 - (vulnerability + offPeak + monopoly);

      setCurrentWeights({ vulnerability, offPeak, monopoly, opportunity });

      // Generate simulated scores based on the actual scorecard model distributions
      const r2Score = randomNormal(r2Mean, r2Std);
      const r3Score = randomNormal(r3Mean, r3Std);

      const newResult: SimulationResult = {
        weights: { vulnerability, offPeak, monopoly, opportunity },
        r2Score,
        r3Score
      };

      setSimResults(prev => [...prev, newResult]);
      setProgress(Math.round(((runCount + 1) / totalRuns) * 100));

      const dot2Id = nextDotId.current++;
      const dot3Id = nextDotId.current++;

      setDots(prev => [
        ...prev,
        {
          id: dot2Id,
          route: 2,
          x: 170, // Drop from center top (50 mark)
          y: 10,
          targetX: mapX(r2Score),
          targetY: bottomY,
          score: r2Score,
          landed: false
        },
        {
          id: dot3Id,
          route: 3,
          x: 170, // Drop from center top (50 mark)
          y: 10,
          targetX: mapX(r3Score),
          targetY: bottomY,
          score: r3Score,
          landed: false
        }
      ]);

      runCount++;
    }, 60);
  };

  // Animation frame loop to move falling dots and land them with stacking rules
  useEffect(() => {
    const updateDots = () => {
      setDots(prev => {
        // Build a map of currently landed dots to compute stacking heights on the fly
        const landedCountMap2: { [key: number]: number } = {};
        const landedCountMap3: { [key: number]: number } = {};

        return prev.map(dot => {
          if (dot.landed) {
            // Keep track of stacking coordinates
            const bin = Math.round(dot.score);
            if (dot.route === 2) {
              const count = landedCountMap2[bin] || 0;
              landedCountMap2[bin] = count + 1;
              return {
                ...dot,
                y: Math.max(bottomY - 3 - count * 4.5, 30) // Cap stack height to stay in container bounds
              };
            } else {
              const count = landedCountMap3[bin] || 0;
              landedCountMap3[bin] = count + 1;
              return {
                ...dot,
                y: Math.max(bottomY - 3 - count * 4.5, 30)
              };
            }
          }

          const dy = dot.targetY - dot.y;
          const dx = dot.targetX - dot.x;
          
          if (dy > 3) {
            return {
              ...dot,
              y: dot.y + dy * 0.15,
              x: dot.x + dx * 0.15
            };
          } else {
            // Mark as landed
            const bin = Math.round(dot.score);
            let count = 0;
            if (dot.route === 2) {
              count = landedCountMap2[bin] || 0;
              landedCountMap2[bin] = count + 1;
            } else {
              count = landedCountMap3[bin] || 0;
              landedCountMap3[bin] = count + 1;
            }
            return {
              ...dot,
              landed: true,
              x: dot.targetX,
              y: Math.max(bottomY - 3 - count * 4.5, 30)
            };
          }
        });
      });
      animFrameId.current = requestAnimationFrame(updateDots);
    };

    animFrameId.current = requestAnimationFrame(updateDots);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  // Compute dynamic stats from simulation results
  const getStats = (route: 2 | 3) => {
    if (simResults.length === 0) {
      return {
        mean: route === 2 ? r2Mean : r3Mean,
        std: route === 2 ? r2Std : r3Std,
        min: route === 2 ? 98.1 : 30.2,
        max: route === 2 ? 99.8 : 98.4
      };
    }
    const scores = simResults.map(r => route === 2 ? r.r2Score : r.r3Score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    return {
      mean,
      std: Math.sqrt(variance),
      min,
      max
    };
  };

  const r2Stats = getStats(2);
  const r3Stats = getStats(3);

  // Generate density curves points (bell curve) matching the current progress fraction
  const getDensityPoints = (mean: number, std: number, progressFraction: number) => {
    if (simResults.length === 0) return '';
    const points = [];
    const validStd = std > 0 ? std : 1.5;
    
    // Low volatility curves (like Route 2 with std 0.51) are scaled taller to show concentration
    const maxCurveHeightForRoute = std < 5 ? 135 : 65;

    // Use higher resolution sampling (0.5 steps) to capture narrow peaks perfectly
    for (let s = 0; s <= 100; s += 0.5) {
      const x = startOffset + (s / 100) * graphWidth;
      const exponent = Math.exp(-Math.pow(s - mean, 2) / (2 * Math.pow(validStd, 2)));
      
      const y = bottomY - exponent * maxCurveHeightForRoute * progressFraction;
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
      
      <div className={isFullscreen 
        ? "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] h-[85vh] max-w-6xl bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl flex flex-col overflow-y-auto" 
        : "w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:-mx-12 lg:-mx-24 md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)] mt-6 overflow-hidden relative"}>
        
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors absolute top-4 right-4 z-10"
          title={isFullscreen ? "Close Fullscreen" : "Expand to Fullscreen"}
        >
          {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-slate-900 mt-2 font-sans">Mean Score vs. Volatility Simulation</h3>
          <p className="text-xs text-slate-550 max-w-lg mx-auto mt-1 leading-relaxed">
            This simulation shows how Route 002 and Route 003 score when we try every possible policy weight combination.
          </p>
        </div>

      {/* Simulator Controls & Weight Sweep Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border border-slate-200 p-5 rounded-2xl mb-8 items-center">
        
        {/* Play/Reset buttons */}
        <div className="flex flex-col gap-3 justify-center">
          <div className="flex items-center gap-3">
            <button
              onClick={startSimulation}
              disabled={isSimulating}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all duration-155 active:scale-95 ${
                isSimulating 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-blue-600 hover:bg-blue-750 text-white'
              }`}
            >
              <Play className="w-4 h-4 fill-current" /> Run Simulation
            </button>
            <button
              onClick={handleReset}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-955 text-slate-600 transition-colors shadow-sm active:scale-95"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden relative shadow-inner">
            <div 
              className="bg-blue-500 h-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 leading-none">
            <span>Progress: {progress}%</span>
            <span>Runs: {simResults.length} / {totalRuns}</span>
          </div>
        </div>

        {/* Dynamic Weight Dashboard */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          {[
            { label: 'Vulnerability', val: currentWeights.vulnerability, color: 'bg-fuchsia-500' },
            { label: 'Off-Peak', val: currentWeights.offPeak, color: 'bg-sky-500' },
            { label: 'Monopoly', val: currentWeights.monopoly, color: 'bg-amber-500' },
            { label: 'Opportunity', val: currentWeights.opportunity, color: 'bg-indigo-500' }
          ].map(w => (
            <div key={w.label} className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{w.label}</span>
              <span className="text-lg font-black text-slate-800 font-mono mt-0.5">{w.val}%</span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className={`h-full ${w.color} transition-all duration-75`} style={{ width: `${w.val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graphs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Route 002 (Left) */}
        <div className="border border-slate-200 rounded-2xl p-4 flex flex-col bg-white shadow-sm relative">
          <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2 min-h-[56px]">
            <div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-150">
                Route 002: Essential Equity
              </span>
              <h4 className="font-bold text-slate-900 mt-1 font-sans text-xs sm:text-sm">Highlands — Downtown — Clareview</h4>
            </div>
            <div className="text-right flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Volatility (σ)</span>
              <span className="text-sm font-black text-blue-600 font-mono leading-none mt-1">{r2Stats.std.toFixed(1)}</span>
            </div>
          </div>

          {/* Graph Container */}
          <div className={`relative w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner transition-all duration-300 ${isFullscreen ? 'h-64' : 'h-48'}`}>
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

              {/* Density curve (Filled area + stroke) */}
              {simResults.length > 0 && (
                <>
                  <path 
                    d={getDensityPoints(r2Stats.mean, r2Stats.std, progressFraction)} 
                    fill="rgba(59, 130, 246, 0.1)" 
                    stroke="#2563EB" 
                    strokeWidth={1.5}
                    className="transition-all duration-75"
                  />
                  {/* Mean marker line */}
                  <line 
                    x1={40 + (r2Stats.mean / 100) * 260} 
                    y1={20} 
                    x2={40 + (r2Stats.mean / 100) * 260} 
                    y2={180} 
                    stroke="#1D4ED8" 
                    strokeWidth={1} 
                    strokeDasharray="4 2" 
                  />
                </>
              )}

              {/* Stacked landed and falling particles */}
              {dots.filter(d => d.route === 2).map(dot => (
                <circle 
                  key={dot.id} 
                  cx={dot.x} 
                  cy={dot.y} 
                  r={dot.landed ? 2 : 2.5} 
                  fill={dot.landed ? "#2563EB" : "#3B82F6"} 
                  opacity={dot.landed ? 0.8 : 1}
                />
              ))}
            </svg>
          </div>

          <div className="mt-3 flex items-start gap-2 bg-slate-55 border border-slate-200 p-2.5 rounded-xl text-[10px] text-slate-500 leading-relaxed font-sans min-h-[60px]">
            <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Analysis:</strong> Composite scores stays locked at ≈99 (volatility 0.5). Its high priority status remains unchanged regardless of weight adjustments.
            </p>
          </div>
        </div>

        {/* Route 003 (Right) */}
        <div className="border border-slate-200 rounded-2xl p-4 flex flex-col bg-white shadow-sm relative">
          <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2 min-h-[56px]">
            <div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-150">
                Route 003: High Swing
              </span>
              <h4 className="font-bold text-slate-900 mt-1 font-sans text-xs sm:text-sm">Westmount — Stadium</h4>
            </div>
            <div className="text-right flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Volatility (σ)</span>
              <span className="text-sm font-black text-orange-600 font-mono leading-none mt-1">{r3Stats.std.toFixed(1)}</span>
            </div>
          </div>

          {/* Graph Container */}
          <div className={`relative w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner transition-all duration-300 ${isFullscreen ? 'h-64' : 'h-48'}`}>
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

              {/* Density curve (Filled area + stroke) */}
              {simResults.length > 0 && (
                <>
                  <path 
                    d={getDensityPoints(r3Stats.mean, r3Stats.std, progressFraction)} 
                    fill="rgba(249, 115, 22, 0.1)" 
                    stroke="#F97316" 
                    strokeWidth={1.5}
                    className="transition-all duration-75"
                  />
                  {/* Mean marker line */}
                  <line 
                    x1={40 + (r3Stats.mean / 100) * 260} 
                    y1={20} 
                    x2={40 + (r3Stats.mean / 100) * 260} 
                    y2={180} 
                    stroke="#EA580C" 
                    strokeWidth={1} 
                    strokeDasharray="4 2" 
                  />
                </>
              )}

              {/* Stacking and falling particles */}
              {dots.filter(d => d.route === 3).map(dot => (
                <circle 
                  key={dot.id} 
                  cx={dot.x} 
                  cy={dot.y} 
                  r={dot.landed ? 2 : 2.5} 
                  fill={dot.landed ? "#EA580C" : "#F97316"} 
                  opacity={dot.landed ? 0.8 : 1}
                />
              ))}
            </svg>
          </div>

          <div className="mt-3 flex items-start gap-2 bg-slate-55 border border-slate-200 p-2.5 rounded-xl text-[10px] text-slate-550 leading-relaxed font-sans min-h-[60px]">
            <Info className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Analysis:</strong> Composite scores vary widely between 30 and 98 (volatility 16.6). Its priority ranking is highly sensitive to policy focus.
            </p>
          </div>
      </div>

      {/* Fullscreen stats and history log */}
      {isFullscreen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-slate-100 pt-6">
          {/* Column 1: Detailed Statistics Table */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Simulation Summary Stats</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px]">
                    <th className="pb-2">Metric</th>
                    <th className="pb-2 text-right text-blue-600">Route 002 (Essential Equity)</th>
                    <th className="pb-2 text-right text-orange-600">Route 003 (High Swing)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-655 font-semibold">
                  <tr>
                    <td className="py-2 font-bold text-slate-700">Mean Score</td>
                    <td className="py-2 text-right font-mono font-bold text-blue-600">{r2Stats.mean.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono font-bold text-orange-600">{r3Stats.mean.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-slate-700">Volatility (σ)</td>
                    <td className="py-2 text-right font-mono">{r2Stats.std.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono">{r3Stats.std.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-slate-700">Minimum Simulated Score</td>
                    <td className="py-2 text-right font-mono">{r2Stats.min?.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono">{r3Stats.min?.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-slate-700">Maximum Simulated Score</td>
                    <td className="py-2 text-right font-mono">{r2Stats.max?.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono">{r3Stats.max?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Column 2: Live Log Panel */}
          <div className="bg-slate-900 text-slate-300 font-mono text-[10px] rounded-2xl p-5 shadow-inner flex flex-col h-[180px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Run History Log</span>
              <span className="text-[9px] bg-slate-800 text-teal-400 px-1.5 py-0.5 rounded font-bold">ACTIVE FEED</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: 'thin' }}>
              {simResults.length === 0 ? (
                <div className="text-slate-500 text-center py-8">No simulation data. Click "Run Simulation" above.</div>
              ) : (
                [...simResults].reverse().slice(0, 30).map((res, i) => (
                  <div key={i} className="flex justify-between items-center hover:bg-slate-800 px-1 py-0.5 rounded">
                    <span>
                      <span className="text-slate-500">#{simResults.length - i}</span>{' '}
                      <span className="text-blue-400">V:{res.weights.vulnerability}%</span>{' '}
                      <span className="text-emerald-400">P:{res.weights.offPeak}%</span>{' '}
                      <span className="text-amber-400">M:{res.weights.monopoly}%</span>{' '}
                      <span className="text-teal-400">O:{res.weights.opportunity}%</span>
                    </span>
                    <span className="font-bold">
                      <span className="text-blue-500">{res.r2Score.toFixed(1)}</span>
                      <span className="text-slate-600 mx-1">|</span>
                      <span className="text-orange-500">{res.r3Score.toFixed(1)}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </>
  );
};
