"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Bus, 
  ArrowLeft, 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  HelpCircle, 
  Layers, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Maximize2,
  ChevronDown
} from 'lucide-react';
import { GlobalNavMenu, PageView } from '@/components/widgets/GlobalNavMenu';
import { BusStopTicket } from '@/components/widgets/BusStopTicket';
import { CatchmentDonutCard } from '@/components/widgets/CatchmentDonutCard';
import { CimdExplainer } from '@/components/widgets/CimdExplainer';
import { BusStopGradeDistribution } from '@/components/widgets/BusStopGradeDistribution';

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
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Menu Modal */}
      <GlobalNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        onNavigate={onNavigate}
        activeItemIndex={4}
      />

      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('landing')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Return to Landing Page"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#1e3a8a]">
              ETS EQUITY FRAMEWORK &bull; PAGE 2.1
            </div>
            <h1 className="text-sm md:text-base font-black text-slate-900 tracking-tight">
              Explain the Bus Stop Equity Scorecard to Me!
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('bus-stop-analysis')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#1e3a8a]" />
            <span>Open Dashboard (2.2)</span>
          </button>

          <button
            onClick={() => setIsNavMenuOpen(true)}
            className="px-3 py-1.5 text-[11px] font-bold text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all uppercase tracking-wider flex items-center gap-1.5"
          >
            <span>MENU</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Narrative Intro */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#1e3a8a] text-xs font-mono font-bold mb-6">
          <MapPin className="w-3.5 h-3.5" />
          <span>MICRO-SCALE SPATIAL EQUITY IN TRANSIT</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Why evaluate transit equity at the individual bus stop scale?
        </h2>

        <p className="mt-6 text-base md:text-lg text-slate-600 leading-relaxed font-medium">
          Route-level equity scores summarise transit networks well across long distances, but they smooth out local differences over kilometres of roadway. A single bus line often connects affluent neighbourhoods and marginalized communities on the same trip.
        </p>

        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          Evaluating equity at the individual stop captures the specific curb where passengers board. This metric reflects where riders wait in sub-zero Edmonton weather, navigate snow-packed sidewalks, and transfer between routes. Below, we document the data and spatial calculations behind Edmonton's 6,755 bus stops.
        </p>
      </div>

      {/* Main Narrative Chapters Container */}
      <main className="max-w-4xl mx-auto px-6 pb-24 space-y-24">
        {/* CHAPTER 1: THE TWO STOPS (SUBJECT TICKETS) */}
        <section id="chapter-1" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#1e3a8a] uppercase tracking-wider">Chapter 1</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Two Bus Stops, Two Realities
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            To evaluate how the scoring system functions across distinct urban contexts, compare two stops within the Edmonton Transit Service network:
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
            <span className="text-xs font-mono font-bold text-[#1e3a8a] uppercase tracking-wider">Chapter 2</span>
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
            <span className="text-xs font-mono font-bold text-[#1e3a8a] uppercase tracking-wider">Chapter 3</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Decoding the Canadian Index of Multiple Deprivation (CIMD)
            </h3>
          </div>
          <CimdExplainer />
        </section>

        {/* CHAPTER 4: PROPORTIONAL OVERLAP (THE USER'S DONUT CARD REFERENCE) */}
        <section id="chapter-4" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#1e3a8a] uppercase tracking-wider">Chapter 4</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Proportional Area Overlap: Slicing the Census Geography
            </h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-medium">
            <p>
              Census Dissemination Areas (DAs) are irregular polygons populated with 400 to 700 residents. A 400-metre circular walkshed rarely lands entirely inside a single administrative polygon; it commonly intersects four, seven, or nine distinct DAs.
            </p>
            <p>
              To maintain spatial accuracy without boundary distortions, we compute polygon intersections in GIS. Each intersecting DA contributes to the stop score in direct proportion to the percentage of the 400m circle it occupies:
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
            <span className="text-xs font-mono font-bold text-[#1e3a8a] uppercase tracking-wider">Chapter 5</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              The Quintile Grading Scale: What Grades A Through E Mean
            </h3>
          </div>
          <BusStopGradeDistribution />
        </section>

        {/* CHAPTER 6: SPATIAL MAPBOX INTEGRATION (SIDE-BY-SIDE & TOGGLE) */}
        <section id="chapter-6" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#1e3a8a] uppercase tracking-wider">Chapter 6</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Mapping the Divide: Side-by-Side and Toggled Spatial Comparisons
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Toggle between the two stops or inspect them side by side. Stop #6586 borders rental multi-family subdivisions in North Edmonton, whereas Stop #1745 serves single-family residential streets in Westmount:
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
            <span className="text-xs font-mono font-bold text-[#1e3a8a] uppercase tracking-wider">Chapter 7</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Supply vs. Need: Daily Trips Compared Against Demographic Need
            </h3>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-4 text-sm text-slate-700">
            <p className="leading-relaxed font-medium">
              When transit networks allocate trips based primarily on legacy downtown corridors, stops in high-need catchments frequently receive minimal off-peak frequency.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-lg">
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase">Stop #6586 (Grade A)</span>
                <div className="text-2xl font-mono font-black text-emerald-950 mt-1">53 Daily Trips</div>
                <p className="text-xs text-emerald-900 mt-2 font-medium">
                  Passengers in this 94th percentile need catchment wait 30 to 45 minutes between buses during midday and evening hours.
                </p>
              </div>
              <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-lg">
                <span className="text-xs font-mono font-bold text-rose-800 uppercase">Stop #1745 (Grade E)</span>
                <div className="text-2xl font-mono font-black text-rose-950 mt-1">264 Daily Trips</div>
                <p className="text-xs text-rose-900 mt-2 font-medium">
                  Passengers in this low-need catchment receive frequent trunk service arriving every five to ten minutes throughout the day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 8: METHODOLOGICAL HONESTY & CATCHMENT BARRIERS */}
        <section id="chapter-8" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#1e3a8a] uppercase tracking-wider">Chapter 8</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Methodological Realities: Physical Barriers and Spatial Boundaries
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

        {/* CHAPTER 9: HOW DECISION MAKERS CAN ACT */}
        <section id="chapter-9" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold text-[#1e3a8a] uppercase tracking-wider">Chapter 9</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              Policy Actions for Transit Planners and Decision Makers
            </h3>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              The Bus Stop Equity Scorecard translates diagnostic demographic data into concrete operational decisions:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-xs font-mono font-bold text-[#1e3a8a] uppercase">1. Capital Amenities</div>
                <h4 className="font-bold text-slate-900 text-sm">Shelters and Heaters</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Direct capital grants toward Grade A stops to fund weather enclosures, benches, and radiant overhead heaters for cold-weather waits.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-xs font-mono font-bold text-[#1e3a8a] uppercase">2. Operations</div>
                <h4 className="font-bold text-slate-900 text-sm">Sidewalk Snow Clearing</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Prioritise sidewalk and boarding pad snow removal near Grade A stops where elderly riders, children, and people using mobility devices face slip risks.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-xs font-mono font-bold text-[#1e3a8a] uppercase">3. Service Planning</div>
                <h4 className="font-bold text-slate-900 text-sm">Off-Peak Frequency</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Protect 15-to-20-minute off-peak and weekend headways on feeder routes serving Grade A stops rather than cutting service to hourly frequencies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 10: CALL TO ACTION & EXPLORER */}
        <section id="chapter-10" className="pt-8 border-t border-slate-200 text-center space-y-6">
          <h3 className="text-2xl md:text-3xl font-black text-slate-900">
            Explore Edmonton's 6,755 Bus Stops
          </h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed font-medium">
            Inspect stop grades across all neighbourhoods, test custom CIMD weighting criteria, and search any stop in the city.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('bus-stop-analysis')}
              className="px-6 py-3 rounded-xl bg-[#1e3a8a] hover:bg-[#152e6f] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Launch Bus Stop Dashboard (2.2)</span>
            </button>

            <button
              onClick={() => onNavigate('bus-stop-directory')}
              className="px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#1e3a8a]" />
              <span>Browse Bus Stop Directory (2.3)</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
