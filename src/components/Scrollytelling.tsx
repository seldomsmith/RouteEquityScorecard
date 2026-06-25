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
import { OdtExplainerMap } from './widgets/OdtExplainerMap';

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


export const Scrollytelling: React.FC<ScrollytellingProps> = ({ onBack, onJumpIn }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [sensitivityData, setSensitivityData] = useState<any[]>([]);

  // States to hold route geometry & boundaries for the inline ExplainerMaps
  const [route2Data, setRoute2Data] = useState<any>(null);
  const [route3Data, setRoute3Data] = useState<any>(null);
  const [route727Data, setRoute727Data] = useState<any>(null);
  const [odtGeoJson, setOdtGeoJson] = useState<any>(null);
  const [daGeoJson, setDaGeoJson] = useState<any>(null);

  // Policy Sliders state for Step 7 (Policy Weights)
  const [weights, setWeights] = useState({
    vulnerability: 25,
    offPeak: 25,
    monopoly: 25,
    opportunity: 25,
  });

  // State hooks for detailed math expanders
  const [showVulnerabilityMath, setShowVulnerabilityMath] = useState(false);
  const [showOpportunityMath, setShowOpportunityMath] = useState(false);
  const [showOffPeakMath, setShowOffPeakMath] = useState(false);
  const [showMonopolyMath, setShowMonopolyMath] = useState(false);

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

    fetch('/data/odt_zones.geojson')
      .then((res) => res.json())
      .then((data) => setOdtGeoJson(data))
      .catch((err) => console.error("❌ Explainer Map failed to load ODT GeoJSON:", err));

    fetch('/data/golden_route_record.json')
      .then((res) => res.json())
      .then((data) => {
        const r2 = data.routes.find((r: any) => r.route_id === '002');
        const r3 = data.routes.find((r: any) => r.route_id === '003');
        const r727 = data.routes.find((r: any) => r.route_id === '727');
        setRoute2Data(r2);
        setRoute3Data(r3);
        setRoute727Data(r727);
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
              <h2 className="text-3xl font-black text-blue-900 leading-tight">1. The ETS Route Equity Score - Explained</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Every day, thousands of Edmontonians rely on transit to travel to work, purchase groceries, visit healthcare facilities, and see family. Because not all transit services are experienced equally, the Route Equity Scorecard measures how well each route assists transit users, particularly those in equity-seeking communities.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                We will examine two contrasting routes throughout this walkthrough:
              </p>
              
              <div className="flex flex-col md:flex-row gap-6 py-4 md:-mx-12 lg:-mx-24 justify-between items-stretch">
                <div className="flex flex-col gap-2 w-full md:w-1/2">
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
                
                <div className="flex flex-col gap-2 w-full md:w-1/2">
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
                When developing a transit network that meets the needs of Edmonton residents, we must identify which routes provide an essential service to equity-seeking communities, and this scorecard provides the data to make those decisions.
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
              <h2 className="text-3xl font-black text-blue-900 leading-tight">2. The Four Pillars of Transit Equity</h2>
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
                Each route receives a score from 0 to 100 on each pillar. Combining these four scores helps determine a route's overall transit equity score.
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
              <h2 className="text-3xl font-black text-blue-900 leading-tight">3. Transit Vulnerability</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                The Transit Vulnerability pillar measures who lives near a bus route. We look at the population of low-income households, seniors, youth, lone parents, and visible minorities in the neighbourhoods served by each line.
              </p>
              
              <div className="flex flex-col md:flex-row gap-6 py-2 md:-mx-12 lg:-mx-24 justify-between items-stretch">
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: High Vulnerability (Score: 80.8)" 
                    description="Route 002 serves a large population of 49,902 people across 81 neighbourhoods. Many of these areas contain high concentrations of low-income residents and recent immigrants."
                  />
                </div>
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="003" 
                    theme="orange" 
                    title="Route 003: Low Vulnerability (Score: 17.5)" 
                    description="Route 003 serves 13,664 people across 25 neighbourhoods. Because these areas generally have higher average household incomes, they present lower vulnerability index rankings."
                  />
                </div>
              </div>

              {/* Tell me more about the math */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setShowVulnerabilityMath(!showVulnerabilityMath)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs md:text-sm shadow-sm transition-all duration-200 flex items-center gap-2 hover:border-slate-300"
                >
                  <span>{showVulnerabilityMath ? "Hide Detailed Math" : "Tell me more about the math"}</span>
                </button>
              </div>

              {showVulnerabilityMath && (
                <div className="mt-4 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm transition-all duration-300 animate-fadeIn space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-extrabold text-slate-900">Vulnerability Methodology: Additive Scoring</h3>
                    <p className="text-xs text-slate-500 mt-0.5">How demographic profiles along a route generate the final score.</p>
                  </div>
                  
                  <div className="text-sm text-slate-600 space-y-3">
                    <p>
                      The Transit Vulnerability index is calculated at the Dissemination Area (DA) level. Each DA starts with a base score of 0. For each of the five core socio-demographic risk groups, we check if the DA falls within the top 20% (quintile 5) network-wide:
                    </p>
                    
                    {/* Visual Grid representing demographic categories */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-2">
                      {[
                        { label: 'Low Income', desc: 'Worst 20%', val: '+1.0' },
                        { label: 'Seniors (65+)', desc: 'Worst 20%', val: '+1.0' },
                        { label: 'Youth (<18)', desc: 'Worst 20%', val: '+1.0' },
                        { label: 'Lone Parents', desc: 'Worst 20%', val: '+1.0' },
                        { label: 'Visible Minorities', desc: 'Worst 20%', val: '+1.0' }
                      ].map((item, index) => (
                        <div key={index} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                          <span className="text-xs font-bold text-slate-800 leading-tight">{item.label}</span>
                          <span className="text-[10px] text-slate-400 font-medium mt-1">{item.desc}</span>
                          <span className="text-xs font-black text-teal-600 mt-2 bg-teal-50 px-2.5 py-0.5 rounded-full">{item.val}</span>
                        </div>
                      ))}
                    </div>

                    <p>
                      A DA's vulnerability score ranges from <strong>0.0 to 5.0</strong>. The route's overall raw score is the population-weighted average of all DAs it intersects:
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 font-mono text-xs text-slate-700 flex flex-col gap-2">
                      <div className="font-bold text-center text-teal-700">
                        {"\\[ V_{\\text{route}} = \\frac{\\sum (V_{\\text{DA}} \\times \\text{Population}_{\\text{DA}})}{\\sum \\text{Population}_{\\text{DA}}} \\]"}
                      </div>
                      <div className="text-[10px] text-slate-400 text-center border-t border-slate-200/60 pt-2 mt-1">
                        We then normalize this weighted score to a scale of 0 to 100 relative to all other routes in Edmonton.
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
              <h2 className="text-3xl font-black text-blue-900 leading-tight">4. Destination Opportunity</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                The Destination Opportunity pillar evaluates how well a bus route connects riders to critical locations. These locations include major employment centres, medical facilities, post-secondary schools, and grocery stores.
              </p>
              
              <div className="flex flex-col md:flex-row gap-6 py-2 md:-mx-12 lg:-mx-24 justify-between items-stretch">
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: Diverse Access Link (Score: 92.7)" 
                    description="Route 002 connects many residential areas directly to major shopping centres, employment zones, and transit terminals."
                  />
                </div>
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="003" 
                    theme="orange" 
                    title="Route 003: Local Hub Connection (Score: 18.9)" 
                    description="Route 003 covers a shorter distance and connects fewer major hubs, indicating that riders on Route 003 must transfer more frequently to reach key destinations across Edmonton."
                  />
                </div>
              </div>

              {/* Tell me more about the math */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setShowOpportunityMath(!showOpportunityMath)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs md:text-sm shadow-sm transition-all duration-200 flex items-center gap-2 hover:border-slate-300"
                >
                  <span>{showOpportunityMath ? "Hide Detailed Math" : "Tell me more about the math"}</span>
                </button>
              </div>

              {showOpportunityMath && (
                <div className="mt-4 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm transition-all duration-300 animate-fadeIn space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-extrabold text-slate-900">Opportunity Methodology: Point of Interest Weights</h3>
                    <p className="text-xs text-slate-500 mt-0.5">How destination accessibility weights influence the overall score.</p>
                  </div>
                  
                  <div className="text-sm text-slate-600 space-y-3">
                    <p>
                      The Destination Opportunity index evaluates points of interest (POIs) located within the route's walking buffer catchment (typically 400m from all stops). Rather than summing all destinations equally, the model weighs them by societal utility categories:
                    </p>
                    
                    {/* Visual Category Progress/Contribution Bars */}
                    <div className="space-y-2 py-2">
                      {[
                        { label: 'Hospitals & Medical Facilities', weight: '5.0 multiplier', percent: 100, color: 'bg-emerald-600' },
                        { label: 'Employment Centres (Jobs)', weight: '3.0 multiplier', percent: 60, color: 'bg-indigo-650' },
                        { label: 'Post-Secondary Campuses', weight: '3.0 multiplier', percent: 60, color: 'bg-teal-500' },
                        { label: 'Supermarkets & Food Markets', weight: '2.0 multiplier', percent: 40, color: 'bg-amber-500' },
                        { label: 'Primary & Secondary Schools', weight: '1.0 multiplier', percent: 20, color: 'bg-slate-400' }
                      ].map((item, index) => (
                        <div key={index} className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>{item.label}</span>
                            <span>{item.weight}</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <p>
                      The weighted raw counts are combined and normalized relative to the minimum and maximum raw opportunity counts recorded across Edmonton's entire transit network:
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 font-mono text-xs text-slate-700 flex flex-col gap-2">
                      <div className="font-bold text-center text-teal-700">
                        {"\\[ O_{\\text{route}} = \\frac{O_{\\text{raw}} - O_{\\text{min}}}{O_{\\text{max}} - O_{\\text{min}}} \\times 100 \\]"}
                      </div>
                      <div className="text-[10px] text-slate-400 text-center border-t border-slate-200/60 pt-2 mt-1">
                        This guarantees that routes serving a high variety of vital destinations score close to 100, while hyper-local feeder routes score lower.
                      </div>
                    </div>

                    <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
                      <strong>Policy Sensitivity:</strong> In our Monte Carlo weight sensitivity meta-analysis, the Destination Opportunity weight (default 35%) emerged as a primary driver of score elasticity. Shifting weight towards Opportunity favors high-frequency, radial commuter routes connecting to major job hubs (like Route 002) at the expense of localized transit monopolies, representing a core strategic trade-off for transit planners.
                    </p>
                  </div>
                </div>
              )}
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
              <h2 className="text-3xl font-black text-blue-900 leading-tight">5. Off Peak Service</h2>
              <p className="text-slate-655 text-base leading-relaxed">
                The Off Peak Service pillar measures the frequency and reliability of a bus route outside standard working hours. This includes service during evenings, late nights, Saturdays, and Sundays.
              </p>
              
              <div className="flex flex-col md:flex-row gap-6 py-2 md:-mx-12 lg:-mx-24 justify-between items-stretch">
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="003" 
                    theme="orange" 
                    title="Route 003: Consistent Off Peak (Score: 38.0)" 
                    description="Route 003 maintains regular frequency during late-night hours and weekends, providing dependable service throughout the entire week."
                  />
                </div>
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: Reduced Night Hours (Score: 31.3)" 
                    description="Although Route 002 has high frequency during weekdays, its frequency drops significantly during off-peak times, making travel more difficult for late-night shift workers."
                  />
                </div>
              </div>

              {/* Tell me more about the math */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setShowOffPeakMath(!showOffPeakMath)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs md:text-sm shadow-sm transition-all duration-200 flex items-center gap-2 hover:border-slate-300"
                >
                  <span>{showOffPeakMath ? "Hide Detailed Math" : "Tell me more about the math"}</span>
                </button>
              </div>

              {showOffPeakMath && (
                <div className="mt-4 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm transition-all duration-300 animate-fadeIn space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-extrabold text-slate-900">Off-Peak Methodology: Headway-Based Scores</h3>
                    <p className="text-xs text-slate-500 mt-0.5">How transit frequency during off-peak windows converts into scores.</p>
                  </div>
                  
                  <div className="text-sm text-slate-600 space-y-3">
                    <p>
                      Service quality is evaluated across four distinct off-peak time bands: <strong>Evenings</strong> (18:00 - 22:00 weekdays), <strong>Nights</strong> (22:00 - 05:00 weekdays), <strong>Saturdays</strong> (All day), and <strong>Sundays</strong> (All day).
                    </p>
                    
                    <p className="text-xs text-slate-500 font-bold">Headway-to-Points Conversion Scale:</p>
                    
                    {/* Visual Headway Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
                      {[
                        { range: '< 15 mins', points: '100 pts', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                        { range: '15 – 30 mins', points: '70 pts', color: 'bg-blue-50 text-blue-750 border-blue-100' },
                        { range: '30 – 60 mins', points: '40 pts', color: 'bg-amber-50 text-amber-750 border-amber-100' },
                        { range: '> 60 mins / None', points: '10 pts', color: 'bg-rose-50 text-rose-700 border-rose-105' }
                      ].map((item, index) => (
                        <div key={index} className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${item.color} text-center`}>
                          <span className="text-xs font-bold leading-tight">{item.range}</span>
                          <span className="text-xs font-black mt-2 bg-white px-2.5 py-0.5 rounded-full border border-black/5">{item.points}</span>
                        </div>
                      ))}
                    </div>

                    <p>
                      The overall Off-Peak Score is the arithmetic mean of the points awarded in each of the four categories:
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 font-mono text-xs text-slate-700 flex flex-col gap-2">
                      <div className="font-bold text-center text-teal-700">
                        {"\\[ OP_{\\text{route}} = \\frac{P_{\\text{Evening}} + P_{\\text{Night}} + P_{\\text{Saturday}} + P_{\\text{Sunday}}}{4} \\]"}
                      </div>
                      <div className="text-[10px] text-slate-400 text-center border-t border-slate-200/60 pt-2 mt-1">
                        For example, a route with 15-minute headway on Saturday (70 pts) but no service at Night (10 pts) will see its overall score reflect that gap.
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
              <h2 className="text-3xl font-black text-blue-900 leading-tight">6. Transit Monopoly</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                The Transit Monopoly pillar measures how dependent a neighbourhood is on a single bus route. If a neighbourhood lacks other bus routes or LRT stations within walking distance, the active route operates as a transit monopoly. Although some monopolies are planned to prevent overlapping services, planners must carefully consider this reliance when making service decisions.
              </p>
              
              <div className="flex flex-col md:flex-row gap-6 py-2 md:-mx-12 lg:-mx-24 justify-between items-stretch">
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: Sole Connection (Score: 67.6)" 
                    description="Route 002 serves outer neighbourhoods where no other transit options exist. If the city reduces this service, residents will have no alternative public transportation."
                  />
                </div>
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="003" 
                    theme="orange" 
                    title="Route 003: Multiple Transit Alternatives (Score: 0.0)" 
                    description="Route 003 runs through central areas with overlapping transit options, including several bus routes, local connections, and nearby LRT stations. Because residents can easily access alternative transit lines, the route scores zero on this pillar."
                  />
                </div>
              </div>

              {/* Tell me more about the math */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setShowMonopolyMath(!showMonopolyMath)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs md:text-sm shadow-sm transition-all duration-200 flex items-center gap-2 hover:border-slate-300"
                >
                  <span>{showMonopolyMath ? "Hide Detailed Math" : "Tell me more about the math"}</span>
                </button>
              </div>

              {showMonopolyMath && (
                <div className="mt-4 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm transition-all duration-300 animate-fadeIn space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-extrabold text-slate-900">Monopoly Methodology: Functional Redundancy</h3>
                    <p className="text-xs text-slate-500 mt-0.5">How alternative transit service capacity reduces dependency and scores.</p>
                  </div>
                  
                  <div className="text-sm text-slate-600 space-y-3">
                    <p>
                      The model calculates a <strong>Functional Monopoly Index (FMI)</strong> for each Dissemination Area. If a DA has alternative transit services within a 400m walk, the monopoly score is discounted.
                    </p>
                    
                    {/* Visual flow of discounts */}
                    <div className="flex flex-col gap-2.5 py-2">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-150">
                        <span className="font-bold text-slate-800">1. Base Monopoly Value</span>
                        <span className="text-xs font-black text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-full">1.0 (Sole Route)</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-150">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">2. Alternative Service Discount</span>
                          <span className="text-[10px] text-slate-400">Based on capacity/frequency of other stops</span>
                        </div>
                        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">Up to -0.8</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-150">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">3. On-Demand Transit (ODT) Discount</span>
                          <span className="text-[10px] text-slate-400">Mitigation applied if served by dynamic shuttles</span>
                        </div>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">-50% (FMI × 0.5)</span>
                      </div>
                    </div>

                    <p>
                      The final route score is the population-weighted average of these discounts, scaled from 0 to 100:
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 font-mono text-xs text-slate-700 flex flex-col gap-2">
                      <div className="font-bold text-center text-teal-700">
                        {"\\[ M_{\\text{route}} = \\text{Normalize}\\left(\\frac{\\sum (FMI_{i,r} \\times \\text{Pop}_i)}{\\sum \\text{Pop}_i}\\right) \\times 100 \\]"}
                      </div>
                      <div className="text-[10px] text-slate-400 text-center border-t border-slate-200/60 pt-2 mt-1">
                        A route that serves areas with multiple high-frequency lines gets a score close to 0, indicating that riders have plenty of choices.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ================= SECTION 6.5: On Demand Transit (ODT) ================= */}
          <section className="flex flex-col gap-6">
            {/* Dynamic Map Visualization */}
            {odtGeoJson && (
              <OdtExplainerMap odtGeoJson={odtGeoJson} routeData={route727Data} />
            )}

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">On Demand Transit (ODT)</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Edmonton Transit Service integrates On Demand Transit (ODT) zones to serve areas that lack regular, fixed-route bus lines. These zones use flexible, bookable buses that transport riders from an established bus stop to a designated transit centre or LRT station.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                By providing dynamic feeder service, ODT fundamentally changes how transit equity is calculated for Dissemination Areas (DAs), which are the small, local geographic units used to measure neighbourhood census data. To see this in practice, consider Route 002, which terminates at the Capilano Transit Centre – a primary hub for local ODT feeder shuttles. Since Route 002 serves several outer neighbourhoods, the model applies two mathematical discounts to those specific areas to account for these dynamic transit alternatives:
              </p>
              <ul className="space-y-3 pl-2 text-slate-600 text-base">
                <li>
                  <strong className="text-blue-950 font-bold">Vulnerability Score Reduction (-10%)</strong>: 
                  DAs served by the Capilano ODT receive a 10% reduction on their vulnerability index ({"$V_i \\times 0.90$"}) because local feeder shuttles help ease geographic isolation.
                </li>
                <li>
                  <strong className="text-blue-950 font-bold">Transit Monopoly Reduction (-50%)</strong>: 
                  DAs within the Capilano ODT zone are no longer considered entirely dependent on a single, fixed bus route. The model applies a 50% discount to their Functional Monopoly Index ({"$FMI_{i,r} \\times 0.50$"}) to reflect that residents have a flexible, bookable connection to the wider transit network.
                </li>
              </ul>
              <p className="text-slate-600 text-base leading-relaxed">
                These adjustments ensure that route equity scores are not artificially inflated in areas where ODT is already successfully bridging the service gap.
              </p>
            </div>
          </section>

          {/* ================= SECTION 7: Policy Weights Simulator ================= */}
          <section className="flex flex-col gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">7. Balancing the Different Policy Weights</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                After evaluating the four individual pillars, transit planners must combine them to generate a total equity score for each route. Determining the exact weight or priority given to each pillar represents a fundamental policy choice.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                Under a balanced policy with equal 25% weights across all four pillars, the model translates scores into academic-style letter grades from A (representing the highest equity priority) to F (representing the lowest equity priority). With equal weighting, Route 002 receives a B grade with a score of 68.1, showing that its strong performance in vulnerability, monopoly, and destination opportunity makes it a high priority for service protection. In contrast, Route 003 receives an E grade with a score of 18.6, representing a low equity priority because it serves higher-income neighbourhoods and features multiple alternative transit options.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                When policy priorities shift, these scores adjust accordingly. For example, if a policy prioritizes scheduling by allocating 40% of the weight to Off-Peak Service, 35% to Destination Opportunity, 15% to Transit Vulnerability, and 10% to Transit Monopoly, the final scores change:
              </p>
              <ul className="list-disc list-inside flex flex-col gap-2 text-slate-600 text-base pl-2">
                <li><strong className="text-blue-950 font-bold">Route 002 decreases from 68.1 to 63.8</strong>: Although its demographic vulnerability weight is nearly halved, the route maintains a strong B grade because it connects a high volume of riders to essential jobs and services, keeping its Destination Opportunity score at 92.7.</li>
                <li><strong className="text-blue-950 font-bold">Route 003 increases from 18.6 to 24.4</strong>: Because the Off-Peak Service weight increases to 40%, Route 003 benefits from its reliable evening and weekend schedule, which scores 38.0. This scheduling strength helps offset its low scores in transit monopoly and demographic vulnerability.</li>
              </ul>
            </div>

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
              <h2 className="text-3xl font-black text-blue-900 leading-tight">8. How can we move past trying to perfect the balance?</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                To identify how different policy weights impact route equity scores across the entire city, we expanded our analysis beyond our two main examples. We ran a Monte Carlo simulation to test all possible weight combinations against all 170 routes in the Edmonton network (1,771 weight combinations × 170 routes = 301,070 simulations). This analysis reveals that every route in the city falls into one of four distinct stability classifications, helping us understand which services require the most protection during policy shifts:
              </p>
              <ul className="space-y-3 pl-2 text-slate-600 text-base">
                <li>
                  <strong className="text-blue-950 font-bold">Bedrock Essentials (Always High Equity)</strong>: 
                  These routes score highly across all weight scenarios. Route 002 is a Bedrock Essential because it consistently receives a high route equity score regardless of how we weight the model. This classification is due to Route 002 scoring exceptionally high on three of the four pillars: Vulnerability (80.8), Monopoly (67.6), and Opportunity (92.7). It serves a large population with high concentrations of low-income and immigrant households who may not have other travel options, while simultaneously connecting them to key employment hubs. Even if we minimize the demographic weights and heavily favor Off-Peak Service (its lowest scoring policy weight at 31.3), Route 002's scores on the other three policy weights ensure it remains a high scoring route for equity.
                </li>
                <li>
                  <strong className="text-blue-950 font-bold">Policy Swing Route</strong>: 
                  Routes in this category have scores that fluctuate wildly depending on weight selections. Route 003 is a Policy Swing Corridor because its score rises under an Off-Peak Service focus but drops when we prioritize Transit Monopoly or Transit Vulnerability. Specifically, Route 003 maintains a decent evening and weekend schedule (scoring 38.0 in Off-Peak), which pulls its grade up when temporal service is prioritized. However, because it runs through central neighborhoods with abundant overlapping transit routes and higher average incomes, its Monopoly score is an absolute 0.0 and its Vulnerability score is a low 17.5. When policy shifts to favor demographic need or route dependency, Route 003's score collapses, making its funding priority highly dependent on the active political administration.
                </li>
                <li>
                  <strong className="text-blue-950 font-bold">Moderate Stability (Consistent Mid-Range Scores)</strong>: 
                  These routes maintain steady, mid-range scores across all scenarios and are not highly sensitive to policy changes, representing stable baseline operations. For example, Route 913 (West Edmonton Mall – Jamieson Place) does not feature extreme highs or absolute zeros in any single category. Under the simulation, its scores remain remarkably stable, maintaining an average score of 50.03 with a very low standard deviation of just 4.88.
                </li>
                <li>
                  <strong className="text-blue-950 font-bold">Bedrock Resilient (Always Low Equity)</strong>: 
                  These routes consistently receive lower equity scores across all possible policy weight combinations. They tend to serve higher-income areas with low demographic risk, feature abundant overlapping transit choices, or bypass major employment and service hubs. Route 524 (Bonnie Doon – Holyrood) falls into this category, averaging a score of just 8.9 out of 100 across all configurations.
                </li>
              </ul>
              <p className="text-slate-600 text-base leading-relaxed">
                Identifying these classifications for each route helps us identify which routes should be protected and how different service changes may impact specific routes.
              </p>
            </div>
          </section>

          {/* ================= SECTION 9: Limitations of the Scorecard Model ================= */}
          <section className="flex flex-col gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">9. Limitations of the Scorecard Model</h2>
              <p className="text-slate-605 text-base leading-relaxed">
                While the Route Equity Scorecard provides an equity framework and analytical tool, we must keep several methodological limitations in mind:
              </p>
              
              <div className="flex flex-col gap-8 mt-6">
                {/* Limitation 1 */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">1. The Ecological Fallacy</h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      Evaluating demographic data aggregated at the Dissemination Area (DA) level, which is the smallest geographic unit used by Statistics Canada, assumes that individual residents match their neighbourhood average. In reality, affluent residents live in vulnerable DAs, and transit-dependent families live in wealthy areas. Because the model scores geography rather than individuals, isolated pockets of need can be obscured by broader neighbourhood averages.
                    </p>
                  </div>
                  
                  {/* Visual: Macro vs. Micro Split-View */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row gap-6 justify-center items-stretch mt-2">
                    <div className="w-full sm:w-1/2 flex flex-col justify-center items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Macro View (DA Average)</span>
                      <div className="w-24 h-24 rounded-2xl bg-rose-500/20 border-2 border-rose-500 mt-4 flex items-center justify-center text-rose-700 font-extrabold text-sm">
                        Score: 80.0
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3 font-semibold uppercase">High Vulnerability DA</p>
                    </div>
                    <div className="w-full sm:w-1/2 flex flex-col justify-center items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Micro View (Individual Reality)</span>
                      <div className="grid grid-cols-5 gap-2 mt-4">
                        {Array.from({ length: 15 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-3.5 h-3.5 rounded-full ${i < 10 ? 'bg-rose-500' : 'bg-blue-500'}`} 
                            title={i < 10 ? 'High-need Household' : 'Low-need Household'}
                          />
                        ))}
                      </div>
                      <div className="flex gap-4 mt-4 text-[10px] font-bold">
                        <span className="text-rose-600">🔴 70% High-need</span>
                        <span className="text-blue-600">🔵 30% Low-need</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Limitation 2 */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">2. Static Schedules vs. Real-World Reliability</h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      Off-peak scores are calculated using static General Transit Feed Specification (GTFS) schedules, which are the digital timetables published by the city. This approach assumes buses run on time. The model ignores real-world detours, weather delays, and cancellations, which influence whether a resident chooses to use transit. A scheduled 15-minute route that experiences regular delays is often less useful to riders than a highly reliable, uninterrupted 30-minute route.
                    </p>
                  </div>
                  
                  {/* Visual: Timeline Drift Comparison */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4 mt-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Timeline (Scheduled GTFS)</span>
                      <div className="relative w-full h-8 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between px-6 font-mono text-xs text-emerald-700">
                        <span>0:00 (On Time)</span>
                        <span>0:15 (On Time)</span>
                        <span>0:30 (On Time)</span>
                        <span>0:45 (On Time)</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bottom Timeline (Real-World Tracking)</span>
                      <div className="relative w-full h-8 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between px-6 font-mono text-xs">
                        <span className="text-amber-600">0:08 (Late)</span>
                        <span className="text-rose-600">0:30 (Cancelled)</span>
                        <span className="text-emerald-700">0:45 (Bunched)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Limitation 3 */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">3. Catchment Buffers vs. Physical Barriers</h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      Walking catchments assume ideal pedestrian access and uniform walking speeds. The model cannot detect micro-level barriers, such as broken sidewalks, snow-blocked paths, missing crosswalks, or major highway crossings, that make walking unsafe or impossible for seniors and residents with mobility aids.
                    </p>
                  </div>
                  
                  {/* Visual: Theoretical vs. Actual Walkway */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row gap-6 justify-center items-stretch mt-2">
                    <div className="w-full sm:w-1/2 flex flex-col justify-center items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Layer A (Theoretical Access)</span>
                      <div className="relative w-24 h-24 rounded-full border-4 border-dashed border-teal-500/60 bg-teal-500/10 mt-4 flex items-center justify-center">
                        <span className="text-[10px] text-teal-800 font-bold uppercase tracking-wider">400m Buffer</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3 font-semibold uppercase">Ideal 5-Minute Walk</p>
                    </div>
                    <div className="w-full sm:w-1/2 flex flex-col justify-center items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Layer B (Actual Accessibility)</span>
                      <div className="relative w-24 h-24 border border-rose-500 bg-rose-50/20 mt-4 rounded-xl flex items-center justify-center">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-red-600 -rotate-12" title="Ravine / Highway Barrier" />
                        <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider relative z-10">Detour Required</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3 font-semibold uppercase text-rose-600">1.2km Actual Walk</p>
                    </div>
                  </div>
                </div>

                {/* Limitation 4 */}
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">4. Destination Quantity vs. Quality</h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      The Destination Opportunity pillar counts the presence of services but ignores their affordability or capacity. It treats a luxury organic market and a discount grocery store as identical food destinations, despite their vastly different utility to low-income riders.
                    </p>
                  </div>
                  
                  {/* Visual: Utility Discount Split Card */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row gap-6 justify-center items-stretch mt-2">
                    <div className="w-full sm:w-1/2 flex flex-col justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Raw View</span>
                      <div className="mt-4 flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-slate-200/60 shadow-inner">
                        <span className="text-xs font-bold text-slate-800">2 Grocery Stores</span>
                        <span className="text-[10px] text-slate-400 mt-1">Equal 100% Spatial Access</span>
                      </div>
                    </div>
                    <div className="w-full sm:w-1/2 flex flex-col justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Equity-Adjusted View</span>
                      <div className="mt-4 space-y-2 text-left bg-white p-3 rounded-xl border border-slate-200/60 shadow-inner">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">Discount Grocery</span>
                          <span className="text-teal-600 font-extrabold">100% Utility</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
                          <span className="font-bold text-slate-500">Luxury specialty grocer</span>
                          <span className="text-rose-600 font-extrabold">-80% Utility</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ================= SECTION 10: Applying the Scorecard to Planning Decisions ================= */}
          <section className="flex flex-col gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">10. Applying the Scorecard to Planning Decisions</h2>
              <p className="text-slate-605 text-base leading-relaxed">
                Scoring transit routes across the four pillars and simulating their stability provides analytical data to help planners design and schedule routes. The scorecard helps the city understand how different transit lines serve the diverse needs of the population, allowing planners to predict how service adjustments might impact neighbourhoods – for better or for worse.
              </p>
              <p className="text-slate-605 text-base leading-relaxed">
                Transit equity recognizes that equal service is not always equitable service. True equity requires directing resources where they will do the most to reduce mobility barriers for residents who rely on transit the most. While policy decisions will always involve subjective value judgements, this framework makes those trade-offs transparent, allowing planners to build equity directly into daily transit operations.
              </p>
            </div>
          </section>

          {/* ================= BOTTOM CALL TO ACTION (Section 11) ================= */}
          <section className="mt-12 pt-12 border-t border-slate-200 flex flex-col items-center gap-6 text-center">
            <div className="max-w-md space-y-2">
              <h3 className="text-2xl font-black text-blue-950">11. Explore the Route Equity Scorecard Tool</h3>
              <p className="text-sm text-slate-500">
                You can use the spotlight search to find specific routes, adjust weights with zero-sum policy sliders, filter the map by grade badges or stability classifications, and analyse diagnostics using waterfall charts, pedestrian walk isochrones, and the interactive Dissemination Area vulnerability matrix.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
              <button
                onClick={onJumpIn}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all duration-200 active:scale-95 whitespace-nowrap"
              >
                Let's jump in!
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
