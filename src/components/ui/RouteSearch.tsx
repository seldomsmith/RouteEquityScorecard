"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';

export const RouteSearch = () => {
  const { allRouteMetrics, setSelectedRoute, selectedRoute } = useUIStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRoutes = allRouteMetrics.filter(r => 
    String(r.route_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.route_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGrade = (score: number) => {
    if (score >= 80) return { l: 'A', c: 'text-emerald-600' };
    if (score >= 60) return { l: 'B', c: 'text-emerald-500' };
    if (score >= 40) return { l: 'C', c: 'text-amber-500' };
    if (score >= 20) return { l: 'D', c: 'text-orange-500' };
    return { l: 'E', c: 'text-rose-600' };
  };

  return (
    <div className="p-6 border-b border-slate-200" ref={dropdownRef}>
      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3 text-center">Isolate Corridor</h3>
      
      <div className="relative">
        <input 
          type="text" 
          placeholder={selectedRoute ? `Selected: ${selectedRoute}` : "Search or Select Route..."}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
        />
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
            {filteredRoutes.length === 0 ? (
              <div className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase italic">No matches found</div>
            ) : (
              filteredRoutes.map((r, i) => {
                const grade = getGrade(r.rei_score);
                return (
                  <button 
                    key={i}
                    onClick={() => {
                      setSelectedRoute(r.route_id);
                      setSearchTerm("");
                      setIsOpen(false);
                    }}
                    className="w-full flex justify-between items-center px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <div className="text-left">
                      <p className="text-[9px] font-black text-slate-900 uppercase leading-none">{r.route_name}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">ID: {r.route_id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-black ${grade.c}`}>{grade.l}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
