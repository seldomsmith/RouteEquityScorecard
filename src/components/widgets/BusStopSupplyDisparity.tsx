"use client";

import React from 'react';
import { Bus, Clock, Snowflake, ArrowRight } from 'lucide-react';

interface BusStopSupplyDisparityProps {
  stopA: {
    stop_id: string;
    stop_name: string;
    equal_grade: string;
    equal_percentile: number;
    equal_score: number;
    daily_trips: number;
    peak_trips_per_hour: number;
  };
  stopB: {
    stop_id: string;
    stop_name: string;
    equal_grade: string;
    equal_percentile: number;
    equal_score: number;
    daily_trips: number;
    peak_trips_per_hour: number;
  };
}

export const BusStopSupplyDisparity: React.FC<BusStopSupplyDisparityProps> = ({
  stopA,
  stopB,
}) => {
  // Approximate departures within a sample 60-minute midday hour
  // Stop B (264 daily trips) has ~8 departures/hr
  const stopBDepartures = [0, 7, 15, 22, 30, 38, 45, 53];
  // Stop A (53 daily trips) has ~1-2 departures/hr
  const stopADepartures = [0];

  const ratio = (stopB.daily_trips / stopA.daily_trips).toFixed(1);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-8 shadow-xs">
      {/* Disparity Ratio Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
            SYSTEMIC FREQUENCY GAP
          </span>
          <h4 className="text-xl md:text-2xl font-black text-slate-900 mt-0.5">
            {ratio}× More Service at Lower-Need Curb
          </h4>
          <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-xl font-medium">
            Stops located along legacy arterial roads receive up to five times more bus arrivals each day than suburban feeder corridors with severe demographic need.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-center font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-400">Ratio</div>
            <div className="text-2xl font-black text-rose-700 tabular-nums">{ratio} : 1</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-400">Daily Delta</div>
            <div className="text-2xl font-black text-slate-900 tabular-nums">+{stopB.daily_trips - stopA.daily_trips}</div>
          </div>
        </div>
      </div>

      {/* 60-Minute Midday Departure Density Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h5 className="text-sm font-bold text-slate-900">
              One-Hour Midday Schedule Simulation (12:00 PM &ndash; 1:00 PM)
            </h5>
            <p className="text-xs text-slate-500 font-medium">
              Comparing bus arrival frequency along each stop's curb during a typical midday hour:
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400 hidden sm:inline">
            60-Minute Window
          </span>
        </div>

        {/* Timeline Visual Container */}
        <div className="space-y-5 bg-slate-50/70 border border-slate-200/90 rounded-xl p-5">
          {/* Stop B Track (Westmount - High Frequency) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-rose-100 text-rose-800 font-mono font-black text-[10px] flex items-center justify-center">
                  E
                </span>
                <span className="font-bold text-slate-900">Stop #{stopB.stop_id} ({stopB.stop_name})</span>
                <span className="text-slate-400 font-mono text-[11px]">&bull; 1st Percentile Need</span>
              </div>
              <div className="font-mono text-[11px] font-bold text-rose-700 tabular-nums">
                8 arrivals/hr &bull; ~7 min wait
              </div>
            </div>

            {/* Horizontal Timeline Track */}
            <div className="relative h-9 bg-white border border-slate-200 rounded-lg flex items-center px-2 overflow-hidden shadow-2xs">
              {/* Background 15-minute grid lines */}
              <div className="absolute inset-0 flex justify-between px-3 pointer-events-none opacity-20">
                <div className="w-px h-full bg-slate-400" />
                <div className="w-px h-full bg-slate-400" />
                <div className="w-px h-full bg-slate-400" />
                <div className="w-px h-full bg-slate-400" />
              </div>

              {/* Departure Marker Points */}
              {stopBDepartures.map((minute, idx) => {
                const leftPct = (minute / 60) * 100;
                return (
                  <div
                    key={idx}
                    style={{ left: `calc(${leftPct}% - 10px)` }}
                    className="absolute flex items-center gap-0.5 bg-rose-600 text-white rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold shadow-xs hover:scale-110 transition-transform cursor-pointer"
                    title={`Scheduled Departure at 12:${minute < 10 ? '0' + minute : minute}`}
                  >
                    <Bus className="w-2.5 h-2.5" />
                    <span className="tabular-nums">:{minute < 10 ? '0' + minute : minute}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stop A Track (North Edmonton - Low Frequency) */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 font-mono font-black text-[10px] flex items-center justify-center">
                  A
                </span>
                <span className="font-bold text-slate-900">Stop #{stopA.stop_id} ({stopA.stop_name})</span>
                <span className="text-slate-400 font-mono text-[11px]">&bull; 94th Percentile Need</span>
              </div>
              <div className="font-mono text-[11px] font-bold text-emerald-800 tabular-nums">
                1 arrival/hr &bull; ~35 min wait
              </div>
            </div>

            {/* Horizontal Timeline Track */}
            <div className="relative h-9 bg-white border border-slate-200 rounded-lg flex items-center px-2 overflow-hidden shadow-2xs">
              {/* Background 15-minute grid lines */}
              <div className="absolute inset-0 flex justify-between px-3 pointer-events-none opacity-20">
                <div className="w-px h-full bg-slate-400" />
                <div className="w-px h-full bg-slate-400" />
                <div className="w-px h-full bg-slate-400" />
                <div className="w-px h-full bg-slate-400" />
              </div>

              {/* Single Departure Marker Point */}
              {stopADepartures.map((minute, idx) => {
                const leftPct = (minute / 60) * 100;
                return (
                  <div
                    key={idx}
                    style={{ left: `calc(${leftPct}% - 10px)` }}
                    className="absolute flex items-center gap-0.5 bg-emerald-700 text-white rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold shadow-xs hover:scale-110 transition-transform cursor-pointer"
                    title={`Scheduled Departure at 12:${minute < 10 ? '0' + minute : minute}`}
                  >
                    <Bus className="w-2.5 h-2.5" />
                    <span className="tabular-nums">:{minute < 10 ? '0' + minute : minute}</span>
                  </div>
                );
              })}

              {/* Waiting Gap Indicator */}
              <div className="ml-16 flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-medium">
                <ArrowRight className="w-3 h-3 text-amber-500" />
                <span>45-minute headway gap without service</span>
              </div>
            </div>
          </div>

          {/* Time axis marks */}
          <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1 pt-1">
            <span>12:00 PM</span>
            <span>12:15 PM</span>
            <span>12:30 PM</span>
            <span>12:45 PM</span>
            <span>1:00 PM</span>
          </div>
        </div>
      </div>

      {/* Winter Climate Impact Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stop 6586 Card */}
        <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-emerald-800">
              Stop #6586 &bull; Grade A
            </span>
            <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
              94th %ile Need
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-mono tabular-nums font-black text-emerald-950">
              53 Daily Trips
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Average midday headway: <strong>30 to 45 minutes</strong>
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-200/60 flex items-start gap-2 text-xs text-emerald-950 font-medium leading-relaxed">
            <Snowflake className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              <strong>Winter Exposure Penalty:</strong> Riders waiting for infrequent feeder lines face extended exposure in sub-zero Edmonton weather. Missing a single bus adds 40+ minutes of curbside wait time.
            </span>
          </div>
        </div>

        {/* Stop 1745 Card */}
        <div className="bg-rose-50/60 border border-rose-200/90 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-rose-800">
              Stop #1745 &bull; Grade E
            </span>
            <span className="font-mono text-xs font-bold bg-rose-100 text-rose-900 px-2 py-0.5 rounded">
              1st %ile Need
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-mono tabular-nums font-black text-rose-950">
              264 Daily Trips
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Average midday headway: <strong>5 to 10 minutes</strong>
            </div>
          </div>

          <div className="pt-3 border-t border-rose-200/60 flex items-start gap-2 text-xs text-rose-950 font-medium leading-relaxed">
            <Clock className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <span>
              <strong>Turn-Up-and-Go Convenience:</strong> High trip density ensures riders can walk up to the stop without consulting timetables, rarely waiting longer than five minutes between coaches.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
