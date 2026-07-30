"use client";

import React from 'react';
import { X, CheckSquare, Square, Sliders, Layers } from 'lucide-react';
import { useRouteStore, CimdDimensionKey } from '@/store/routeStore';

interface CimdCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CimdCriteriaModal: React.FC<CimdCriteriaModalProps> = ({ isOpen, onClose }) => {
  const activeDimensions = useRouteStore((s) => s.activeDimensions);
  const toggleDimension = useRouteStore((s) => s.toggleDimension);
  const setActiveDimensions = useRouteStore((s) => s.setActiveDimensions);

  if (!isOpen) return null;

  const DIMENSIONS: { key: CimdDimensionKey; label: string; desc: string }[] = [
    {
      key: 'econ',
      label: 'Economic Dependency',
      desc: 'Ratio of population relying on transfer payments, pensions, or non-employment income.'
    },
    {
      key: 'res',
      label: 'Residential Instability',
      desc: 'High housing turnover, renter-dominated DAs, and multi-unit dwellings.'
    },
    {
      key: 'eth',
      label: 'Ethno-cultural Composition',
      desc: 'Proportion of recent immigrants, racialized populations, and non-official language speakers.'
    },
    {
      key: 'sit',
      label: 'Situational Vulnerability',
      desc: 'Low educational attainment, single-parent households, and housing suitability.'
    }
  ];

  const handleSelectAll = () => {
    setActiveDimensions(['econ', 'res', 'eth', 'sit']);
  };

  const handleDeselectAll = () => {
    // Keep at least one active dimension to avoid division by zero
    setActiveDimensions(['econ']);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-[#1e3a8a] rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">CIMD Criteria Dimensions</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Select active sub-dimensions for stop & route scoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Checkboxes */}
        <div className="p-6 space-y-3">
          {DIMENSIONS.map((dim) => {
            const isChecked = activeDimensions.includes(dim.key);
            return (
              <div
                key={dim.key}
                onClick={() => toggleDimension(dim.key)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  isChecked
                    ? 'bg-blue-50/40 border-blue-200 text-slate-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className="mt-0.5 text-[#1e3a8a]">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-[#1e3a8a]" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>{dim.label}</span>
                    {isChecked && (
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">Active</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">{dim.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-[11px] font-bold text-[#1e3a8a] hover:underline"
            >
              Select All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-[11px] font-bold text-slate-500 hover:underline"
            >
              Reset
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
