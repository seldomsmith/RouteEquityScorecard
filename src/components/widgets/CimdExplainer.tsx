"use client";

import React, { useState } from 'react';
import { 
  HelpCircle, 
  X, 
  Users, 
  Home, 
  DollarSign, 
  HeartHandshake 
} from 'lucide-react';

interface CimdExplainerProps {
  initialWeight?: number;
}

export const CimdExplainer: React.FC<CimdExplainerProps> = () => {
  const [showMathModal, setShowMathModal] = useState<boolean>(false);

  const DIMENSIONS = [
    {
      key: 'econ',
      title: 'Economic Deprivation',
      icon: DollarSign,
      color: '#1d4ed8', // Sapphire Blue
      description: 'Measures income inadequacy, poverty rates, and dependence on government income transfers.',
      indicators: [
        'Low-income cut-offs (LICO / LIM)',
        'Social assistance benefits',
        'Working-age unemployment rate',
        'Adults without high school diploma',
      ],
    },
    {
      key: 'res',
      title: 'Residential Instability',
      icon: Home,
      color: '#0f766e', // Pine Teal
      description: 'Tracks neighbourhood turnover, tenant concentrations, and multi-unit apartment density.',
      indicators: [
        'Renter household percentage',
        'Multi-unit apartment buildings',
        'Single-person living arrangements',
        '1-year mobility and relocation rate',
      ],
    },
    {
      key: 'eth',
      title: 'Ethnocultural Composition',
      icon: Users,
      color: '#7c3aed', // Royal Violet
      description: 'Evaluates settlement patterns of groups with high structural reliance on public transit.',
      indicators: [
        'Recent immigrant arrivals (≤ 5 years)',
        'Visible minority resident percentage',
        'Official language limitations',
        'Temporary study / work visa holders',
      ],
    },
    {
      key: 'sit',
      title: 'Situational Vulnerability',
      icon: HeartHandshake,
      color: '#d97706', // Amber Bronze
      description: 'Identifies demographic profiles experiencing severe friction during daily travel.',
      indicators: [
        'Single-parent families',
        'Seniors living alone (age 65+)',
        'Age-based dependency ratio',
        'Zero-vehicle household prevalence',
      ],
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-slate-600 font-medium max-w-2xl">
          Statistics Canada normalizes census dissemination areas from 0 to 100 across four distinct dimensions. Each dimension receives equal 25% weight in the baseline scorecard:
        </p>

        <button
          onClick={() => setShowMathModal(true)}
          className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-all flex items-center gap-2 self-start sm:self-auto shadow-xs shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#059669]" />
          <span>Show me the math</span>
        </button>
      </div>

      {/* 4 Pillars Grid with 3D Hard-Shadow Lift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {DIMENSIONS.map((dim) => {
          const Icon = dim.icon;

          return (
            <div
              key={dim.key}
              className="w-full pillar-card-lift flex flex-col bg-white rounded-2xl border-2 overflow-hidden shadow-xs"
              style={{
                '--pillar-color': dim.color,
              } as React.CSSProperties}
            >
              {/* Top Segment: Colored Header */}
              <div
                className="p-5 flex flex-col items-center justify-center text-center text-white select-none"
                style={{ backgroundColor: dim.color }}
              >
                <div className="p-2.5 bg-white/20 rounded-xl border border-white/30 mb-2.5 shadow-2xs">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider leading-tight">
                  {dim.title}
                </span>
                <span className="text-[10px] font-mono opacity-85 uppercase tracking-widest mt-1">
                  25% Equal Weight
                </span>
              </div>

              {/* Bottom Segment: White Text Body */}
              <div className="flex-1 p-5 flex flex-col justify-between bg-white space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {dim.description}
                </p>

                {/* Census Variables */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Key Census Variables:
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-600 font-medium">
                    {dim.indicators.map((ind, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold text-slate-400">&bull;</span>
                        <span className="leading-tight">{ind}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Math Modal */}
      {showMathModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowMathModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-mono font-bold uppercase text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Methodology Specification
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-2">
              Formula: Aggregating CIMD Scores for Bus Stops
            </h3>

            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 space-y-2">
              <div className="font-bold text-[#059669] text-[11px] uppercase tracking-wider">Formula Definitions</div>
              <div className="py-1 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500 font-sans font-medium text-xs">DA Vulnerability Score:</span>
                <span className="font-bold tabular-nums">Score_DA = (Econ + Res + Eth + Sit) / 4</span>
              </div>
              <div className="py-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500 font-sans font-medium text-xs">Stop Catchment Aggregate:</span>
                <span className="font-bold tabular-nums">Score_Stop = ∑ (Overlap_%_DA_i × Score_DA_i)</span>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
              <h5 className="font-bold text-slate-900 text-sm">How Statistics Canada Computes Quintiles</h5>
              <p>
                Each Canadian Census Dissemination Area (DA) is scored and normalized into quintile-based percentiles from 0 to 100 across each of the 4 dimensions. When equal weighting is applied, the DA vulnerability score is the straight arithmetic mean of its active dimension percentiles.
              </p>
              
              <h5 className="font-bold text-slate-900 text-sm mt-4">Why Area-Weighted Proportional Overlap?</h5>
              <p>
                Bus stop catchments represent pedestrian walk sheds (400-metre radius circles). Since walk sheds do not obey administrative boundaries, a stop frequently straddles multiple DAs. Rather than arbitrarily assigning a stop to whatever census boundary its pole happens to be planted in, we calculate the exact polygon area intersection percentage of each DA within the 400m circle.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowMathModal(false)}
                className="px-5 py-2 rounded-xl bg-[#059669] text-white font-bold text-xs hover:bg-[#152e6f] transition-all"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
