"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useDuckDB } from '@/hooks/useDuckDB';
import { useRouteStore } from '@/store/routeStore';
import { EquityQuadrant, RoutePoint } from '@/components/charts/EquityQuadrant';
import { ShapWaterfall } from '@/components/charts/ShapWaterfall';
import { Sidebar } from '@/components/Sidebar';

// Dynamic import with SSR disabled — Mapbox GL requires window/document
const Map = dynamic(() => import('@/components/map/Map'), { ssr: false });

export const CommandCentre = () => {
  const { db, isInitializing, error } = useDuckDB();
  const weights = useRouteStore((state) => state.weights);
  const selectedRoute = useRouteStore((state) => state.selectedRoute);

  const [systemPopServed, setSystemPopServed] = React.useState<number | null>(null);
  const [routeData, setRouteData] = React.useState<RoutePoint[]>([]);

  useEffect(() => {
    if (db) {
      const loadData = async () => {
        try {
          console.log("🚀 Ingesting Golden Record into DuckDB...");
          
          const response = await fetch('/data/golden_route_record.parquet');
          const buffer = await response.arrayBuffer();
          
          await db.registerFileBuffer('data.parquet', new Uint8Array(buffer));
          const conn = await db.connect();
          
          await conn.query(`CREATE TABLE network_data AS SELECT * FROM read_parquet('data.parquet')`);
          console.log("✅ Golden Record secured in 'network_data' table.");

          // ⚡ QUERY 1: Unique population served
          const popResult = await conn.query(`
            SELECT CAST(SUM(sub.pop) AS INTEGER) as total_pop FROM (
              SELECT DISTINCT da.id, da.pop FROM (
                SELECT UNNEST(route.da_metadata) as da FROM (
                  SELECT UNNEST(routes) as route FROM network_data
                ) t1
              ) t2
            ) sub
          `);
          const popVal = popResult.toArray()[0].total_pop;
          console.log('📊 Engine -> Total Unique Pop Served:', popVal);
          setSystemPopServed(Number(popVal));

          // ⚡ QUERY 2: Full route data (including coords and pillar scores)
          const routeResult = await conn.query(`
            SELECT 
              route.route_id,
              route.name,
              route.short_name,
              route.grade,
              CAST(route.composite_score AS DOUBLE) as composite_score,
              CAST(route.total_pop_served AS INTEGER) as total_pop_served,
              CAST(route.pillar_1_vulnerability AS DOUBLE) as pillar_1,
              CAST(route.pillar_2_temporal AS DOUBLE) as pillar_2,
              CAST(route.pillar_3_monopoly AS DOUBLE) as pillar_3,
              CAST(route.pillar_4_opportunity AS DOUBLE) as pillar_4,
              route.coords
            FROM (
              SELECT UNNEST(routes) as route FROM network_data
            ) t1
          `);

          const rows = routeResult.toArray();
          const routes: RoutePoint[] = rows.map((row: any) => {
            // Convert coords from Arrow format
            let coords: number[][] = [];
            try {
              const rawCoords = row.coords;
              if (rawCoords && rawCoords.toArray) {
                coords = rawCoords.toArray().map((c: any) => {
                  if (c && c.toArray) return Array.from(c.toArray());
                  return Array.isArray(c) ? c : [];
                });
              } else if (Array.isArray(rawCoords)) {
                coords = rawCoords;
              }
            } catch (e) {
              console.warn('Could not parse coords for route', row.route_id);
            }

            return {
              route_id: String(row.route_id),
              name: String(row.name),
              short_name: String(row.short_name),
              grade: String(row.grade),
              composite_score: Number(row.composite_score),
              total_pop_served: Number(row.total_pop_served),
              pillar_1: Number(row.pillar_1),
              pillar_2: Number(row.pillar_2),
              pillar_3: Number(row.pillar_3),
              pillar_4: Number(row.pillar_4),
              coords,
            };
          });
          
          console.log(`📊 Engine -> ${routes.length} routes loaded (with coords & pillars)`);
          setRouteData(routes);
          
          await conn.close();
        } catch (err) {
          console.error("❌ Data Ingestion Failed:", err);
        }
      };

      loadData();
    }
  }, [db]);

  const selectedRouteData = routeData.find((r) => r.route_id === selectedRoute) || null;

  return (
    <div className="w-full h-full flex">
      {/* Sidebar */}
      <div className="w-72 border-r border-slate-200 h-full flex-shrink-0 hidden md:block">
        <Sidebar routes={routeData} />
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full flex flex-col relative">
        {/* Engine Status */}
        <div className="absolute top-4 left-4 z-10 command-card p-3 flex items-center gap-3">
          <div className={`status-indicator ${isInitializing ? 'bg-amber-500 animate-pulse' : db ? 'bg-brand-teal-500' : 'bg-brand-rose-500'}`} />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-slate-800">
            {isInitializing ? 'INITIALIZING ENGINE...' : db ? 'ENGINE SECURE' : 'ENGINE FAILURE'}
          </span>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map systemPopServed={systemPopServed} routes={routeData} />
        </div>
        
        {/* Bottom Panels */}
        <div className="h-1/3 border-t border-white/20 glass-panel grid grid-cols-2 gap-4 p-4 z-10 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] relative">
          <div className="command-card bg-brand-slate-50/50 flex flex-col p-3 overflow-hidden">
              <span className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-widest mb-1 text-center">Score Breakdown</span>
              <div className="flex-1 min-h-0">
                <ShapWaterfall route={selectedRouteData} />
              </div>
          </div>
          <div className="command-card bg-brand-slate-50/50 flex flex-col p-3 overflow-hidden">
              <span className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-widest mb-1 text-center">Ridership-Equity Quadrant</span>
              <div className="flex-1 min-h-0">
                <EquityQuadrant data={routeData} />
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
