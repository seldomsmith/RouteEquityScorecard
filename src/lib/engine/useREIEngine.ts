"use client";

import { useEffect, useState } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import { useWeightingStore } from '@/store/useWeightingStore';

export const useREIEngine = () => {
  const [db, setDb] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const weights = useWeightingStore();

  useEffect(() => {
    const initDB = async () => {
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
      
      const response = await fetch(bundle.mainWorker!);
      const script = await response.text();
      const blob = new Blob([script], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));

      const logger = new duckdb.ConsoleLogger();
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      
      const conn = await db.connect();
      const dataUrl = `${window.location.origin}/data/network_data.parquet`;

      await conn.query(`
        CREATE TABLE network_data AS 
        SELECT * FROM read_parquet('${dataUrl}');
      `);
      
      setDb(conn);
    };

    initDB().catch(err => console.error("DuckDB Init Failed:", err));
  }, []);

  useEffect(() => {
    if (!db) return;

    const runCalculation = async () => {
      const { vulnerability, temporal, monopoly, opportunity } = weights;
      
      const query = `
        SELECT 
          route_id,
          route_name,
          pop_served,
          ROUND(
            ((vuln_score * ${vulnerability}) + 
             (temp_score * ${temporal}) + 
             (mono_score * ${monopoly}) + 
             (opp_score * ${opportunity})) / 
            NULLIF(${vulnerability + temporal + monopoly + opportunity}, 0), 
          1) as rei_score,
          vuln_score,
          temp_score,
          mono_score,
          opp_score
        FROM network_data
        ORDER BY rei_score DESC;
      `;
      
      const res = await db.query(query);
      setResults(res.toArray());
    };

    runCalculation();
  }, [db, weights]);

  return results;
};
