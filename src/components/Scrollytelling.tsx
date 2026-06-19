"use client";

import React, { useState, useMemo } from 'react';
import { 
  Bus, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Compass
} from 'lucide-react';
import { RouteTicket } from './ui/RouteTicket';

interface ScrollytellingProps {
  onBack: () => void;
  onJumpIn: () => void;
}

export const Scrollytelling: React.FC<ScrollytellingProps> = ({ onBack, onJumpIn }) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  // Policy Sliders state for Step 7 (Policy Weights)
  const [weights, setWeights] = useState({
    vulnerability: 25,
    offPeak: 25,
    monopoly: 25,
    opportunity: 25,
  });

  const handleWeightChange = (key: keyof typeof weights, val: number) => {
    const diff = val - weights[key];
    const otherKeys = (Object.keys(weights) as Array<keyof typeof weights>).filter(k => k !== key);
    
    // Distribute the difference proportionally among the other weights
    const sumOthers = otherKeys.reduce((sum, k) => sum + weights[k], 0);
    const newWeights = { ...weights, [key]: val };
    
    if (sumOthers > 0) {
      otherKeys.forEach(k => {
        const ratio = weights[k] / sumOthers;
        newWeights[k] = Math.max(0, Math.round(weights[k] - diff * ratio));
      });
    } else {
      otherKeys.forEach(k => {
        newWeights[k] = Math.max(0, Math.round((100 - val) / 3));
      });
    }

    // Adjust any minor rounding discrepancies to ensure total is exactly 100%
    const total = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    if (total !== 100) {
      newWeights[otherKeys[0]] += (100 - total);
    }

    setWeights(newWeights);
  };

  // Live Score Calculator for Step 7
  const liveScores = useMemo(() => {
    // Route 002 raw scores
    const r2 = { vulnerability: 80.8, offPeak: 31.3, monopoly: 67.6, opportunity: 92.7 };
    // Route 003 raw scores
    const r3 = { vulnerability: 17.5, offPeak: 38.0, monopoly: 0.0, opportunity: 18.9 };

    const score2 = (
      r2.vulnerability * (weights.vulnerability / 100) +
      r2.offPeak * (weights.offPeak / 100) +
      r2.monopoly * (weights.monopoly / 100) +
      r2.opportunity * (weights.opportunity / 100)
    );

    const score3 = (
      r3.vulnerability * (weights.vulnerability / 100) +
      r3.offPeak * (weights.offPeak / 100) +
      r3.monopoly * (weights.monopoly / 100) +
      r3.opportunity * (weights.opportunity / 100)
    );

    return { route2: score2, route3: score3 };
  }, [weights]);

  const totalSteps = 9;

  const handleNext = () => {
    if (activeStep < totalSteps - 1) setActiveStep(activeStep + 1);
  };

  const handlePrev = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  // Step names for progress tracking
  const stepTitles = [
    "Introduction",
    "Four Pillars",
    "Vulnerability",
    "Opportunity",
    "Off Peak Service",
    "Transit Monopoly",
    "Policy Weights",
    "Stability Focus",
    "Action"
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 font-sans relative">
      
      {/* 🚌 Fixed Scrollytelling Header with Progress Tracker */}
      <header className="fixed top-0 left-0 w-full bg-white border-b border-slate-200 z-50 h-16 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200"
            title="Return to Home"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Scrollyteller</span>
            <span className="text-sm font-black text-blue-900 leading-none mt-1">{stepTitles[activeStep]}</span>
          </div>
        </div>

        {/* Dynamic Bus Progress Bar */}
        <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-visible relative">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${(activeStep / (totalSteps - 1)) * 100}%` }}
            />
            {/* Slideable Bus Indicator */}
            <div 
              className="absolute -top-3 w-7 h-7 bg-white border-2 border-teal-500 rounded-full flex items-center justify-center shadow-md transition-all duration-300"
              style={{ 
                left: `calc(${(activeStep / (totalSteps - 1)) * 100}% - 14px)`,
              }}
            >
              <Bus className="w-4 h-4 text-teal-600" />
            </div>
          </div>
        </div>

        <button
          onClick={onJumpIn}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm shadow-md transition-all duration-200 active:scale-95 whitespace-nowrap"
        >
          Let's jump in!
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Main Scrollytelling Container */}
      <main className="flex-grow pt-16 flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full overflow-hidden">
        
        {/* 📊 LEFT COLUMN: Dynamic React Visualizations */}
        <section className="w-full lg:w-[55%] h-[40vh] lg:h-full bg-slate-900 flex items-center justify-center p-4 md:p-8 relative border-b lg:border-b-0 lg:border-r border-slate-800">
          
          {/* Decorative dark grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-10" />

          {/* PAGE 1 VISUAL: Edmonton Subway-like Network Layout */}
          {activeStep === 0 && (
            <div className="w-full h-full max-w-lg flex flex-col justify-center items-center">
              <svg className="w-full h-64 opacity-80" viewBox="0 0 600 300">
                <path d="M50 150 L 250 150 L 350 250 L 550 250" fill="none" stroke="#22c55e" strokeWidth="8" strokeDasharray="600" strokeDashoffset="0" className="animate-[dash_3s_ease-in-out]" />
                <path d="M250 -50 L 250 200 L 350 300" fill="none" stroke="#eab308" strokeWidth="8" />
                <path d="M50 250 L 150 250 L 250 150 L 550 150" fill="none" stroke="#ef4444" strokeWidth="8" />
                {/* Highlight Route 002 (Blue Route) */}
                <path d="M500 -50 L 500 100 L 400 200 L 200 200 L 100 300" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" className="opacity-90 animate-pulse" />
                <circle cx="500" cy="100" r="6" fill="white" stroke="#3b82f6" strokeWidth="3" />
                <circle cx="400" cy="200" r="6" fill="white" stroke="#3b82f6" strokeWidth="3" />
                <circle cx="200" cy="200" r="6" fill="white" stroke="#3b82f6" strokeWidth="3" />
              </svg>
              <div className="text-center mt-4">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">Edmonton Route Matrix</span>
                <p className="text-[10px] text-slate-500 mt-1">Route 002 (Blue Corridor) and Route 003 (Red Corridor) Highlighted</p>
              </div>
            </div>
          )}

          {/* PAGE 2 VISUAL: Four Pillars Grid Layout */}
          {activeStep === 1 && (
            <div className="grid grid-cols-2 gap-4 max-w-md w-full">
              {[
                { title: "Transit Vulnerability", icon: ShieldCheck, desc: "Demographic Makeup", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { title: "Off Peak Service", icon: Clock, desc: "Evening & Weekend Hours", color: "text-blue-500", bg: "bg-blue-500/10" },
                { title: "Transit Monopoly", icon: Zap, desc: "Alternative Route Availability", color: "text-amber-500", bg: "bg-amber-500/10" },
                { title: "Destination Opportunity", icon: Compass, desc: "Employment & Health Connections", color: "text-purple-500", bg: "bg-purple-500/10" }
              ].map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col gap-2 transition-all hover:scale-105">
                    <div className={`w-8 h-8 rounded-lg ${p.color} ${p.bg} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-white leading-tight">{p.title}</span>
                    <span className="text-[10px] text-slate-500">{p.desc}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGE 3 VISUAL: Transit Vulnerability Comparison Graph */}
          {activeStep === 2 && (
            <div className="w-full max-w-sm flex flex-col gap-6">
              <span className="text-xs font-bold font-mono text-emerald-400 tracking-wider text-center uppercase">Vulnerability Pillar Breakdown</span>
              <div className="flex flex-col gap-4">
                {/* Route 002 */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Route 002 (Blue)</span>
                    <span className="text-blue-400">80.8 / 100</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '80.8%' }} />
                  </div>
                </div>
                {/* Route 003 */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Route 003 (Orange)</span>
                    <span className="text-amber-400">17.5 / 100</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '17.5%' }} />
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-800 pt-4 grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-500 uppercase">Low Income</span><span className="text-xs font-bold text-slate-300">18.2% vs 12.5%</span></div>
                <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-500 uppercase">Minorities</span><span className="text-xs font-bold text-slate-300">29.5% vs 24.1%</span></div>
                <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-500 uppercase">Seniors</span><span className="text-xs font-bold text-slate-300">2.1% vs 1.6%</span></div>
              </div>
            </div>
          )}

          {/* PAGE 4 VISUAL: Destination Opportunity Nodes */}
          {activeStep === 3 && (
            <div className="w-full max-w-sm flex flex-col justify-center items-center gap-6">
              <span className="text-xs font-bold font-mono text-purple-400 tracking-wider uppercase text-center">Opportunity Index Graph</span>
              <div className="flex justify-between items-center w-full relative px-6">
                {/* Connector Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  <line x1="15%" y1="50%" x2="85%" y2="20%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
                  <line x1="15%" y1="50%" x2="85%" y2="50%" stroke="#3b82f6" strokeWidth="2" />
                  <line x1="15%" y1="50%" x2="85%" y2="80%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
                  <line x1="15%" y1="80%" x2="85%" y2="80%" stroke="#eab308" strokeWidth="1" opacity="0.4" />
                </svg>

                {/* Left Side Routes */}
                <div className="flex flex-col gap-10 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">R002</div>
                  <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">R003</div>
                </div>

                {/* Right Side Opportunities */}
                <div className="flex flex-col gap-6 relative z-10 text-xs font-bold text-slate-300">
                  <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/80">🏥 Hospitals (Access 5.0)</div>
                  <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/80">🎓 Universities (Access 3.0)</div>
                  <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/80">💼 Major Job Centers</div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 5 VISUAL: Off Peak Timeline Hours */}
          {activeStep === 4 && (
            <div className="w-full max-w-sm flex flex-col gap-6">
              <span className="text-xs font-bold font-mono text-blue-400 tracking-wider text-center uppercase">Service Hours Clock Grid</span>
              
              {/* Service timeline representation */}
              <div className="flex flex-col gap-4 text-xs font-bold text-slate-400">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Route 003 Off Peak Timeline</span>
                    <span className="text-amber-400">38.0 Score</span>
                  </div>
                  <div className="flex h-6 rounded overflow-hidden border border-slate-800">
                    <div className="flex-1 bg-amber-500" title="Day service" />
                    <div className="flex-1 bg-amber-600" title="Evening service" />
                    <div className="flex-1 bg-amber-700" title="Weekend coverage" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Route 002 Off Peak Timeline</span>
                    <span className="text-blue-400">31.3 Score</span>
                  </div>
                  <div className="flex h-6 rounded overflow-hidden border border-slate-800">
                    <div className="flex-1 bg-blue-600" title="Day service" />
                    <div className="w-[30%] bg-blue-800" title="Reduced evening service" />
                    <div className="w-[20%] bg-slate-850" title="No night coverage" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 6 VISUAL: Transit Monopoly Walk Sheds */}
          {activeStep === 5 && (
            <div className="w-full max-w-sm flex flex-col justify-center items-center gap-6">
              <span className="text-xs font-bold font-mono text-amber-400 tracking-wider uppercase text-center">Service Catchment Intersections</span>
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Route 002 Isolated Circle */}
                <div className="absolute w-40 h-40 rounded-full border-2 border-blue-500/30 bg-blue-500/10 flex items-center justify-center animate-pulse">
                  <span className="text-[10px] font-bold text-blue-400 absolute top-4">Route 002 Walk Shed</span>
                </div>
                
                {/* Route 003 Overlapping Circles */}
                <div className="absolute w-24 h-24 rounded-full border border-amber-500/30 bg-amber-500/5 -translate-x-12 translate-y-6" />
                <div className="absolute w-24 h-24 rounded-full border border-red-500/30 bg-red-500/5 translate-x-12 -translate-y-6" />
                <div className="absolute w-20 h-20 rounded-full border border-emerald-500/30 bg-emerald-500/5 translate-y-8" />
                
                <div className="z-10 w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300">R003</div>
              </div>
              <p className="text-[10px] text-slate-500 text-center">Route 003 overlaps with 3 alternative lines (Redundant). Route 002 is isolated.</p>
            </div>
          )}

          {/* PAGE 7 VISUAL: Dynamic Weights Simulator */}
          {activeStep === 6 && (
            <div className="w-full max-w-sm flex flex-col gap-6">
              <span className="text-xs font-bold font-mono text-teal-400 tracking-wider text-center uppercase">Live Weighted Score Calculator</span>
              
              <div className="flex flex-col gap-4 text-xs font-bold text-slate-300">
                {/* Route 002 live score */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>Route 002 Score</span>
                    <span className="text-blue-400 font-mono">{liveScores.route2.toFixed(1)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-200" style={{ width: `${liveScores.route2}%` }} />
                  </div>
                </div>

                {/* Route 003 live score */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>Route 003 Score</span>
                    <span className="text-amber-400 font-mono">{liveScores.route3.toFixed(1)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-200" style={{ width: `${liveScores.route3}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 8 VISUAL: Policy Swing Scatter Plot */}
          {activeStep === 7 && (
            <div className="w-full max-w-sm flex flex-col justify-center items-center gap-4">
              <span className="text-xs font-bold font-mono text-purple-400 tracking-wider uppercase text-center">Robustness vs. Volatility Map</span>
              <svg className="w-64 h-64 border-b border-l border-slate-700 overflow-visible" viewBox="0 0 100 100">
                {/* Labels */}
                <text x="50" y="108" fill="#64748b" fontSize="6" textAnchor="middle" fontWeight="bold">Mean Score (Equity Support)</text>
                <text x="-50" y="-8" fill="#64748b" fontSize="6" textAnchor="middle" fontWeight="bold" transform="rotate(-90)">Volatility (Rr)</text>
                
                {/* Route 002 (Bedrock Essential) */}
                <circle cx="80" cy="85" r="5" fill="#3b82f6" className="animate-ping" opacity="0.4" />
                <circle cx="80" cy="85" r="5" fill="#3b82f6" />
                <text x="82" y="81" fill="#3b82f6" fontSize="5" fontWeight="black">R002 (Bedrock)</text>

                {/* Route 003 (Policy Swing) */}
                <circle cx="20" cy="25" r="5" fill="#ef4444" className="animate-ping" opacity="0.4" />
                <circle cx="20" cy="25" r="5" fill="#ef4444" />
                <text x="22" y="21" fill="#ef4444" fontSize="5" fontWeight="black">R003 (Swing)</text>

                {/* Scatter plot points */}
                <circle cx="45" cy="55" r="3" fill="#64748b" opacity="0.3" />
                <circle cx="60" cy="45" r="3" fill="#64748b" opacity="0.3" />
                <circle cx="35" cy="70" r="3" fill="#64748b" opacity="0.3" />
                <circle cx="70" cy="30" r="3" fill="#64748b" opacity="0.3" />
              </svg>
            </div>
          )}

          {/* PAGE 9 VISUAL: Summary Grid comparison */}
          {activeStep === 8 && (
            <div className="w-full max-w-sm flex flex-col gap-4">
              <span className="text-xs font-bold font-mono text-teal-400 tracking-wider text-center uppercase">Route Diagnostics Sheet</span>
              
              <table className="w-full text-left text-[11px] text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase">
                    <th className="py-2">Pillar Indicator</th>
                    <th className="py-2 text-right">Route 002</th>
                    <th className="py-2 text-right">Route 003</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  <tr><td className="py-2">Vulnerability Index</td><td className="py-2 text-right text-blue-400 font-bold">80.8</td><td className="py-2 text-right text-amber-500 font-bold">17.5</td></tr>
                  <tr><td className="py-2">Off Peak Service</td><td className="py-2 text-right text-blue-400 font-bold">31.3</td><td className="py-2 text-right text-amber-500 font-bold">38.0</td></tr>
                  <tr><td className="py-2">Transit Monopoly</td><td className="py-2 text-right text-blue-400 font-bold">67.6</td><td className="py-2 text-right text-amber-500 font-bold">0.0</td></tr>
                  <tr><td className="py-2">Opportunity Access</td><td className="py-2 text-right text-blue-400 font-bold">92.7</td><td className="py-2 text-right text-amber-500 font-bold">18.9</td></tr>
                  <tr className="border-t-2 border-slate-700 font-bold text-white"><td className="py-2">Final Score (25% weights)</td><td className="py-2 text-right text-blue-400">66.9 (B)</td><td className="py-2 text-right text-amber-500">18.5 (E)</td></tr>
                </tbody>
              </table>
            </div>
          )}

        </section>

        {/* 📖 RIGHT COLUMN: Text Narrative Scroll panel with tickets */}
        <section className="w-full lg:w-[45%] h-[60vh] lg:h-full overflow-y-auto custom-scrollbar p-6 md:p-8 flex flex-col justify-between bg-white relative">
          
          <div className="flex-1 flex flex-col justify-center">
            
            {/* Step content switches */}
            {activeStep === 0 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl md:text-3xl font-black text-blue-900 leading-tight">The Big Picture</h2>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Every day, thousands of Edmontonians rely on transit to travel to work, purchase groceries, visit healthcare facilities, and see family. Because not all transit services are experienced equally, the Route Equity Scorecard measures how well each route assists transit users, particularly those in equity-seeking communities.
                </p>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  We will examine two contrasting routes:
                </p>
                <div className="flex flex-col gap-4 mt-2">
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: Downtown - Capilano" 
                    description="A long, high-frequency line crossing the city to link outer neighbourhoods."
                  />
                  <RouteTicket 
                    routeNumber="003" 
                    theme="orange" 
                    title="Route 003: Westmount - Stadium" 
                    description="A shorter connection route linking central hubs."
                  />
                </div>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed mt-2">
                  City planners must identify which routes provide an essential service to equity-seeking communities, and this scorecard provides the data to make those decisions.
                </p>
              </div>
            )}

            {activeStep === 1 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl md:text-3xl font-black text-blue-900 leading-tight">The Four Pillars of Transit Equity</h2>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Rather than guessing where transit needs are greatest, the model evaluates every route across four distinct pillars:
                </p>
                <ol className="list-decimal list-inside flex flex-col gap-3 text-slate-600 text-sm md:text-base pl-2">
                  <li><strong className="text-blue-950">Transit Vulnerability</strong>: The demographic makeup of the neighbourhoods along the route.</li>
                  <li><strong className="text-blue-950">Off Peak Service</strong>: The availability of the route during evenings, nights, and weekends.</li>
                  <li><strong className="text-blue-950">Transit Monopoly</strong>: The reliance of neighbourhoods on a single route without alternative options, such as the LRT or nearby frequent bus lines.</li>
                  <li><strong className="text-blue-950">Destination Opportunity</strong>: The connection of riders to essential locations, including employment areas, hospitals, supermarkets, and schools.</li>
                </ol>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Each route receives a score from 0 to 100 on each pillar. Combining these four scores helps determine a route's transit equity score.
                </p>
              </div>
            )}

            {activeStep === 2 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl md:text-3xl font-black text-blue-900 leading-tight">Transit Vulnerability</h2>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  The Transit Vulnerability pillar measures who lives near a bus route. We look at the population of low-income households, seniors, youth, lone parents, and visible minorities in the neighbourhoods served by each line.
                </p>
                <div className="flex flex-col gap-4 my-2">
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: High Vulnerability" 
                    description="Route 002 serves a large population of 49,902 people across 81 neighbourhoods. Many of these areas contain high concentrations of low-income residents and recent immigrants. As a result, Route 002 receives a vulnerability score of 80.8 out of 100."
                  />
                  <RouteTicket 
                    routeNumber="003" 
                    theme="orange" 
                    title="Route 003: Low Vulnerability" 
                    description="Route 003 serves 13,664 people across 25 neighbourhoods. Because these areas generally have higher average household incomes, fewer seniors, and fewer low-income households, Route 003 receives a vulnerability score of 17.5 out of 100."
                  />
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl md:text-3xl font-black text-blue-900 leading-tight">Destination Opportunity</h2>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  The Destination Opportunity pillar evaluates how well a bus route connects riders to critical locations. These locations include major employment centres, medical facilities, post-secondary schools, and grocery stores.
                </p>
                <div className="flex flex-col gap-4 my-2">
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: Diverse Access Link" 
                    description="Route 002 connects many residential areas directly to major shopping centres, employment zones, and transit terminals. Because it links riders to diverse opportunities, it scores 92.7 out of 100 on Destination Opportunity."
                  />
                  <RouteTicket 
                    routeNumber="003" 
                    theme="orange" 
                    title="Route 003: Local Hub connection" 
                    description="Route 003 covers a shorter distance and connects fewer major hubs, resulting in a Destination Opportunity score of 18.9 out of 100. This score indicates that riders on Route 003 must transfer more frequently to reach key destinations across Edmonton."
                  />
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl md:text-3xl font-black text-blue-900 leading-tight">Off Peak Service</h2>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  The Off Peak Service pillar measures the frequency and reliability of a bus route outside standard working hours. This includes service during evenings, late nights, Saturdays, and Sundays.
                </p>
                <div className="flex flex-col gap-4 my-2">
                  <RouteTicket 
                    routeNumber="003" 
                    theme="orange" 
                    title="Route 003: Consistent Off Peak" 
                    description="Route 003 maintains regular frequency during late-night hours and weekends. Because it provides dependable service throughout the entire week, it scores 38.0 out of 100 on Off Peak Service."
                  />
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: Reduced Night Hours" 
                    description="Route 002 has a slightly lower score of 31.3 out of 100. Although Route 002 has high frequency during weekdays, its frequency drops significantly during off-peak times, making travel more difficult for late-night shift workers."
                  />
                </div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl md:text-3xl font-black text-blue-900 leading-tight">Transit Monopoly</h2>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  The Transit Monopoly pillar measures how dependent a neighbourhood is on a single bus route. If a neighbourhood has no other bus routes or LRT stations within walking distance, that route acts as a transit monopoly.
                </p>
                <div className="flex flex-col gap-4 my-2">
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: Sole Lifeline" 
                    description="Route 002 serves outer neighbourhoods where no other transit options exist. If this route were reduced, residents would have no alternative transportation. Therefore, it scores 67.6 out of 100 on Transit Monopoly."
                  />
                  <RouteTicket 
                    routeNumber="003" 
                    theme="orange" 
                    title="Route 003: Multiple transit Alternatives" 
                    description="Route 003 runs through central areas with overlapping transit options, including several bus routes and nearby LRT stations. Because residents can easily access alternative transit lines, Route 003 scores 0.0 out of 100 on Transit Monopoly."
                  />
                </div>
              </div>
            )}

            {activeStep === 6 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl md:text-3xl font-black text-blue-900 leading-tight">Policy Weights (Setting City Priorities)</h2>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  After evaluating the individual pillars, city planners must combine them to generate a final grade. To do this, planners assign weights to each pillar, representing the city's current priorities.
                </p>
                
                {/* Weight Sliders Simulator UI */}
                <div className="my-2 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Weights Allocation Dashboard</span>
                  
                  {/* Slider: Vulnerability */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Transit Vulnerability</span>
                      <span className="font-mono text-teal-600">{weights.vulnerability}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={weights.vulnerability}
                      onChange={(e) => handleWeightChange('vulnerability', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  {/* Slider: Off Peak */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Off Peak Service</span>
                      <span className="font-mono text-teal-600">{weights.offPeak}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={weights.offPeak}
                      onChange={(e) => handleWeightChange('offPeak', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  {/* Slider: Monopoly */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Transit Monopoly</span>
                      <span className="font-mono text-teal-600">{weights.monopoly}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={weights.monopoly}
                      onChange={(e) => handleWeightChange('monopoly', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  {/* Slider: Opportunity */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Destination Opportunity</span>
                      <span className="font-mono text-teal-600">{weights.opportunity}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={weights.opportunity}
                      onChange={(e) => handleWeightChange('opportunity', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>
                </div>

                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Under a balanced policy with equal 25% weights, Route 002 receives a B grade (score of 66.9) due to its high scores in vulnerability, monopoly, and opportunity. Route 003 receives an E grade (score of 18.5) because it serves neighbourhoods with higher average incomes and many alternative transit options.
                </p>
              </div>
            )}

            {activeStep === 8 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl md:text-3xl font-black text-blue-900 leading-tight">Turning Data into Action</h2>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  By scoring bus routes across the four pillars and testing score stability, transit planners can make objective funding decisions.
                </p>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Instead of guessing, resources can be distributed systematically:
                </p>
                <ul className="list-disc list-inside flex flex-col gap-2 text-slate-600 text-sm md:text-base pl-2">
                  <li>Protect and fund Bedrock Essentials, such as Route 002, to maintain the foundation of the transit network.</li>
                  <li>Target funding toward low-scoring routes to improve frequency, off-peak hours, or connections to jobs.</li>
                </ul>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Transit equity is not about providing the same service to everyone. It is about allocating resources to make the greatest positive difference in the lives of residents.
                </p>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Planners and residents can use the search tool below to find specific bus routes, view individual pillar scores, and identify stability classes.
                </p>
              </div>
            )}

            {activeStep === 7 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl md:text-3xl font-black text-blue-900 leading-tight">The Stability Focus (Predicting Policy Swings)</h2>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  To confirm transit planning is reliable under different political administrations, the model runs a Monte Carlo simulation. This process tests thousands of weight combinations to determine how scores change as policy priorities shift.
                </p>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  The model classifies routes based on their scoring stability:
                </p>
                <ul className="list-disc list-inside flex flex-col gap-3 text-slate-600 text-sm md:text-base pl-2">
                  <li><strong className="text-blue-950">Bedrock Essentials</strong>: These routes score highly across all weight scenarios. Route 002 is a Bedrock Essential because it consistently receives high marks, making it a permanent priority for transit funding.</li>
                  <li><strong className="text-blue-950">Policy Swing Corridors</strong>: These routes have scores that fluctuate wildly depending on weight selections. Route 003 is a Policy Swing Corridor because its score rises under an Off Peak Service focus but drops when planners prioritise Transit Monopoly or Transit Vulnerability.</li>
                </ul>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Identifying these classes helps planners protect core services and understand how policy changes affect specific routes.
                </p>
              </div>
            )}

          </div>

          {/* 🔘 Navigation Footbar */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
            <button
              onClick={handlePrev}
              disabled={activeStep === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border font-bold text-xs transition-all duration-200 ${
                activeStep === 0
                  ? 'text-slate-350 bg-slate-50 border-slate-100 cursor-not-allowed'
                  : 'text-slate-600 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    activeStep === i ? 'bg-teal-500 w-4' : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={activeStep === totalSteps - 1 ? onJumpIn : handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 active:scale-95"
            >
              {activeStep === totalSteps - 1 ? "Jump to Map!" : "Next"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </section>

      </main>

    </div>
  );
};
