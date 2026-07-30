# Engineering Lessons

## L-001: Prop Chain Integrity — The "Phantom Prop" Pattern (2026-07-29)

**What happened**: `Sidebar.tsx` passed `onViewBusStopDirectory={onViewBusStopDirectory}` to `<GlobalNavMenu>`, but the identifier was never declared in `SidebarProps`, never destructured from the component's props, and never defined as a local variable. Runtime exploded with `ReferenceError: onViewBusStopDirectory is not defined`.

**Root cause**: Adding a new navigation path (`bus-stop-directory`) involved touching five files across the prop chain. The prop was added to `GlobalNavMenu`'s interface and to a `<GlobalNavMenu>` call inside `Sidebar.tsx`, but nobody threaded it through `SidebarProps` or passed it from the parent (`CommandCentre`). Meanwhile, `GlobalNavMenu` itself never called the prop — it routed everything through `onNavigate` already.

**Defensive rules**:

1. **Single source of truth for page routing types.** `PageView` lives in `GlobalNavMenu.tsx` and is exported. Every component that touches navigation must `import { PageView }` — no inline union duplicates. When you add a new page, you add it once in `PageView`, and TypeScript propagates the change requirement everywhere.

2. **Before passing a prop in JSX, verify the identifier exists.** If you type `someProp={someIdentifier}`, confirm `someIdentifier` is either (a) in the component's props interface AND destructured, (b) a local const/state, or (c) imported. If none of these, the code will throw at runtime.

3. **After adding a prop to a child's interface, trace the full chain.** Walk from the leaf component (`GlobalNavMenu`) up through every parent that renders it (`Sidebar`, `BusStopAnalysis`, `CommandCentre`, `page.tsx`). At each level, confirm: (a) the prop is declared in the parent's own props interface, (b) it's destructured in the component signature, (c) the parent's parent passes it. If any link in the chain is missing, the prop is undefined.

4. **Dead props are bugs waiting to happen.** If a component declares an interface prop but never references it in the function body, delete it. Dead props create confusion about which callback is authoritative. In this case, `onViewBusStopDirectory` existed alongside `onNavigate` and did the same thing — one was used, one was ignored.

5. **TypeScript strict mode should catch this.** Ensure `tsconfig.json` has `"strict": true` and `"noUnusedLocals": true`. A properly configured TS build would have flagged the undeclared identifier at compile time. Never skip type-checking before deploying.

---

## L-003: Unimported Lucide Icon Identifiers (2026-07-30)

**What happened**: `Scrollytelling.tsx` rendered `<Menu className="w-3.5 h-3.5" />` on line 390, but `Menu` was omitted from the `lucide-react` import statement at the top of the file. Navigation to the "Explain this to me!" scrollytelling page crashed with a client-side exception: `ReferenceError: Menu is not defined`.

**Root cause**: Adding UI elements (like global header menu triggers) quickly without verifying that every JSX component symbol is present in the file's top-level imports.

**Defensive rules**:

1. **Verify every JSX component symbol is explicitly imported.** Whenever inserting a icon component like `<Menu />`, `<ChevronRight />`, or `<BarChart2 />`, verify line-by-line that the identifier is present in the top-level `import { ... } from 'lucide-react'` declaration.
2. **Never rely on global scope for JSX components.** Icons and components are modular exports; an unimported icon will evaluate to `undefined` and throw a client-side exception at runtime.

