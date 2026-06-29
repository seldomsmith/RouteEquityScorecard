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
