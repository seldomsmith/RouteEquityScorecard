# Split-Screen Sticky Panels — Layout Redesign Plan

## Concept

Replace the current single-column stacked layout with a two-panel split-screen. The **left panel** (40% width) scrolls naturally and contains all narrative text. The **right panel** (60% width) is `position: sticky` and swaps its visual content (maps, charts, simulations) as the reader scrolls past each section boundary on the left.

The effect: the reader scrolls through the story on the left, and the right side of the screen always shows the relevant interactive visual for whatever section they're currently reading. No scrolling past giant chart blocks — the visuals persist at eye level until the next one takes over.

---

## Section-by-Section Content Mapping

Each section splits into a **Text Track** (left) and a **Sticky Visual** (right):

| Section | Left Panel (Text) | Right Panel (Sticky Visual) |
|---|---|---|
| **1. Introduction** | Narrative paragraphs + RouteTicket cards | `ExplainerMap` side-by-side (Route 002 + 003) |
| **2. Four Pillars** | Brief intro paragraph | `FourPillars` card grid (2×2 on the right) |
| **3. Vulnerability** | Methodology text + score comparison | `InteractiveToggleMap` (demographic heatmap) |
| **4. Destination Opportunity** | Methodology text + score breakdown | `GroceryFlowViz` + destination stat grid |
| **5. Off-Peak Service** | Methodology text + RouteTicket cards | `OffPeakFrequencyChart` (frequency line chart) |
| **6. Transit Monopoly** | Methodology text + formula breakdown | `CatchmentBarrierMap` (catchment radius map) |
| **6.5. On-Demand Transit** | ODT narrative | `OdtExplainerMap` (Route 727 overlay) |
| **7. Policy Weights Simulator** | Weight slider controls + live score readout | `ShapWaterfall` (SHAP waterfall chart) |
| **8. Stability & Volatility** | Narrative + Monte Carlo explanation | `MonteCarloPlinko` (simulation charts) |
| **9. Methodological Limitations** | Full narrative (no complex visual) | `StaggeredMenu` limitations list or static illustration |
| **10. Call to Action** | CTA buttons + closing narrative | Scatterplot (Mean vs. Volatility) |

---

## Architectural Changes

### New Wrapper: `SplitScreenLayout.tsx`

A reusable layout shell that manages the split:

```
┌──────────────────────────────────────────────┐
│  Header (fixed, full-width, z-50)            │
├──────────────┬───────────────────────────────┤
│              │                               │
│  Left Panel  │  Right Panel                  │
│  (scrolls)   │  (position: sticky;           │
│  40% width   │   top: 4rem; height: calc     │
│              │   (100vh - 4rem); 60% width)  │
│              │                               │
│  Section 1   │  ┌─────────────────────────┐  │
│  text...     │  │                         │  │
│              │  │   Active Visual          │  │
│  Section 2   │  │   (crossfade on          │  │
│  text...     │  │    section change)       │  │
│              │  │                         │  │
│  Section 3   │  └─────────────────────────┘  │
│  text...     │                               │
│              │                               │
└──────────────┴───────────────────────────────┘
```

- The right panel uses `position: sticky; top: 64px` (below header) with `height: calc(100vh - 64px)`.
- Active visual determined by an `IntersectionObserver` on each left-panel section. Whichever section has >50% viewport intersection drives the right panel content.
- Visual transitions use a crossfade (`opacity` + `transition-opacity duration-500`) rather than hard swaps.

### Section Refactor

Each current `<section>` block in `Scrollytelling.tsx` gets decomposed into two child components:
- `SectionNarrative` — the text, RouteTickets, expandable details
- `SectionVisual` — the map/chart/simulation widget

The `SplitScreenLayout` receives an array of `{ narrative: ReactNode, visual: ReactNode }` and handles rendering + intersection tracking.

### Mobile Fallback (< 768px)

On screens below `md` breakpoint, the layout collapses back to the current stacked single-column design. The sticky panel becomes a regular inline block. No functionality loss, just a different reading flow. This is handled with a single Tailwind responsive prefix: `md:flex-row` on the container and `md:sticky` on the right panel.

### Scroll Progress Bar

The existing subway-map progress tracker in the header continues to work — it reads scroll position from the left panel's `scrollTop` instead of the full-page container.

---

## Sections That Need Special Handling

### Section 7 (Policy Weights Simulator)
Interactive controls on both sides — the sliders live in the "text" column but directly control the visual. This section may need the slider controls duplicated into the sticky panel, or the sticky panel expanded to include a compact slider row above the SHAP chart.

### Section 8 (Monte Carlo Stability)
Has a fullscreen toggle on the simulation. The fullscreen modal needs to break out of the sticky panel and overlay the entire viewport, same as it does today.

### Section 9 (Methodological Limitations)
No heavy visual widget. Options: render the `StaggeredMenu` as the sticky visual, use a static illustration, or let the previous section's visual persist with a dimmed overlay.

---

## Task Breakdown

- [ ] Create `SplitScreenLayout.tsx` wrapper with left/right panel structure and `IntersectionObserver` logic
- [ ] Extract each section's text content into `SectionNarrative` fragments
- [ ] Extract each section's visual widget into `SectionVisual` fragments
- [ ] Wire the section mapping array into `SplitScreenLayout` with crossfade transitions
- [ ] Implement mobile fallback (stacked layout below `md` breakpoint)
- [ ] Migrate scroll progress tracking from full-page to left-panel `scrollTop`
- [ ] Handle Section 7 slider/visual co-location
- [ ] Handle Section 8 fullscreen breakout from sticky panel
- [ ] Handle Section 9 visual-less section gracefully
- [ ] Verify header, subway progress bar, and "View Scorecard" button still function
- [ ] Test responsive breakpoints (mobile, tablet, desktop)
- [ ] Performance audit — ensure maps/charts in sticky panel don't re-mount on section change
