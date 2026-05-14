"use client";

import React, { useEffect } from 'react';
import { useDuckDB } from '@/hooks/useDuckDB';
import { useRouteStore } from '@/store/routeStore';
import { Map } from '@/components/map/Map';

export const CommandCentre = () => {
  const { db, isInitializing, error } = useDuckDB();
  const weights = useRouteStore((state) => state.weights);

  const [systemPopServed, setSystemPopServed] = React.useState<number | null>(null);

  useEffect(() => {
    if (db) {
      const loadData = async () => {
        try {
          console.log("🚀 Ingesting Golden Record into DuckDB...");
          
          // Fetch the JSON data
          const response = await fetch('/data/golden_route_record.json');
          const jsonData = await response.json();
          
          // Insert into DuckDB using 'God Mode' auto-inference
          await db.registerFileText('data.json', JSON.stringify(jsonData));
          const conn = await db.connect();
          
          // Create the table directly from the JSON file using auto-detection
          await conn.query(`CREATE TABLE network_data AS SELECT * FROM read_json_auto('data.json')`);
          
          console.log("✅ Golden Record secured in 'network_data' table.");

          // ⚡ TEST THE ENGINE: Query the total population served
          const result = await conn.query(`
            SELECT SUM(route.total_pop_served) as total_pop 
            FROM (SELECT UNNEST(routes) as route FROM network_data)
          `);
          
          const pop = result.toArray()[0].total_pop;
          console.log(`📊 Engine Query Result -> Total System Pop Served: ${pop}`);
          setSystemPopServed(Number(pop));
          
          await conn.close();
        } catch (err) {
          console.error("❌ Data Ingestion Failed:", err);
        }
      };

      loadData();
    }
  }, [db]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Top Banner Status */}
      <div className="absolute top-4 left-4 z-10 command-card p-3 flex items-center gap-3">
        <div className={`status-indicator ${isInitializing ? 'bg-amber-500 animate-pulse' : db ? 'bg-brand-teal-500' : 'bg-brand-rose-500'}`} />
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-slate-800">
          {isInitializing ? 'INITIALIZING ENGINE...' : db ? 'ENGINE SECURE' : 'ENGINE FAILURE'}
        </span>
      </div>

      <div className="flex-1 relative">
        <Map systemPopServed={systemPopServed} />
      </div>
      
      <div className="h-1/3 border-t border-white/20 glass-panel grid grid-cols-2 gap-4 p-4 z-10 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] relative">
        <div className="command-card bg-brand-slate-50/50 flex flex-col items-center justify-center p-4">
            <span className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-widest mb-2">Equity Dissemination Matrix</span>
            <div className="text-xs text-brand-slate-400">Awaiting Spatial Selection...</div>
        </div>
        <div className="command-card bg-brand-slate-50/50 flex flex-col items-center justify-center p-4">
            <span className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-widest mb-2">Ridership-Equity Quadrant</span>
            <div className="text-xs text-brand-slate-400">Awaiting Spatial Selection...</div>
        </div>
      </div>
    </div>
  );
};
