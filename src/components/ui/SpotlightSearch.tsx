"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouteStore } from '@/store/routeStore';
import { RoutePoint } from '@/components/charts/EquityQuadrant';

interface SpotlightSearchProps {
  routes: RoutePoint[];
}

export const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ routes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const setSelectedRoute = useRouteStore((s) => s.setSelectedRoute);
  const setSelectedDa = useRouteStore((s) => s.setSelectedDa);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Listen for global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Derive unique Dissemination Areas (DAs) from routes
  const uniqueDAs = useMemo(() => {
    const daMap = new Map<string, { id: string; pop: number }>();
    routes.forEach((r) => {
      if (r.da_data) {
        r.da_data.forEach((d) => {
          if (!daMap.has(d.id)) {
            daMap.set(d.id, { id: d.id, pop: d.pop });
          }
        });
      }
    });
    return Array.from(daMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [routes]);

  // 3. Filter routes and DAs based on search query
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      // Return top 5 routes and top 5 DAs as defaults when search is empty
      const defaultRoutes = routes
        .slice(0, 5)
        .map((r) => ({ type: 'route' as const, id: r.route_id, label: `${r.short_name} — ${r.name}`, sublabel: `Grade ${r.grade} · Score: ${r.composite_score.toFixed(1)}` }));
      const defaultDAs = uniqueDAs
        .slice(0, 5)
        .map((d) => ({ type: 'da' as const, id: d.id, label: `DA ${d.id}`, sublabel: `Population Served: ${d.pop.toLocaleString()}` }));
      return [...defaultRoutes, ...defaultDAs];
    }

    const q = query.toLowerCase();

    const matchedRoutes = routes
      .filter((r) => r.short_name.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
      .slice(0, 10)
      .map((r) => ({ type: 'route' as const, id: r.route_id, label: `${r.short_name} — ${r.name}`, sublabel: `Grade ${r.grade} · Score: ${r.composite_score.toFixed(1)}` }));

    const matchedDAs = uniqueDAs
      .filter((d) => d.id.includes(q))
      .slice(0, 10)
      .map((d) => ({ type: 'da' as const, id: d.id, label: `DA ${d.id}`, sublabel: `Population Served: ${d.pop.toLocaleString()}` }));

    return [...matchedRoutes, ...matchedDAs];
  }, [query, routes, uniqueDAs]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input automatically when search is opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 4. Keyboard Navigation inside the Spotlight Modal
  useEffect(() => {
    if (!isOpen) return;

    const handleNav = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredResults[selectedIndex];
        if (selected) {
          executeAction(selected);
        }
      }
    };

    window.addEventListener('keydown', handleNav);
    return () => window.removeEventListener('keydown', handleNav);
  }, [isOpen, filteredResults, selectedIndex]);

  const executeAction = (item: { type: 'route' | 'da'; id: string }) => {
    if (item.type === 'route') {
      setSelectedRoute(item.id);
    } else {
      setSelectedDa(item.id);
    }
    setIsOpen(false);
  };

  // Close when clicking outside of the search box
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-150 scale-95 hover:scale-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        Spotlight Search
        <kbd className="bg-slate-100 text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded text-[8px] font-mono ml-1 font-black">⌘K</kbd>
      </button>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-start justify-center pt-[15vh] px-4 transition-all duration-200 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div 
        ref={containerRef}
        className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all transform scale-100 animate-slideUp max-h-[50vh]"
      >
        {/* Search Input Box */}
        <div className="relative border-b border-slate-100 flex items-center px-4 py-3.5">
          <svg className="text-slate-400 w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="w-full pl-3 pr-8 text-xs font-semibold text-slate-700 bg-transparent focus:outline-none placeholder-slate-400"
            placeholder="Search corridors or dissemination areas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute right-4 text-[9px] font-mono font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[35vh]">
          {filteredResults.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-xs font-semibold uppercase tracking-wider">No results found</p>
              <p className="text-[10px] opacity-75 mt-1">Try entering another corridor number or DA code.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Split by Type headers inside mapping */}
              {filteredResults.map((item, idx) => {
                const isActive = selectedIndex === idx;
                
                // Show section headers when categories switch
                const showHeader = idx === 0 || filteredResults[idx - 1].type !== item.type;
                
                return (
                  <div key={item.type + item.id}>
                    {showHeader && (
                      <div className="px-3 py-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-md mb-1">
                        {item.type === 'route' ? 'Routes / Transit Corridors' : 'Edmonton Dissemination Areas (DAs)'}
                      </div>
                    )}
                    
                    <button
                      onClick={() => executeAction(item)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex justify-between items-center transition-all duration-75
                        ${isActive 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                        }`}
                    >
                      <div>
                        <p className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}>
                          {item.label}
                        </p>
                        <p className={`text-[8px] font-medium mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                          {item.sublabel}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.type === 'route' ? (
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${isActive ? 'bg-slate-800 text-white' : 'bg-brand-teal-50 text-brand-teal-700'}`}>
                            Route
                          </span>
                        ) : (
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${isActive ? 'bg-slate-800 text-white' : 'bg-amber-50 text-amber-700'}`}>
                            DA
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[8px] font-mono opacity-80 animate-pulse">⏎ SELECT</span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard instructions footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-2.5 flex justify-between items-center text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span className="font-mono text-[8px] opacity-75">REI Spotlight 1.0</span>
        </div>
      </div>
    </div>
  );
};
