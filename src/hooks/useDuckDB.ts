import { useState, useEffect } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';

export const useDuckDB = () => {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const initDb = async () => {
      if (db || isInitializing) return;
      setIsInitializing(true);

      try {
        // Use jsDelivr bundles to completely bypass Next.js Webpack Wasm loader issues
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        
        // Select a bundle based on browser checks
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        // Bypass Cross-Origin Worker Security Errors by wrapping the CDN URL in a local Blob
        const workerURL = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
        );

        // Instantiate the async version of DuckDB-wasm
        const worker = new Worker(workerURL);
        const logger = new duckdb.ConsoleLogger();
        const newDb = new duckdb.AsyncDuckDB(logger, worker);
        
        await newDb.instantiate(bundle.mainModule, bundle.pthreadWorker);
        
        if (active) {
          setDb(newDb);
          setIsInitializing(false);
          console.log('🦆 DuckDB-Wasm initialized successfully!');
        }
      } catch (err) {
        console.error('Failed to initialize DuckDB:', err);
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to initialize DuckDB');
          setIsInitializing(false);
        }
      }
    };

    initDb();

    return () => {
      active = false;
    };
  }, []); // Only run once on mount

  return { db, isInitializing, error };
};
