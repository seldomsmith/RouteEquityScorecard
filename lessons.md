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
- **Terminal Encoding Safety (CP1252 / Unicode Emojis)**: Under standard Windows environments, python print statements containing emoji characters or non-ASCII symbols can trigger a fatal `UnicodeEncodeError` due to default console encoding (typically CP1252). Avoid printing emojis or special mathematical symbols directly in print statements; instead, use clean ASCII brackets (e.g. `[SUCCESS]` or `[1/5]`).
- **Census Data Scaling (Percentage vs. Counts)**: Census dissemination area profiles might contain absolute counts represented as floating-point numbers due to statistical perturbations or suppression logic (e.g. `seniors = 5.7` or `22.2` in a DA). Always double check the column statistics and ranges relative to total population before assuming a column is pre-calculated as a percentage, as naively scaling or misinterpreting count columns will skew standardizations.

