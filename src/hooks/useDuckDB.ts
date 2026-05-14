import { useState, useEffect } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvp_worker,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker,
  },
};

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
        // Select a bundle based on browser checks
        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

        // Instantiate the async version of DuckDB-wasm
        const worker = new Worker(bundle.mainWorker!);
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
