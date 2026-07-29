import React from 'react';
import { Layers } from 'lucide-react';

export type BusStopGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'Regional';

interface BusStopGradeLegendProps {
  selectedGrades: BusStopGrade[];
  onToggleGrade: (grade: BusStopGrade) => void;
  gradeCounts?: Record<BusStopGrade, number>;
}

export const GRADE_CONFIG: Record<BusStopGrade, { label: string; color: string; bg: string; border: string }> = {
  A: { label: 'Grade A', color: '#10B981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-500' },
  B: { label: 'Grade B', color: '#3B82F6', bg: 'bg-blue-50 text-blue-700 border-blue-200', border: 'border-blue-500' },
  C: { label: 'Grade C', color: '#F59E0B', bg: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-amber-500' },
  D: { label: 'Grade D', color: '#F97316', bg: 'bg-orange-50 text-orange-700 border-orange-200', border: 'border-orange-500' },
  E: { label: 'Grade E', color: '#EF4444', bg: 'bg-red-50 text-red-700 border-red-200', border: 'border-red-500' },
  Regional: { label: 'Regional', color: '#94A3B8', bg: 'bg-slate-100 text-slate-600 border-slate-200', border: 'border-slate-400' },
};

export const BusStopGradeLegend: React.FC<BusStopGradeLegendProps> = ({
  selectedGrades,
  onToggleGrade,
  gradeCounts
}) => {
  const grades: BusStopGrade[] = ['A', 'B', 'C', 'D', 'E', 'Regional'];

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-3.5 w-52 text-slate-800 space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#1e3a8a]" /> Grade Filter
        </span>
        <span className="text-[10px] font-bold text-slate-400">
          {selectedGrades.length === 6 ? 'All' : `${selectedGrades.length}/6`}
        </span>
      </div>

      <div className="space-y-1.5">
        {grades.map((g) => {
          const cfg = GRADE_CONFIG[g];
          const isSelected = selectedGrades.includes(g);
          const count = gradeCounts ? gradeCounts[g] : undefined;

          return (
            <button
              key={g}
              onClick={() => onToggleGrade(g)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-white border-slate-200 shadow-xs text-slate-900'
                  : 'bg-slate-50/60 border-slate-100 text-slate-400 opacity-65 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs border border-white"
                  style={{ backgroundColor: cfg.color }}
                />
                <span>{cfg.label}</span>
              </div>

              {count !== undefined && (
                <span className="font-mono text-[10px] font-bold opacity-75">
                  {count.toLocaleString()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
