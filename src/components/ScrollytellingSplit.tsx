"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Home, ArrowRight, HelpCircle, AlertCircle, Percent, Maximize2, Minimize2 } from 'lucide-react';
import { RouteTicket } from './ui/RouteTicket';
import { ExplainerMap } from './widgets/ExplainerMap';
import { MonteCarloPlinko } from './widgets/MonteCarloPlinko';
import { OdtExplainerMap } from './widgets/OdtExplainerMap';
import { FourPillars } from './widgets/FourPillars';
import { InteractiveToggleMap } from './widgets/InteractiveToggleMap';
import { OffPeakFrequencyChart } from './widgets/OffPeakFrequencyChart';
import { CatchmentBarrierMap } from './widgets/CatchmentBarrierMap';
import { ShapWaterfall } from './charts/ShapWaterfall';
import { GroceryFlowViz } from './widgets/GroceryFlowViz';
import { DataExplorerModal } from './widgets/DataExplorerModal';

// Recharts components for Section 8 Scatter Chart
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ScrollytellingSplitProps {
  onBack: () => void;
  onJumpIn: () => void;
  scrollProgress: number;
  setScrollProgress: (val: number) => void;
  sensitivityData: any[];
  route2Data: any;
  route3Data: any;
  route727Data: any;
  allRoutesData: any[];
  odtGeoJson: any;
  daGeoJson: any;
  weights: { vulnerability: number; offPeak: number; monopoly: number; opportunity: number };
  handleWeightChange: (key: any, val: number) => void;
  activeSimulatorRouteId: '002' | '003';
  setActiveSimulatorRouteId: (val: '002' | '003') => void;
  showFullscreenScatterplot: boolean;
  setShowFullscreenScatterplot: (val: boolean) => void;
  showFullscreenSimulator: boolean;
  setShowFullscreenSimulator: (val: boolean) => void;
  isSplitScreen: boolean;
  setIsSplitScreen: (val: boolean) => void;
}

export const ScrollytellingSplit: React.FC<ScrollytellingSplitProps> = ({
  onBack,
  onJumpIn,
  scrollProgress,
  setScrollProgress,
  sensitivityData,
  route2Data,
  route3Data,
  route727Data,
  allRoutesData,
  odtGeoJson,
  daGeoJson,
  weights,
  handleWeightChange,
  activeSimulatorRouteId,
  setActiveSimulatorRouteId,
  showFullscreenScatterplot,
  setShowFullscreenScatterplot,
  showFullscreenSimulator,
  setShowFullscreenSimulator,
  isSplitScreen,
  setIsSplitScreen
}) => {
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('section-1');

  // Modals local states
  const [showVulnerabilityMath, setShowVulnerabilityMath] = useState(false);
  const [showOpportunityMath, setShowOpportunityMath] = useState(false);
  const [showOffPeakMath, setShowOffPeakMath] = useState(false);
  const [showMonopolyMath, setShowMonopolyMath] = useState(false);
  const [showDataExplorer, setShowDataExplorer] = useState(false);

  // IntersectionObserver to set active section based on left panel scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('split-', '');
            setActiveSection(id);
          }
        });
      },
      {
        root: leftPanelRef.current,
        rootMargin: '-30% 0px -40% 0px',
      }
    );

    const sections = leftPanelRef.current?.querySelectorAll('section');
    sections?.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, []);

  // Track left panel scroll for the Subway progress bar in the header
  useEffect(() => {
    const el = leftPanelRef.current;
    if (!el) return;

    const handleScroll = () => {
      const totalScroll = el.scrollHeight - el.clientHeight;
      if (totalScroll > 0) {
        setScrollProgress(el.scrollTop / totalScroll);
      }
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [setScrollProgress]);

  // Click-to-scroll handler for Subway dots
  const scrollToSection = (id: string) => {
    const target = leftPanelRef.current?.querySelector(`#split-${id}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Live Scores calculations
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

  // Helper to determine the dynamic CSS class of sections in left scroll panel
  const getSectionClass = (id: string) => {
    return `flex flex-col gap-6 py-12 border-b border-slate-100 last:border-0 transition-opacity duration-300 ${
      activeSection === id ? 'opacity-100' : 'opacity-40'
    }`;
  };

  // Stability Custom Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl p-4 text-xs w-64 text-slate-900 overflow-hidden relative">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <span className="font-extrabold text-sm text-blue-900">Route {data.route_id}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              data.stability_class === 'Essential Equity' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
              data.stability_class === 'High Swing' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
              data.stability_class === 'Moderate Swing' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
              'bg-slate-50 text-slate-500 border border-slate-100'
            }`}>
              {data.stability_class}
            </span>
          </div>
          <div className="space-y-1.5 font-medium text-slate-655">
            <div className="flex justify-between">
              <span>Mean Score:</span>
              <strong className="text-slate-800">{data.mean_score.toFixed(1)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Volatility (SD):</span>
              <strong className="text-slate-800">{data.volatility.toFixed(1)}</strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-screen w-full flex flex-col font-sans bg-slate-50 overflow-hidden relative">
      
      {/* Header */}
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
                onClick={() => setIsSplitScreen(!isSplitScreen)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isSplitScreen 
                    ? 'bg-blue-600 shadow-sm shadow-blue-500/50 scale-110 hover:bg-blue-700' 
                    : 'bg-slate-300 hover:bg-slate-400 hover:scale-110'
                }`}
                title="Toggle Split-Screen Layout"
              />
            </div>
          </div>
        </div>

        {/* Subway Map Progress Bar */}
        <div className="flex-1 max-w-xl mx-8 relative hidden md:block px-4">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 rounded-full transition-all duration-75"
            style={{ width: `${scrollProgress * 100}%` }}
          />

          <div className="relative flex justify-between w-full">
            {[
              { id: 'section-1', label: '1. Intro' },
              { id: 'section-2', label: '2. Pillars' },
              { id: 'section-3', label: '3. Vulnerability' },
              { id: 'section-4', label: '4. Opportunity' },
              { id: 'section-5', label: '5. Off-Peak' },
              { id: 'section-6', label: '6. Monopoly' },
              { id: 'section-odt', label: 'ODT' },
              { id: 'section-7', label: '7. Simulator' },
              { id: 'section-8', label: '8. Stability' },
              { id: 'section-9', label: '9. Misses' },
              { id: 'section-10', label: '10. Strategy' }
            ].map((section, idx, arr) => {
              const fraction = idx / (arr.length - 1);
              const isPassed = scrollProgress >= fraction - 0.02;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="group relative flex items-center justify-center -translate-y-1"
                  title={section.label}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-sm ${
                    isPassed 
                      ? 'bg-blue-600 border-blue-600 scale-110' 
                      : 'bg-white border-slate-350 hover:border-slate-500'
                  }`}>
                    {isActive && (
                      <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                    )}
                  </div>
                  <span className="absolute top-6 scale-0 group-hover:scale-100 transition-all duration-150 bg-slate-900/90 backdrop-blur-sm text-[10px] text-white px-2 py-1 rounded-md font-bold shadow-md whitespace-nowrap z-50">
                    {section.label}
                  </span>
                </button>
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

      {/* Main Split Screen Container */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative w-full h-[calc(100vh-64px)] pt-16">
        
        {/* LEFT COLUMN: Narrative flow */}
        <div 
          ref={leftPanelRef}
          className="w-full md:w-[42%] h-full overflow-y-auto scroll-smooth custom-scrollbar bg-white px-6 md:px-10 py-12 flex flex-col z-10 shadow-md relative"
        >
          
          {/* SECTION 1: Introduction */}
          <section id="split-section-1" className={getSectionClass('section-1')}>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-blue-900 leading-tight">1. The ETS Route Equity Score - Explained</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Transit services are not experienced equally. The Route Equity Scorecard measures how effectively each route serves riders, specifically those in equity-seeking communities. When developing a transit network that meets the needs of Edmonton residents, planners must identify which routes provide essential service to equity-seeking communities.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                For this explanation, we compare two primary routes:
              </p>
              
              <div className="flex flex-col gap-3 py-2">
                <RouteTicket 
                  routeNumber="002" 
                  theme="blue" 
                  title="Route 002: Downtown - Capilano" 
                  description="A long, high-frequency line crossing the city to link outer neighbourhoods."
                />
                <RouteTicket 
                  routeNumber="003" 
                  theme="yellow" 
                  title="Route 003: Westmount - Stadium" 
                  description="A shorter connection route linking central hubs."
                />
              </div>

              <p className="text-slate-600 text-xs leading-relaxed italic border-l-2 border-slate-200 pl-3">
                Look at the map on the right to see their physical layouts and the Dissemination Areas they intersect.
              </p>
            </div>
          </section>

          {/* SECTION 2: Four Pillars */}
          <section id="split-section-2" className={getSectionClass('section-2')}>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-blue-900 leading-tight">2. The Four Pillars of Transit Equity</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                There are four key metrics that determine the route equity score of any particular route:
              </p>
              <ul className="list-disc pl-5 text-slate-655 text-xs font-semibold space-y-2 leading-relaxed">
                <li><strong>Transit Vulnerability:</strong> Demographic need based on low-income, senior, youth, single-parent, and visible minority populations.</li>
                <li><strong>Destination Opportunity:</strong> Direct walking-distance access to hospitals, schools, employment, and groceries.</li>
                <li><strong>Off-Peak Service:</strong> Frequency and consistency of night and weekend routes.</li>
                <li><strong>Transit Monopoly:</strong> Reliance on a single route with no nearby walking-distance alternatives.</li>
              </ul>
              <p className="text-slate-600 text-sm leading-relaxed">
                Review the interactive card grid on the right to inspect details for each pillar.
              </p>
            </div>
          </section>

          {/* SECTION 3: Vulnerability */}
          <section id="split-section-3" className={getSectionClass('section-3')}>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-blue-900 leading-tight">3. Transit Vulnerability</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Demographics shape local need. The Transit Vulnerability pillar tracks the concentration of socio-demographic risk groups served by each route.
              </p>
              
              <div className="flex flex-col gap-3 py-2">
                <RouteTicket 
                  routeNumber="002" 
                  theme="blue" 
                  title="Route 002: High Vulnerability (Score: 80.8)" 
                  description="Route 002 serves high-vulnerability pockets in East Edmonton with many low-income residents and recent immigrants."
                />
                <RouteTicket 
                  routeNumber="003" 
                  theme="yellow" 
                  title="Route 003: Low Vulnerability (Score: 17.5)" 
                  description="Route 003 routes through central residential areas with higher average household incomes."
                />
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setShowVulnerabilityMath(!showVulnerabilityMath)}
                  className="px-4 py-2 rounded-xl border border-blue-900/20 text-blue-900 bg-white hover:bg-blue-50/50 font-bold text-xs transition-all duration-200 shadow-sm active:scale-98"
                >
                  {showVulnerabilityMath ? "Hide Detailed Math" : "Tell me more about the math"}
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 4: Opportunity */}
          <section id="split-section-4" className={getSectionClass('section-4')}>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-blue-900 leading-tight">4. Destination Opportunity</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Buses exist to connect people to jobs, groceries, and essential services. This pillar maps how many POIs are accessible within a 400m walk of each bus stop.
              </p>
              
              <div className="flex flex-col gap-3 py-2">
                <RouteTicket 
                  routeNumber="002" 
                  theme="blue" 
                  title="Route 002: Diverse Access Link (Score: 92.7)" 
                  description="Connects residents directly to Downtown office complexes, secondary schools, grocery stores, and medical clinics."
                />
                <RouteTicket 
                  routeNumber="003" 
                  theme="yellow" 
                  title="Route 003: Local Hub Connection (Score: 18.9)" 
                  description="Primarily serves quieter interior neighborhoods with low point-of-interest density."
                />
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setShowOpportunityMath(!showOpportunityMath)}
                  className="px-4 py-2 rounded-xl border border-blue-900/20 text-blue-900 bg-white hover:bg-blue-50/50 font-bold text-xs transition-all duration-200 shadow-sm active:scale-98"
                >
                  {showOpportunityMath ? "Hide Detailed Math" : "Tell me more about the math"}
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 5: Off Peak Service */}
          <section id="split-section-5" className={getSectionClass('section-5')}>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-blue-900 leading-tight">5. Off Peak Service</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Transit must support night-shift workers, weekend errands, and off-hour medical needs. We measure off-peak frequency against peak hour service.
              </p>
              
              <div className="flex flex-col gap-3 py-2">
                <RouteTicket 
                  routeNumber="002" 
                  theme="blue" 
                  title="Route 002: Reduced Night Hours (Score: 31.3)" 
                  description="Operates frequently during weekdays, but service frequency drops substantially during evening and weekend schedules."
                />
                <RouteTicket 
                  routeNumber="003" 
                  theme="yellow" 
                  title="Route 003: Consistent Off Peak (Score: 38.0)" 
                  description="Maintains stable, consistent service loops through late-night hours and weekends."
                />
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setShowOffPeakMath(!showOffPeakMath)}
                  className="px-4 py-2 rounded-xl border border-blue-900/20 text-blue-900 bg-white hover:bg-blue-50/50 font-bold text-xs transition-all duration-200 shadow-sm active:scale-98"
                >
                  {showOffPeakMath ? "Hide Detailed Math" : "Tell me more about the math"}
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 6: Transit Monopoly */}
          <section id="split-section-6" className={getSectionClass('section-6')}>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-blue-900 leading-tight">6. Transit Monopoly</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                If a route is canceled, can riders walk to another? The Functional Monopoly Index identifies neighborhoods reliant on a single bus route.
              </p>
              
              <div className="flex flex-col gap-3 py-2">
                <RouteTicket 
                  routeNumber="002" 
                  theme="blue" 
                  title="Route 002: High Monopoly (Score: 67.6)" 
                  description="Serves several eastern neighborhoods where no other alternative transit stops exist within 400m."
                />
                <RouteTicket 
                  routeNumber="003" 
                  theme="yellow" 
                  title="Route 003: Low Monopoly (Score: 0.0)" 
                  description="Overlaps with multiple overlapping downtown bus networks and central LRT stations."
                />
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setShowMonopolyMath(!showMonopolyMath)}
                  className="px-4 py-2 rounded-xl border border-blue-900/20 text-blue-900 bg-white hover:bg-blue-50/50 font-bold text-xs transition-all duration-200 shadow-sm active:scale-98"
                >
                  {showMonopolyMath ? "Hide Detailed Math" : "Tell me more about the math"}
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 6.5: ODT */}
          <section id="split-section-odt" className={getSectionClass('section-odt')}>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-blue-900 leading-tight">On Demand Transit (ODT)</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                On-Demand zones bridge areas lacking fixed lines. The scorecard integrates ODT by reducing Vulnerability Scores (-10%) and Transit Monopoly index (-50%) for DAs within service zones, reflecting improved mobility.
              </p>
              <p className="text-slate-600 text-xs leading-relaxed italic">
                Inspect the ODT buffer zone and Route 727 overlay on the right map.
              </p>
            </div>
          </section>

          {/* SECTION 7: Pillar Weights Simulator */}
          <section id="split-section-7" className={getSectionClass('section-7')}>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-blue-900 leading-tight">7. Balancing the Different Pillar Weights</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                After evaluating the four pillars, we are able to combine them to generate an overall equity score for each route; however, the weighting of the four pillars can impact the final score of the route. Each score is out of 100 and the routes are sorted into quintiles with a grade assigned, A through E with A being the highest scoring routes (most important for equity) and E for the lowest scoring routes (least important for equity).
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Under a balanced weighting, with equal weighting of 25% across all four pillars:
              </p>
              <ul className="text-xs text-slate-600 leading-relaxed mt-2 space-y-2 list-disc pl-5">
                <li>
                  Route 002 receives a score of 68.1 or a B grade as it has high scores from the vulnerability, monopoly, and destination opportunity categories. This makes it a high scoring route and highly important for transit equity.
                </li>
                <li>
                  Route 003 receives a score of 18.6 or an E grade. This low score is attributed to the higher-income neighbourhoods it serves and overlaps with alternative transit options (low monopoly score).
                </li>
              </ul>
              <p className="text-slate-600 text-sm leading-relaxed">
                When a user adjusts the weighting of the categories, these scores adjust accordingly. For example, if a new policy prioritizes scheduling by allocating 40% of the weight to Off-Peak Service, 35% to Destination Opportunity, 15% to Transit Vulnerability, and 10% to Transit Monopoly, the final scores change:
              </p>
              <ul className="text-xs text-slate-600 leading-relaxed mt-2 space-y-2 list-disc pl-5">
                <li>
                  Route 002 decreases from 68.1 to 63.8: Although its vulnerability score is nearly halved, the route maintains a strong B grade because it connects a high volume of riders to essential jobs and services, keeping its Destination Opportunity score at 92.7.
                </li>
                <li>
                  Route 003 increases from 18.6 to 24.4: Because the Off-Peak Service weight increases to 40%, Route 003 benefits from its reliable evening and weekend schedule, which scores 38.0. This scheduling strength helps offset its low scores in transit monopoly and demographic vulnerability.
                </li>
              </ul>
              <p className="text-slate-600 text-xs leading-relaxed mt-4 bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-inner">
                Use the pillar weight simulator below to show how weighting the different pillars can impact the final scoring of Route 002 and Route 003.
                <br /><br />
                <strong>Note on Scoring (A–E):</strong> Routes are graded on a curve by dividing the network into five equal groups (quintiles). Because this is a relative ranking, a route's final letter grade depends not only on its own raw score but on how it compares to the rest of the network. As you adjust the pillar weights, a route might shift into a higher or lower grade simply because the priorities of the overall network have changed.
              </p>

              {/* Policy Weight Sliders inside the Left Column */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                {[
                  { key: 'vulnerability', label: 'Transit Vulnerability', color: 'bg-rose-500' },
                  { key: 'opportunity', label: 'Destination Opportunity', color: 'bg-indigo-600' },
                  { key: 'offPeak', label: 'Off-Peak Service', color: 'bg-emerald-500' },
                  { key: 'monopoly', label: 'Transit Monopoly', color: 'bg-amber-500' }
                ].map((slider) => (
                  <div key={slider.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{slider.label}</span>
                      <span>{weights[slider.key as keyof typeof weights]}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={weights[slider.key as keyof typeof weights]}
                        onChange={(e) => handleWeightChange(slider.key as any, parseInt(e.target.value) || 0)}
                        className="flex-grow h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-blue-600"
                      />
                      <div className={`w-3 h-3 rounded-full ${slider.color}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Scores Dashboard */}
              <div className="grid grid-cols-2 gap-3 py-2 text-center">
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-blue-700">Route 002</span>
                  <div className="text-2xl font-black text-blue-900 mt-1">{liveScores.route2.toFixed(1)}</div>
                </div>
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-amber-700">Route 003</span>
                  <div className="text-2xl font-black text-amber-900 mt-1">{liveScores.route3.toFixed(1)}</div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => setShowDataExplorer(true)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
                >
                  View Full Network Directory
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 8: Route Stability */}
          <section id="split-section-8" className={getSectionClass('section-8')}>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-blue-900 leading-tight">8. Route Stability & Volatility</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                By running a 1,000-run Monte Carlo simulation shifting weights, we identify stability profiles:
              </p>
              <ul className="list-disc pl-5 text-slate-655 text-xs font-semibold space-y-2 leading-relaxed">
                <li><strong>Essential Equity:</strong> Remains high-priority regardless of configuration (e.g. Route 002).</li>
                <li><strong>High Swing:</strong> Sensitive to off-peak/weekend adjustments (e.g. Route 003).</li>
                <li><strong>Moderate Swing:</strong> Steady mid-range scores.</li>
                <li><strong>Low Equity:</strong> Consistently low scores.</li>
              </ul>
              <p className="text-slate-600 text-xs leading-relaxed italic border-l-2 border-slate-200 pl-3">
                Watch the organic simulation distribution and inspect the Policy Risk Map scatter plot on the right.
              </p>
            </div>
          </section>

          {/* SECTION 9: Limitations */}
          <section id="split-section-9" className={getSectionClass('section-9')}>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-blue-900 leading-tight">9. What the Scorecard Misses</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Mathematical modeling has core structural limits:
              </p>
              <ol className="list-decimal pl-5 text-slate-655 text-xs font-semibold space-y-2 leading-relaxed">
                <li><strong>Ecological Fallacy:</strong> DA-level aggregations hide micro-level resident variations.</li>
                <li><strong>Static Schedules:</strong> GTFS data ignores real-world delays, road work, and vehicle cancellations.</li>
                <li><strong>Physical Barriers:</strong> Straight buffers ignore real-world walking blockages (e.g. river valleys, train tracks).</li>
                <li><strong>Destination Quality:</strong> Counting POIs fails to account for cost, capacity, and service levels.</li>
              </ol>
            </div>
          </section>

          {/* SECTION 10: Applying the Scorecard */}
          <section id="split-section-10" className={getSectionClass('section-10')}>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-blue-900 leading-tight">10. Applying the Scorecard to Planning Decisions</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                The scorecards serve as an analytical lens for planners. Transit equity is not just about equal service distribution, but directing infrastructure to systematically dismantle accessibility barriers.
              </p>
              <div className="pt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onJumpIn}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all duration-200"
                >
                  Explore the Command Center
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onBack}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 shadow-sm"
                >
                  Back to Welcome Screen
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT PANEL: Sticky visualizations (desktops only) */}
        <div className="hidden md:block w-full md:w-[58%] h-full relative bg-slate-100 border-l border-slate-200 overflow-hidden">
          
          {/* Section 1 visual: ExplainerMap compare */}
          <div className={`absolute inset-0 p-8 flex flex-col justify-center gap-6 transition-all duration-500 ${
            activeSection === 'section-1' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
          }`}>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4 h-[75vh]">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">Edmonton Network Context</span>
              <div className="flex gap-4 flex-1 h-full">
                <div className="w-1/2 flex flex-col gap-2 relative h-full">
                  <span className="text-[10px] font-bold text-slate-500">Route 002 Geometry</span>
                  <div className="flex-grow rounded-2xl overflow-hidden border border-slate-200 relative h-full">
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
                </div>
                <div className="w-1/2 flex flex-col gap-2 relative h-full">
                  <span className="text-[10px] font-bold text-slate-500">Route 003 Geometry</span>
                  <div className="flex-grow rounded-2xl overflow-hidden border border-slate-200 relative h-full">
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
              </div>
            </div>
          </div>

          {/* Section 2 visual: Four Pillars cards */}
          <div className={`absolute inset-0 p-8 flex items-center justify-center transition-all duration-500 ${
            activeSection === 'section-2' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
          }`}>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full max-w-2xl">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block mb-4">The Metric Framework</span>
              <FourPillars />
            </div>
          </div>

          {/* Section 3 visual: Vulnerability toggle map */}
          <div className={`absolute inset-0 p-8 flex items-center justify-center transition-all duration-500 ${
            activeSection === 'section-3' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
          }`}>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full h-[75vh] flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">Demographic Priority Overlays</span>
              <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 relative">
                {route2Data && route3Data && daGeoJson && (
                  <InteractiveToggleMap 
                    route2Data={route2Data} 
                    route3Data={route3Data} 
                    daGeoJson={daGeoJson} 
                    allRoutesData={allRoutesData} 
                    mode="vulnerability" 
                  />
                )}
              </div>
              <span className="text-[10px] font-semibold text-slate-400 italic text-center">Highlighted tracts show Edmonton's high-vulnerability Dissemination Areas (DAs).</span>
            </div>
          </div>

          {/* Section 4 visual: Opportunity toggle map */}
          <div className={`absolute inset-0 p-8 flex items-center justify-center transition-all duration-500 ${
            activeSection === 'section-4' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
          }`}>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full h-[75vh] flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">Destination Access Network</span>
              <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 relative">
                {route2Data && route3Data && daGeoJson && (
                  <InteractiveToggleMap 
                    route2Data={route2Data} 
                    route3Data={route3Data} 
                    daGeoJson={daGeoJson} 
                    allRoutesData={allRoutesData} 
                    mode="opportunity" 
                  />
                )}
              </div>
              <span className="text-[10px] font-semibold text-slate-400 italic text-center">Points of Interest index map showing medical, educational, and commercial facilities.</span>
            </div>
          </div>

          {/* Section 5 visual: Off Peak Line Chart */}
          <div className={`absolute inset-0 p-8 flex items-center justify-center transition-all duration-500 ${
            activeSection === 'section-5' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
          }`}>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full max-w-2xl flex flex-col gap-4">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">Service frequency profile</span>
              <div className="w-full h-[320px] bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <OffPeakFrequencyChart />
              </div>
            </div>
          </div>

          {/* Section 6 visual: Monopoly Index Map */}
          <div className={`absolute inset-0 p-8 flex items-center justify-center transition-all duration-500 ${
            activeSection === 'section-6' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
          }`}>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full h-[75vh] flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">Functional Monopoly Index</span>
              <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 relative">
                {route2Data && route3Data && daGeoJson && (
                  <InteractiveToggleMap 
                    route2Data={route2Data} 
                    route3Data={route3Data} 
                    daGeoJson={daGeoJson} 
                    allRoutesData={allRoutesData} 
                    mode="monopoly" 
                  />
                )}
              </div>
              <span className="text-[10px] font-semibold text-slate-400 italic text-center">Deep colored tracts highlight neighborhoods dependent on a single route.</span>
            </div>
          </div>

          {/* Section ODT visual: Odt map */}
          <div className={`absolute inset-0 p-8 flex items-center justify-center transition-all duration-500 ${
            activeSection === 'section-odt' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
          }`}>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full h-[75vh] flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">On Demand Service Zones</span>
              <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 relative">
                {odtGeoJson && route727Data && (
                  <OdtExplainerMap odtGeoJson={odtGeoJson} routeData={route727Data} />
                )}
              </div>
              <span className="text-[10px] font-semibold text-slate-400 italic text-center">Active ODT service area showing discount boundary zones.</span>
            </div>
          </div>

          {/* Section 7 visual: ShapWaterfall */}
          <div className={`absolute inset-0 p-8 flex items-center justify-center transition-all duration-500 ${
            activeSection === 'section-7' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
          }`}>
            <div className={`bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-3 ${showFullscreenSimulator ? 'fixed inset-4 z-[90]' : 'w-full max-w-2xl h-[75vh]'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">SHAP Waterfall Analysis</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveSimulatorRouteId('002')}
                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all duration-200 border ${activeSimulatorRouteId === '002' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    Route 002
                  </button>
                  <button 
                    onClick={() => setActiveSimulatorRouteId('003')}
                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all duration-200 border ${activeSimulatorRouteId === '003' ? 'bg-amber-50 border-amber-50 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    Route 003
                  </button>
                  <button 
                    onClick={() => setShowFullscreenSimulator(!showFullscreenSimulator)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    {showFullscreenSimulator ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex-grow relative border border-slate-100 rounded-2xl bg-slate-50/50 p-4">
                <ShapWaterfall activeRouteId={activeSimulatorRouteId} weights={weights} />
              </div>
            </div>
          </div>

          {/* Section 8 visual: MonteCarloPlinko & Scatterplot */}
          <div className={`absolute inset-0 p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar transition-all duration-500 ${
            activeSection === 'section-8' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
          }`}>
            {/* Plinko curve grow chart */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-3 min-h-[350px]">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">Weight Distribution Simulation</span>
              <div className="flex-1">
                <MonteCarloPlinko />
              </div>
            </div>

            {/* Scatterplot */}
            <div className={`bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-3 ${
              showFullscreenScatterplot ? 'fixed inset-4 z-[90] min-h-0' : 'min-h-[480px]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">Risk Map: Mean Score vs Volatility</span>
                <button
                  onClick={() => setShowFullscreenScatterplot(!showFullscreenScatterplot)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  {showFullscreenScatterplot ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="flex-1 w-full min-h-[300px]">
                {sensitivityData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        type="number" 
                        dataKey="volatility" 
                        name="Volatility" 
                        unit="" 
                        domain={[0, 15]}
                        label={{ value: 'Volatility (Standard Deviation)', position: 'insideBottom', offset: -10, fontStyle: 'normal', fontWeight: 'bold', fontSize: 10, fill: '#64748b' }}
                        tick={{ fontSize: 9, fill: '#64748b' }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="mean_score" 
                        name="Mean Score" 
                        domain={[0, 100]}
                        label={{ value: 'Mean Composite Score', angle: -90, position: 'insideLeft', offset: 0, fontStyle: 'normal', fontWeight: 'bold', fontSize: 10, fill: '#64748b' }}
                        tick={{ fontSize: 9, fill: '#64748b' }}
                      />
                      <ChartTooltip content={<CustomChartTooltip />} />
                      
                      <Scatter name="Routes" data={sensitivityData.filter(d => d.route_id !== '002' && d.route_id !== '003')}>
                        {sensitivityData.filter(d => d.route_id !== '002' && d.route_id !== '003').map((entry, index) => {
                          let color = '#94a3b8'; // default
                          if (entry.stability_class === 'Essential Equity') color = '#3b82f6';
                          else if (entry.stability_class === 'High Swing') color = '#f59e0b';
                          else if (entry.stability_class === 'Moderate Swing') color = '#10b981';
                          
                          return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.6} r={4.5} />;
                        })}
                      </Scatter>

                      <Scatter name="Route 002" data={sensitivityData.filter(d => d.route_id === '002')}>
                        <Cell fill="#3b82f6" r={8} stroke="#ffffff" strokeWidth={2} />
                      </Scatter>
                      <Scatter name="Route 003" data={sensitivityData.filter(d => d.route_id === '003')}>
                        <Cell fill="#f59e0b" r={8} stroke="#ffffff" strokeWidth={2} />
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Section 9 visual: Limitations visual column */}
          <div className={`absolute inset-0 p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar transition-all duration-500 ${
            activeSection === 'section-9' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
          }`}>
            {/* Ecological Fallacy Ring */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">1. Ecological Fallacy Demo</span>
              <div className="flex flex-col md:flex-row gap-6 justify-center items-center py-2">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                    <circle cx="56" cy="56" r="48" stroke="#3b82f6" strokeWidth="8" fill="transparent" strokeDasharray="301.6" strokeDashoffset="60.3" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-slate-900">80.0</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Zone Avg</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 flex-1 justify-center">
                  {['DA 01: 95.0', 'DA 02: 85.0', 'DA 03: 40.0', 'DA 04: 100.0'].map((da, i) => (
                    <div key={i} className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-655">
                      {da}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GTFS Comparison */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">2. Scheduled vs. Real-World Tracking</span>
              <div className="space-y-3 font-semibold text-xs py-1">
                <div className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                  <span className="text-emerald-800">GTFS Schedule</span>
                  <span className="font-mono text-emerald-600 bg-white px-2 py-0.5 rounded border border-emerald-100">08:00 AM (On Time)</span>
                </div>
                <div className="flex justify-between items-center bg-rose-50/50 border border-rose-100 rounded-xl p-3">
                  <span className="text-rose-800">Real-World Tracking (AVL)</span>
                  <span className="font-mono text-rose-600 bg-white px-2 py-0.5 rounded border border-rose-100">08:14 AM (14m Drift)</span>
                </div>
              </div>
            </div>

            {/* Maps row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm h-[240px] flex flex-col gap-2 relative">
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">3. Walk Isochrone Barriers</span>
                <div className="flex-1 rounded-xl overflow-hidden border border-slate-100 relative">
                  <CatchmentBarrierMap />
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm h-[240px] flex flex-col gap-2 relative">
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">4. Grocery Supply Flow</span>
                <div className="flex-1 rounded-xl overflow-hidden border border-slate-100 relative">
                  <GroceryFlowViz />
                </div>
              </div>
            </div>
          </div>

          {/* Section 10 visual: Final network summary visual */}
          <div className={`absolute inset-0 p-8 flex items-center justify-center transition-all duration-500 ${
            activeSection === 'section-10' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
          }`}>
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm max-w-md text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Percent className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">ETS Route Equity Scorecard OS</h3>
              <p className="text-slate-655 text-xs font-semibold leading-relaxed">
                Click "View Scorecard" in the top-right to enter the dynamic data explorer and run deep analytical queries against all 170 active routes.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* DETAILED METHODOLOGY MODALS */}

      {/* 3. Vulnerability detailed math */}
      {showVulnerabilityMath && (
        <div 
          onClick={() => setShowVulnerabilityMath(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl h-[85vh] bg-slate-100 border border-slate-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden cursor-default"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <button
                onClick={() => setShowVulnerabilityMath(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all duration-150"
              >
                <span className="font-extrabold text-sm">✕</span>
              </button>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Methodology Details</span>
              <div className="w-8 h-8 opacity-0" />
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar text-sm text-slate-600 leading-relaxed">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-2xl font-black text-slate-900 leading-tight">Vulnerability Methodology: Additive Scoring</h3>
                <p className="text-xs text-slate-500 mt-1">How demographic profiles along a route generate the final score.</p>
              </div>
              <p>
                The Transit Vulnerability index is calculated at the Dissemination Area (DA) level. Each DA starts with a base score of 0. For each of the five core socio-demographic risk groups, we check if the DA falls within the top 20% (quintile 5) network-wide:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-2">
                {[
                  { label: 'Low Income', desc: 'Worst 20%', val: '+1.0' },
                  { label: 'Seniors (65+)', desc: 'Worst 20%', val: '+1.0' },
                  { label: 'Youth (<18)', desc: 'Worst 20%', val: '+1.0' },
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
              <p>
                A DA's vulnerability score ranges from <strong>0.0 to 5.0</strong>. The route's overall score is calculated by taking the average of these vulnerability scores across all neighborhoods it serves, weighted by each neighborhood's population. This population-weighted average is then converted to a scale of 0 to 100 relative to all other bus routes in the city, ensuring that routes serving larger numbers of vulnerable residents score higher.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Opportunity detailed math */}
      {showOpportunityMath && (
        <div 
          onClick={() => setShowOpportunityMath(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl h-[85vh] bg-slate-100 border border-slate-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden cursor-default"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <button
                onClick={() => setShowOpportunityMath(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all duration-150"
              >
                <span className="font-extrabold text-sm">✕</span>
              </button>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Methodology Details</span>
              <div className="w-8 h-8 opacity-0" />
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar text-sm text-slate-600 leading-relaxed">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-2xl font-black text-slate-900 leading-tight">Destination Opportunity Methodology: Spatial POIs</h3>
                <p className="text-xs text-slate-500 mt-1">Weighted proximity checks for key municipal resources.</p>
              </div>
              <p>
                Opportunity scores evaluate the proximity of a route's bus stops to various points of interest. A route's stops are buffered by 400 meters (walking distance) and analyzed for overlapping POI categories. The scores are weighted based on essential priority values:
              </p>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-bold text-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs uppercase">POI Category</th>
                      <th className="px-6 py-3 text-left text-xs uppercase">Point Value</th>
                      <th className="px-6 py-3 text-left text-xs uppercase">Policy Alignment Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-semibold text-slate-655 text-xs">
                    <tr>
                      <td className="px-6 py-4">Hospitals & Health Centers</td>
                      <td className="px-6 py-4 text-indigo-650 font-black">30 pts</td>
                      <td className="px-6 py-4">Critical emergency healthcare access for transit-dependent riders.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">Major Employment Centres</td>
                      <td className="px-6 py-4 text-indigo-650 font-black">25 pts</td>
                      <td className="px-6 py-4">Direct connections to key employment zones (e.g. Downtown, Industrial parks).</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">Post-Secondary Schools</td>
                      <td className="px-6 py-4 text-indigo-650 font-black">15 pts</td>
                      <td className="px-6 py-4">Access to universities (UofA, MacEwan, NAIT) for youth opportunities.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">Grocery Stores</td>
                      <td className="px-6 py-4 text-indigo-650 font-black">15 pts</td>
                      <td className="px-6 py-4">Preventing food deserts by linking residents to supermarkets.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">Primary/Secondary Schools</td>
                      <td className="px-6 py-4 text-indigo-650 font-black">10 pts</td>
                      <td className="px-6 py-4">Basic educational access for families.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">Rec Centres & Libraries</td>
                      <td className="px-6 py-4 text-indigo-650 font-black">5 pts</td>
                      <td className="px-6 py-4">Community engagement, free internet, and municipal services.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Off-Peak detailed math */}
      {showOffPeakMath && (
        <div 
          onClick={() => setShowOffPeakMath(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl h-[85vh] bg-slate-100 border border-slate-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden cursor-default"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <button
                onClick={() => setShowOffPeakMath(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all duration-150"
              >
                <span className="font-extrabold text-sm">✕</span>
              </button>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Methodology Details</span>
              <div className="w-8 h-8 opacity-0" />
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar text-sm text-slate-600 leading-relaxed">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-2xl font-black text-slate-900 leading-tight">Off-Peak Service Methodology: Frequency Retention</h3>
                <p className="text-xs text-slate-500 mt-1">Measuring the availability of off-peak hours compared to peak morning service.</p>
              </div>
              <p>
                Off-peak consistency measures how well a route retains its service frequency outside normal 9-to-5 working shifts. The calculation compares the average headway (minutes between buses) during peak morning hours (07:00 AM - 09:00 AM) to the average headway during off-peak windows (evenings, nights, Saturdays, Sundays).
              </p>
              <p>
                The retention ratio is converted into points:
              </p>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 font-semibold text-slate-655 text-xs">
                <div className="flex justify-between">
                  <span>Headway Retention &gt; 80%</span>
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">100 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Headway Retention 60% - 80%</span>
                  <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded">75 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Headway Retention 40% - 60%</span>
                  <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded">50 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Headway Retention &lt; 40%</span>
                  <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">15 pts</span>
                </div>
              </div>
              <p>
                This ensures that routes maintaining regular frequencies on weekends and late nights score significantly higher than routes that exist purely as weekday-commute collectors.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. Monopoly detailed math */}
      {showMonopolyMath && (
        <div 
          onClick={() => setShowMonopolyMath(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl h-[85vh] bg-slate-100 border border-slate-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden cursor-default"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <button
                onClick={() => setShowMonopolyMath(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all duration-150"
              >
                <span className="font-extrabold text-sm">✕</span>
              </button>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Methodology Details</span>
              <div className="w-8 h-8 opacity-0" />
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar text-sm text-slate-600 leading-relaxed">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-2xl font-black text-slate-900 leading-tight">Transit Monopoly Methodology: FMI Formulation</h3>
                <p className="text-xs text-slate-500 mt-1">Understanding reliance through the Functional Monopoly Index.</p>
              </div>
              <p>
                The Functional Monopoly Index (FMI) is formulated to identify routes serving captive transit riders. For each Dissemination Area (DA) intersecting a route's 400m catchment buffer, we calculate:
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-[11px] text-indigo-950 overflow-x-auto">
                {"FMI_DA = (Served_Stops_On_Route / Total_Stops_In_DA) * (1 / (1 + Alternative_Routes_Within_400m))"}
              </div>
              <p>
                If a DA's only transit options are stops on the route in question, FMI approaches 1.0 (indicating absolute reliance). If multiple alternative routes traverse the area, FMI falls toward 0.0. The route score is the population-weighted average of all intersecting DA FMI scores, normalized network-wide.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FULL NETWORK EXPLORER MODAL */}
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
