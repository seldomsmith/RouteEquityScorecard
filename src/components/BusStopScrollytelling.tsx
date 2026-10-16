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

const CHAPTERS = [
  { id: 'chapter-1', label: '1. Two Stops' },
  { id: 'chapter-2', label: '2. 400m Walkshed' },
  { id: 'chapter-3', label: '3. Four Dimensions' },
  { id: 'chapter-4', label: '4. Area Overlap' },
  { id: 'chapter-5', label: '5. Quintile Grades' },
  { id: 'chapter-6', label: '6. Spatial Map' },
  { id: 'chapter-7', label: '7. Supply vs Need' },
  { id: 'chapter-8', label: '8. Spatial Barriers' },
  { id: 'chapter-9', label: '9. Explore Stops' },
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

      {/* 🚌 Full-Width Hero Container with Bus Stops Waterfall flowing deep into the page */}
      <div className="w-full relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-slate-50/30 to-slate-50/10 pt-16 pb-16 px-6">
        {/* Animated BusStopWaterfall Background spanning the entire hero and intro */}
        <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
          <BusStopWaterfall opacity={0.88} />
        </div>

        {/* Gentle Fade Mask at the bottom edge */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50/90 pointer-events-none z-[1]" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
          <h1 className="text-[38px] md:text-[50px] lg:text-[62px] font-black text-emerald-700 tracking-tight leading-tight uppercase scrolly-title-lift-effect cursor-default">
            ETS BUS STOP EQUITY <br className="hidden sm:inline" />
            SCORECARD
          </h1>

          {/* Hero Narrative Intro integrated directly into the waterfall background */}
          <div className="text-left mt-10 space-y-5 bg-white/85 backdrop-blur-xs p-6 md:p-8 rounded-2xl border border-emerald-100/80 shadow-sm">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Why evaluate transit equity at the individual bus stop scale?
            </h2>

            <p className="text-base md:text-lg text-slate-700 leading-relaxed font-medium">
              Network-level corridor metrics aggregate transit service across kilometres of roadway, but obscure local curb-level disparities. A single bus line often connects affluent neighbourhoods and marginalized communities on the same trip.
            </p>

            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
              Evaluating equity at the individual stop focuses on the specific curb where passengers board. Riders experience transit service directly at the pole: waiting in sub-zero winter temperatures, navigating unplowed boarding pads, and connecting to feeder lines. Below, we document the empirical spatial calculations governing Edmonton's 6,755 municipal bus stops.
            </p>
          </div>
        </div>
      </div>

      {/* Main Narrative Chapters Container */}
      <main className="max-w-4xl mx-auto px-6 pb-24 space-y-24">
        {/* CHAPTER 1: THE TWO STOPS (SUBJECT TICKETS) */}
        <section id="chapter-1" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#059669] uppercase tracking-wider">Chapter 1</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Comparative Analysis: High-Need vs. Low-Need Catchments
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            To evaluate how the scoring methodology functions across distinct urban contexts, compare two stops within the Edmonton Transit Service network:
          </p>

          <div className="grid grid-cols-1 gap-4">
            <BusStopTicket
              stopId={stop6586.stop_id}
              theme="emerald"
              stopName={stop6586.stop_name}
              grade={stop6586.equal_grade}
              score={stop6586.equal_score}
              percentile={stop6586.equal_percentile}
              dailyTrips={stop6586.daily_trips}
              peakTripsPerHour={stop6586.peak_trips_per_hour}
              routesServed={stop6586.routes_served}
              daCount={stop6586.das.length}
              tagline="High socio-demographic need in North Edmonton with modest bus service frequency (53 trips per day)."
            />

            <BusStopTicket
              stopId={stop1745.stop_id}
              theme="rose"
              stopName={stop1745.stop_name}
              grade={stop1745.equal_grade}
              score={stop1745.equal_score}
              percentile={stop1745.equal_percentile}
              dailyTrips={stop1745.daily_trips}
              peakTripsPerHour={stop1745.peak_trips_per_hour}
              routesServed={stop1745.routes_served}
              daCount={stop1745.das.length}
              tagline="Low socio-demographic need along Westmount's 107th Avenue corridor, receiving five times more transit service (264 trips per day)."
            />
          </div>
        </section>

        {/* CHAPTER 2: THE 400M CATCHMENT */}
        <section id="chapter-2" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#059669] uppercase tracking-wider">Chapter 2</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              The 400-Metre Catchment: Defining the Pedestrian Walk Shed
            </h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-medium">
            <p>
              In urban transit planning, 400 metres serves as the standard planning benchmark for pedestrian access to local bus service. This corresponds to approximately a five-minute walk at 4.8 km/h.
            </p>
            <p>
              Rather than assigning data solely from the land parcel touching the signpost, we calculate a 400-metre radial buffer around each bus stop in Edmonton. This circular catchment outlines the immediate population relying on that stop for transit access.
            </p>
          </div>
        </section>

        {/* CHAPTER 3: CANADIAN INDEX OF MULTIPLE DEPRIVATION */}
        <section id="chapter-3" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#059669] uppercase tracking-wider">Chapter 3</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Decoding the Canadian Index of Multiple Deprivation (CIMD)
            </h3>
          </div>
          <CimdExplainer />
        </section>

        {/* CHAPTER 4: PROPORTIONAL OVERLAP (THE USER'S DONUT CARD REFERENCE) */}
        <section id="chapter-4" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#059669] uppercase tracking-wider">Chapter 4</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Proportional Area Weighting: Dissemination Area Overlap
            </h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-medium">
            <p>
              A single bus stop does not serve just one neat city block; people walk in from every direction.
            </p>
            <p>
              Statistics Canada divides cities into small neighborhood pockets called Dissemination Areas, each home to about 400 to 700 residents. When you draw a standard five-minute walk around any bus stop (a 400-metre circle), that circle rarely fits inside a single census zone. It almost always slices through three, five, or eight different neighborhood blocks.
            </p>
            <p>
              To score a stop fairly, we calculate the exact slice of each neighborhood inside the circle. If half the circle covers an area with high economic need and the other half covers an affluent street, each neighborhood gets an equal 50% say in the final score. No guesswork; just real local geography.
            </p>
          </div>

          {/* Side-by-Side Donut Cards (Recreating user's reference) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
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
              <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-wider">
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

        {/* CHAPTER 5: THE QUINTILE GRADING SCALE */}
        <section id="chapter-5" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#059669] uppercase tracking-wider">Chapter 5</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              The Quintile Grading Scale: What Grades A Through E Mean
            </h3>
          </div>
          <BusStopGradeDistribution />
        </section>

        {/* CHAPTER 6: SPATIAL MAPBOX INTEGRATION (SIDE-BY-SIDE & TOGGLE) */}
        <section id="chapter-6" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#059669] uppercase tracking-wider">Chapter 6</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Spatial Distribution: Comparative Catchment Geography
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Click either stop to fly directly to its 400-metre walking catchment, or toggle both stops on to compare their locations across Edmonton. Stop #6586 borders rental multi-family subdivisions in North Edmonton, whereas Stop #1745 serves single-family residential streets in Westmount:
          </p>

          <BusStopToggleMap
            stopA={stop6586}
            stopB={stop1745}
            daGeoJson={daGeoJson}
          />
        </section>

        {/* CHAPTER 7: SUPPLY VS NEED */}
        <section id="chapter-7" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#059669] uppercase tracking-wider">Chapter 7</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Supply vs. Need: Daily Trips Compared Against Demographic Need
            </h3>
          </div>
          <BusStopSupplyDisparity stopA={stop6586} stopB={stop1745} />
        </section>

        {/* CHAPTER 8: METHODOLOGICAL HONESTY & CATCHMENT BARRIERS */}
        <section id="chapter-8" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#059669] uppercase tracking-wider">Chapter 8</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Spatial Constraints: Physical Barriers and Aggregate Geography
            </h3>
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

        {/* CHAPTER 9: CALL TO ACTION & EXPLORER */}
        <section id="chapter-9" className="pt-8 border-t border-slate-200 text-center space-y-6">
          <h3 className="text-2xl md:text-3xl font-black text-slate-900">
            Explore Edmonton's 6,755 Bus Stops
          </h3>
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
