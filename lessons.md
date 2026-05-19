# Lessons Learned

## Project: Route Equity Scorecard

### Tool Usage & Configuration
- **Artifact Paths**: Artifacts (`IsArtifact: true`) must be stored in the App Data directory (`C:\Users\matdow\.gemini\antigravity\brain\...`). Project files should have `IsArtifact: false` and use the workspace path.
- **Directory Creation**: `write_to_file` automatically creates parent directories if they don't exist, which is useful when the workspace is initially empty.

### Process
- **Plan Mode**: Always initialize `tasks/tasklist.md` before starting non-trivial work.

### Architecture
- **Immutable Base vs. Dynamic Computed Data**: The pillar scores (z-score normalized) are immutable and loaded once from Parquet. The composite score, sigmoid, grade, and SHAP contributions are *derived* values that must be recomputed when weights change. Separating `baseRoutes` (immutable) from `scoredRoutes` (derived via `useReactiveScoring`) is the key architectural insight.
- **Single Source of Truth**: `useReactiveScoring` is the only place that computes scores. `CommandCentre` calls it once and passes the result down. No component should independently compute or store scores.
- **Mapbox Hot-Swap**: Use `source.setData()` to update GeoJSON data without reinitializing layers or event handlers. Keep one-time setup (layers, click handlers) separate from reactive data updates.
- **Python ↔ TypeScript Parity**: The frontend scoring hook must use identical math to `scripts/refine_scoring.py` — same sigmoid formula, same quintile logic, same mean/SD calculation. Verify at default weights.
- **Atomic Multi-State Updates vs. Sequential Updates**: When dealing with highly dependent and reactive state systems (like our zero-sum weight sliders), sequential asynchronous updates (like `setWeight` with sequential `setTimeout` triggers) can lead to rounding drift, race conditions, or intermediate zero-sum re-distribution side-effects. Always implement atomic actions (`setWeights`) in the store to apply multi-variable transitions simultaneously.
