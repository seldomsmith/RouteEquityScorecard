"use client";

import React, { useState } from 'react';
import { HelpCircle, ChevronRight, Check } from 'lucide-react';

interface QuintileCut {
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  label: string;
  minScore: number;
  maxScore: number;
  percentileRange: string;
  count: number;
  color: string;
  bgLight: string;
  borderColor: string;
  policyAction: string;
  shelterPriority: string;
}

const QUINTILE_DATA: QuintileCut[] = [
  {
    grade: 'A',
    label: 'Highest Vulnerability',
    minScore: 73.5,
    maxScore: 100.0,
    percentileRange: '80th - 100th %ile',
    count: 1355,
    color: '#10b981',
    bgLight: 'bg-emerald-50 text-emerald-950',
    borderColor: 'border-emerald-300',
    policyAction: 'Highest priority for heated shelters, real-time schedule displays, winter snow clearing fast-tracks, and enhanced evening bus frequency.',
    shelterPriority: 'High Priority (Tier 1)'
  },
  {
    grade: 'B',
    label: 'Elevated Vulnerability',
    minScore: 64.9,
    maxScore: 73.4,
    percentileRange: '60th - 80th %ile',
    count: 1350,
    color: '#3b82f6',
    bgLight: 'bg-blue-50 text-blue-950',
    borderColor: 'border-blue-300',
    policyAction: 'Strong candidates for weather enclosures, standard benches, and pedestrian crossing safety upgrades.',
    shelterPriority: 'Moderate-High (Tier 2)'
  },
  {
    grade: 'C',
    label: 'Median Baseline',
    minScore: 58.1,
    maxScore: 64.8,
    percentileRange: '40th - 60th %ile',
    count: 1351,
    color: '#eab308',
    bgLight: 'bg-yellow-50 text-yellow-950',
    borderColor: 'border-yellow-300',
    policyAction: 'Standard municipal baseline. Capital amenities allocated according to system boarding volume thresholds.',
    shelterPriority: 'Standard Baseline (Tier 3)'
  },
  {
    grade: 'D',
    label: 'Low Vulnerability',
    minScore: 51.5,
    maxScore: 58.0,
    percentileRange: '20th - 40th %ile',
    count: 1351,
    color: '#f97316',
    bgLight: 'bg-orange-50 text-orange-950',
    borderColor: 'border-orange-300',
    policyAction: 'Catchments with above-average household income and vehicle ownership. Capital upgrades prioritized if connecting major transfer nodes.',
    shelterPriority: 'Secondary Priority (Tier 4)'
  },
  {
    grade: 'E',
    label: 'Lowest Vulnerability',
    minScore: 0.0,
    maxScore: 51.4,
    percentileRange: '0th - 20th %ile',
    count: 1348,
    color: '#ef4444',
    bgLight: 'bg-rose-50 text-rose-950',
    borderColor: 'border-rose-300',
    policyAction: 'Lowest demographic need. Bus service predominantly serves discretionary commuters rather than captive riders.',
    shelterPriority: 'Low Priority (Tier 5)'
  }
];

export const BusStopGradeDistribution: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');

  const activeQuintile = QUINTILE_DATA.find(q => q.grade === selectedGrade)!;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#1e3a8a]">
            QUINTILE METHODOLOGY & POLICY IMPACT
          </span>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
            Understanding Bus Stop Grades (Grade A through E)
          </h3>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            Every municipal bus stop in Edmonton is benchmarked against its peers and placed into an exact 20% quintile bracket.
          </p>
        </div>
      </div>

      {/* Horizontal Quintile Segment Bar */}
      <div className="mt-6">
        <div className="flex w-full h-8 rounded-xl overflow-hidden shadow-xs border border-slate-200">
          {QUINTILE_DATA.map((q) => {
            const isSelected = selectedGrade === q.grade;
            return (
              <button
                key={q.grade}
                onClick={() => setSelectedGrade(q.grade)}
                style={{ backgroundColor: q.color }}
                className={`flex-1 flex items-center justify-center text-white font-mono font-black text-xs transition-transform ${
                  isSelected ? 'scale-105 z-10 shadow-md ring-2 ring-slate-900' : 'opacity-85 hover:opacity-100'
                }`}
                title={`Grade ${q.grade}: ${q.label}`}
              >
                Grade {q.grade}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 px-1">
          <span>0.0 (Min Score)</span>
          <span>Cut: 51.5</span>
          <span>Cut: 58.1</span>
          <span>Cut: 64.9</span>
          <span>Cut: 73.5</span>
          <span>100.0 (Max Score)</span>
        </div>
      </div>

      {/* Selected Grade Breakdown Card */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border border-slate-200/90 rounded-2xl p-6">
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                style={{ backgroundColor: activeQuintile.color }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-mono font-black text-sm shadow-xs"
              >
                {activeQuintile.grade}
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-base">{activeQuintile.label}</h4>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {activeQuintile.percentileRange}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Score Range:</span>
                <span className="font-mono font-bold text-slate-800">
                  {activeQuintile.minScore.toFixed(1)} - {activeQuintile.maxScore.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Stop Count:</span>
                <span className="font-mono font-bold text-slate-800">
                  {activeQuintile.count} stops (20.0%)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Shelter Priority:</span>
                <span className="font-bold text-[#1e3a8a]">{activeQuintile.shelterPriority}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Archetypal Stop Example:
            </span>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              {activeQuintile.grade === 'A' ? 'Stop #6586 (121 St & 145 Ave)' : activeQuintile.grade === 'E' ? 'Stop #1745 (130 St & 107 Ave)' : 'Representative Corridor Stop'}
            </div>
          </div>
        </div>

        {/* Policy Impact Detail */}
        <div className="md:col-span-2 flex flex-col justify-between bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Actionable Decision Framework
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
              {activeQuintile.policyAction}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1e3a8a] text-[11px] font-bold border border-blue-100">
              Winter Snow Clearance
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1e3a8a] text-[11px] font-bold border border-blue-100">
              Capital Infrastructure Fund
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1e3a8a] text-[11px] font-bold border border-blue-100">
              Pedestrian Safety Lighting
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
