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
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { RouteTicket } from './ui/RouteTicket';
import { ExplainerMap } from './widgets/ExplainerMap';
import { MonteCarloPlinko } from './widgets/MonteCarloPlinko';
import { OdtExplainerMap } from './widgets/OdtExplainerMap';
import { FourPillars } from './widgets/FourPillars';
import { InteractiveToggleMap } from './widgets/InteractiveToggleMap';
import { OffPeakFrequencyChart } from './widgets/OffPeakFrequencyChart';
import { CatchmentBarrierMap } from './widgets/CatchmentBarrierMap';
import { StaggeredMenu } from './widgets/StaggeredMenu';
import { ShapWaterfall } from './charts/ShapWaterfall';
import { GroceryFlowViz } from './widgets/GroceryFlowViz';
import { Maximize2, X } from 'lucide-react';

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

// Helper to generate a normal distribution curve
function generateNormalDistribution(mean: number, std: number) {
  // If std is extremely small or missing, add a tiny bit of width for rendering
  const validStd = (std && std > 0) ? std : 0.5;
  const points = [];
  
  // Create 50 points from 0 to 100 for an absolute scale
  for (let x = 0; x <= 100; x += 2) {
    const exponent = Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(validStd, 2)));
    const y = (1 / (validStd * Math.sqrt(2 * Math.PI))) * exponent;
    points.push({ x, y });
  }
  return points;
}

// Safe Highlight Tooltip for the Scatter Chart with Hover-State Sparkline
const CustomChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;

  const mean = typeof d?.score_mean === 'number' ? d.score_mean : 0;
  const std = typeof d?.score_std === 'number' ? d.score_std : 1;
  const sparklineData = generateNormalDistribution(mean, std);
  const color = CLASS_COLORS[d.stability_class] || '#94a3b8'; // default slate-400

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl p-4 text-xs w-64 text-slate-900 overflow-hidden relative">
      {/* Background glow matching the class color */}
      <div 
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      
      <div className="relative z-10">
        <p className="font-black text-slate-900 text-sm truncate">{d?.name || 'Unknown Route'}</p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
          {(d?.stability_class ? (CLASS_LABELS[d.stability_class] || d.stability_class) : 'Unknown Stability')} (Route {d?.short_name || '?'})
        </p>
        
        <div className="mt-4 mb-2 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Mean</span>
            <span className="font-bold text-lg leading-none" style={{ color }}>{mean.toFixed(1)}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Volatility (Std)</span>
            <span className="font-bold text-lg leading-none text-slate-900">{std.toFixed(2)}</span>
          </div>
        </div>

        {/* Sparkline Micro-chart */}
        <div className="h-16 w-full -mx-2 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`colorGradient-${d.route_id || 'tooltip'}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="y" 
                stroke={color} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#colorGradient-${d.route_id || 'tooltip'})`} 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between w-full text-[8px] text-slate-500 font-bold mt-1 px-2">
          <span>0 (Low Equity)</span>
          <span>100 (High Equity)</span>
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
  const [allRoutesData, setAllRoutesData] = useState<any[]>([]);
  const [odtGeoJson, setOdtGeoJson] = useState<any>(null);
  const [daGeoJson, setDaGeoJson] = useState<any>(null);

  // Policy Sliders state for Step 7 (Policy Weights)
  const [weights, setWeights] = useState({
    vulnerability: 25,
    offPeak: 25,
    monopoly: 25,
    opportunity: 25,
  });
  
  // State for toggling route in the simulator waterfall chart
  const [activeSimulatorRouteId, setActiveSimulatorRouteId] = useState<'002' | '003'>('002');
  
  // State for fullscreen scatterplot
  const [showFullscreenScatterplot, setShowFullscreenScatterplot] = useState(false);

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
          
          // Exclude school specials (e.g. routes starting with S, containing 'school' or 'special')
          const isSchoolOrSpecial = 
            obj.short_name?.startsWith('S') || 
            obj.short_name?.toLowerCase().includes('school') ||
            obj.short_name?.toLowerCase().includes('special') ||
            obj.name?.toLowerCase().includes('school') ||
            obj.name?.toLowerCase().includes('special');

          if (obj.route_id && !isSchoolOrSpecial) {
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
        setAllRoutesData(data.routes);
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

  const r2 = { vulnerability: 80.8, offPeak: 31.3, monopoly: 67.6, opportunity: 92.7 };
  const r3 = { vulnerability: 17.5, offPeak: 38.0, monopoly: 0.0, opportunity: 18.9 };

  const liveScores = {
    route2: (
      r2.vulnerability * (weights.vulnerability / 100) +
      r2.offPeak * (weights.offPeak / 100) +
      r2.monopoly * (weights.monopoly / 100) +
      r2.opportunity * (weights.opportunity / 100)
    ),
    route3: (
      r3.vulnerability * (weights.vulnerability / 100) +
      r3.offPeak * (weights.offPeak / 100) +
      r3.monopoly * (weights.monopoly / 100) +
      r3.opportunity * (weights.opportunity / 100)
    )
  };


  return (
    <div ref={containerRef} className="h-screen w-full flex flex-col bg-slate-50 font-sans relative overflow-y-auto scroll-smooth custom-scrollbar">
      
      {/* 🚌 Fixed Scrollytelling Header with Subway Map Scroll Progress Tracker */}
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
            <span className="text-xs font-black text-blue-900 uppercase tracking-widest leading-none">ETS Route Equity Scorecard</span>
            <span className="text-[10px] font-semibold text-teal-650 leading-none mt-1">Scroll down to read</span>
          </div>
        </div>

        {/* Subway Map Progress Bar */}
        <div className="flex-1 max-w-xl mx-8 relative hidden md:block px-4">
          {/* Base track */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
          {/* Active progress track */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 rounded-full transition-all duration-75"
            style={{ width: `${scrollProgress * 100}%` }}
          />
          {/* Subway dots representing the 11 sections (sections 1-10 + section-odt) */}
          <div className="relative flex justify-between items-center w-full">
            {[
              { id: 'section-1', label: '1. Introduction' },
              { id: 'section-2', label: '2. Four Pillars' },
              { id: 'section-3', label: '3. Vulnerability' },
              { id: 'section-4', label: '4. Opportunity' },
              { id: 'section-5', label: '5. Off Peak Service' },
              { id: 'section-6', label: '6. Transit Monopoly' },
              { id: 'section-odt', label: 'ODT: On Demand' },
              { id: 'section-7', label: '7. Policy Weights' },
              { id: 'section-8', label: '8. Stability Index' },
              { id: 'section-9', label: '9. Limitations' },
              { id: 'section-10', label: '10. Decisions' },
            ].map((section, idx, arr) => {
              const fraction = idx / (arr.length - 1);
              const isPassed = scrollProgress >= fraction - 0.02;

              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  title={section.label}
                  className="group relative flex items-center justify-center focus:outline-none"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {/* Outer glow ring on hover or active */}
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-255 border-2 ${
                    isPassed 
                      ? 'border-blue-500 bg-white hover:bg-blue-50' 
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}>
                    {/* Inner core dot */}
                    <span className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      isPassed ? 'bg-blue-500' : 'bg-slate-350'
                    }`} />
                  </span>
                  
                  {/* Tooltip */}
                  <span className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2.5 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    {section.label}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        <button
          onClick={onJumpIn}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm shadow-md transition-all duration-200 active:scale-95 whitespace-nowrap"
        >
          View Scorecard
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Main Scrollytelling Container */}
      <main className="flex-grow pt-24 pb-20 w-full flex justify-center bg-slate-50">
        <div className="w-full max-w-3xl px-6 flex flex-col gap-24">
          
          {/* ================= SECTION 1: Introduction ================= */}
          <section id="section-1" className="flex flex-col gap-6">
            
            {/* Narrative text (sitting directly on the background) */}
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">1. The ETS Route Equity Score - Explained</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Transit services are not experienced equally. The Route Equity Scorecard measures how effectively each route serves riders, specifically those in equity-seeking communities. When developing a transit network that meets the needs of Edmonton residents, policymakers must identify which routes provide essential service to equity-seeking communities. This scorecard provides the data to inform those decisions.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                For this explanation, we will use two routes to show our methodology:
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
                    theme="yellow" 
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
                When developing a transit network that meets the needs of Edmonton residents, policymakers must identify which routes provide essential service to equity-seeking communities. This scorecard provides the data to inform those decisions.
              </p>
            </div>
          </section>

          {/* ================= SECTION 2: Four Pillars ================= */}
          <section id="section-2" className="flex flex-col gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">2. The Four Pillars of Transit Equity</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                The model evaluates every route across four pillars. Click each card below to inspect its methodology definition:
              </p>
            </div>

            <FourPillars />

            <p className="text-slate-600 text-base leading-relaxed">
              Each route receives a score from 0 to 100 on each pillar. Combining these four scores helps determine a route's overall transit equity score.
            </p>
          </section>

          {/* ================= SECTION 3: Vulnerability ================= */}
          <section id="section-3" className="flex flex-col gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">3. Transit Vulnerability</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                The Transit Vulnerability pillar tracks the demographics of residents living near a route. We measure the population of low-income households, seniors, youth, lone parents, and visible minorities in the neighbourhoods served by each line.
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
                    theme="yellow" 
                    title="Route 003: Low Vulnerability (Score: 17.5)" 
                    description="Route 003 serves 13,664 people across 25 neighbourhoods. Because these areas generally have higher average household incomes, they present lower vulnerability index rankings."
                  />
                </div>
              </div>
            </div>

            {route2Data && route3Data && daGeoJson && (
              <>
                <InteractiveToggleMap 
                  route2Data={route2Data} 
                  route3Data={route3Data} 
                  daGeoJson={daGeoJson} 
                  allRoutesData={allRoutesData} 
                  mode="vulnerability" 
                />
                <p className="text-slate-500 text-xs md:text-sm italic text-center mt-1">
                  The maps illustrate Dissemination Areas (DAs) colored by vulnerability index, highlighting Route 002's traversal through several high-vulnerability pockets in East Edmonton, compared to Route 003's path through lower-priority central residential areas.
                </p>
              </>
            )}

            {/* Tell me more about the math */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setShowVulnerabilityMath(!showVulnerabilityMath)}
                className="px-5 py-2.5 rounded-xl border border-blue-900/20 text-blue-900 bg-white hover:bg-blue-50/50 font-extrabold text-xs md:text-sm transition-all duration-200 flex items-center gap-2 shadow-sm hover:border-blue-900/40 active:scale-98"
              >
                <span>{showVulnerabilityMath ? "Hide Detailed Math" : "Tell me more about the math"}</span>
              </button>
            </div>

            {showVulnerabilityMath && (
              <div 
                onClick={() => setShowVulnerabilityMath(false)}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-4xl h-[85vh] bg-slate-100 border border-slate-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden cursor-default"
                >
                  
                  {/* Header / Top Control Row */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    <button
                      onClick={() => setShowVulnerabilityMath(false)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all duration-150"
                      title="Close methodology panel"
                    >
                      <span className="font-extrabold text-sm">✕</span>
                    </button>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Methodology Details
                    </span>
                    <div className="w-8 h-8 opacity-0" aria-hidden="true" />
                  </div>

                  {/* Scrollable Modal Content */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                    <div className="border-b border-slate-200 pb-4">
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">Vulnerability Methodology: Additive Scoring</h3>
                      <p className="text-xs text-slate-500 mt-1">How demographic profiles along a route generate the final score.</p>
                    </div>
                    
                    <div className="text-sm text-slate-600 space-y-4">
                      <p className="leading-relaxed">
                        The Transit Vulnerability index is calculated at the Dissemination Area (DA) level. Each DA starts with a base score of 0. For each of the five core socio-demographic risk groups, we check if the DA falls within the top 20% (quintile 5) network-wide:
                      </p>
                      
                      {/* Visual Grid representing demographic categories */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-2">
                        {[
                          { label: 'Low Income', desc: 'Worst 20%', val: '+1.0' },
                          { label: 'Seniors (65+)', desc: 'Worst 20%', val: '+1.0' },
                          { label: 'Youth (\\x3c18)', desc: 'Worst 20%', val: '+1.0' },
                          { label: 'Lone Parents', desc: 'Worst 20%', val: '+1.0' },
                          { label: 'Visible Minorities', desc: 'Worst 20%', val: '+1.0' }
                        ].map((item, index) => (
                          <div key={index} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
                            <span className="text-xs font-bold text-slate-800 leading-tight">{item.label}</span>
                            <span className="text-[10px] text-slate-400 font-medium mt-1">{item.desc}</span>
                            <span className="text-xs font-black text-teal-600 mt-2 bg-teal-50 px-2.5 py-0.5 rounded-full">{item.val}</span>
                          </div>
                        ))}
                      </div>

                      <p className="leading-relaxed">
                        A DA's vulnerability score ranges from <strong>0.0 to 5.0</strong>. The route's overall score is calculated by taking the average of these vulnerability scores across all neighbourhoods it serves, weighted by each neighbourhood's population. This population-weighted average is then converted to a scale of 0 to 100 relative to all other bus routes in the city, ensuring that routes serving larger numbers of vulnerable residents score higher.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ================= SECTION 4: Opportunity ================= */}
          <section id="section-4" className="flex flex-col gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">4. Destination Opportunity</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                The Destination Opportunity pillar evaluates how well a route connects riders to specific locations, including employment centres, medical facilities, post-secondary schools, and grocery stores.
              </p>
              
              <div className="flex flex-col md:flex-row gap-6 py-2 md:-mx-12 lg:-mx-24 justify-between items-stretch">
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: Diverse Access Link (Score: 92.7)" 
                    description="Route 002 connects residential areas directly to shopping centres, employment zones, and transit terminals."
                  />
                </div>
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="003" 
                    theme="yellow" 
                    title="Route 003: Local Hub Connection (Score: 18.9)" 
                    description="Route 003 covers a shorter distance and connects fewer hubs, meaning riders must transfer more frequently to reach destinations."
                  />
                </div>
              </div>
            </div>

            {route2Data && route3Data && daGeoJson && (
              <>
                <InteractiveToggleMap 
                  route2Data={route2Data} 
                  route3Data={route3Data} 
                  daGeoJson={daGeoJson} 
                  allRoutesData={allRoutesData} 
                  mode="opportunity" 
                />
                <p className="text-slate-500 text-xs md:text-sm italic text-center mt-1">
                  The maps plot Points of Interest (POIs) clustered near bus stops, illustrating Route 002's connectivity to medical, commercial, and employment centres, while Route 003 serves primarily residential nodes.
                </p>
              </>
            )}

            {/* Tell me more about the math */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setShowOpportunityMath(!showOpportunityMath)}
                className="px-5 py-2.5 rounded-xl border border-blue-900/20 text-blue-900 bg-white hover:bg-blue-50/50 font-extrabold text-xs md:text-sm transition-all duration-200 flex items-center gap-2 shadow-sm hover:border-blue-900/40 active:scale-98"
              >
                <span>{showOpportunityMath ? "Hide Detailed Math" : "Tell me more about the math"}</span>
              </button>
            </div>

            {showOpportunityMath && (
              <div 
                onClick={() => setShowOpportunityMath(false)}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-4xl h-[85vh] bg-slate-100 border border-slate-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden cursor-default"
                >
                  
                  {/* Header / Top Control Row */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    <button
                      onClick={() => setShowOpportunityMath(false)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all duration-150"
                      title="Close methodology panel"
                    >
                      <span className="font-extrabold text-sm">✕</span>
                    </button>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Methodology Details
                    </span>
                    <div className="w-8 h-8 opacity-0" aria-hidden="true" />
                  </div>

                  {/* Scrollable Modal Content */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                    <div className="border-b border-slate-200 pb-4">
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">Opportunity Methodology: Point of Interest Weights</h3>
                      <p className="text-xs text-slate-500 mt-1">How destination accessibility weights influence the overall score.</p>
                    </div>
                    
                    <div className="text-sm text-slate-600 space-y-5">
                      <p className="leading-relaxed">
                        The Destination Opportunity index evaluates points of interest (POIs) located within the route's walking buffer catchment (typically 400m from all stops). Rather than summing all destinations equally, the model weighs them by societal utility categories:
                      </p>

                      {/* POI Table */}
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                              <th className="px-4 py-3">POI Category</th>
                              <th className="px-4 py-3">Registry Key</th>
                              <th className="px-4 py-3 text-right">Total Mapped POIs</th>
                              <th className="px-4 py-3 text-right font-black">Weight</th>
                              <th className="px-4 py-3 pl-6">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            <tr>
                              <td className="px-4 py-2.5 font-bold text-slate-900">Emergency and Hospital Care</td>
                              <td className="px-4 py-2.5 font-mono text-slate-500">hospital / emergency_room</td>
                              <td className="px-4 py-2.5 text-right font-mono">35 <span className="text-[10px] text-slate-400 font-semibold">(23 Hosp + 12 ER)</span></td>
                              <td className="px-4 py-2.5 text-right font-bold text-teal-650">5.0</td>
                              <td className="px-4 py-2.5 pl-6 text-slate-500">Critical trauma and emergency medical services</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2.5 font-bold text-slate-900">Employment Centres</td>
                              <td className="px-4 py-2.5 font-mono text-slate-500">employment</td>
                              <td className="px-4 py-2.5 text-right font-mono">29,894</td>
                              <td className="px-4 py-2.5 text-right font-bold text-teal-650">3.0</td>
                              <td className="px-4 py-2.5 pl-6 text-slate-500">Primary workplaces and industrial/commercial hubs</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2.5 font-bold text-slate-900">Post-Secondary Campuses</td>
                              <td className="px-4 py-2.5 font-mono text-slate-500">post_secondary</td>
                              <td className="px-4 py-2.5 text-right font-mono">5</td>
                              <td className="px-4 py-2.5 text-right font-bold text-teal-650">3.0</td>
                              <td className="px-4 py-2.5 pl-6 text-slate-500">Major universities and technical colleges</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2.5 font-bold text-slate-900">Primary Care</td>
                              <td className="px-4 py-2.5 font-mono text-slate-500">primary_care</td>
                              <td className="px-4 py-2.5 text-right font-mono">127</td>
                              <td className="px-4 py-2.5 text-right font-bold text-teal-650">3.0</td>
                              <td className="px-4 py-2.5 pl-6 text-slate-500">Family doctors and non-specialty health clinics</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2.5 font-bold text-slate-900">Grocery Stores & Supermarkets</td>
                              <td className="px-4 py-2.5 font-mono text-slate-500">grocery</td>
                              <td className="px-4 py-2.5 text-right font-mono">62</td>
                              <td className="px-4 py-2.5 text-right font-bold text-teal-600">2.0</td>
                              <td className="px-4 py-2.5 pl-6 text-slate-500">Grocery stores that have fresh produce</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2.5 font-bold text-slate-900">K-12 Schools</td>
                              <td className="px-4 py-2.5 font-mono text-slate-500">school</td>
                              <td className="px-4 py-2.5 text-right font-mono">460</td>
                              <td className="px-4 py-2.5 text-right font-bold text-slate-550">1.0</td>
                              <td className="px-4 py-2.5 pl-6 text-slate-500">Public and separate primary/secondary schools</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2.5 font-bold text-slate-900">Municipal Rec Centres</td>
                              <td className="px-4 py-2.5 font-mono text-slate-500">recreation</td>
                              <td className="px-4 py-2.5 text-right font-mono">47</td>
                              <td className="px-4 py-2.5 text-right font-bold text-slate-550">1.0</td>
                              <td className="px-4 py-2.5 pl-6 text-slate-500">Public pools, arenas, and community spaces</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2.5 font-bold text-slate-900">Edmonton Public Libraries</td>
                              <td className="px-4 py-2.5 font-mono text-slate-500">library</td>
                              <td className="px-4 py-2.5 text-right font-mono">31</td>
                              <td className="px-4 py-2.5 text-right font-bold text-slate-550">1.0</td>
                              <td className="px-4 py-2.5 pl-6 text-slate-500">Public study rooms and community internet nodes</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <p className="leading-relaxed">
                        These weighted counts sum to create a raw opportunity score. This raw score is scaled from 0 to 100 relative to all other routes in Edmonton. Routes connecting to a wide variety of destinations score close to 100, while local feeder routes score lower.
                      </p>

                      {/* Data Pipeline Section */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                          Data Pipeline and Methodology: Score Computation
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          To calculate these scores, the data pipeline combines three primary sources:
                        </p>
                        <ul className="flex flex-col gap-2.5 text-xs text-slate-650">
                          <li className="flex items-start gap-2">
                            <span className="text-teal-600 mt-1 flex-shrink-0">•</span>
                            <span className="flex-1">
                              <strong className="text-slate-900">OpenStreetMap (OSM) via Overpass API:</strong> This source provides geographic coordinates for schools, universities, community centres, grocery stores, and medical facilities.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-teal-600 mt-1 flex-shrink-0">•</span>
                            <span className="flex-1">
                              <strong className="text-slate-900">Edmonton Business Census (2025/2026):</strong> This dataset provides granular business registration data, which allows the model to count commercial and industrial employment density along transit corridors instead of relying on general zoning maps.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-teal-600 mt-1 flex-shrink-0">•</span>
                            <span className="flex-1">
                              <strong className="text-slate-900">GTFS Stop Coordinates:</strong> These files establish the precise locations of transit stops to construct the 400-metre walking catchments.
                            </span>
                          </li>
                        </ul>
                      </div>

                      <p className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
                        <strong>Policy Sensitivity:</strong> In our Monte Carlo weight sensitivity meta-analysis, the Destination Opportunity weight emerged as a primary driver of score elasticity. Shifting weight towards Opportunity favors high-frequency, radial commuter routes connecting to major job hubs (like Route 002) at the expense of localized transit monopolies, representing a core strategic trade-off for decision making.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ================= SECTION 5: Off Peak Service ================= */}
          <section id="section-5" className="flex flex-col gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">5. Off Peak Service</h2>
              <p className="text-slate-655 text-base leading-relaxed">
                The Off Peak Service pillar tracks route frequency outside standard working hours. This includes service during evenings, late nights, Saturdays, and Sundays.
              </p>
              <p className="text-slate-655 text-sm leading-relaxed p-4 bg-slate-100 rounded-xl border border-slate-200 shadow-sm mt-2">
                <strong>Note:</strong> The scorecard measures the equity value of the <em>existing</em> route, rather than the unmet deficit of a neighbourhood. If a route does not operate at night, it is not currently functioning as an off-peak equity lifeline and receives a lower priority score.
              </p>
              
              <div className="flex flex-col md:flex-row gap-6 py-2 md:-mx-12 lg:-mx-24 justify-between items-stretch">
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: Reduced Night Hours (Score: 31.3)" 
                    description="Route 002 operates frequently during weekdays, but service drops during off-peak times, reducing options for late-night shift workers."
                  />
                </div>
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="003" 
                    theme="yellow" 
                    title="Route 003: Consistent Off Peak (Score: 38.0)" 
                    description="Route 003 maintains consistent frequency during late-night hours and weekends."
                  />
                </div>
              </div>
            </div>

            <OffPeakFrequencyChart />
            <p className="text-slate-500 text-xs md:text-sm italic text-center mt-1">
              The line chart plots service headways throughout the day, illustrating that Route 003 maintains consistent headways during evening and weekend hours compared to Route 002's drop in service frequency.
            </p>

            {/* Tell me more about the math */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setShowOffPeakMath(!showOffPeakMath)}
                className="px-5 py-2.5 rounded-xl border border-blue-900/20 text-blue-900 bg-white hover:bg-blue-50/50 font-extrabold text-xs md:text-sm transition-all duration-200 flex items-center gap-2 shadow-sm hover:border-blue-900/40 active:scale-98"
              >
                <span>{showOffPeakMath ? "Hide Detailed Math" : "Tell me more about the math"}</span>
              </button>
            </div>

            {showOffPeakMath && (
              <div 
                onClick={() => setShowOffPeakMath(false)}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-4xl h-[85vh] bg-slate-100 border border-slate-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden cursor-default"
                >
                  
                  {/* Header / Top Control Row */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    <button
                      onClick={() => setShowOffPeakMath(false)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all duration-150"
                      title="Close methodology panel"
                    >
                      <span className="font-extrabold text-sm">✕</span>
                    </button>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Methodology Details
                    </span>
                    <div className="w-8 h-8 opacity-0" aria-hidden="true" />
                  </div>

                  {/* Scrollable Modal Content */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                    <div className="border-b border-slate-200 pb-4">
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">Off-Peak Methodology: Headway-Based Scores</h3>
                      <p className="text-xs text-slate-500 mt-1">How transit frequency during off-peak windows converts into scores.</p>
                    </div>
                    
                    <div className="text-sm text-slate-600 space-y-4">
                      <p className="leading-relaxed">
                        Service quality is evaluated across four distinct off-peak time bands: <strong>Evenings</strong> (18:00 - 22:00 weekdays), <strong>Nights</strong> (22:00 - 05:00 weekdays), <strong>Saturdays</strong> (All day), and <strong>Sundays</strong> (All day).
                      </p>
                      
                      <p className="text-xs text-slate-500 font-bold">Headway-to-Points Conversion Scale:</p>
                      
                      {/* Visual Headway Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
                        {[
                          { range: '\u003c 15 mins', points: '100 pts', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                          { range: '15 – 30 mins', points: '70 pts', color: 'bg-blue-50 text-blue-750 border-blue-100' },
                          { range: '30 – 60 mins', points: '40 pts', color: 'bg-amber-50 text-amber-750 border-amber-100' },
                          { range: '> 60 mins / None', points: '10 pts', color: 'bg-rose-50 text-rose-700 border-rose-105' }
                        ].map((item, index) => (
                          <div key={index} className={`flex flex-col items-center justify-center p-3 rounded-2xl border bg-white shadow-sm ${item.color} text-center`}>
                            <span className="text-xs font-bold leading-tight">{item.range}</span>
                            <span className="text-xs font-black mt-2 bg-slate-50 px-2.5 py-0.5 rounded-full border border-black/5">{item.points}</span>
                          </div>
                        ))}
                      </div>

                      <p className="leading-relaxed">
                        The overall Off-Peak Score is calculated by averaging the points earned across all four time windows (Evenings, Nights, Saturdays, and Sundays). For example, if a route runs frequently on Saturdays (earning 70 points) but has no service late at night (earning only 10 points), the final score will be dragged down to reflect that lack of late-night service.
                      </p>

                      {/* Methodological Assumptions Section */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                          Methodological Assumptions and Justifications
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          To maintain transparency for decision-makers, it is important to outline the mathematical assumptions and limitations of this calculation:
                        </p>
                        <div className="flex flex-col gap-4 text-xs text-slate-655">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-900 block">Focus on Service Retention Over Absolute Frequency:</span>
                            <p className="leading-relaxed">
                              This metric measures relative service stability rather than the absolute number of buses running. For example, a route that runs once every 60 minutes in the morning and maintains that same once-an-hour frequency at night will receive a perfect score of 100%. A major corridor route that runs every 5 minutes in the morning but drops to every 15 minutes at night will receive a score of 33%, despite still offering more total buses. This design choice is intentional: it acts as a "Service Retention Index" to protect outer neighborhoods from losing their basic transit lifelines during off-peak hours.
                            </p>
                          </div>
                          <div className="space-y-1 border-t border-slate-100 pt-3">
                            <span className="font-bold text-slate-900 block">Representative Time Windows:</span>
                            <p className="leading-relaxed">
                              The formula uses specific one-hour windows (7:30 AM–8:30 AM for peak morning, and 9:30 PM–10:30 PM for late night) as proxies for service span. While this does not capture midday or weekend service, it provides a highly transparent, easily calculated, and reproducible metric. More complex alternatives, such as tracking total operating hours or absolute trip counts, tend to over-prioritize busy downtown lines at the expense of necessary community coverage routes.
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-550 border-t border-slate-100 pt-3 leading-relaxed">
                          By using this retention-based approach, the scorecard remains a clear and defensible tool for protecting vulnerable transit riders from losing essential late-night service.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ================= SECTION 6: Transit Monopoly ================= */}
          <section id="section-6" className="flex flex-col gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">6. Transit Monopoly</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                The Transit Monopoly pillar calculates neighbourhood dependence on a single bus route. If a neighbourhood lacks alternative bus routes or LRT stations within walking distance, the active route operates as a transit monopoly. Planners must consider this reliance when adjusting service.
              </p>
              
              <div className="flex flex-col md:flex-row gap-6 py-2 md:-mx-12 lg:-mx-24 justify-between items-stretch">
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="002" 
                    theme="blue" 
                    title="Route 002: Vital Monopoly Link (Score: 67.6)" 
                    description="Route 002 serves several dissemination areas in East Edmonton where it is the sole operating transit line. Removing Route 002 would leave these neighbourhoods without transit service."
                  />
                </div>
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="003" 
                    theme="yellow" 
                    title="Route 003: Overlapping Network (Score: 0.0)" 
                    description="Route 003 overlaps with multiple bus routes and LRT lines, providing riders with alternative options."
                  />
                </div>
              </div>
            </div>

            {route2Data && route3Data && daGeoJson && (
              <>
                <InteractiveToggleMap 
                  route2Data={route2Data} 
                  route3Data={route3Data} 
                  daGeoJson={daGeoJson} 
                  allRoutesData={allRoutesData} 
                  mode="monopoly" 
                />
                <p className="text-slate-500 text-xs md:text-sm italic text-center mt-1">
                  The maps show Dissemination Areas (DAs) colored by monopoly classification. Note the high-monopoly red blocks served by Route 002 compared to the green, low-monopoly zones surrounding Route 003.
                </p>
              </>
            )}

              {/* Tell me more about the math */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setShowMonopolyMath(!showMonopolyMath)}
                  className="px-5 py-2.5 rounded-xl border border-blue-900/20 text-blue-900 bg-white hover:bg-blue-50/50 font-extrabold text-xs md:text-sm transition-all duration-200 flex items-center gap-2 shadow-sm hover:border-blue-900/40 active:scale-98"
                >
                  <span>{showMonopolyMath ? "Hide Detailed Math" : "Tell me more about the math"}</span>
                </button>
              </div>

              {showMonopolyMath && (
                <div 
                  onClick={() => setShowMonopolyMath(false)}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
                >
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-4xl h-[85vh] bg-slate-100 border border-slate-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden cursor-default"
                  >
                    
                    {/* Header / Top Control Row */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                      <button
                        onClick={() => setShowMonopolyMath(false)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all duration-150"
                        title="Close methodology panel"
                      >
                        <span className="font-extrabold text-sm">✕</span>
                      </button>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Methodology Details
                      </span>
                      <div className="w-8 h-8 opacity-0" aria-hidden="true" />
                    </div>

                    {/* Scrollable Modal Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                      <div className="border-b border-slate-200 pb-4">
                        <h3 className="text-2xl font-black text-slate-900 leading-tight">Monopoly Methodology: Functional Redundancy</h3>
                        <p className="text-xs text-slate-500 mt-1">How alternative transit service capacity reduces dependency and scores.</p>
                      </div>
                      
                      <div className="text-sm text-slate-600 space-y-4">
                        <p className="leading-relaxed">
                          The model calculates a <strong>Functional Monopoly Index (FMI)</strong> for each Dissemination Area. If a DA has alternative transit services within a 400m walk, the monopoly score is discounted.
                        </p>
                        
                        {/* Visual flow of discounts */}
                        <div className="flex flex-col gap-2.5 py-2">
                          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
                            <span className="font-bold text-slate-800">Base Monopoly Value</span>
                            <span className="text-xs font-black text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-full">1.0 (Sole Route)</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">Alternative Service Discount</span>
                              <span className="text-[10px] text-slate-400">Based on capacity/frequency of other stops</span>
                            </div>
                            <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">Up to -0.8</span>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">On-Demand Transit (ODT) Discount</span>
                              <span className="text-[10px] text-slate-400">Mitigation applied if served by dynamic shuttles</span>
                            </div>
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">-50% (FMI × 0.5)</span>
                          </div>
                        </div>

                        <p className="leading-relaxed">
                          The final route score is calculated by taking the average of these monopoly values across all neighbourhoods served, weighted by population. We then scale the result from 0 to 100. A route that runs through areas with many other bus routes and LRT lines will get a score close to 0, indicating that riders have plenty of other travel options.
                        </p>

                        {/* Mathematical Formulation */}
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                            Mathematical Formulation
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            For any given Dissemination Area (DA) i and route r:
                          </p>
                          <ul className="flex flex-col gap-3 text-xs text-slate-650 pl-1">
                            <li className="space-y-0.5">
                              <strong className="text-slate-900 block">Active Route Set - R(i):</strong>
                              <p className="leading-relaxed">Let R(i) be the set of all transit routes that stop within 400m of the boundary of DA i.</p>
                            </li>
                            <li className="space-y-0.5 border-t border-slate-100 pt-2">
                              <strong className="text-slate-900 block">Destination Catchment, D(r):</strong>
                              <p className="leading-relaxed">For each route r, we index all Points of Interest (POIs), including employment hubs, schools, grocery stores, and medical services, that are reachable within 400m of any stop along that route.</p>
                            </li>
                            <li className="space-y-0.5 border-t border-slate-100 pt-2">
                              <strong className="text-slate-900 block">Alternative Routes - A(i,r):</strong>
                              <p className="leading-relaxed">For a specific route r serving DA i, its alternative routes are defined as the routes in R(i) other than route r.</p>
                            </li>
                            <li className="space-y-0.5 border-t border-slate-100 pt-2">
                              <strong className="text-slate-900 block">Shared Destination Volume - S(i,r):</strong>
                              <p className="leading-relaxed">We calculate the unique set of destinations reachable by alternative routes that overlap with the destinations reachable by route r.</p>
                            </li>
                            <li className="space-y-0.5 border-t border-slate-100 pt-2">
                              <strong className="text-slate-900 block">Functional Redundancy - FR(i,r):</strong>
                              <p className="leading-relaxed">{"The redundancy ratio is the proportion of a route's destinations that can be reached using the alternative routes: \\(FR_{i,r} = \\frac{|S_{i,r}|}{|D_r|}\\). (If a route serves zero POIs, its redundancy defaults to 1.0 to prevent false-monopoly flags in non-destination areas)."}</p>
                            </li>
                            <li className="space-y-0.5 border-t border-slate-100 pt-2">
                              <strong className="text-slate-900 block">Functional Monopoly Criteria:</strong>
                              <p className="leading-relaxed font-semibold text-slate-800">If the Functional Redundancy ratio is less than 20% (FR(i,r) &lt; 0.20), it indicates that alternative routes do not connect residents to the destinations they need. Route r is then classified as a Functional Monopoly for DA i.</p>
                            </li>
                          </ul>
                        </div>

                        {/* Policy and Scoring Impact */}
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                            Policy and Scoring Impact
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Shifting from physical stops to destination overlap reshapes how routes are prioritized on the scorecard:
                          </p>
                          <ul className="flex flex-col gap-3 text-xs text-slate-650 pl-1">
                            <li className="space-y-0.5">
                              <strong className="text-slate-900 block">Suburban Feeder and Radial Routes:</strong>
                              <p className="leading-relaxed">Cross-town feeders and suburban radial lines see their Monopoly Scores rise significantly. Although they may run parallel to or cross other routes near regional transit centers (which disqualified them under spatial scoring), they diverge to serve unique industrial parks, schools, or hospitals. Their functional uniqueness is now recognized.</p>
                            </li>
                            <li className="space-y-0.5 border-t border-slate-100 pt-2">
                              <strong className="text-slate-900 block">Urban Core Overlaps:</strong>
                              <p className="leading-relaxed">High-frequency routes running parallel to downtown (e.g., along main arterials) remain correctly classified as low-monopoly. Because they share extensive destination overlaps (with multiple routes heading to the downtown core), cancelling one route leaves riders with viable alternatives to reach the same hubs.</p>
                            </li>
                          </ul>
                        </div>

                        {/* Advanced Methodology Box */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-3">
                          <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                            <HelpCircle className="w-4 h-4" /> Future Refinement: Capacity-Weighted FMI
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            The current binary "all-or-nothing" definition (either a route is the only option or it is not) has limitations. For example, if a DA is served by a high-frequency route and a minor route that runs once a day, neither is classified as a monopoly, even though the minor route's contribution is practically negligible.
                          </p>
                          <p className="text-xs text-slate-655 leading-relaxed">
                            The proposed Capacity-Weighted FMI replaces the binary cutoff with an Index of Capacity Share:
                          </p>
                          <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-indigo-950 overflow-x-auto">
                            FMI(i,r) = 1 - Sum [ Capacity(alt) / (Capacity(r) + Capacity(alt)) ]
                          </div>
                          <p className="text-xs text-slate-655 leading-relaxed">
                            This proposed index measures the strength of alternative routes as a percentage of the main route's capacity. For example, if alternative routes only provide 5% of the seats in a neighborhood, the Redundancy Index is 0.05, signaling a near-total monopoly. If alternative routes provide equivalent or greater capacity, the index reaches 1.0 or higher, showing high redundancy.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </section>

          {/* ================= SECTION 7: Policy Weights Simulator ================= */}
          <section id="section-7" className="flex flex-col gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">7. Balancing the Different Policy Weights</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                After evaluating the four pillars, transit planners combine them to generate a total equity score for each route. Determining the priority given to each pillar represents a fundamental policy choice.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                Under a balanced policy with equal 25% weights across all four pillars, the model translates scores into academic-style letter grades from A (representing the highest equity priority) to F (representing the lowest equity priority). With equal weighting, Route 002 receives a B grade (68.1), as its strong performance in vulnerability, monopoly, and destination opportunity makes it a high priority for service protection. Route 003 receives an E grade (18.6), a low equity priority because it serves higher-income neighbourhoods and overlaps with alternative transit options.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                When policy priorities shift, these scores adjust accordingly. For example, if a policy prioritizes scheduling by allocating 40% of the weight to Off-Peak Service, 35% to Destination Opportunity, 15% to Transit Vulnerability, and 10% to Transit Monopoly, the final scores change:
              </p>
              <ul className="text-sm text-slate-600 leading-relaxed mt-2 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 flex-shrink-0 pt-[2px]">•</span>
                  <span className="flex-1">
                    <strong className="text-blue-950 font-bold">Route 002 decreases from 68.1 to 63.8</strong>: Although its demographic vulnerability weight is nearly halved, the route maintains a strong B grade because it connects a high volume of riders to essential jobs and services, keeping its Destination Opportunity score at 92.7.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 flex-shrink-0 pt-[2px]">•</span>
                  <span className="flex-1">
                    <strong className="text-blue-950 font-bold">Route 003 increases from 18.6 to 24.4</strong>: Because the Off-Peak Service weight increases to 40%, Route 003 benefits from its reliable evening and weekend schedule, which scores 38.0. This scheduling strength helps offset its low scores in transit monopoly and demographic vulnerability.
                  </span>
                </li>
              </ul>
            </div>

            {/* Interactive Weight Sliders Simulator Widget (Wider to match Route 2 & 3 cards) */}
            <div className="p-6 bg-slate-100 border border-slate-200 rounded-3xl flex flex-col gap-5 shadow-sm md:-mx-12 lg:-mx-24 w-full md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)]">
              <div className="flex flex-col items-center">
                <Zap className="w-8 h-8 text-teal-600 mb-1" />
                <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Policy Weights Simulator</span>
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

              {/* Live simulated results visual bar chart */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-inner min-h-[400px]">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Policy Weight Equity Scoring</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveSimulatorRouteId('002')}
                      className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all duration-200 border ${activeSimulatorRouteId === '002' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      Route 002
                    </button>
                    <button 
                      onClick={() => setActiveSimulatorRouteId('003')}
                      className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all duration-200 border ${activeSimulatorRouteId === '003' ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      Route 003
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 w-full relative pt-2">
                  <ShapWaterfall 
                    route={{
                      route_id: activeSimulatorRouteId,
                      short_name: activeSimulatorRouteId,
                      name: activeSimulatorRouteId === '002' ? 'Highlands - Downtown' : 'Westmount - Stadium',
                      grade: (activeSimulatorRouteId === '002' ? liveScores.route2 : liveScores.route3) > 80 ? 'A' : (activeSimulatorRouteId === '002' ? liveScores.route2 : liveScores.route3) > 60 ? 'B' : (activeSimulatorRouteId === '002' ? liveScores.route2 : liveScores.route3) > 40 ? 'C' : (activeSimulatorRouteId === '002' ? liveScores.route2 : liveScores.route3) > 20 ? 'D' : 'E',
                      composite_score: activeSimulatorRouteId === '002' ? liveScores.route2 : liveScores.route3,
                      total_pop_served: 0, category: 'bus', trip_count: 0, route_length_km: 0, coords: [], da_data: [],
                      pillar_1: activeSimulatorRouteId === '002' ? r2.vulnerability : r3.vulnerability,
                      pillar_2: activeSimulatorRouteId === '002' ? r2.offPeak : r3.offPeak,
                      pillar_3: activeSimulatorRouteId === '002' ? r2.monopoly : r3.monopoly,
                      pillar_4: activeSimulatorRouteId === '002' ? r2.opportunity : r3.opportunity,
                      shap: [
                        { pillar: 'vuln', label: 'Vulnerability', value: (activeSimulatorRouteId === '002' ? r2.vulnerability : r3.vulnerability) * (weights.vulnerability / 100) - (50 * (weights.vulnerability/100)), color: ((activeSimulatorRouteId === '002' ? r2.vulnerability : r3.vulnerability) * (weights.vulnerability / 100) - (50 * (weights.vulnerability/100))) >= 0 ? '#10B981' : '#F43F5E', rawScore: 0, networkMean: 50, weight: weights.vulnerability/100 },
                        { pillar: 'temp', label: 'Off Peak', value: (activeSimulatorRouteId === '002' ? r2.offPeak : r3.offPeak) * (weights.offPeak / 100) - (50 * (weights.offPeak/100)), color: ((activeSimulatorRouteId === '002' ? r2.offPeak : r3.offPeak) * (weights.offPeak / 100) - (50 * (weights.offPeak/100))) >= 0 ? '#10B981' : '#F43F5E', rawScore: 0, networkMean: 50, weight: weights.offPeak/100 },
                        { pillar: 'mono', label: 'Monopoly', value: (activeSimulatorRouteId === '002' ? r2.monopoly : r3.monopoly) * (weights.monopoly / 100) - (50 * (weights.monopoly/100)), color: ((activeSimulatorRouteId === '002' ? r2.monopoly : r3.monopoly) * (weights.monopoly / 100) - (50 * (weights.monopoly/100))) >= 0 ? '#10B981' : '#F43F5E', rawScore: 0, networkMean: 50, weight: weights.monopoly/100 },
                        { pillar: 'opp', label: 'Opportunity', value: (activeSimulatorRouteId === '002' ? r2.opportunity : r3.opportunity) * (weights.opportunity / 100) - (50 * (weights.opportunity/100)), color: ((activeSimulatorRouteId === '002' ? r2.opportunity : r3.opportunity) * (weights.opportunity / 100) - (50 * (weights.opportunity/100))) >= 0 ? '#10B981' : '#F43F5E', rawScore: 0, networkMean: 50, weight: weights.opportunity/100 }
                      ]
                    } as any}
                    networkStats={{
                      sigmoidMidpoint: 50,
                      sigmoidSteepness: 0.1,
                      quintileCuts: [20, 40, 60, 80],
                      pillarMeans: { pillar_1_vulnerability: 50, pillar_2_temporal: 50, pillar_3_monopoly: 50, pillar_4_opportunity: 50 }
                    }}
                  />
                </div>
              </div>
              
              <p className="text-slate-605 text-base leading-relaxed mt-4">
                <strong>Note on Scoring (A–E):</strong> Routes are graded on a curve by dividing the network into five equal groups (quintiles). Because this is a relative ranking, a route's final letter grade depends not only on its own raw score but on how it compares to the rest of the network. As you adjust the policy weights, a route might shift into a higher or lower grade simply because the priorities of the overall network have changed.
              </p>
            </div>
          </section>

          {/* ================= SECTION 8: Route Stability and Elasticity ================= */}
          <section id="section-8" className="flex flex-col gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">8. Route Stability and Elasticity: What's the Perfect Mix?</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                When policy priorities change, some routes shift dramatically in grade, while others remain stable. To model this behaviour, we ran a sensitivity simulation calculating route scores across 1,000 policy weight combinations.
              </p>
              <p className="text-slate-655 text-base leading-relaxed font-semibold">
                This simulation reveals four route stability classifications:
              </p>

              <div className="flex flex-col gap-6 pl-2 py-2">
                {/* 1. Bedrock Essentials */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                      Bedrock Essentials (Always High Equity)
                    </span>
                  </div>
                  <p className="text-slate-655 text-base leading-relaxed pl-3.5">
                    These routes score highly across all weight scenarios, maintaining ranking stability regardless of the active policy configuration.
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-slate-200 pl-4 ml-3.5 italic">
                    Route 002 consistently receives a high route equity score regardless of how the model is weighted. This classification is due to Route 002 scoring exceptionally high on three of the four pillars: Vulnerability (80.8), Monopoly (67.6), and Opportunity (92.7). It serves a large population with high concentrations of low-income and immigrant households who may not have other travel options, while simultaneously connecting them to key employment hubs. Even if we minimize the demographic weights and heavily favor Off-Peak Service (its lowest scoring policy weight at 31.3), Route 002's scores on the other three policy weights ensure it remains a high scoring route for equity.
                  </p>
                </div>

                {/* 2. Policy Swing Route */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                      Policy Swing Route
                    </span>
                  </div>
                  <p className="text-slate-655 text-base leading-relaxed pl-3.5">
                    Scores for routes in this category fluctuate wildly depending on weight selections, making their funding priority highly sensitive to changing planning objectives.
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-slate-200 pl-4 ml-3.5 italic">
                    Route 003 is a Policy Swing Corridor because its score rises under an Off-Peak Service focus but drops when we prioritize Transit Monopoly or Transit Vulnerability. Specifically, Route 003 maintains a decent evening and weekend schedule (scoring 38.0 in Off-Peak), which pulls its grade up when temporal service is prioritized. However, because it runs through central neighborhoods with abundant overlapping transit routes and higher average incomes, its Monopoly score is an absolute 0.0 and its Vulnerability score is a low 17.5. When policy shifts to favor demographic need or route dependency, Route 003's score collapses, making its funding priority highly dependent on the active political administration.
                  </p>
                </div>

                {/* 3. Moderate Stability */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Moderate Stability (Consistent Mid-Range Scores)
                    </span>
                  </div>
                  <p className="text-slate-655 text-base leading-relaxed pl-3.5">
                    These routes maintain steady, mid-range scores across all scenarios and are not highly sensitive to policy changes, representing stable baseline operations.
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-slate-200 pl-4 ml-3.5 italic">
                    For example, Route 913 (West Edmonton Mall – Jamieson Place) does not feature extreme highs or absolute zeros in any single category. Under the simulation, its scores remain remarkably stable, maintaining an average score of 50.03 with a very low standard deviation of just 4.88.
                  </p>
                </div>

                {/* 4. Bedrock Resilient */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-55 text-slate-700 border border-slate-200">
                      Bedrock Resilient (Always Low Equity)
                    </span>
                  </div>
                  <p className="text-slate-655 text-base leading-relaxed pl-3.5">
                    These routes consistently receive lower equity scores across all possible policy weight combinations, typically running through affluent sectors.
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-slate-200 pl-4 ml-3.5 italic">
                    Route 524 (Bonnie Doon – Holyrood) falls into this category, averaging a score of just 8.9 out of 100 across all configurations.
                  </p>
                </div>
              </div>

              <p className="text-slate-605 text-base leading-relaxed">
                Identifying these classifications for each route helps us identify which routes should be protected and how different service changes may impact specific routes.
              </p>
              <p className="text-slate-605 text-base leading-relaxed">
                <strong>There is no perfect mix of policy weights but this analysis shows us which routes are performing a high equity service no matter how we weight them.</strong>
              </p>
            </div>

            {/* 📊 Actual Interactive Scatter Plot (Swapped to bottom of Section 8) */}
            {showFullscreenScatterplot && (
              <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFullscreenScatterplot(false)} />
            )}
            <div className={showFullscreenScatterplot ? "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] h-[85vh] max-w-6xl bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl flex flex-col" : "w-full h-[550px] bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:-mx-12 lg:-mx-24 md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)] mt-4 relative"}>
              
              {/* Expand / Close Button */}
              <button 
                onClick={() => setShowFullscreenScatterplot(!showFullscreenScatterplot)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors z-10"
                title={showFullscreenScatterplot ? "Close Fullscreen" : "Expand to Fullscreen"}
              >
                {showFullscreenScatterplot ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>

              <div className="text-center mb-4 mt-2">
                <span className="text-sm font-black text-blue-900 uppercase tracking-wider">Policy Risk Map: Mean Score vs. Volatility</span>
                <p className="text-xs text-slate-500 mt-1">Route 002 and Route 003 highlighted relative to all 170 network routes. Hover over each route for more detail.</p>
              </div>

              {/* Legend placed clean at the top */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4 text-xs font-bold border-b border-slate-100 pb-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                  <span className="w-3 h-3 rounded-full bg-[#2563EB] inline-block border border-[#1D4ED8]" />
                  <span className="text-blue-950">Route 002</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                  <span className="w-3 h-3 rounded-full bg-[#EA580C] inline-block border border-[#C2410C]" />
                  <span className="text-orange-950">Route 003</span>
                </div>
              </div>

              {sensitivityData.length > 0 ? (
                <div className="flex-1 min-h-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 15, right: 25, bottom: 35, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        type="number"
                        dataKey="score_mean"
                        name="Mean Score"
                        domain={[0, 100]}
                        tickCount={6}
                        stroke="#64748B"
                        fontSize={11}
                        label={{
                          value: 'Mean Score (Overall Priority Rank)',
                          position: 'bottom',
                          offset: 15,
                          fontSize: 11,
                          fill: '#334155',
                          fontWeight: 700
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="score_std"
                        name="Volatility"
                        domain={[0, 40]}
                        tickCount={5}
                        stroke="#64748B"
                        fontSize={11}
                        label={{
                          value: 'Robustness Index (Rr), Volatility',
                          angle: -90,
                          position: 'insideLeft',
                          offset: -10,
                          fontSize: 11,
                          fill: '#334155',
                          fontWeight: 700
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
                          let radius = 6.0; // Scaled up from 3.5
                          let fillOpacity = 0.35; // Increased opacity
                          let stroke = 'transparent';
                          let strokeWidth = 0;

                          if (isRoute2) {
                            fill = '#2563EB'; // Bright blue for Route 2
                            radius = 12; // Scaled up from 8
                            fillOpacity = 1.0;
                            stroke = '#1D4ED8';
                            strokeWidth = 2.5;
                          } else if (isRoute3) {
                            fill = '#EA580C'; // Bright orange for Route 3
                            radius = 12; // Scaled up from 8
                            fillOpacity = 1.0;
                            stroke = '#C2410C';
                            strokeWidth = 2.5;
                          }

                          return (
                            <React.Fragment key={`cell-wrap-${index}`}>
                              <Cell
                                key={`cell-${index}`}
                                fill={fill}
                                fillOpacity={fillOpacity}
                                stroke={stroke}
                                strokeWidth={strokeWidth}
                                r={radius}
                              />
                              {(isRoute2 || isRoute3) && (
                                <g>
                                  {/* Background badge for label */}
                                  <rect
                                    x={isRoute2 ? 55 : 30}
                                    y={isRoute2 ? 150 : 25}
                                    width={72}
                                    height={20}
                                    rx={4}
                                    fill="#0f172a"
                                    opacity={0.85}
                                  />
                                  <text
                                    x={isRoute2 ? 91 : 66}
                                    y={isRoute2 ? 164 : 39}
                                    textAnchor="middle"
                                    fill="#ffffff"
                                    fontSize={10}
                                    fontWeight="black"
                                  >
                                    {isRoute2 ? 'Route 002' : 'Route 003'}
                                  </text>
                                </g>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-mono">
                  Loading Sensitivity Scatter dataset...
                </div>
              )}
            </div>
          </section>

          {/* ================= SECTION 9: Methodological Limitations ================= */}
          <section id="section-9" className="flex flex-col gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">9. What the Scorecard Misses</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                No mathematical model perfectly captures the lived experience of transit riders. The ETS Route Equity Scorecard has several methodological limitations:
              </p>
              
              <div className="flex flex-col gap-8 mt-6">
                {/* Limitation 1 */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">1. The Ecological Fallacy</h3>
                    <p className="text-slate-605 text-sm mt-1 leading-relaxed">
                      Evaluating demographic data aggregated at the Dissemination Area (DA) level, which is the smallest geographic unit used by Statistics Canada, assumes that individual residents match their neighbourhood average. In reality, affluent residents live in vulnerable DAs, and transit-dependent families live in wealthy areas. Because the model scores geography rather than individuals, isolated pockets of need are often obscured by broader neighbourhood averages.
                    </p>
                  </div>
                  
                  {/* Visual: Macro vs. Micro Split-View (Upgraded to high fidelity match) */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8 justify-center items-stretch mt-2 md:-mx-12 lg:-mx-24 w-full md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)]">
                    {/* Text Headers Side by Side */}
                    <div className="flex justify-between items-center w-full px-8 pt-4 pb-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Zone Average</span>
                        <span className="text-[10px] text-slate-500">(15% Vulnerable)</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300" />
                      <div className="flex flex-col text-right">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Granular Breakdown</span>
                        <span className="text-[10px] text-slate-500">(True Dissemination)</span>
                      </div>
                    </div>
                    <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-center relative">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Score</span>
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-slate-500 mt-4 leading-relaxed max-w-xs">
                        Appears broadly adequate when viewed as a single, homogenous block.
                      </p>
                    </div>

                    <div className="w-full md:w-1/2 flex flex-col justify-center p-6 bg-slate-50/50 border border-slate-100 rounded-2xl relative">
                      <div className="text-center mb-4">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">🎯 Micro View</span>
                        <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide mt-3">Granular Breakdown</h4>
                      </div>
                      
                      {/* High-Fidelity Progress Bars */}
                      <div className="space-y-4 my-2">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-600" /> High-need Segments</span>
                            <span className="text-rose-655 font-black text-sm">70%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-rose-500 to-red-650 rounded-full" style={{ width: '70%' }} />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Low-need Segments</span>
                            <span className="text-emerald-700 font-black text-sm">30%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-550 rounded-full" style={{ width: '30%' }} />
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-slate-500 mt-4 leading-relaxed text-center">
                        Reveals deep disparities masked by the aggregated zone average.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Limitation 2 */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">2. Static Schedules vs. Real-World Reliability</h3>
                    <p className="text-slate-605 text-sm mt-1 leading-relaxed">
                      Off-peak scores are calculated using static General Transit Feed Specification (GTFS) schedules, which are the digital timetables published by the city. This approach assumes buses run on time. The model ignores real-world detours, weather delays, and cancellations, which influence whether a resident chooses to use transit. A scheduled 15-minute route that experiences regular delays is often less useful to riders than a highly reliable, uninterrupted 30-minute route.
                    </p>
                  </div>
                  
                  {/* Visual: Timeline Drift Comparison (Upgraded to high fidelity) */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 mt-2 md:-mx-12 lg:-mx-24 w-full md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)]">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">🗓️ Scheduled GTFS</span>
                        <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Perfect Interval</span>
                      </div>
                      <div className="relative w-full h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between px-6 font-mono text-[10px] md:text-xs text-emerald-700 font-bold shadow-inner">
                        <span>0:00 (On Time)</span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span>0:15 (On Time)</span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span>0:30 (On Time)</span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span>0:45 (On Time)</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">⚠️ Real-World Tracking</span>
                        <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider text-rose-605">Timeline Drift</span>
                      </div>
                      <div className="relative w-full h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between px-6 font-mono text-[10px] md:text-xs shadow-inner">
                        <span className="text-amber-600 font-bold">0:08 (Late)</span>
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                        <span className="text-rose-600 font-black">0:30 (Cancelled)</span>
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                        <span className="text-emerald-700 font-bold">0:45 (Bunched)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Limitation 3 */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">3. Catchment Buffers vs. Physical Barriers</h3>
                    <p className="text-slate-605 text-sm mt-1 leading-relaxed">
                      Walking catchments assume ideal pedestrian access and uniform walking speeds. The model cannot detect micro-level barriers, such as broken sidewalks, snow-blocked paths, missing crosswalks, or major highway crossings, that make walking unsafe or impossible for seniors and residents with mobility aids.
                    </p>
                  </div>
                  
                  <CatchmentBarrierMap />
                </div>

                {/* Limitation 4 */}
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">4. Destination Quantity vs. Quality</h3>
                    <p className="text-slate-605 text-sm mt-1 leading-relaxed">
                      The Destination Opportunity pillar counts the presence of services but ignores their affordability or capacity. It treats a luxury organic market and a discount grocery store as identical food destinations, despite their vastly different utility to low-income riders.
                    </p>
                  </div>
                  
                  <GroceryFlowViz />
                </div>

              </div>
            </div>
          </section>

          {/* ================= SECTION 10: Applying the Scorecard to Planning Decisions ================= */}
          <section id="section-10" className="flex flex-col gap-6">
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
            <div className="max-w-2xl space-y-4">
              <h3 className="text-3xl font-black text-blue-900 leading-tight">Explore the Route Equity Scorecard Tool</h3>
              <p className="text-slate-600 text-base leading-relaxed">
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
