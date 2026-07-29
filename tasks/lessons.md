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

## L-002: React Hook Ordering — Conditional Returns Before Hooks (2026-07-29)

**What happened**: `BusStopDirectoryModal.tsx` had `if (!isOpen) return null` placed before `useMemo` calls, violating React's rules of hooks. When the modal opened, React saw more hooks than in the previous render and threw.

**Defensive rule**: ALL hooks (`useState`, `useMemo`, `useCallback`, `useEffect`, `useRef`) must execute before ANY conditional return statement. Period. No exceptions. Move early-return guards to after the last hook call.
