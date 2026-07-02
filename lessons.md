# Lessons Learned

## Project: Route Equity Scorecard

### Tool Usage & Configuration
- **Artifact Paths**: Artifacts (`IsArtifact: true`) must be stored in the App Data directory (`C:\Users\matdow\.gemini\antigravity\brain\...`). Project files should have `IsArtifact: false` and use the workspace path.
- **Directory Creation**: `write_to_file` automatically creates parent directories if they don't exist, which is useful when the workspace is initially empty.

### Process
- **Plan Mode**: Always initialize `tasks/tasklist.md` before starting non-trivial work.

### UI/UX Design
- **Semantic Color Isolation**: Input controls (such as weight sliders) must not borrow high-contrast color palettes reserved for qualitative maps, grades, or indicators (e.g., emerald/blue/amber/orange/red grades). Reusing categorical colors on inputs causes cognitive confusion. Instead, style input elements with a premium neutral medium gray (e.g., slate-500 `#64748B`) and a high-contrast black thumb dot to decouple controls from data indicators.

### Architecture
- **Immutable Base vs. Dynamic Computed Data**: The pillar scores (z-score normalized) are immutable and loaded once from Parquet. The composite score, sigmoid, grade, and SHAP contributions are *derived* values that must be recomputed when weights change. Separating `baseRoutes` (immutable) from `scoredRoutes` (derived via `useReactiveScoring`) is the key architectural insight.
- **Single Source of Truth**: `useReactiveScoring` is the only place that computes scores. `CommandCentre` calls it once and passes the result down. No component should independently compute or store scores.
- **Mapbox Hot-Swap**: Use `source.setData()` to update GeoJSON data without reinitializing layers or event handlers. Keep one-time setup (layers, click handlers) separate from reactive data updates.
- **Python ↔ TypeScript Parity**: The frontend scoring hook must use identical math to `scripts/refine_scoring.py` — same sigmoid formula, same quintile logic, same mean/SD calculation. Verify at default weights.
- **Atomic Multi-State Updates vs. Sequential Updates**: When dealing with highly dependent and reactive state systems (like our zero-sum weight sliders), sequential asynchronous updates (like `setWeight` with sequential `setTimeout` triggers) can lead to rounding drift, race conditions, or intermediate zero-sum re-distribution side-effects. Always implement atomic actions (`setWeights`) in the store to apply multi-variable transitions simultaneously.
- **Terminal Encoding Safety (CP1252 / Unicode Emojis)**: Under standard Windows environments, python print statements containing emoji characters or non-ASCII symbols can trigger a fatal `UnicodeEncodeError` due to default console encoding (typically CP1252). Avoid printing emojis or special mathematical symbols directly in print statements; instead, use clean ASCII brackets (e.g. `[SUCCESS]` or `[1/5]`).
- **Census Data Scaling (Percentage vs. Counts)**: Census dissemination area profiles might contain absolute counts represented as floating-point numbers due to statistical perturbations or suppression logic (e.g. `seniors = 5.7` or `22.2` in a DA). Always double check the column statistics and ranges relative to total population before assuming a column is pre-calculated as a percentage, as naively scaling or misinterpreting count columns will skew standardizations.

## Update GitHub Protocol
Whenever the USER requests an update to GitHub (e.g., "Update Github" or "Sync to remote"), the agent must execute the following 5-step protocol:
# Lessons Learned

## Project: Route Equity Scorecard

### Tool Usage & Configuration
- **Artifact Paths**: Artifacts (`IsArtifact: true`) must be stored in the App Data directory (`C:\Users\matdow\.gemini\antigravity\brain\...`). Project files should have `IsArtifact: false` and use the workspace path.
- **Directory Creation**: `write_to_file` automatically creates parent directories if they don't exist, which is useful when the workspace is initially empty.

### Process
- **Plan Mode**: Always initialize `tasks/tasklist.md` before starting non-trivial work.

### UI/UX Design
- **Semantic Color Isolation**: Input controls (such as weight sliders) must not borrow high-contrast color palettes reserved for qualitative maps, grades, or indicators (e.g., emerald/blue/amber/orange/red grades). Reusing categorical colors on inputs causes cognitive confusion. Instead, style input elements with a premium neutral medium gray (e.g., slate-500 `#64748B`) and a high-contrast black thumb dot to decouple controls from data indicators.

### Architecture
- **Immutable Base vs. Dynamic Computed Data**: The pillar scores (z-score normalized) are immutable and loaded once from Parquet. The composite score, sigmoid, grade, and SHAP contributions are *derived* values that must be recomputed when weights change. Separating `baseRoutes` (immutable) from `scoredRoutes` (derived via `useReactiveScoring`) is the key architectural insight.
- **Single Source of Truth**: `useReactiveScoring` is the only place that computes scores. `CommandCentre` calls it once and passes the result down. No component should independently compute or store scores.
- **Mapbox Hot-Swap**: Use `source.setData()` to update GeoJSON data without reinitializing layers or event handlers. Keep one-time setup (layers, click handlers) separate from reactive data updates.
- **Python ↔ TypeScript Parity**: The frontend scoring hook must use identical math to `scripts/refine_scoring.py` — same sigmoid formula, same quintile logic, same mean/SD calculation. Verify at default weights.
- **Atomic Multi-State Updates vs. Sequential Updates**: When dealing with highly dependent and reactive state systems (like our zero-sum weight sliders), sequential asynchronous updates (like `setWeight` with sequential `setTimeout` triggers) can lead to rounding drift, race conditions, or intermediate zero-sum re-distribution side-effects. Always implement atomic actions (`setWeights`) in the store to apply multi-variable transitions simultaneously.
- **Terminal Encoding Safety (CP1252 / Unicode Emojis)**: Under standard Windows environments, python print statements containing emoji characters or non-ASCII symbols can trigger a fatal `UnicodeEncodeError` due to default console encoding (typically CP1252). Avoid printing emojis or special mathematical symbols directly in print statements; instead, use clean ASCII brackets (e.g. `[SUCCESS]` or `[1/5]`).
- **Census Data Scaling (Percentage vs. Counts)**: Census dissemination area profiles might contain absolute counts represented as floating-point numbers due to statistical perturbations or suppression logic (e.g. `seniors = 5.7` or `22.2` in a DA). Always double check the column statistics and ranges relative to total population before assuming a column is pre-calculated as a percentage, as naively scaling or misinterpreting count columns will skew standardizations.

## Update GitHub Protocol
Whenever the USER requests an update to GitHub (e.g., "Update Github" or "Sync to remote"), the agent must execute the following 5-step protocol:
1. **Status Inspection**: Run `git status` to identify modified, added, or deleted files.
2. **Clean Staging**: Stage the changes using `git add .` to gather all edits.
3. **Elite Commit Message Formulation**: Generate a precise, professional, and descriptive commit message that summarizes the logical changes (e.g. `feat: implement UTM spatial decay re-scoring pipeline`). Avoid generic or short messages.
4. **Push Execution**: Execute a push to the active branch (`git push origin <branch_name>`).
5. **Confirmation Summary**: Print the commit hash, modified files, and push confirmation in a concise markdown table or list for the USER.

### Demographic Weight Calibration & Equal Weighting
- **Equal-Weight Policy Baseline**: Using equal weights (`1.0` for all indicators) provides a policy-neutral, simple, and transparent baseline for demographic vulnerability scoring. This removes administrative or political bias from the index's default settings while retaining a high correlation (0.98) with complex empirical weighting schemes (like PCA-derived weights), making it highly defensible for public transit policy.

### Scrollytelling UI Layouts
- **Breakout Visuals & Horizontal Comparisons**: When comparing two contrasting items (like Route 2 and Route 3) in vertical scrollytelling layouts, stacking them horizontally on desktop while allowing them to break out of the standard container width (via negative margins like `lg:-mx-24`) creates a premium, high-impact editorial feel. This keeps comparisons side-by-side for easier diagnostic scanning and adds visual breathing room.
- **Seamless Inline Methodologies**: Providing interactive "Tell me more about the math" toggle disclosures directly below data components with tailored, beautiful SVG/CSS visuals is far more engaging and seamless than sending the user to separate docs or worksheets, preserving flow and context.

### SWC Parser Errors & JSX Tag Balancing
- **Misleading SWC Error Locations**: When SWC reports "Unexpected token `div`. Expected jsx identifier" at the root `return (<div>...)` of a component, the actual cause is almost never at that line. It's typically a missing closing JSX tag (`</section>`, `</div>`, etc.) somewhere deeper in the JSX body. SWC's parser backtracks to the root element when the JSX tree is structurally invalid.
- **Debugging Protocol**: When facing a JSX parse error: (1) Verify brace balance first, (2) check for hidden/zero-width characters, (3) **count opening and closing HTML-like tags** (`<section>` vs `</section>`, `<div>` vs `</div>`) — this is the most likely root cause, (4) emoji in JSX comments or string content is almost never the issue.
- **Preventive Rule**: After any batch edit that modifies JSX section boundaries, always run a tag-pair verification pass before committing. Specifically verify that every `<section>` has a matching `</section>` at the correct indentation level.
- **Raw Less-Than Symbols**: Raw `<` characters in JSX text nodes or inside string literals wrapped in JSX curly brace expressions (e.g., `label: 'Youth (<18)'` or `range: '< 15 mins'`) can be mistakenly parsed as JSX opening tags by compiler tools like SWC. This triggers the generic `Unexpected token div. Expected jsx identifier` error due to backtracking. Always escape them using HTML entities (`&lt;`) in text nodes, or unicode/hex escape sequences (`\u003c` or `\x3c`) in JS/TS string literals.
- **LaTeX Curly Braces in JSX**: Literal braces `{` and `}` in text nodes (such as inside LaTeX mathematical formulations like `R_i \setminus \{r\}` or `S_{i,r}`) will be interpreted by the JSX compiler as the start and end of JavaScript expression blocks. This triggers a compiler syntax error that backtracks to the root of the component (e.g. `Unexpected token div`). To prevent this, always wrap text containing literal braces in a JSX expression string literal (e.g. `{"FR_{i,r} = \\frac{|S_{i,r}|}{|D_r|}"}`).

- **TypeScript Generics inside TSX Bodies**: Compiler tools like SWC can misinterpret generic type arguments containing angle brackets (`<` and `>`) inside the component body (e.g., `useState<'002' | '003'>('002')` or `(Object.keys(weights) as Array<keyof typeof weights>)`) as the beginning of a JSX block. This completely confuses the parser and results in the "Unexpected token `div`. Expected jsx identifier" syntax error at the root `return (` statement. To permanently avoid this, remove all generic brackets before the `return` statement in `.tsx` files, and instead use the TypeScript `as` cast syntax (e.g. `useState('002' as '002' | '003')` or `useState([] as any[])`).
- **Raw Less-Than Symbols in For-Loops**: Similar to the generic bug, using `<` in a standard for-loop (e.g., `for (let i = 0; i < array.length; i++)`) can trigger SWC parser collapse in `.tsx` files if an arrow function (`=>`) or other `>` symbol appears shortly after. The parser treats `i < array.length ... =>` as a massive unclosed JSX tag, triggering the same backtracking `Unexpected token div` error. The fix is to flip the logic to avoid `<` entirely: `for (let i = 0; array.length > i; i++)`.
