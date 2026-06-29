"use client";

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const data = [
  { time: '06:00', route2: 8, route3: 4 },
  { time: '08:00', route2: 8, route3: 4 },
  { time: '10:00', route2: 4, route3: 4 },
  { time: '12:00', route2: 4, route3: 4 },
  { time: '14:00', route2: 4, route3: 4 },
  { time: '16:00', route2: 8, route3: 4 },
  { time: '18:00', route2: 2, route3: 4 },
  { time: '20:00', route2: 1.5, route3: 3 },
  { time: '22:00', route2: 1, route3: 3 },
  { time: '24:00', route2: 0, route3: 2 },
];

export const OffPeakFrequencyChart: React.FC = () => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4 md:-mx-12 lg:-mx-24 md:w-[calc(100%+6rem)] lg:w-[calc(100%+12rem)] h-[380px]">
      <div className="text-center mb-1">
        <span className="text-sm font-black text-blue-900 uppercase tracking-wider block">Service Frequency Profile throughout the day</span>
        <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
          Hourly bus runs comparing Route 002 (reduced off-peak) and Route 003 (steady frequency)
        </span>
      </div>

      <div className="flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 30, left: 10, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis 
              dataKey="time" 
              stroke="#64748B" 
              fontSize={10} 
              label={{ value: 'Time of Day (24h Clock)', position: 'bottom', offset: 5, fontSize: 10, fill: '#64748B', fontWeight: 700 }}
            />
            <YAxis 
              stroke="#64748B" 
              fontSize={10} 
              label={{ value: 'Frequency (Buses per Hour)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: '#64748B', fontWeight: 700 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
              labelStyle={{ fontWeight: 'black', color: '#1E293B' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
            />
            <Line 
              type="monotone" 
              dataKey="route2" 
              name="Route 002: Bedrock (Blue)" 
              stroke="#3B82F6" 
              strokeWidth={3}
              activeDot={{ r: 6 }} 
            />
            <Line 
              type="monotone" 
              dataKey="route3" 
              name="Route 003: Corridor (Orange)" 
              stroke="#F97316" 
              strokeWidth={3}
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
