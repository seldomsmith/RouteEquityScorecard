"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Bus, 
  Home, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Compass
} from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { RouteTicket } from './ui/RouteTicket';
import { ExplainerMap } from './widgets/ExplainerMap';
import { MonteCarloPlinko } from './widgets/MonteCarloPlinko';

interface ScrollytellingProps {
  onBack: () => void;
  onJumpIn: () => void;
}

// Color map aligning with the user's Policy Risk Map design:
const CLASS_COLORS: Record<string, string> = {
  'Bedrock Essential': '#2E4057',       // Always High Equity
  'Bedrock Resilient': '#68889E',       // Always Low Equity
  'Policy Swing Corridor': '#E85F5C',   // High Swing Routes
  'Moderate Stability': '#F4B942',      // Moderate Stability
};

const CLASS_LABELS: Record<string, string> = {
  'Bedrock Essential': 'Always High Equity',
  'Bedrock Resilient': 'Always Low Equity',
  'Policy Swing Corridor': 'High Swing Routes',
  'Moderate Stability': 'Moderate Stability',
};

export const Scrollytelling: React.FC<ScrollytellingProps> = ({ onBack, onJumpIn }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [sensitivityData, setSensitivityData] = useState<any[]>([]);

  // States to hold route geometry & boundaries for the inline ExplainerMaps
  const [route2Data, setRoute2Data] = useState<any>(null);
  const [route3Data, setRoute3Data] = useState<any>(null);
  const [daGeoJson, setDaGeoJson] = useState<any>(null);

  // Policy Sliders state for Step 7 (Policy Weights)
  const [weights, setWeights] = useState({
    vulnerability: 25,
    offPeak: 25,
    monopoly: 25,
    opportunity: 25,
  });

  // Track container scroll progress for the top indicator
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const totalScroll = el.scrollHeight - el.clientHeight;
      if (totalScroll > 0) {
        setScrollProgress(el.scrollTop / totalScroll);
      }
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch sensitivity data for the scatter plot
  useEffect(() => {
    fetch('/data/sensitivity_summary.csv')
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split('\n');
        if (lines.length === 0) return;
        const headers = lines[0].split(',').map((h) => h.trim());
        const list: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const values = line.split(',').map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, idx) => {
            const val = values[idx];
            if (h === 'route_id' || h === 'name' || h === 'short_name' || h === 'stability_class') {
              obj[h] = val || '';
            } else {
              obj[h] = Number(val || 0);
            }
          });
          if (obj.route_id) {
            list.push(obj);
          }
        }
        setSensitivityData(list);
      })
      .catch((err) => console.error('Failed to load sensitivity summary:', err));
  }, []);

  // Fetch route geometries and DA boundaries GeoJSON
  useEffect(() => {
    fetch('/data/da_boundaries_simple.geojson')
      .then((res) => res.json())
      .then((data) => setDaGeoJson(data))
      .catch((err) => console.error("❌ Explainer Map failed to load DA boundaries:", err));

    fetch('/data/golden_route_record.json')
      .then((res) => res.json())
      .then((data) => {
        const r2 = data.routes.find((r: any) => r.route_id === '002');
        const r3 = data.routes.find((r: any) => r.route_id === '003');
        setRoute2Data(r2);
        setRoute3Data(r3);
      })
      .catch((err) => console.error("❌ Explainer Map failed to load golden route records:", err));
  }, []);

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

  // Live Score Calculator for weights simulator
  const liveScores = useMemo(() => {
    const r2 = { vulnerability: 80.8, offPeak: 31.3, monopoly: 67.6, opportunity: 92.7 };
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

  // Safe Highlight Tooltip for the Scatter Chart
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    if (!d) return null;

    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl px-3 py-2 text-xs max-w-xs">
        <p className="font-bold text-slate-900">{d?.name || 'Unknown Route'}</p>
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
          {(d?.stability_class ? (CLASS_LABELS[d.stability_class] || d.stability_class) : 'Unknown Stability')} (Route {d?.short_name || '?'})
        </p>
        <div className="mt-1.5 space-y-0.5 text-slate-600 border-t border-slate-100 pt-1.5">
          <div className="flex justify-between gap-4">
            <span>Mean Score:</span>
            <span className="font-bold text-slate-800">{(typeof d?.score_mean === 'number') ? d.score_mean.toFixed(1) : 'N/A'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Volatility:</span>
            <span className="font-bold text-slate-800">{(typeof d?.score_std === 'number') ? d.score_std.toFixed(2) : 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="h-screen w-full flex flex-col bg-slate-50 font-sans relative overflow-y-auto scroll-smooth custom-scrollbar">
      
      {/* 🚌 Fixed Scrollytelling Header with Scroll Progress Tracker */}
      <header className="fixed top-0 left-0 w-full bg-white border-b border-slate-200 z-50 h-16 px-4 md:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200"
            title="Return to Home"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Transit Equity Explainer</span>
            <span className="text-xs font-semibold text-teal-650 leading-none mt-1">Scroll down to read</span>
          </div>
        </div>

        {/* Scroll Progress Bar */}
        <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
          <div className="w-full h-1 bg-slate-100 rounded-full">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-75"
              style={{ width: `${scrollProgress * 100}%` }}
            />
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
      <main className="flex-grow pt-24 pb-20 w-full flex justify-center bg-slate-50">
        <div className="w-full max-w-3xl px-6 flex flex-col gap-24">
          
          {/* ================= SECTION 1: Introduction ================= */}
          <section className="flex flex-col gap-6">
            
            {/* Narrative text (sitting directly on the background) */}
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">The Big Picture</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Every day, thousands of Edmontonians rely on transit to travel to work, purchase groceries, visit healthcare facilities, and see family. Because not all transit services are experienced equally, the Route Equity Scorecard measures how well each route assists transit users, particularly those in equity-seeking communities.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                We will examine two contrasting routes throughout this walkthrough:
              </p>
              
              <div className="flex flex-col gap-8 py-4">
                <div className="flex flex-col gap-2">
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: Downtown - Capilano" 
                    description="A long, high-frequency line crossing the city to link outer neighbourhoods."
                  />
                  {/* Inline interactive Mapbox instance showing Route 002 */}
                  {daGeoJson && route2Data && (
                    <ExplainerMap 
                      routeId="002" 
                      routeCoords={route2Data.coords} 
                      servedDas={route2Data.da_metadata} 
                      daGeoJson={daGeoJson} 
                      grade={route2Data.grade} 
                    />
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <RouteTicket 
                    routeNumber="003" 
                    theme="orange" 
                    title="Route 003: Westmount - Stadium" 
                    description="A shorter connection route linking central hubs."
                  />
                  {/* Inline interactive Mapbox instance showing Route 003 */}
                  {daGeoJson && route3Data && (
                    <ExplainerMap 
                      routeId="003" 
                      routeCoords={route3Data.coords} 
                      servedDas={route3Data.da_metadata} 
                      daGeoJson={daGeoJson} 
                      grade={route3Data.grade} 
                    />
                  )}
                </div>
              </div>

              <p className="text-slate-600 text-base leading-relaxed">
                City planners must identify which routes provide an essential service to equity-seeking communities, and this scorecard provides the data to make those decisions.
              </p>
            </div>
          </section>

          {/* ================= SECTION 2: Four Pillars ================= */}
          <section className="flex flex-col gap-6">
            {/* Visual Placeholder */}
            <div className="w-full h-72 bg-slate-100 border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 font-bold select-none shadow-sm gap-2 p-6 text-center">
              <Compass className="w-10 h-10 text-slate-350" />
              <span className="text-xs font-mono tracking-widest uppercase mt-2">Visualisation: The Four Pillars of Transit Equity</span>
              <p className="text-[11px] text-slate-400 max-w-md font-medium mt-1">
                Visualizing Vulnerability, Off Peak, Monopoly, and Opportunity weight pillars.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">The Four Pillars of Transit Equity</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Rather than guessing where transit needs are greatest, the model evaluates every route across four distinct pillars:
              </p>
              <ul className="space-y-3 pl-2 text-slate-600 text-base">
                <li><strong className="text-blue-950 font-bold">1. Transit Vulnerability</strong>: The demographic makeup of the neighbourhoods along the route.</li>
                <li><strong className="text-blue-950 font-bold">2. Destination Opportunity</strong>: The connection of riders to essential locations, including employment areas, hospitals, supermarkets, and schools.</li>
                <li><strong className="text-blue-950 font-bold">3. Off Peak Service</strong>: The availability of the route during evenings, nights, and weekends.</li>
                <li><strong className="text-blue-950 font-bold">4. Transit Monopoly</strong>: The reliance of neighbourhoods on a single route without alternative options, such as the LRT or nearby frequent bus lines.</li>
              </ul>
              <p className="text-slate-600 text-base leading-relaxed">
                Each route receives a score from 0 to 100 on each pillar. Combining these four scores helps determine a route's transit equity score.
              </p>
            </div>
          </section>

          {/* ================= SECTION 3: Vulnerability ================= */}
          <section className="flex flex-col gap-6">
            {/* Visual Placeholder */}
            <div className="w-full h-72 bg-slate-100 border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 font-bold select-none shadow-sm gap-2 p-6 text-center">
              <Bus className="w-10 h-10 text-slate-350" />
              <span className="text-xs font-mono tracking-widest uppercase mt-2">Visualisation: Transit Vulnerability comparison</span>
              <p className="text-[11px] text-slate-400 max-w-md font-medium mt-1">
                Demographic metrics comparison for low income, seniors, and minorities on Route 002 vs Route 003.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">Transit Vulnerability</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                The Transit Vulnerability pillar measures who lives near a bus route. We look at the population of low-income households, seniors, youth, lone parents, and visible minorities in the neighbourhoods served by each line.
              </p>
              
              <div className="flex flex-col gap-4 py-2">
                <RouteTicket 
                  routeNumber="002" 
                  theme="blue" 
                  title="Route 002: High Vulnerability (Score: 80.8)" 
                  description="Route 002 serves a large population of 49,902 people across 81 neighbourhoods. Many of these areas contain high concentrations of low-income residents and recent immigrants."
                />
                <RouteTicket 
                  routeNumber="003" 
                  theme="orange" 
                  title="Route 003: Low Vulnerability (Score: 17.5)" 
                  description="Route 003 serves 13,664 people across 25 neighbourhoods. Because these areas generally have higher average household incomes, they present lower vulnerability index rankings."
                />
              </div>
            </div>
          </section>

          {/* ================= SECTION 4: Opportunity ================= */}
          <section className="flex flex-col gap-6">
            {/* Visual Placeholder */}
            <div className="w-full h-72 bg-slate-100 border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 font-bold select-none shadow-sm gap-2 p-6 text-center">
              <Compass className="w-10 h-10 text-slate-350" />
              <span className="text-xs font-mono tracking-widest uppercase mt-2">Visualisation: Destination Opportunity network maps</span>
              <p className="text-[11px] text-slate-400 max-w-md font-medium mt-1">
                Route reach to major employment hubs, hospitals, and post-secondary campuses.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">Destination Opportunity</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                The Destination Opportunity pillar evaluates how well a bus route connects riders to critical locations. These locations include major employment centres, medical facilities, post-secondary schools, and grocery stores.
              </p>
              
              <div className="flex flex-col gap-4 py-2">
                <RouteTicket 
                  routeNumber="002" 
                  theme="blue" 
                  title="Route 002: Diverse Access Link (Score: 92.7)" 
                  description="Route 002 connects many residential areas directly to major shopping centres, employment zones, and transit terminals."
                />
                <RouteTicket 
                  routeNumber="003" 
                  theme="orange" 
                  title="Route 003: Local Hub Connection (Score: 18.9)" 
                  description="Route 003 covers a shorter distance and connects fewer major hubs, indicating that riders on Route 003 must transfer more frequently to reach key destinations across Edmonton."
                />
              </div>
            </div>
          </section>

          {/* ================= SECTION 5: Off Peak Service ================= */}
          <section className="flex flex-col gap-6">
            {/* Visual Placeholder */}
            <div className="w-full h-72 bg-slate-100 border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 font-bold select-none shadow-sm gap-2 p-6 text-center">
              <Clock className="w-10 h-10 text-slate-350" />
              <span className="text-xs font-mono tracking-widest uppercase mt-2">Visualisation: Off-Peak service clock</span>
              <p className="text-[11px] text-slate-400 max-w-md font-medium mt-1">
                Operating hours and reliability timeline comparisons for evening and weekend service.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">Off Peak Service</h2>
              <p className="text-slate-655 text-base leading-relaxed">
                The Off Peak Service pillar measures the frequency and reliability of a bus route outside standard working hours. This includes service during evenings, late nights, Saturdays, and Sundays.
              </p>
              
              <div className="flex flex-col gap-4 py-2">
                <RouteTicket 
                  routeNumber="003" 
                  theme="orange" 
                  title="Route 003: Consistent Off Peak (Score: 38.0)" 
                  description="Route 003 maintains regular frequency during late-night hours and weekends, providing dependable service throughout the entire week."
                />
                <RouteTicket 
                  routeNumber="002" 
                  theme="blue" 
                  title="Route 002: Reduced Night Hours (Score: 31.3)" 
                  description="Although Route 002 has high frequency during weekdays, its frequency drops significantly during off-peak times, making travel more difficult for late-night shift workers."
                />
              </div>
            </div>
          </section>

          {/* ================= SECTION 6: Transit Monopoly ================= */}
          <section className="flex flex-col gap-6">
            {/* Visual Placeholder */}
            <div className="w-full h-72 bg-slate-100 border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 font-bold select-none shadow-sm gap-2 p-6 text-center">
              <ShieldCheck className="w-10 h-10 text-slate-350" />
              <span className="text-xs font-mono tracking-widest uppercase mt-2">Visualisation: Transit Monopoly buffer catchments</span>
              <p className="text-[11px] text-slate-400 max-w-md font-medium mt-1">
                Highlighting areas that are solely reliant on one specific route without alternative transit corridors.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">Transit Monopoly</h2>
              <p className="text-slate-655 text-base leading-relaxed">
                The Transit Monopoly pillar measures how dependent a neighbourhood is on a single bus route. If a neighbourhood has no other bus routes or LRT stations within walking distance, that route acts as a transit monopoly.
              </p>
              
              <div className="flex flex-col gap-4 py-2">
                <RouteTicket 
                  routeNumber="002" 
                  theme="blue" 
                  title="Route 002: Sole Lifeline (Score: 67.6)" 
                  description="Route 002 serves outer neighbourhoods where no other transit options exist. If this route were reduced, residents would have no alternative transportation."
                />
                <RouteTicket 
                  routeNumber="003" 
                  theme="orange" 
                  title="Route 003: Multiple Transit Alternatives (Score: 0.0)" 
                  description="Route 003 runs through central areas with overlapping transit options, including several bus routes and nearby LRT stations. Because residents can easily access alternative transit lines, it scores zero."
                />
              </div>
            </div>
          </section>

          {/* ================= SECTION 7: Policy Weights Simulator ================= */}
          <section className="flex flex-col gap-6">
            
            {/* Interactive Weight Sliders Simulator Widget */}
            <div className="p-6 bg-slate-100 border border-slate-200 rounded-3xl flex flex-col gap-5 shadow-sm">
              <div className="flex flex-col items-center">
                <Zap className="w-8 h-8 text-teal-600 mb-1" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Policy Weights Simulator</span>
                <span className="text-xs text-slate-400 mt-0.5 text-center">Adjust weights to see how route scores shift instantly</span>
              </div>
              
              <div className="flex flex-col gap-4">
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
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
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
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
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
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
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
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>
              </div>

              {/* Live score comparison inside weight card */}
              <div className="p-4 bg-white/70 border border-slate-200 rounded-xl flex flex-col gap-1.5 shadow-inner">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Live Simulated Result</span>
                <div className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  <div className="flex justify-between">
                    <span>Route 002 Score:</span>
                    <span className="text-blue-650 font-mono font-black">{liveScores.route2.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Route 003 Score:</span>
                    <span className="text-amber-600 font-mono font-black">{liveScores.route3.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">Policy Weights (Setting City Priorities)</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                After evaluating the individual pillars, city planners must combine them to generate a final grade. To do this, planners assign weights to each pillar, representing the city's current priorities.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                Under a balanced policy with equal 25% weights, Route 002 receives a B grade (score of 66.9) due to its high scores in vulnerability, monopoly, and opportunity. Route 003 receives an E grade (score of 18.5) because it serves neighbourhoods with higher average incomes and many alternative transit options.
              </p>
            </div>
          </section>

          {/* ================= SECTION 8: Stability Focus Scatter Plot & Plinko ================= */}
          <section className="flex flex-col gap-6">
            
            {/* 📊 Actual Interactive Scatter Plot */}
            <div className="w-full h-96 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col">
              <div className="text-center mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Policy Risk Map: Mean Score vs. Volatility</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Route 002 & Route 003 highlighted relative to all 170 network routes</p>
              </div>

              {sensitivityData.length > 0 ? (
                <div className="flex-1 min-h-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        type="number"
                        dataKey="score_mean"
                        name="Mean Score"
                        domain={[0, 100]}
                        tickCount={6}
                        stroke="#94A3B8"
                        fontSize={9}
                        label={{
                          value: 'Mean Score (Overall Priority Rank)',
                          position: 'bottom',
                          offset: 5,
                          fontSize: 9,
                          fill: '#64748B',
                          fontWeight: 600
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="score_std"
                        name="Volatility"
                        domain={[0, 40]}
                        tickCount={5}
                        stroke="#94A3B8"
                        fontSize={9}
                        label={{
                          value: 'Robustness Index (Rr) — Volatility',
                          angle: -90,
                          position: 'insideLeft',
                          offset: -5,
                          fontSize: 9,
                          fill: '#64748B',
                          fontWeight: 600
                        }}
                      />
                      <Tooltip content={<CustomChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                      
                      <Scatter data={sensitivityData}>
                        {sensitivityData.map((entry, index) => {
                          if (!entry) return null;
                          const isRoute2 = entry.route_id === '002';
                          const isRoute3 = entry.route_id === '003';
                          
                          // Style highlight for Route 002 and 003
                          let fill = (entry.stability_class && CLASS_COLORS[entry.stability_class]) || '#64748B';
                          let radius = 3.5;
                          let fillOpacity = 0.25;
                          let stroke = 'transparent';
                          let strokeWidth = 0;

                          if (isRoute2) {
                            fill = '#2563EB'; // Bright blue for Route 2
                            radius = 8;
                            fillOpacity = 1.0;
                            stroke = '#1D4ED8';
                            strokeWidth = 2;
                          } else if (isRoute3) {
                            fill = '#EA580C'; // Bright orange for Route 3
                            radius = 8;
                            fillOpacity = 1.0;
                            stroke = '#C2410C';
                            strokeWidth = 2;
                          }

                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={fill}
                              fillOpacity={fillOpacity}
                              stroke={stroke}
                              strokeWidth={strokeWidth}
                              r={radius}
                            />
                          );
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>

                  {/* Manual Overlay Labels for Route 002 and Route 003 */}
                  <div className="absolute top-2 left-6 bg-slate-50/90 backdrop-blur-sm border border-slate-200 rounded px-2 py-1 text-[9px] font-bold text-blue-650 shadow-sm pointer-events-none">
                    🔵 Route 002: Bedrock Essential (Low Volatility / High Score)
                  </div>
                  <div className="absolute bottom-10 left-6 bg-slate-50/90 backdrop-blur-sm border border-slate-200 rounded px-2 py-1 text-[9px] font-bold text-orange-605 shadow-sm pointer-events-none">
                    🟠 Route 003: Policy Swing Corridor (Low Volatility / Low Score)
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-mono">
                  Loading Sensitivity Scatter dataset...
                </div>
              )}
            </div>

            {/* 🎮 Premium Interactive Monte Carlo Plinko Physics Simulation Widget */}
            <div className="w-full mt-4">
              <MonteCarloPlinko />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">The Stability Focus (Predicting Policy Swings)</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                To confirm transit planning is reliable under different political administrations, the model runs a Monte Carlo simulation. This process tests thousands of weight combinations to determine how scores change as policy priorities shift.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                The model classifies routes based on their scoring stability:
              </p>
              <ul className="space-y-3 pl-2 text-slate-600 text-base">
                <li><strong className="text-blue-950 font-bold">Bedrock Essentials</strong>: These routes score highly across all weight scenarios. Route 002 is a Bedrock Essential because it consistently receives high marks, making it a permanent priority for transit funding.</li>
                <li><strong className="text-blue-950 font-bold">Policy Swing Corridors</strong>: These routes have scores that fluctuate wildly depending on weight selections. Route 003 is a Policy Swing Corridor because its score rises under an Off Peak Service focus but drops when planners prioritise Transit Monopoly or Transit Vulnerability.</li>
              </ul>
              <p className="text-slate-600 text-base leading-relaxed">
                Identifying these classes helps planners protect core services and understand how policy changes affect specific routes.
              </p>
            </div>
          </section>

          {/* ================= SECTION 9: Action ================= */}
          <section className="flex flex-col gap-6">
            {/* Visual Placeholder */}
            <div className="w-full h-72 bg-slate-100 border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 font-bold select-none shadow-sm gap-2 p-6 text-center">
              <Bus className="w-10 h-10 text-slate-350" />
              <span className="text-xs font-mono tracking-widest uppercase mt-2">Visualisation: Comparative diagnostics route matrix</span>
              <p className="text-[11px] text-slate-400 max-w-md font-medium mt-1">
                A summary grid presenting diagnostic indicators and final recommendations.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">Turning Data into Action</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                By scoring bus routes across the four pillars and testing score stability, transit planners can make objective funding decisions.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                Instead of guessing, resources can be distributed systematically:
              </p>
              <ul className="list-disc list-inside flex flex-col gap-2 text-slate-600 text-base pl-2">
                <li>Protect and fund Bedrock Essentials, such as Route 002, to maintain the foundation of the transit network.</li>
                <li>Target funding toward low-scoring routes to improve frequency, off-peak hours, or connections to jobs.</li>
              </ul>
              <p className="text-slate-600 text-base leading-relaxed">
                Transit equity is not about providing the same service to everyone. It is about allocating resources to make the greatest positive difference in the lives of residents.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                Planners and residents can use the search tool in the dashboard to find specific bus routes, view individual pillar scores, and identify stability classes.
              </p>
            </div>
          </section>

          {/* ================= BOTTOM CALL TO ACTION ================= */}
          <section className="mt-12 pt-12 border-t border-slate-200 flex flex-col items-center gap-6 text-center">
            <div className="max-w-md space-y-2">
              <h3 className="text-2xl font-black text-blue-950">Ready to explore the data?</h3>
              <p className="text-sm text-slate-500">
                You can search routes, adjust weights, and explore Dissemination Area matrices in our fully interactive map dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
              <button
                onClick={onJumpIn}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all duration-200 active:scale-95 whitespace-nowrap"
              >
                Go to Map Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onBack}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm border border-slate-300 shadow-sm transition-all duration-200 active:scale-95 whitespace-nowrap"
              >
                Back to Welcome Screen
              </button>
            </div>
          </section>

        </div>
      </main>

    </div>
  );
};
