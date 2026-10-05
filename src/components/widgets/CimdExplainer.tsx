"use client";

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  X, 
  Layers, 
  ShieldAlert, 
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
  const [activeTab, setActiveTab] = useState<'econ' | 'res' | 'eth' | 'sit'>('econ');

  const DIMENSIONS = [
    {
      key: 'econ',
      title: 'Economic Deprivation',
      subtitle: 'Income adequacy, low income prevalence & social assistance',
      icon: DollarSign,
      color: 'blue',
      badge: 'bg-blue-50 text-blue-800 border-blue-200',
      description: 'Measures financial capacity and poverty indicators derived from the Canadian census. High deprivation indicates low personal income, dependence on government transfer payments, and lack of discretionary reserves.',
      indicators: [
        'Proportion of population with income below low-income cut-offs (LICO/LIM)',
        'Proportion of households receiving social assistance benefits',
        'Unemployment rate among prime working-age adults',
        'Proportion of adults aged 25-64 without a high school diploma'
      ],
      stop6586Score: 40.0,
      stop1745Score: 20.0
    },
    {
      key: 'res',
      title: 'Residential Instability',
      subtitle: 'Tenure, dwelling density & household stability',
      icon: Home,
      color: 'emerald',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: 'Quantifies housing churn and living precarity. Areas with high residential instability have higher proportions of tenant households, frequent moves, crowded multi-unit buildings, and fewer multi-generational roots.',
      indicators: [
        'Proportion of households renting their primary dwelling',
        'Proportion of multi-unit residential structures',
        'Proportion of single-person households',
        'Mobility rate (residence changed in past 12 months)'
      ],
      stop6586Score: 80.0,
      stop1745Score: 20.0
    },
    {
      key: 'eth',
      title: 'Ethnocultural Composition',
      subtitle: 'Immigration recency, visible minorities & language barriers',
      icon: Users,
      color: 'purple',
      badge: 'bg-purple-50 text-purple-800 border-purple-200',
      description: 'Captures community diversity and potential systemic integration hurdles, including new immigrant cohorts, non-official language speakers, and visible minority populations who frequently rely heavily on public transit.',
      indicators: [
        'Proportion of recent immigrants (arrived in past 5 years)',
        'Proportion of visible minority residents',
        'Proportion with no knowledge of either official language (English or French)',
        'Proportion of non-permanent residents (work/study permits)'
      ],
      stop6586Score: 100.0,
      stop1745Score: 20.0
    },
    {
      key: 'sit',
      title: 'Situational Vulnerability',
      subtitle: 'Single parent families, elderly living alone & dependence',
      icon: HeartHandshake,
      color: 'amber',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Measures specific socio-demographic barriers and life situations that exacerbate physical travel constraints, such as solo-caregiver obligations, isolated senior citizens, and low vehicle ownership.',
      indicators: [
        'Proportion of single-parent female-led families',
        'Proportion of seniors aged 65+ living alone',
        'Dependency ratio (youth + senior pop relative to working age)',
        'Zero-vehicle household prevalence'
      ],
      stop6586Score: 100.0,
      stop1745Score: 40.0
    }
  ] as const;

  const currentDim = DIMENSIONS.find(d => d.key === activeTab)!;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#1e3a8a]">
            STATISTICS CANADA FRAMEWORK
          </span>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
            The Canadian Index of Multiple Deprivation (CIMD)
          </h3>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            Constructed from 2021 Census Dissemination Area data across four non-redundant statistical dimensions.
          </p>
        </div>

        <button
          onClick={() => setShowMathModal(true)}
          className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-all flex items-center gap-2 self-start md:self-auto shadow-2xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#1e3a8a]" />
          <span>Show me the math</span>
        </button>
      </div>

      {/* 4 Dimension Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-6">
        {DIMENSIONS.map((dim) => {
          const Icon = dim.icon;
          const isActive = activeTab === dim.key;
          return (
            <button
              key={dim.key}
              onClick={() => setActiveTab(dim.key as any)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-[#1e3a8a] bg-blue-50/50 shadow-xs ring-1 ring-[#1e3a8a]'
                  : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1e3a8a]' : 'text-slate-400'}`} />
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-[#1e3a8a]" />}
              </div>
              <div className="mt-3">
                <div className={`text-xs font-bold ${isActive ? 'text-[#1e3a8a]' : 'text-slate-800'}`}>
                  {dim.title}
                </div>
                <div className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                  25% equal weight
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tab Detail Card */}
      <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
          <div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${currentDim.badge}`}>
              Dimension: {currentDim.title}
            </span>
            <h4 className="text-base font-bold text-slate-900 mt-1.5">{currentDim.subtitle}</h4>
          </div>

          {/* Micro-score comparison for the two candidate stops */}
          <div className="flex items-center gap-3 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400">Sample DA Scores:</span>
            <span className="font-mono text-emerald-700 font-bold">Stop #6586: {currentDim.stop6586Score}</span>
            <span className="text-slate-300">&bull;</span>
            <span className="font-mono text-rose-700 font-bold">Stop #1745: {currentDim.stop1745Score}</span>
          </div>
        </div>

        <p className="text-xs md:text-sm text-slate-700 mt-4 leading-relaxed font-medium">
          {currentDim.description}
        </p>

        <div className="mt-4 pt-4 border-t border-slate-200/60">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
            Key Census Variables Included:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
            {currentDim.indicators.map((ind, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-slate-200/50">
                <span className="text-blue-500 font-bold mt-0.5">&bull;</span>
                <span className="text-[11px] leading-snug">{ind}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Math Modal */}
      {showMathModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowMathModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-mono font-bold uppercase text-[#1e3a8a] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Methodology Specification
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-2">
              Formula: Aggregating CIMD Scores for Bus Stops
            </h3>

            <div className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto">
              <code>
                {`Score_DA = (Econ + Res + Eth + Sit) / 4\n\nScore_Stop = ∑ (Overlap_%_DA_i × Score_DA_i)`}
              </code>
            </div>

            <div className="mt-5 space-y-3 text-xs text-slate-600 leading-relaxed">
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
                className="px-5 py-2 rounded-xl bg-[#1e3a8a] text-white font-bold text-xs hover:bg-[#152e6f] transition-all"
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
