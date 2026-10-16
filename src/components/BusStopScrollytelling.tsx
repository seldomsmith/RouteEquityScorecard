"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Home, 
  Menu, 
  ArrowRight, 
  BookOpen, 
  LayoutDashboard, 
  AlertTriangle 
} from 'lucide-react';
import { GlobalNavMenu, PageView } from '@/components/widgets/GlobalNavMenu';
import { BusStopTicket } from '@/components/widgets/BusStopTicket';
import { CatchmentDonutCard } from '@/components/widgets/CatchmentDonutCard';
import { CimdExplainer } from '@/components/widgets/CimdExplainer';
import { BusStopGradeDistribution } from '@/components/widgets/BusStopGradeDistribution';
import { BusStopWaterfall } from '@/components/BusStopWaterfall';
import { BusStopSupplyDisparity } from '@/components/widgets/BusStopSupplyDisparity';
import { BusStopMonteCarloSimulation } from '@/components/widgets/BusStopMonteCarloSimulation';
import { BusStopStabilityScatter } from '@/components/charts/BusStopStabilityScatter';

const CHAPTERS = [
  { id: 'chapter-1', label: '1. Introduction' },
  { id: 'chapter-2', label: '2. 400m Walkshed' },
  { id: 'chapter-3', label: '3. Four Dimensions' },
  { id: 'chapter-4', label: '4. Area Overlap' },
  { id: 'chapter-5', label: '5. Quintile Grades' },
  { id: 'chapter-6', label: '6. Spatial Map' },
  { id: 'chapter-7', label: '7. Supply vs Need' },
  { id: 'chapter-8', label: '8. Stability Analysis' },
  { id: 'chapter-9', label: '9. Spatial Barriers' },
  { id: 'chapter-10', label: '10. Explore Stops' },
];

const BusStopToggleMap = dynamic(
  () => import('@/components/widgets/BusStopToggleMap').then((m) => m.BusStopToggleMap),
  { ssr: false }
);

interface BusStopScrollytellingProps {
  onNavigate: (page: PageView) => void;
}

export const BusStopScrollytelling: React.FC<BusStopScrollytellingProps> = ({ onNavigate }) => {
  const [isNavMenuOpen, setIsNavMenuOpen] = useState<boolean>(false);
  const [stopsData, setStopsData] = useState<any[]>([]);
  const [daGeoJson, setDaGeoJson] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(Math.max(scrollTop / maxScroll, 0), 1));
    }
  };

  const handleScrollToChapter = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Load stops and DA boundaries
  useEffect(() => {
    Promise.all([
      fetch('/data/bus_stop_vulnerability.json').then((res) => res.json()),
      fetch('/data/da_boundaries_simple.geojson').then((res) => res.json()).catch(() => null),
    ])
      .then(([vulnerabilityData, geoData]) => {
        if (vulnerabilityData && vulnerabilityData.stops) {
          setStopsData(vulnerabilityData.stops);
        }
        if (geoData) {
          setDaGeoJson(geoData);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load bus stop scrollytelling data:', err);
        setLoading(false);
      });
  }, []);

  // Archetypal candidate stops
  const stop6586 = stopsData.find((s) => s.stop_id === '6586') || {
    stop_id: '6586',
    stop_name: '121 Street & 145 Avenue',
    lat: 53.607214,
    lon: -113.529852,
    equal_score: 82.1,
    equal_percentile: 94.2,
    equal_grade: 'A',
    routes_served: ['103', '613'],
    daily_trips: 53,
    peak_trips_per_hour: 3.2,
    das: [
      { da_id: '48110274', pct: 27.5, equal_score: 80.0 },
      { da_id: '48110268', pct: 22.7, equal_score: 90.0 },
      { da_id: '48110270', pct: 21.2, equal_score: 75.0 },
      { da_id: '48110273', pct: 11.6, equal_score: 85.0 },
      { da_id: '48112802', pct: 10.9, equal_score: 80.0 },
      { da_id: '48111478', pct: 3.3, equal_score: 80.0 },
      { da_id: '48110269', pct: 2.9, equal_score: 90.0 },
    ],
  };

  const stop1745 = stopsData.find((s) => s.stop_id === '1745') || {
    stop_id: '1745',
    stop_name: '130 Street & 107 Avenue',
    lat: 53.550874,
    lon: -113.545777,
    equal_score: 43.2,
    equal_percentile: 4.1,
    equal_grade: 'E',
    routes_served: ['002', '007', '901'],
    daily_trips: 264,
    peak_trips_per_hour: 17.8,
    das: [
      { da_id: '48110180', pct: 32.9, equal_score: 25.0 },
      { da_id: '48110182', pct: 26.5, equal_score: 45.0 },
      { da_id: '48110181', pct: 16.5, equal_score: 60.0 },
      { da_id: '48111087', pct: 14.7, equal_score: 50.0 },
      { da_id: '48111090', pct: 3.4, equal_score: 65.0 },
      { da_id: '48110179', pct: 3.1, equal_score: 65.0 },
      { da_id: '48110178', pct: 1.3, equal_score: 70.0 },
      { da_id: '48111086', pct: 1.0, equal_score: 45.0 },
      { da_id: '48110183', pct: 0.7, equal_score: 45.0 },
    ],
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="h-screen w-full flex flex-col bg-[#fafbfc] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-y-auto custom-scrollbar scroll-smooth"
    >
      {/* Navigation Menu Modal */}
      <GlobalNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        onNavigate={onNavigate}
        activeItemIndex={4}
      />

      {/* 🚌 Fixed Scrollytelling Header with Subway Map Scroll Progress Tracker */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('landing')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200"
            title="Return to Home"
          >
            <Home className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsNavMenuOpen(true)}
            className="px-3 py-1.5 text-[10px] font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-all uppercase tracking-wider shadow-2xs flex items-center gap-1.5"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Menu</span>
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-black text-emerald-800 uppercase tracking-widest leading-none">
              ETS Bus Stop Equity Scorecard
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 leading-none mt-1">
              Scroll down to read
            </span>
          </div>
        </div>

        {/* Subway Map Progress Bar */}
        <div className="flex-1 max-w-xl mx-8 relative hidden md:block px-4">
          {/* Base track */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
          {/* Active progress track */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-emerald-600 -translate-y-1/2 rounded-full transition-all duration-75"
            style={{ width: `${scrollProgress * 100}%` }}
          />
          {/* Subway dots representing the 9 chapters */}
          <div className="relative flex justify-between items-center w-full">
            {CHAPTERS.map((chapter, idx, arr) => {
              const fraction = idx / (arr.length - 1);
              const isPassed = scrollProgress >= fraction - 0.02;

              return (
                <button
                  key={chapter.id}
                  type="button"
                  title={chapter.label}
                  className="group relative flex items-center justify-center focus:outline-none"
                  onClick={() => handleScrollToChapter(chapter.id)}
                >
                  {/* Outer glow ring on hover or active */}
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${
                    isPassed 
                      ? 'border-emerald-600 bg-white hover:bg-emerald-50 ring-2 ring-emerald-600/20' 
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}>
                    {/* Inner core dot */}
                    <span className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      isPassed ? 'bg-emerald-600' : 'bg-slate-300'
                    }`} />
                  </span>
                  
                  {/* Tooltip */}
                  <span className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    {chapter.label}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: View Scorecard button */}
        <button
          onClick={() => onNavigate('bus-stop-analysis')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm shadow-md transition-all duration-200 active:scale-95 whitespace-nowrap"
        >
          <span>View Scorecard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* 🚌 Full-Width Hero Container with Bus Stops Waterfall Background */}
      <div className="w-full relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-slate-50/25 to-slate-50 pt-20 pb-20 px-6 flex flex-col items-center justify-center text-center">
        {/* Animated BusStopWaterfall Background spanning the hero */}
        <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
          <BusStopWaterfall opacity={0.88} />
        </div>

        {/* Fade Mask Overlay to make lines fade to white/slate-50 seamlessly */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/40 to-slate-50 pointer-events-none z-[1]" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
          <h1 className="text-[38px] md:text-[50px] lg:text-[62px] font-black text-emerald-700 tracking-tight leading-tight uppercase scrolly-title-lift-effect cursor-default">
            ETS BUS STOP EQUITY <br className="hidden sm:inline" />
            SCORECARD
          </h1>
        </div>
      </div>

      {/* Main Narrative Sections Container */}
      <main className="max-w-4xl mx-auto px-6 py-10 pb-24 space-y-24">
        {/* ================= SECTION 1: Introduction ================= */}
        <section id="chapter-1" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-emerald-900 leading-tight">
              1. Introduction
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Network-level corridor metrics aggregate transit service across kilometres of roadway, but obscure local curb-level disparities. A single bus line often connects affluent neighbourhoods and marginalized communities on the same trip.
            </p>
            <p className="text-slate-600 text-base leading-relaxed">
              Evaluating equity at the individual stop focuses on the specific curb where passengers board. Riders experience transit service directly at the pole: waiting in sub-zero winter temperatures, navigating unplowed boarding pads, and connecting to feeder lines. Below, we document the empirical spatial calculations governing Edmonton's 6,755 municipal bus stops.
            </p>
            <p className="text-slate-600 text-base leading-relaxed font-medium">
              To evaluate how the scoring methodology functions across distinct urban contexts, compare two stops within the Edmonton Transit Service network:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <BusStopTicket
              stopId={stop6586.stop_id}
              theme="purple"
              stopName={stop6586.stop_name}
              grade={stop6586.equal_grade}
              score={stop6586.equal_score}
              percentile={stop6586.equal_percentile}
              dailyTrips={stop6586.daily_trips}
              peakTripsPerHour={stop6586.peak_trips_per_hour}
              routesServed={stop6586.routes_served}
              daCount={stop6586.das.length}
              stabilityClass="Essential Equity Bus Stop"
              stabilityMean={82.1}
              stabilityStd={9.1}
              tagline="High socio-demographic need in North Edmonton with modest bus service frequency (53 trips per day)."
            />

            <BusStopTicket
              stopId={stop1745.stop_id}
              theme="orange"
              stopName={stop1745.stop_name}
              grade={stop1745.equal_grade}
              score={stop1745.equal_score}
              percentile={stop1745.equal_percentile}
              dailyTrips={stop1745.daily_trips}
              peakTripsPerHour={stop1745.peak_trips_per_hour}
              routesServed={stop1745.routes_served}
              daCount={stop1745.das.length}
              stabilityClass="Always Low Equity Bus Stop"
              stabilityMean={43.3}
              stabilityStd={5.9}
              tagline="Low socio-demographic need along Westmount's 107th Avenue corridor, receiving five times more transit service (264 trips per day)."
            />
          </div>
        </section>

        {/* ================= SECTION 2: The 400m Catchment ================= */}
        <section id="chapter-2" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-emerald-900 leading-tight">
              2. The 400-Metre Walking Catchment
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              In urban transit planning, 400 metres serves as the standard planning benchmark for pedestrian access to local bus service. This corresponds to approximately a five-minute walk at 4.8 km/h.
            </p>
            <p className="text-slate-600 text-base leading-relaxed">
              Rather than assigning data solely from the land parcel touching the signpost, we calculate a 400-metre radial buffer around each bus stop in Edmonton. This circular catchment outlines the immediate population relying on that stop for transit access.
            </p>
          </div>
        </section>

        {/* ================= SECTION 3: Four Dimensions of Demographic Need ================= */}
        <section id="chapter-3" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-emerald-900 leading-tight">
              3. The Four Dimensions of Demographic Need
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Edmonton's bus stop scores are built on Statistics Canada's Canadian Index of Multiple Deprivation (CIMD). Each dimension captures a distinct facet of socio-economic vulnerability across census dissemination areas.
            </p>
          </div>
          <CimdExplainer />
        </section>

        {/* ================= SECTION 4: Proportional Area Weighting ================= */}
        <section id="chapter-4" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-emerald-900 leading-tight">
              4. Proportional Area Weighting: Dissemination Area Overlap
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              A single bus stop does not serve just one neat city block; people walk in from every direction.
            </p>
            <p className="text-slate-600 text-base leading-relaxed">
              Statistics Canada divides cities into small neighbourhood pockets called Dissemination Areas, each home to about 400 to 700 residents. When you draw a standard five-minute walk around any bus stop (a 400-metre circle), that circle rarely fits inside a single census zone. It almost always slices through three, five, or eight different neighbourhood blocks.
            </p>
            <p className="text-slate-600 text-base leading-relaxed">
              To score a stop fairly, we calculate the exact slice of each neighbourhood inside the circle. If half the circle covers an area with high economic need and the other half covers an affluent street, each neighbourhood gets an equal 50% say in the final score. No guesswork; just real local geography.
            </p>
          </div>

          {/* Side-by-Side Donut Cards (Recreating user's reference) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-purple-700 uppercase tracking-wider">
                High Need Case Study: Stop #6586
              </span>
              <CatchmentDonutCard
                stopId={stop6586.stop_id}
                stopName={stop6586.stop_name}
                score={stop6586.equal_score}
                percentile={stop6586.equal_percentile}
                grade={stop6586.equal_grade}
                das={stop6586.das}
                showCalculatedMath={true}
              />
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-orange-700 uppercase tracking-wider">
                Low Need Case Study: Stop #1745
              </span>
              <CatchmentDonutCard
                stopId={stop1745.stop_id}
                stopName={stop1745.stop_name}
                score={stop1745.equal_score}
                percentile={stop1745.equal_percentile}
                grade={stop1745.equal_grade}
                das={stop1745.das}
                showCalculatedMath={true}
              />
            </div>
          </div>
        </section>

        {/* ================= SECTION 5: The Quintile Grading Scale ================= */}
        <section id="chapter-5" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-emerald-900 leading-tight">
              5. The Quintile Grading Scale
            </h2>
          </div>
          <BusStopGradeDistribution />
        </section>

        {/* ================= SECTION 6: Spatial Distribution ================= */}
        <section id="chapter-6" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-emerald-900 leading-tight">
              6. Spatial Distribution: Comparative Catchment Geography
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Click either stop to fly directly to its 400-metre walking catchment, or toggle both stops on to compare their locations across Edmonton. Stop #6586 borders rental multi-family subdivisions in North Edmonton, whereas Stop #1745 serves single-family residential streets in Westmount:
            </p>
          </div>

          <BusStopToggleMap
            stopA={stop6586}
            stopB={stop1745}
            daGeoJson={daGeoJson}
          />
        </section>

        {/* ================= SECTION 7: Supply vs. Need ================= */}
        <section id="chapter-7" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-emerald-900 leading-tight">
              7. Supply vs. Need: Daily Trips Compared Against Demographic Need
            </h2>
          </div>
          <BusStopSupplyDisparity stopA={stop6586} stopB={stop1745} />
        </section>

        {/* ================= SECTION 8: Bus Stop Stability and Volatility ================= */}
        <section id="chapter-8" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-emerald-900 leading-tight">
              8. Bus Stop Stability and Volatility: Equity Sensitivity Analysis
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              As shown above, when the demographic indicator weighting changes, the grade assigned to some bus stops shifts dramatically while others remain stable. To better understand and model this dynamic, we ran a sensitivity simulation calculating stop scores across all 15 possible indicator toggle combinations. This allows us to understand which stops are important for the purposes of equity, no matter what weighting model we use. Use the simulation below to compare how the stability of Stop #6586 and Stop #2821 differ.
            </p>
            <p className="text-slate-700 text-base leading-relaxed font-bold">
              This simulation reveals four bus stop stability classifications:
            </p>
          </div>

          <BusStopMonteCarloSimulation />

          <div className="space-y-6 pt-2">
            <div className="flex flex-col gap-6 pl-2 py-2">
              {/* 1. Essential Equity Bus Stop */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span className="px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                    Essential Equity Bus Stop (Always High Equity)
                  </span>
                </div>
                <p className="text-slate-700 text-base leading-relaxed pl-3.5 font-medium">
                  These stops score highly across all demographic scenarios, maintaining ranking stability regardless of the active indicator configuration.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-purple-300 pl-4 ml-3.5 italic">
                  <strong className="text-purple-700">Stop #6586</strong> (121 Street & 145 Avenue) consistently receives a high bus stop equity score regardless of how the demographic model is weighted. This classification is due to Stop #6586 scoring exceptionally high on three of the four dimensions: Ethnocultural Composition (100.0), Situational Vulnerability (89.4), and Residential Instability (75.8). It serves a catchment with high concentrations of low-income families and immigrants who rely directly on local feeder lines. Across all 15 possible combinations, Stop #6586 receives Grade A in 12 configurations and Grade B in 3 configurations: 100% of combinations place it in high equity priority. Even if we minimize demographic weights and heavily favor Economic Deprivation (its lowest scoring dimension at 63.2), Stop #6586's scores across the other dimensions ensure it remains an Essential Equity Bus Stop.
                </p>
              </div>

              {/* 2. High Swing Bus Stop */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                    High Swing Bus Stop
                  </span>
                </div>
                <p className="text-slate-700 text-base leading-relaxed pl-3.5 font-medium">
                  Scores for stops in this category fluctuate wildly depending on indicator selections, making their funding priority highly sensitive to changing planning objectives.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-red-300 pl-4 ml-3.5 italic">
                  <strong className="text-red-700">Stop #2821</strong> (104 Street & 82 Avenue) is a High Swing Bus Stop because its score surges under a Residential Instability focus but collapses when we prioritize Economic Deprivation. Specifically, Stop #2821 serves a corridor along Whyte Avenue in Old Strathcona characterized by multi-family rental apartments and student tenants, scoring an absolute 100.0 in Residential Instability. However, because surrounding residents report higher average incomes, its Economic Deprivation score is just 20.0. When indicator weights shift from tenant concentration to income poverty, Stop #2821's score swings 80 points (from 20.0 to 100.0) across four letter grades from Grade A to Grade E, making its relative funding priority highly sensitive to the chosen weighting model.
                </p>
              </div>

              {/* 3. Low Swing Bus Stop */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    Low Swing Bus Stop
                  </span>
                </div>
                <p className="text-slate-700 text-base leading-relaxed pl-3.5 font-medium">
                  These stops maintain steady, mid-range scores across all scenarios and are not highly sensitive to indicator changes, representing stable baseline operations.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-amber-300 pl-4 ml-3.5 italic">
                  For example, <strong className="text-amber-700">Stop #5416</strong> (167 Street & 118 Avenue) does not feature extreme highs or absolute zeros in any single dimension. Under the simulation, its scores remain remarkably steady, maintaining an average score of 50.0 with a volatility of 0.0 across all 15 indicator combinations.
                </p>
              </div>

              {/* 4. Always Low Equity Bus Stop */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-200">
                    Always Low Equity Bus Stop
                  </span>
                </div>
                <p className="text-slate-700 text-base leading-relaxed pl-3.5 font-medium">
                  These stops consistently receive lower equity scores across all possible indicator combinations, typically running through affluent residential sectors.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-orange-300 pl-4 ml-3.5 italic">
                  <strong className="text-orange-700">Stop #1745</strong> (130 Street & 107 Avenue in Westmount) falls into this category, receiving Grade E in 12 configurations and Grade D in 2 configurations (93.3% low need rate), averaging a score of 43.3 out of 100.
                </p>
              </div>
            </div>

            <p className="text-slate-600 text-base leading-relaxed">
              Identifying these classifications for each stop helps transit planners identify which stops should receive permanent infrastructure investments (such as heated shelters, tactile boarding pads, and fast-track winter maintenance) and how policy changes may alter curbside priority.
            </p>
            <p className="text-slate-700 text-base leading-relaxed font-bold">
              There is no perfect mix of demographic weights; they all rely on subjective policy choices. But this analysis demonstrates which bus stops perform a high-equity service no matter how we weight them.
            </p>
          </div>

          {/* Interactive Sensitivity Scatter Plot */}
          <BusStopStabilityScatter />
        </section>

        {/* ================= SECTION 9: Spatial Constraints ================= */}
        <section id="chapter-9" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-emerald-900 leading-tight">
              9. Spatial Constraints: Physical Barriers and Aggregate Geography
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm text-slate-700">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Euclidean Circles vs. Physical Barriers</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                A 400m Euclidean radius draws a circle as the crow flies. In practice, arterial freeways (such as Yellowhead Trail), rail rights-of-way, and suburban cul-de-sacs cut off walking routes, making the effective walkshed smaller than the circle.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>The Ecological Fallacy</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Census measures report aggregate neighbourhood characteristics. An individual passenger boarding at a given stop may not share every demographic attribute of the surrounding area.
              </p>
            </div>
          </div>
        </section>

        {/* ================= SECTION 10: Call to Action & Explorer ================= */}
        <section id="chapter-10" className="pt-8 border-t border-slate-200 text-center space-y-6">
          <h2 className="text-3xl font-black text-emerald-900 leading-tight">
            10. Explore Edmonton's 6,755 Bus Stops
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed font-medium">
            Inspect stop grades across all neighbourhoods, test custom CIMD weighting criteria, and search any stop in the city.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('bus-stop-analysis')}
              className="px-6 py-3 rounded-xl bg-[#059669] hover:bg-[#152e6f] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Launch Bus Stop Dashboard (2.2)</span>
            </button>

            <button
              onClick={() => onNavigate('bus-stop-directory')}
              className="px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#059669]" />
              <span>Browse Bus Stop Directory (2.3)</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
