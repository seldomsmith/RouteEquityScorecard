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
import { InteractiveToggleMap } from './widgets/InteractiveToggleMap';
import { OffPeakFrequencyChart } from './widgets/OffPeakFrequencyChart';
import { CatchmentBarrierMap } from './widgets/CatchmentBarrierMap';
import { StaggeredMenu } from './widgets/StaggeredMenu';
import { ShapWaterfall } from './charts/ShapWaterfall';
import { GroceryFlowViz } from './widgets/GroceryFlowViz';
import { RouteWaterfall } from './RouteWaterfall';
import { DataExplorerModal } from './widgets/DataExplorerModal';
import { Maximize2, X, HelpCircle, Users, Target } from 'lucide-react';
import { mapStabilityClass } from '@/utils/stability';

const TwoPillars: React.FC = () => {
  const pillars = [
    {
      title: 'Transit Vulnerability',
      icon: Users,
      color: '#EF4444', // Red
      description: 'Measures neighborhood socio-demographic need along each route. The score reflects the concentration of low-income households, seniors, youth, lone-parent households, and visible minority residents living near the route stops.',
    },
    {
      title: 'Destination Opportunity',
      icon: Target,
      color: '#4F46E5', // Indigo
      description: 'Evaluates connections to specific destinations. Points are awarded based on hospitals, employment centres, post-secondary schools, grocery stores, and primary/secondary schools within walking distance.',
    },
  ];

  return (
    <div className="w-full mt-4 flex flex-col gap-6 md:-mx-12 lg:-mx-24 md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-h-[220px]">
        {pillars.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div 
              key={idx}
              className="w-full pillar-card-lift flex flex-col bg-white rounded-2xl border-2 overflow-hidden"
              style={{ 
                '--pillar-color': p.color,
              } as React.CSSProperties}
            >
              <div 
                className="p-5 flex flex-col items-center justify-center text-center text-white select-none"
                style={{ backgroundColor: p.color }}
              >
                <div className="p-2.5 bg-white/15 rounded-lg border border-white/20 mb-2">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider leading-tight">
                  {p.title}
                </span>
              </div>
              <div className="flex-1 p-5 flex flex-col justify-start bg-white">
                <p className="text-[11px] text-slate-655 leading-relaxed font-semibold">
                  {p.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ScrollytellingProps {
  onBack: () => void;
  onJumpIn: () => void;
  onToggleVersion?: () => void;
}

// Color map aligning with the user's Policy Risk Map design:
const CLASS_COLORS: { [key: string]: string } = {
  'Essential Equity Routes': '#3B82F6',       // Always High Equity
  'Low Equity-Priority Routes': '#10B981',    // Always Low Equity
  'High Swing Routes': '#EF4444',             // High Swing Routes
  'Moderate Swing Routes': '#F59E0B',         // Moderate Swing Routes
};

const CLASS_LABELS: { [key: string]: string } = {
  'Essential Equity Routes': 'Always High Equity',
  'Low Equity-Priority Routes': 'Always Low Equity',
  'High Swing Routes': 'High Swing Routes',
  'Moderate Swing Routes': 'Moderate Swing Routes',
};

// Helper to generate a normal distribution curve
function generateNormalDistribution(mean: number, std: number) {
  // If std is extremely small or missing, add a tiny bit of width for rendering
  const validStd = (std && std > 0) ? std : 0.5;
  const points = [];
  
  // Create 50 points from 0 to 100 for an absolute scale
  for (let x = 0; 100 >= x; x += 2) {
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


export const ScrollytellingTwoPillar = ({ onBack, onJumpIn, onToggleVersion }: ScrollytellingProps) => {
  const containerRef = useRef(null as HTMLDivElement | null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [sensitivityData, setSensitivityData] = useState([] as any[]);

  // States to hold route geometry & boundaries for the inline ExplainerMaps
  const [route2Data, setRoute2Data] = useState(null as any);
  const [route3Data, setRoute3Data] = useState(null as any);
  const [route727Data, setRoute727Data] = useState(null as any);
  const [allRoutesData, setAllRoutesData] = useState([] as any[]);
  const [odtGeoJson, setOdtGeoJson] = useState(null as any);
  const [daGeoJson, setDaGeoJson] = useState(null as any);

  // Policy Sliders state for Step 7 (Policy Weights)
  const [weights, setWeights] = useState({
    vulnerability: 50,
    opportunity: 50,
  });
  
  // State for toggling route in the simulator waterfall chart
  const [activeSimulatorRouteId, setActiveSimulatorRouteId] = useState('002' as '002' | '003');
  
  // State for fullscreen scatterplot
  const [showFullscreenScatterplot, setShowFullscreenScatterplot] = useState(false);
  
  // State for fullscreen simulator
  const [showFullscreenSimulator, setShowFullscreenSimulator] = useState(false);

  // Active section tracking for spotlight dimming effect
  const [activeSection, setActiveSection] = useState('section-1');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observerOptions = {
      root: el,
      rootMargin: '-30% 0px -40% 0px', // Spotlights the section in the middle portion of the screen
      threshold: 0.1,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    const sectionIds = [
      'section-1', 'section-2', 'section-3', 'section-4',
      'section-odt', 'section-7', 'section-8', 'section-9', 'section-10'
    ];

    sectionIds.forEach((id) => {
      const target = document.getElementById(id);
      if (target) observer.observe(target);
    });

    return () => observer.disconnect();
  }, []);

  const getSectionClass = (id: string) => {
    return 'flex flex-col gap-6';
  };

  // State hooks for detailed math expanders
  const [showVulnerabilityMath, setShowVulnerabilityMath] = useState(false);
  const [showOpportunityMath, setShowOpportunityMath] = useState(false);
  const [showDataExplorer, setShowDataExplorer] = useState(false);

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
    fetch('/data/sensitivity_summary_2_pillar.csv')
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split('\n');
        if (lines.length === 0) return;
        const headers = lines[0].split(',').map((h) => h.trim());
        const list: any[] = [];
        for (let i = 1; lines.length > i; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const values = line.split(',').map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, idx) => {
            const val = values[idx];
            if (h === 'route_id' || h === 'name' || h === 'short_name' || h === 'stability_class') {
              obj[h] = h === 'stability_class' ? mapStabilityClass(val || '') : (val || '');
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
        const mappedRoutes = data.routes.map((r: any) => ({
          ...r,
          stability_class: mapStabilityClass(r.stability_class || 'Moderate Stability'),
          stability_class_2_pillar: mapStabilityClass(r.stability_class_2_pillar || 'Moderate Stability')
        }));
        const r2 = mappedRoutes.find((r: any) => r.route_id === '002');
        const r3 = mappedRoutes.find((r: any) => r.route_id === '003');
        const r727 = mappedRoutes.find((r: any) => r.route_id === '727');
        setRoute2Data(r2);
        setRoute3Data(r3);
        setRoute727Data(r727);
        setAllRoutesData(mappedRoutes);
      })
      .catch((err) => console.error("❌ Explainer Map failed to load golden route records:", err));
  }, []);

  const handleWeightChange = (key: keyof typeof weights, val: number) => {
    // With only 2 weights, if one changes to `val`, the other must be `100 - val`
    const otherKey = key === 'vulnerability' ? 'opportunity' : 'vulnerability';
    setWeights({
      [key]: val,
      [otherKey]: 100 - val,
    } as any);
  };

  const r2 = { vulnerability: 80.8, offPeak: 31.3, monopoly: 67.6, opportunity: 92.7 };
  const r3 = { vulnerability: 17.5, offPeak: 38.0, monopoly: 0.0, opportunity: 24.2 };

  const liveScores = {
    route2: (
      r2.vulnerability * (weights.vulnerability / 100) +
      r2.opportunity * (weights.opportunity / 100)
    ),
    route3: (
      r3.vulnerability * (weights.vulnerability / 100) +
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
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-semibold text-teal-650 leading-none">Scroll down to read</span>
              <button 
                onClick={() => {
                  setIsSplitScreen(!isSplitScreen);
                  if (onToggleVersion) onToggleVersion();
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 bg-blue-600 shadow-sm shadow-blue-500/50 scale-110 hover:bg-blue-700`}
                title="Toggle 4-Pillar View"
              />
              <span className="text-[10px] font-semibold text-blue-600 leading-none transition-colors duration-300 drop-shadow-sm">Two Pillars</span>
            </div>
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
          {/* Subway dots representing the 9 sections */}
          <div className="relative flex justify-between items-center w-full">
            {[
              { id: 'section-1', label: '1. Introduction' },
              { id: 'section-2', label: '2. Two Pillars' },
              { id: 'section-3', label: '3. Vulnerability' },
              { id: 'section-4', label: '4. Opportunity' },
              { id: 'section-odt', label: '5. On Demand' },
              { id: 'section-7', label: '6. Balancing' },
              { id: 'section-8', label: '7. Route Sensitivity' },
              { id: 'section-9', label: '8. Limitations' },
              { id: 'section-10', label: '9. Decisions' },
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
      <main className="flex-grow pt-16 pb-20 w-full flex flex-col items-center bg-slate-50">
        
        {/* 🚌 Full-Width Premium Hero Header */}
        <div className="w-full relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-slate-50/20 to-slate-50 pt-20 pb-16 px-6 flex flex-col items-center justify-center text-center">
          {/* Animated RouteWaterfall Background */}
          <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <RouteWaterfall opacity={0.25} showStations={false} />
          </div>

          {/* Fade Mask Overlay to make lines fade to white/slate-50 seamlessly */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/40 to-slate-50 pointer-events-none z-[1]" />

          {/* Content */}
          <div className="relative z-10 max-w-3xl w-full flex flex-col items-center justify-center">
            <h1 className="text-[38px] md:text-[50px] lg:text-[62px] font-black text-blue-900 tracking-tight leading-tight uppercase scrolly-title-lift-effect cursor-default">
              ETS Route Equity Scorecard
            </h1>
          </div>
        </div>

        {/* Max-width content container */}
        <div className="w-full max-w-3xl px-6 flex flex-col gap-24 mt-8">
          
          {/* ================= SECTION 1: Introduction ================= */}
          <section id="section-1" className={getSectionClass('section-1')}>
            
            {/* Narrative text (sitting directly on the background) */}
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">1. Introduction</h2>
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
                By analyzing these lines through a systematic framework, we can quantify transit equity and compare route performance objectively.
              </p>
            </div>
          </section>

          {/* ================= SECTION 2: Two Pillars ================= */}
          <section id="section-2" className={getSectionClass('section-2')}>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">2. The Two Pillars of Transit Equity</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                There are two pillars that determine the route equity score of any particular route in this model.
              </p>
            </div>

            <TwoPillars />

            <p className="text-slate-600 text-base leading-relaxed">
              Each route receives a score from 0 to 100 on each pillar. Combining these two scores helps determine a route's overall transit equity score. Explore each pillar below.
            </p>
          </section>

          {/* ================= SECTION 3: Vulnerability ================= */}
          <section id="section-3" className={getSectionClass('section-3')}>
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
                    heightClass="h-[260px] sm:h-[230px] md:h-[210px]"
                  />
                </div>
                <div className="w-full md:w-1/2 flex flex-col">
                  <RouteTicket 
                    routeNumber="003" 
                    theme="yellow" 
                    title="Route 003: Low Vulnerability (Score: 17.5)" 
                    description="Route 003 serves 13,664 people across 25 neighbourhoods. Because these areas generally have higher average household incomes, they present lower vulnerability index rankings."
                    heightClass="h-[260px] sm:h-[230px] md:h-[210px]"
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
                  The maps illustrate Dissemination Areas (DAs) colored by vulnerability index, highlighting <strong className="text-blue-600">Route 002</strong>'s traversal through several high-vulnerability pockets in East Edmonton, compared to <strong className="text-amber-600">Route 003</strong>'s path through lower-priority central residential areas.
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

                      <div className="border-t border-slate-200 pt-6 mt-6 space-y-6">
                        <div className="border-b border-slate-200 pb-4">
                          <h3 className="text-2xl font-black text-slate-900 leading-tight">Neighbourhood Data Reliability Analysis</h3>
                          <p className="text-xs text-slate-500 mt-1">Measuring the stability and volatility of vulnerability rankings across Edmonton.</p>
                        </div>
                        
                        <p className="text-slate-600 text-sm leading-relaxed">
                          We wanted to know if the vulnerability rankings for different Edmonton neighbourhoods would change significantly if we shifted the importance of our six demographic markers: Low Income, Visible Minorities, Seniors, Recent Immigrants, Lone Parents, and Youth. To test this, we ran a "sensitivity analysis" to see how stable the data really is.
                        </p>

                        <div className="space-y-2">
                          <h4 className="text-base font-bold text-slate-800">How We Tested the Data</h4>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            We tested over <strong>88,000 different weight combinations</strong> across Edmonton’s 1,762 populated neighbourhoods (Dissemination Areas). This involved about <strong>156 million calculations</strong> to see if changing the "math" behind the scores would drastically flip which areas were considered high-need versus low-need.
                          </p>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            The goal was to measure the "volatility", or how much a score moves, when the weights change. If a neighbourhood’s score stays roughly the same regardless of the weights, the data is considered stable and reliable.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-base font-bold text-slate-805 text-[14px]">Neighbourhood Stability Examples</h4>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            This table shows how different types of neighbourhoods reacted to the thousands of weight changes. Most areas remained very consistent.
                          </p>

                          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200">
                              <thead className="bg-slate-50 font-bold text-slate-700 text-xs">
                                <tr>
                                  <th className="px-4 py-3 text-left">Neighbourhood Name</th>
                                  <th className="px-4 py-3 text-right">Mean Score (0-100)</th>
                                  <th className="px-4 py-3 text-right">Standard Deviation (Volatility)</th>
                                  <th className="px-4 py-3 text-left">Priority Stability Class</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 font-semibold text-slate-655 text-xs">
                                <tr>
                                  <td className="px-4 py-3">ABBOTTSFIELD</td>
                                  <td className="px-4 py-3 text-right">66.11</td>
                                  <td className="px-4 py-3 text-right text-rose-600">12.54</td>
                                  <td className="px-4 py-3 text-rose-700 bg-rose-50/50 px-2 py-0.5 rounded-full inline-block mt-1 text-[10px]">Highly Volatile (Borderline C/B Node)</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-3">QUEEN MARY PARK</td>
                                  <td className="px-4 py-3 text-right">56.53</td>
                                  <td className="px-4 py-3 text-right text-amber-600">9.59</td>
                                  <td className="px-4 py-3 text-amber-700 bg-amber-50/50 px-2 py-0.5 rounded-full inline-block mt-1 text-[10px]">Moderately Volatile</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-3">BEACON HEIGHTS</td>
                                  <td className="px-4 py-3 text-right">48.48</td>
                                  <td className="px-4 py-3 text-right text-emerald-600">6.37</td>
                                  <td className="px-4 py-3 text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded-full inline-block mt-1 text-[10px]">High Stability (Consistent Average Need)</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-3">BEACON HEIGHTS</td>
                                  <td className="px-4 py-3 text-right">28.05</td>
                                  <td className="px-4 py-3 text-right text-emerald-600">4.12</td>
                                  <td className="px-4 py-3 text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded-full inline-block mt-1 text-[10px]">High Stability (Consistent Low-Moderate Need)</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-3">BELLEVUE</td>
                                  <td className="px-4 py-3 text-right">21.93</td>
                                  <td className="px-4 py-3 text-right text-blue-600">3.16</td>
                                  <td className="px-4 py-3 text-blue-700 bg-blue-50/50 px-2 py-0.5 rounded-full inline-block mt-1 text-[10px]">Highly Resilient (Consistent Low Need)</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-3">BEACON HEIGHTS</td>
                                  <td className="px-4 py-3 text-right">0.00</td>
                                  <td className="px-4 py-3 text-right text-slate-500">0.00</td>
                                  <td className="px-4 py-3 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full inline-block mt-1 text-[10px]">Absolute Stability (Unpopulated Area)</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <p className="text-slate-400 text-[10px] italic">
                            (Note: The full dataset for all 1,762 Dissemination Areas is neighbourhood_vulnerability_sensitivity)
                          </p>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-base font-bold text-slate-800">Key Findings: What the Results Mean</h4>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            The most important takeaway is that <strong>Edmonton’s neighbourhood rankings are incredibly stable</strong>. Even when we significantly changed the weights, 95% of neighbourhoods saw their scores shift by less than 10 points on a 100-point scale. This means that a high-need neighbourhood stays high-priority, no matter how you tweak the formula.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-base font-bold text-slate-800">Why the Rankings Stay Steady</h4>
                          <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2 leading-relaxed">
                            <li><strong>Standardized Scaling:</strong> Every indicator is converted to a common scale first. This prevents one large group from drowning out others just because of their population size.</li>
                            <li><strong>Limited Weight Ranges:</strong> By keeping the weights within a reasonable range, we ensure no single variable can take over the entire index.</li>
                            <li><strong>Linear Stability:</strong> Neighbourhoods with very low needs are the most stable—their scores almost never change. As needs increase, volatility rises slightly because there are more active factors to weight, but the overall priority level remains clear.</li>
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-base font-bold text-slate-800">Practical Impacts for the ETS Route Equity Scorecard</h4>
                          <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2 leading-relaxed">
                            <li><strong>Fair and Defensible Grades:</strong> Since the neighbourhood scores are so stable, the final "A to E" grades for transit routes are mathematically solid. A route gets a high equity grade because it serves real needs, not because of biased weighting.</li>
                            <li><strong>Simple Math is Better:</strong> Because complex statistical models gave nearly identical results to a simple average, we can use a transparent "Equal Weight" model. This is much easier to explain to the public and city council.</li>
                            <li><strong>Focus on Service, Not Debates:</strong> Decision makers do not need to spend time determining which group is "more important." The math proves that the geographic patterns of need are robust.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ================= SECTION 4: Opportunity ================= */}
          <section id="section-4" className={getSectionClass('section-4')}>
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
                  The maps plot Points of Interest (POIs) clustered near bus stops, illustrating <strong className="text-blue-600">Route 002</strong>'s connectivity to medical, commercial, and employment centres, while <strong className="text-amber-600">Route 003</strong> serves primarily residential nodes.
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
                    </div>
                  </div>
                </div>
              </div>
              )}
          </section>

          {/* ================= SECTION ODT: On-Demand Transit (ODT) ================= */}
          <section id="section-odt" className={getSectionClass('section-odt')}>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">5. On Demand Transit (ODT)</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Edmonton Transit Service integrates On Demand Transit (ODT) zones to serve areas that lack regular, fixed-route bus lines. These zones use flexible, bookable buses that transport riders from an established bus stop to a designated transit centre or LRT station.
              </p>

              {/* Dynamic Map Visualization - Relocated right under the specified ODT description line */}
              {odtGeoJson && (
                <div className="w-full md:-mx-12 lg:-mx-24 md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)]">
                  <OdtExplainerMap odtGeoJson={odtGeoJson} routeData={route727Data} />
                </div>
              )}

              <p className="text-slate-600 text-base leading-relaxed">
                By providing dynamic feeder service, ODT fundamentally changes how transit equity is calculated for Dissemination Areas (DAs), which are the small, local geographic units used to measure neighbourhood census data. To see this in practice, consider <strong className="text-blue-600">Route 002</strong>, which connects at major hubs like the Stadium and Clareview Transit Centres – primary hubs for local ODT feeder shuttles. Since <strong className="text-blue-600">Route 002</strong> serves several outer neighbourhoods, the model applies a mathematical discount to those specific areas to account for these dynamic transit alternatives:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-slate-600 text-base">
                <li>
                  <strong className="text-blue-950 font-bold">Vulnerability Score Reduction (-10%)</strong>: 
                  DAs served by the Stadium/Clareview ODT receive a 10% reduction on their vulnerability index (V_i * 0.90) because local feeder shuttles help ease geographic isolation.
                </li>
              </ul>
              <p className="text-slate-600 text-base leading-relaxed">
                These adjustments ensure that route equity scores are not artificially inflated in areas where ODT is already successfully bridging the service gap.
              </p>
            </div>
          </section>

          {/* ================= SECTION 6: Pillar Weights Simulator ================= */}
          <section id="section-7" className={getSectionClass('section-7')}>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">6. Balancing the Different Pillar Weights</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                After evaluating the two pillars, we are able to combine them to generate an overall equity score for each route; however, the weighting of the two pillars can impact the final score of the route. Each score is out of 100 and the routes are sorted into quintiles with a grade assigned, A through E with A being the highest scoring routes (most important for equity) and E for the lowest scoring routes (least important for equity).
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                Under a balanced weighting, with equal weighting of 50% across both pillars:
              </p>
              <ul className="text-base text-slate-600 leading-relaxed mt-2 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 flex-shrink-0 pt-[2px]">•</span>
                  <span className="flex-1">
                    <strong className="text-blue-600">Route 002</strong> receives a strong score because it connects a high volume of riders to essential jobs and services, keeping its Destination Opportunity score at 92.7, and it serves highly vulnerable populations (Vulnerability 80.8).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 flex-shrink-0 pt-[2px]">•</span>
                  <span className="flex-1">
                    <strong className="text-amber-600">Route 003</strong> receives a much lower score. This low score is attributed to the higher-income neighbourhoods it serves (Vulnerability 17.5) and its relatively lower Destination Opportunity score (24.2).
                  </span>
                </li>
              </ul>
              <p className="text-slate-600 text-base leading-relaxed">
                When a user adjusts the weighting of the categories, these scores adjust accordingly. For example, if a new pillar weighting model prioritizes Destination Opportunity by allocating 80% to it and only 20% to Vulnerability, the scores shift:
              </p>
              <ul className="text-base text-slate-600 leading-relaxed mt-2 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 flex-shrink-0 pt-[2px]">•</span>
                  <span className="flex-1">
                    <strong className="text-blue-600">Route 002</strong> increases its lead as a top priority route, driven entirely by its massive 92.7 Destination Opportunity score, showing its value as a core structural link.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 flex-shrink-0 pt-[2px]">•</span>
                  <span className="flex-1">
                    <strong className="text-amber-600">Route 003</strong> remains low, but gets slightly more credit for its Destination Opportunity compared to its Vulnerability.
                  </span>
                </li>
              </ul>
            </div>

            {/* Interactive Weight Sliders Simulator Widget (Wider to match Route 2 & 3 cards) */}
            {showFullscreenSimulator && (
              <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFullscreenSimulator(false)} />
            )}
            
            <div className={showFullscreenSimulator 
              ? "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] h-[85vh] max-w-6xl bg-slate-100 border border-slate-200 rounded-3xl p-8 shadow-2xl flex flex-col gap-5 overflow-y-auto" 
              : "p-6 bg-slate-100 border border-slate-200 rounded-3xl flex flex-col gap-5 shadow-sm md:-mx-12 lg:-mx-24 w-full md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)] relative"}>
              
              <button 
                onClick={() => setShowFullscreenSimulator(!showFullscreenSimulator)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors absolute top-4 right-4 z-10"
                title={showFullscreenSimulator ? "Close Fullscreen" : "Expand to Fullscreen"}
              >
                {showFullscreenSimulator ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>

              <div className="flex flex-col items-center">
                <Zap className="w-8 h-8 text-teal-600 mb-1" />
                <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Pillar Weights Simulator</span>
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
              <div className={`p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-inner ${showFullscreenSimulator ? 'flex-1 min-h-[400px]' : 'min-h-[400px]'}`}>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div />
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
                      pillar_2: 0,
                      pillar_3: 0,
                      pillar_4: activeSimulatorRouteId === '002' ? r2.opportunity : r3.opportunity,
                      shap: [
                        { pillar: 'vuln', label: 'Vulnerability', value: (activeSimulatorRouteId === '002' ? r2.vulnerability : r3.vulnerability) * (weights.vulnerability / 100) - (50 * (weights.vulnerability/100)), color: ((activeSimulatorRouteId === '002' ? r2.vulnerability : r3.vulnerability) * (weights.vulnerability / 100) - (50 * (weights.vulnerability/100))) >= 0 ? '#10B981' : '#F43F5E', rawScore: activeSimulatorRouteId === '002' ? r2.vulnerability : r3.vulnerability, networkMean: 50, weight: weights.vulnerability/100 },
                        { pillar: 'opp', label: 'Opportunity', value: (activeSimulatorRouteId === '002' ? r2.opportunity : r3.opportunity) * (weights.opportunity / 100) - (50 * (weights.opportunity/100)), color: ((activeSimulatorRouteId === '002' ? r2.opportunity : r3.opportunity) * (weights.opportunity / 100) - (50 * (weights.opportunity/100))) >= 0 ? '#10B981' : '#F43F5E', rawScore: activeSimulatorRouteId === '002' ? r2.opportunity : r3.opportunity, networkMean: 50, weight: weights.opportunity/100 }
                      ]
                    } as any}
                    networkStats={{
                      sigmoidMidpoint: 50,
                      sigmoidSteepness: 0.1,
                      quintileCuts: [20, 40, 60, 80],
                      pillarMeans: { pillar_1_vulnerability: 50, pillar_2_temporal: 0, pillar_3_monopoly: 0, pillar_4_opportunity: 50 }
                    }}
                  />
                </div>
              </div>
              
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed mt-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                Use the pillar weight simulator below to show how weighting the different pillars can impact the final scoring of Route 002 and Route 003.
                <br /><br />
                <strong>Note on Scoring (A–E):</strong> Routes are graded on a curve by dividing the network into five equal groups (quintiles). Because this is a relative ranking, a route's final letter grade depends not only on its own raw score but on how it compares to the rest of the network. As you adjust the pillar weights, a route might shift into a higher or lower grade simply because the priorities of the overall network have changed.
              </p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowDataExplorer(true)}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
                >
                  <Maximize2 className="w-4 h-4" /> View Full Network Directory
                </button>
              </div>
            </div>
          </section>

          {/* ================= SECTION 8: Route Stability and Volatility ================= */}
          <section id="section-8" className={getSectionClass('section-8')}>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">7. Route Stability and Volatility: Equity Sensitivity Analysis</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                As shown above, when the pillar weighting changes, some routes may shift dramatically in grade; however, others may remain stable. To better understand and model this behaviour, we ran a sensitivity simulation calculating route scores across over 100 pillar weight combinations. This allows us to understand which routes are important for the purposes of equity, no matter what weighting we use.
              </p>
              <p className="text-slate-655 text-base leading-relaxed font-semibold">
                This simulation reveals four route stability classifications:
              </p>
            </div>

            <MonteCarloPlinko />

            <div className="space-y-4">
              <div className="flex flex-col gap-6 pl-2 py-2">
                {/* 1. Essential Equity Routes */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                      Essential Equity Routes (Always High Equity)
                    </span>
                  </div>
                  <p className="text-slate-655 text-base leading-relaxed pl-3.5">
                    These routes score highly across all weight scenarios, maintaining ranking stability regardless of the active pillar configuration.
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-slate-200 pl-4 ml-3.5 italic">
                    <strong className="text-blue-600">Route 002</strong> consistently receives a high route equity score regardless of how the model is weighted. This classification is due to <strong className="text-blue-600">Route 002</strong> scoring exceptionally high on both of the pillars: Vulnerability (80.8), and Opportunity (92.7). It serves a large population with high concentrations of low-income and immigrant households who may not have other travel options, while simultaneously connecting them to key employment hubs. Even if we minimize one of the weights, <strong className="text-blue-600">Route 002</strong>'s score on the other pillar weight ensures it remains a high scoring route for equity.
                  </p>
                </div>

                {/* 2. High Swing Routes */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">
                      High Swing Routes
                    </span>
                  </div>
                  <p className="text-slate-655 text-base leading-relaxed pl-3.5">
                    Scores for routes in this category fluctuate wildly depending on weight selections, making their funding priority highly sensitive to changing planning objectives.
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-slate-200 pl-4 ml-3.5 italic">
                    <strong className="text-amber-600">Route 003</strong> is a High Swing Route because its score rises under an Opportunity focus but drops when we prioritize Transit Vulnerability. Specifically, <strong className="text-amber-600">Route 003</strong> maintains a decent Destination Opportunity score (24.2) which pulls its grade up when destinations are prioritized. However, because it runs through central neighborhoods with higher average incomes, its Vulnerability score is a low 17.5. When pillar weights shift to favor demographic need, <strong className="text-amber-600">Route 003</strong>'s score collapses, making its relative funding priority highly sensitive to the chosen weighting model.
                  </p>
                </div>

                {/* 3. Moderate Swing Routes */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                      Moderate Swing Routes
                    </span>
                  </div>
                  <p className="text-slate-655 text-base leading-relaxed pl-3.5">
                    These routes maintain steady, mid-range scores across all scenarios and are not highly sensitive to pillar changes, representing stable baseline operations.
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-slate-200 pl-4 ml-3.5 italic">
                    For example, Route 913 (West Edmonton Mall – Jamieson Place) does not feature extreme highs or absolute zeros in any single category. Under the simulation, its scores remain remarkably stable, maintaining an average score of 50.03 with a very low standard deviation of just 4.88.
                  </p>
                </div>

                {/* 4. Low Equity-Priority Routes */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Low Equity-Priority Routes
                    </span>
                  </div>
                  <p className="text-slate-655 text-base leading-relaxed pl-3.5">
                    These routes consistently receive lower equity scores across all possible pillar weight combinations, typically running through affluent sectors.
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
                <strong>There is no perfect mix of pillar weights, they all rely on subjective value determinations, but this analysis shows us which routes are performing a high equity service no matter how we weight them.</strong>
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
                <span className="text-sm font-black text-blue-900 uppercase tracking-wider">Pillar Sensitivity Map: Mean Score vs. Volatility</span>
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
          <section id="section-9" className={getSectionClass('section-9')}>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">8. What the Scorecard Misses</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                No mathematical model perfectly captures the lived experience of transit riders. The ETS Route Equity Scorecard has several methodological limitations:
              </p>
              
              <div className="flex flex-col gap-8 mt-6">
                {/* Limitation 1 */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">I. The Ecological Fallacy</h3>
                    <p className="text-slate-605 text-sm mt-1 leading-relaxed">
                      Evaluating demographic data aggregated at the Dissemination Area (DA) level, which is the smallest geographic unit used by Statistics Canada, assumes that individual residents match their neighbourhood average. In reality, affluent residents live in vulnerable DAs, and transit-dependent families live in wealthy areas. Because the model scores geography rather than individuals, isolated pockets of need are often obscured by broader neighbourhood averages.
                    </p>
                  </div>
                  
                  {/* Visual: Macro vs. Micro Split-View (Upgraded to high fidelity match) */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8 justify-center items-stretch mt-2 md:-mx-12 lg:-mx-24 w-full md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)]">
                    <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-center relative">
                      <div className="text-center mb-4">
                        <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide">Zone Average</h4>
                      </div>
                      
                      {/* High-Fidelity SVG Circular Ring Indicator */}
                      <div className="relative w-36 h-36 mt-4 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="72" cy="72" r="54" stroke="#E2E8F0" strokeWidth="10" fill="transparent" />
                          <circle cx="72" cy="72" r="54" stroke="#0D9488" strokeWidth="10" fill="transparent" strokeDasharray="339.3" strokeDashoffset="67.8" strokeLinecap="round" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-slate-800 leading-none">80.0</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Score</span>
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-slate-500 mt-4 leading-relaxed max-w-xs">
                        Appears broadly adequate when viewed as a single, homogenous block.
                      </p>
                    </div>

                    <div className="w-full md:w-1/2 flex flex-col justify-center p-6 bg-slate-50/50 border border-slate-100 rounded-2xl relative">
                      <div className="text-center mb-4">
                        <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide">Granular Breakdown</h4>
                      </div>
                      
                      {/* High-Fidelity Progress Bars */}
                      <div className="space-y-4 my-2">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Low-need Segments <span className="text-[10px] text-slate-400 font-medium">(80% of Zone)</span></span>
                            <span className="text-emerald-700 font-black text-sm">90.0 <span className="text-[10px] text-slate-400 font-bold uppercase">Score</span></span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-550 rounded-full" style={{ width: '90%' }} />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-600" /> High-need Segments <span className="text-[10px] text-slate-400 font-medium">(20% of Zone)</span></span>
                            <span className="text-rose-655 font-black text-sm">40.0 <span className="text-[10px] text-slate-400 font-bold uppercase">Score</span></span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-rose-500 to-red-650 rounded-full" style={{ width: '40%' }} />
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
                    <h3 className="text-xl font-bold text-slate-900">II. Static Schedules vs. Real-World Reliability</h3>
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
                    <h3 className="text-xl font-bold text-slate-900">III. Catchment Buffers vs. Physical Barriers</h3>
                    <p className="text-slate-605 text-sm mt-1 leading-relaxed">
                      Walking catchments assume ideal pedestrian access and uniform walking speeds. The model cannot detect micro-level barriers, such as broken sidewalks, snow-blocked paths, missing crosswalks, or major highway crossings, that make walking unsafe or impossible for seniors and residents with mobility aids.
                    </p>
                  </div>
                  
                  <CatchmentBarrierMap />
                </div>

                {/* Limitation 4 */}
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">IV. Destination Quantity vs. Quality</h3>
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
          <section id="section-10" className={getSectionClass('section-10')}>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-blue-900 leading-tight">9. Applying the Scorecard to Planning Decisions</h2>
              <p className="text-slate-605 text-base leading-relaxed">
                Scoring transit routes across the four pillars and simulating their stability provides analytical data to help planners design and schedule routes. The scorecard helps the city understand how different transit lines serve the diverse needs of the population, allowing decision makers to predict how service adjustments might impact neighbourhoods – for better or for worse.
              </p>
              <p className="text-slate-605 text-base leading-relaxed">
                Transit equity recognizes that equal service is not always equitable service. True equity requires directing resources where they will do the most to reduce mobility barriers for residents who rely on transit the most. While policy decisions will always involve subjective value judgments, this framework makes those trade-offs transparent, allowing decision makers to build equity directly into daily transit operations.
              </p>
            </div>
          </section>

          {/* ================= BOTTOM CALL TO ACTION (Section 11) ================= */}
          <section className="mt-12 pt-12 border-t-2 border-blue-600 flex flex-col items-center gap-6 text-center">
            <div className="max-w-2xl space-y-4">
              <h3 className="text-3xl font-black text-blue-900 leading-tight">Explore the Route Equity Scorecard Tool</h3>
              <p className="text-slate-600 text-base leading-relaxed">
                You can use the spotlight search to find specific routes, adjust weights with zero-sum pillar sliders, filter the map by grade badges or stability classifications, and analyse diagnostics using waterfall charts, pedestrian walk isochrones, and the interactive Dissemination Area vulnerability matrix.
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

      <DataExplorerModal 
        isOpen={showDataExplorer} 
        onClose={() => setShowDataExplorer(false)} 
        allRoutesData={allRoutesData}
        weights={weights} 
        sensitivityData={sensitivityData}
      />
    </div>
  );
};
