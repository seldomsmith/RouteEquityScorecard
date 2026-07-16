# Engineering Lessons

Concrete rules derived from production bugs. Every entry describes a failure mode and a defensive rule to prevent recurrence.

---

## 1. JSX Tag Balance: Close Wrapper Divs Before Relocating Children

**Date:** 2026-06-29  
**Failure:** Scrollytelling.tsx failed to compile with `Unexpected token 'div'. Expected jsx identifier` at the very first JSX element of the return statement (line 237). The error appeared to point at the wrong location because SWC's parser enters a confused state when tag nesting is broken anywhere in the tree.

**Root Cause:** Sections 3, 4, 5, and 6 each had a `<div className="space-y-4">` wrapper around their title, description, and RouteTicket cards. When the math buttons and conditional map blocks were relocated to sit *outside* that wrapper (as direct children of `<section>`), the corresponding `</div>` was never added to close the wrapper before the relocated content. This left 4 unclosed `<div>` tags, breaking the JSX tree.

**Compounding Error:** The initial fix closed 3 of 4 sections (missing Section 4) and failed to remove a now-redundant original `</div>` in Section 6, creating a duplicate close. This required a second commit to fully resolve.

**Defensive Rules:**
- When relocating JSX children outside a wrapper element, always close the wrapper element at the extraction point FIRST, then verify every sibling wrapper in the same file that follows the same pattern.
- After any tag relocation, run a systematic tag balance check across the entire file. Count opens vs closes for `<div>`, `<section>`, `<>` fragments, and all other container elements.
- A global tag count (opens == closes) is necessary but NOT sufficient. Trace the nesting hierarchy section-by-section to confirm each close matches its correct open. Wrong nesting with correct counts still produces parse failures.
- SWC parser errors at the return statement's first JSX element (e.g., line 237) almost always indicate a tag mismatch deeper in the file, not at that line. Don't waste time inspecting the return statement itself; search for unclosed tags in the body.

---

## 2. Always Run `npm install` After Adding Dependencies to package.json

**Date:** 2026-06-29  
**Failure:** `Module not found: Can't resolve 'gsap'` in StaggeredMenu.tsx even though gsap was already declared in package.json.

**Root Cause:** The `gsap` dependency was added to package.json when the StaggeredMenu component was created, but `npm install` was never run in the Codespace environment to actually install the package into `node_modules`.

**Defensive Rules:**
- After adding any new import to a component, verify the package exists in `node_modules` or explicitly run `npm install` in the target environment.
- When working across local + Codespace environments, remember that `git push` syncs source files but NOT `node_modules`. The remote environment must independently run `npm install` after pulling new dependencies.
- Before declaring a feature complete, always verify it compiles in the target build environment, not just that the source files are syntactically correct locally.

---

## 3. Mapbox GL JS Interpolation Expressions: Strict Type Syntax

**Date:** 2026-06-29  
**Failure:** The vulnerability choropleth mapping layer did not color the Dissemination Area (DA) polygons based on the vulnerability index. They remained flat gray.

**Root Cause:** Mapbox GL JS expressions are extremely strict. The second element in the `['interpolate', interpolation, ...]` array must be a valid interpolation type (which must be a nested array expression, e.g. `['linear']` or `['exponential', base]`). Passing a plain string `'linear'` causes the Mapbox GL expression compiler to fail silently or reject the layer config, preventing the color heatmap from rendering.

**Defensive Rules:**
- Always double check the exact Mapbox GL JS expression syntax. When using `interpolate`, the interpolation type must always be enclosed in an array (e.g. `['linear']`), not passed as a raw string.
- If features are confirmed to match (verified by coordinate bounds and key intersections) but the layer is completely invisible, look for type or syntax mismatches in the paint layer expressions.

---

## 4. Viewport-Relative Overlays: Prefer fixed over absolute positioning

**Date:** 2026-06-29  
**Failure:** When clicking the staggered menu button inside the Scrollytelling page, only a tiny white box (64px high) was showing at the top left instead of the navigation sidebar with sections 1-10.

**Root Cause:** The staggered menu component wrapper is nested inside the Scrollytelling header (which has a fixed height of `h-16`/64px). The menu panel was styled with `position: absolute; height: 100%;` which constrained its height to exactly the height of the parent wrapper (64px), clipping the list of sections.

**Defensive Rules:**
- Navigation drawers, modals, and screen overlays should always use `position: fixed; height: 100vh;` and reference the viewport directly, rather than relying on absolute positioning relative to parent containers that might have height limits.
- Make components robust: design them to render correctly regardless of where they are mounted in the DOM.

---

## 5. Narrative Content Audits: Eliminate layout and text duplication

**Date:** 2026-06-29  
**Failure:** Section 2 of the Scrollytelling walkthrough repeated a static bulleted list defining the four pillars of transit equity directly adjacent to a custom interactive card grid (`FourPillars.tsx`) that displayed the exact same descriptions when flipped. This created redundant reading material and visual clutter.

**Defensive Rules:**
- Avoid presenting the same text information in multiple formats (e.g. lists, tables, or text blocks) directly alongside interactive controls (e.g. cards, accordions, or tooltips) that reveal the same copy.
- Structure layouts to let interactive explainer widgets handle detailed definitions, keeping the surrounding narrative body light and introductory.
- Maintain strict vocabulary consistency (e.g. standardizing on "transit riders" rather than mixing "transit users" and "riders").


