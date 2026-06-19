"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useDuckDB } from '@/hooks/useDuckDB';
import { useRouteStore } from '@/store/routeStore';
import { useReactiveScoring } from '@/hooks/useReactiveScoring';
import { EquityQuadrant, RoutePoint } from '@/components/charts/EquityQuadrant';
import { ShapWaterfall } from '@/components/charts/ShapWaterfall';
import { EquityMatrix, RouteWithDAs, DaInfo } from '@/components/charts/EquityMatrix';
import { NetworkDistribution } from '@/components/charts/NetworkDistribution';
import { Sidebar } from '@/components/Sidebar';
import { SpotlightSearch } from '@/components/ui/SpotlightSearch';
import { RouteStabilityScatter } from '@/components/charts/RouteStabilityScatter';

const Map = dynamic(() => import('@/components/map/Map'), { ssr: false });

export const CommandCentre = () => {
  const { db, isInitializing, error } = useDuckDB();
  const weights = useRouteStore((state) => state.weights);
  const selectedRoute = useRouteStore((state) => state.selectedRoute);
  const mapFilterMode = useRouteStore((state) => state.mapFilterMode);

  const disabledWeights = useRouteStore((state) => state.disabledWeights);
  const is2PillarActive = disabledWeights.includes('resilience') && disabledWeights.includes('monopoly');

  const [systemPopServed, setSystemPopServed] = React.useState<number | null>(null);
  const [baseRoutes, setBaseRoutes] = React.useState<RouteWithDAs[]>([]);
  const [sensitivityData4Pillar, setSensitivityData4Pillar] = React.useState<Record<string, any>>({});
  const [sensitivityData2Pillar, setSensitivityData2Pillar] = React.useState<Record<string, any>>({});
  const [daAreaMap, setDaAreaMap] = React.useState<Record<string, number>>({});

  const sensitivityData = is2PillarActive ? sensitivityData2Pillar : sensitivityData4Pillar;

  // Fetch DA boundaries to build land area lookup
  React.useEffect(() => {
    fetch('/data/da_boundaries_simple.geojson')
      .then((res) => res.json())
      .then((data) => {
        const lookup: Record<string, number> = {};
        if (data && data.features) {
          data.features.forEach((f: any) => {
            const dauid = String(f.properties?.DAUID || '');
            const area = Number(f.properties?.LANDAREA || 0.0);
            if (dauid && area > 0) {
              lookup[dauid] = area;
            }
          });
        }
        setDaAreaMap(lookup);
      })
      .catch((err) => console.error('Failed to load DA boundaries geojson:', err));
  }, []);

  // Fetch sensitivity data
  React.useEffect(() => {
    // 4-Pillar
    fetch('/data/sensitivity_summary.csv')
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim());
        const lookup: Record<string, any> = {};
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const values = line.split(',').map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, idx) => {
            const val = values[idx];
            if (h === 'route_id' || h === 'name' || h === 'short_name' || h === 'stability_class') {
              obj[h] = val || '';
            } else {
              obj[h] = Number(val || 0);
            }
          });
          if (obj.route_id) {
            lookup[obj.route_id] = obj;
          }
        }
        setSensitivityData4Pillar(lookup);
      })
      .catch((err) => console.error('Failed to load 4-pillar sensitivity summary:', err));

    // 2-Pillar
    fetch('/data/sensitivity_summary_2_pillar.csv')
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim());
        const lookup: Record<string, any> = {};
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const values = line.split(',').map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, idx) => {
            const val = values[idx];
            if (h === 'route_id' || h === 'name' || h === 'short_name' || h === 'stability_class') {
              obj[h] = val || '';
            } else {
              obj[h] = Number(val || 0);
            }
          });
          if (obj.route_id) {
            lookup[obj.route_id] = obj;
          }
        }
        setSensitivityData2Pillar(lookup);
      })
      .catch((err) => console.error('Failed to load 2-pillar sensitivity summary:', err));
  }, []);

  // ⚡ Reactive Scoring Engine — recalculates composite, sigmoid, grades, and SHAP
  // every time weights change. Pure math on 235 routes = microseconds.
  const { scoredRoutes, networkStats } = useReactiveScoring(baseRoutes, weights);

  const selectedGrade = useRouteStore((state) => state.selectedGrade);
  const filteredRoutes = React.useMemo(() => {
    if (!selectedGrade) return scoredRoutes;
    return scoredRoutes.filter((r) => r.grade === selectedGrade);
  }, [scoredRoutes, selectedGrade]);

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

          // ⚡ QUERY 1: Unique population
          const popResult = await conn.query(`
            SELECT CAST(SUM(sub.pop) AS INTEGER) as total_pop FROM (
              SELECT DISTINCT da.id, da.pop FROM (
                SELECT UNNEST(route.da_metadata) as da FROM (
                  SELECT UNNEST(routes) as route FROM network_data
                ) t1
              ) t2
            ) sub
          `);
          setSystemPopServed(Number(popResult.toArray()[0].total_pop));

          // ⚡ QUERY 2: Route data with coords, pillars, and da_metadata
          // Use route.* to expand all struct fields into columns. This is
          // schema-agnostic: it never names specific fields in SQL, so it
          // can never crash on missing struct members (stability_class,
          // trip_count, etc.). All type conversion and optional field
          // extraction happens in JavaScript below with safe defaults.
          const routeResult = await conn.query(`
            SELECT route.*
            FROM (
              SELECT UNNEST(routes) as route FROM network_data
            ) t1
          `);

          const rows = routeResult.toArray();
          const routes: RouteWithDAs[] = rows.map((row: any) => {
            // Parse coords
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

            // Parse da_metadata
            let da_data: DaInfo[] = [];
            try {
              const rawDa = row.da_metadata;
              if (rawDa && rawDa.toArray) {
                da_data = rawDa.toArray().map((d: any) => ({
                  id: String(d.id || ''),
                  pop: Number(d.pop || 0),
                  low_income_pct: Number(d.low_income_pct || 0),
                  minority_pct: Number(d.minority_pct || 0),
                  senior_pct: Number(d.senior_pct || 0),
                  lone_parent_pct: Number(d.lone_parent_pct || 0),
                  recent_immigrant_pct: Number(d.recent_immigrant_pct || 0),
                  youth_pct: Number(d.youth_pct || 0),
                  vulnerability_index: d.vulnerability_index !== undefined ? Number(d.vulnerability_index) : (d.vulnerability !== undefined ? Number(d.vulnerability) : undefined),
                  neighbourhood: String(d.neighbourhood || ''),
                }));
              }
            } catch (e) {
              console.warn('Could not parse da_metadata for route', row.route_id);
            }

            return {
              route_id: String(row.route_id || ''),
              name: String(row.name || ''),
              short_name: String(row.short_name || ''),
              grade: String(row.grade || 'C'),
              composite_score: Number(row.composite_score || 0),
              total_pop_served: Number(row.total_pop_served || 0),
              pillar_1: Number(row.pillar_1_vulnerability || 0),
              pillar_2: Number(row.pillar_2_temporal || 0),
              pillar_3: Number(row.pillar_3_monopoly || 0),
              pillar_4: Number(row.pillar_4_opportunity || 0),
              coords,
              da_data,
              stability_class: String(row.stability_class || 'Moderate Stability'),
              stability_class_2_pillar: String(row.stability_class_2_pillar || 'Moderate Stability'),
              trip_count: Number(row.trip_count || 0),
              category: String(row.category || 'bus_regular'),
              route_length_km: Number(row.route_length_km || 0),
            };
          });
          
          console.log(`📊 Engine -> ${routes.length} routes loaded (coords + pillars + DA metadata)`);
          setBaseRoutes(routes);
          
          await conn.close();
        } catch (err) {
          console.error("❌ Data Ingestion Failed:", err);
        }
      };

      loadData();
    }
  }, [db]);

  const selectedRouteData = scoredRoutes.find((r) => r.route_id === selectedRoute) || null;

  return (
    <div className="w-full h-full flex">
      {/* Sidebar */}
      <div className="w-72 border-r border-slate-200 h-full flex-shrink-0 hidden md:block">
        <Sidebar routes={scoredRoutes} />
      </div>

      {/* Main Content — scrollable */}
      <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
        {/* Fixed-height top section */}
        <div className="relative" style={{ height: '65vh', minHeight: '500px' }}>
          {/* Engine Status */}
          <div className="absolute top-4 left-4 z-10 command-card p-3 flex items-center gap-3">
            <div className={`status-indicator ${isInitializing ? 'bg-amber-500 animate-pulse' : db ? 'bg-brand-teal-500' : 'bg-brand-rose-500'}`} />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-slate-800">
              {isInitializing ? 'INITIALIZING ENGINE...' : db ? 'ENGINE SECURE' : 'ENGINE FAILURE'}
            </span>
          </div>

          {/* Map */}
          <div className="w-full h-full">
            <Map systemPopServed={systemPopServed} routes={filteredRoutes} />
          </div>
        </div>
        
        {/* Analytical Panels Row */}
        <div className="glass-panel grid grid-cols-2 gap-4 p-4 z-10 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] relative" style={{ minHeight: '400px' }}>
          <div className="command-card bg-brand-slate-50/50 flex flex-col p-3 overflow-hidden">
              <span className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-widest mb-1 text-center">Score Breakdown</span>
              <div className="flex-1 min-h-0">
                <ShapWaterfall route={selectedRouteData} networkStats={networkStats} sensitivityData={sensitivityData} />
              </div>
          </div>
          <div className="command-card bg-brand-slate-50/50 flex flex-col p-3 overflow-hidden">
              <span className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-widest mb-1 text-center">
                {mapFilterMode === 'stability' ? 'Volatility vs. Mean Score (Policy Risk Map)' : 'Population-Equity Quadrant'}
              </span>
              <div className="flex-1 min-h-0">
                {mapFilterMode === 'stability' ? (
                  <RouteStabilityScatter sensitivityData={sensitivityData} />
                ) : (
                  <EquityQuadrant data={filteredRoutes} allRoutes={scoredRoutes} />
                )}
              </div>
          </div>

        </div>
 
        {/* Equity Dissemination Matrix — Full Width */}
        <div className="p-4">
          <EquityMatrix routes={filteredRoutes} daAreaMap={daAreaMap} />
          
          {/* Aggregate Distribution Panel */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="mb-2">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">System-Wide Health Diagnostics</h2>
              <p className="text-xs text-slate-500">Aggregate performance distribution across the network.</p>
            </div>
            <NetworkDistribution data={filteredRoutes} />
          </div>
        </div>
      </div>
      <SpotlightSearch routes={scoredRoutes} />
    </div>
  );
};
