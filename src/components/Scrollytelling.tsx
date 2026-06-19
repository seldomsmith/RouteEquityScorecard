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
      <main className="flex-grow pt-16 overflow-y-auto w-full flex justify-center bg-slate-50">
        <div className="w-full max-w-3xl px-4 py-8 md:py-12 flex flex-col gap-6">
          
          {/* 📊 Vertically Stacked Visual Placeholder */}
          <div className="w-full h-72 bg-slate-100 border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 font-bold select-none shadow-sm gap-2 p-6 text-center">
            <Bus className="w-10 h-10 text-slate-350" />
            <span className="text-xs font-mono tracking-widest uppercase mt-2">Visualisation Placeholder: Screen {activeStep + 1}</span>
            <span className="text-sm font-black text-slate-500">{stepTitles[activeStep]}</span>
            <p className="text-[11px] text-slate-400 max-w-md font-medium mt-1">
              {activeStep === 0 && "Edmonton Transit Service grid map highlighting Route 002 (Blue) and Route 003 (Red)."}
              {activeStep === 1 && "Interactive grid layout presenting the Four Pillars: Vulnerability, Off Peak, Monopoly, and Opportunity."}
              {activeStep === 2 && "Comparative bar chart comparing demographic vulnerability indexes (low income, seniors, and minorities) for Route 002 vs Route 003."}
              {activeStep === 3 && "Accessibility network map illustrating destination opportunity reach (employment hubs, hospitals, and post-secondary hubs)."}
              {activeStep === 4 && "Off-peak service timeline clock highlighting operating hours during evenings, nights, and weekends."}
              {activeStep === 5 && "Service monopoly catchment boundaries and walking buffers highlighting route redundancy."}
              {activeStep === 6 && "Live interactive weights policy simulator updating composite results in real-time."}
              {activeStep === 7 && "Monte Carlo simplex scatter plot identifying Bedrock Essentials vs. Policy Swing Corridors."}
              {activeStep === 8 && "Comparative diagnostic route metrics overview matrix."}
            </p>
          </div>

          {/* 📖 Text Narrative & Tickets */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm flex flex-col justify-between min-h-[300px]">
            
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
                        <span className="font-mono text-teal-650">{weights.vulnerability}%</span>
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
                        <span className="font-mono text-teal-650">{weights.offPeak}%</span>
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
                        <span className="font-mono text-teal-655">{weights.monopoly}%</span>
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
                        <span className="font-mono text-teal-655">{weights.opportunity}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={weights.opportunity}
                        onChange={(e) => handleWeightChange('opportunity', parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      />
                    </div>
                  </div>

                  {/* Live score comparison inside weight card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Live Simulated Result</span>
                    <div className="flex flex-col gap-2 text-xs font-bold text-slate-700">
                      <div className="flex justify-between">
                        <span>Route 002 Score:</span>
                        <span className="text-blue-600 font-mono">{liveScores.route2.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Route 003 Score:</span>
                        <span className="text-amber-500 font-mono">{liveScores.route3.toFixed(1)}</span>
                      </div>
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
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
              <button
                onClick={handlePrev}
                disabled={activeStep === 0}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border font-bold text-xs transition-all duration-200 ${
                  activeStep === 0
                    ? 'text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed'
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

          </div>

        </div>
      </main>

    </div>
  );
};
