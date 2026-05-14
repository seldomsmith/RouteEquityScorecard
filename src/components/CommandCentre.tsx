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
          
          // Fetch the high-speed Parquet data
          const response = await fetch('/data/golden_route_record.parquet');
          const buffer = await response.arrayBuffer();
          
          // Insert into DuckDB memory
          await db.registerFileBuffer('data.parquet', new Uint8Array(buffer));
          const conn = await db.connect();
          
          // Create the table directly from the Parquet file
          await conn.query(`CREATE TABLE network_data AS SELECT * FROM read_parquet('data.parquet')`);
          
          console.log("✅ Golden Record secured in 'network_data' table.");

          // ⚡ ENGINE QUERY: Unique population served (de-duplicated by DA id)
          const result = await conn.query(`
            SELECT CAST(SUM(sub.pop) AS INTEGER) as total_pop FROM (
              SELECT DISTINCT da.id, da.pop FROM (
                SELECT UNNEST(route.da_metadata) as da FROM (
                  SELECT UNNEST(routes) as route FROM network_data
                ) t1
              ) t2
            ) sub
          `);
          
          const val = result.toArray()[0].total_pop;
          console.log('📊 Engine -> Total Unique Pop Served:', val);
          setSystemPopServed(Number(val));
          
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
