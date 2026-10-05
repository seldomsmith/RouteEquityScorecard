# Visual Style System & Implementation Guide: ETS Route Equity Scorecard

A production-grade technical specification and implementation manual for reproducing the visual aesthetic, layout architecture, typography, interactive micro-interactions, Mapbox mapping engine, and quantitative data visualizations developed for the Route Equity Scorecard platform.

---

## 1. Design Philosophy & Aesthetic Foundation

The Route Equity Scorecard design pairs high-density data analytics with the clarity of editorial cartography. It combines a clean scientific publication layout with high-contrast, tactile UI components.

### Core Principles
1. **Pristine White Backgrounds with Low-Contrast Framing**: The UI avoids heavy dark themes or harsh drop shadows. Surfaces rest on neutral slates (`#F8FAFC`, `#F1F5F9`) with crisp borders (`#E2E8F0`) and soft, high-diffusion shadows.
2. **Tactile Transit Metaphors**: Physical transit elements appear as digital metaphors throughout: punch cards, transit tickets with notched edges, isometric stamps, pill markers, and live route lines.
3. **Data-Ink Ratio**: Every color corresponds to a quantitative dimension, a stability tier, or an equity grade. Decorative noise is stripped down; colored accents serve as functional status indicators.
4. **Fluid Proximity Micro-Interactions**: Hover states use geometric shifts, spring-physics transforms, and physics-driven menu tracking.
5. **Progressive Mathematical Disclosure**: Top-level views surface high-level grades and clean metrics. Deep statistical formulations (CIMD, sigmoid normalization, SHAP distributions) expand on demand through dedicated modal and drawer systems ("Tell me more about the math").

---

## 2. Color Palette & Functional Token System

### 2.1 Base Slates & Neutrals
The interface relies on Tailwind's Slate palette with custom semantic brand extensions:

| Token / Variable | Hex Value | Role / Usage |
| :--- | :--- | :--- |
| `brand-slate-50` / `bg-slate-50` | `#F8FAFC` | Main canvas / dashboard body background |
| `brand-slate-100` / `bg-slate-100` | `#F1F5F9` | Secondary cards, pill tracks, subtle containers |
| `brand-slate-200` / `border-slate-200` | `#E2E8F0` | Structural card borders, dividers, dashed separators |
| `brand-slate-300` | `#CBD5E1` | Input outlines, inactive toggle borders |
| `brand-slate-400` / `text-slate-400` | `#94A3B8` | Metadata labels, uppercase sub-headers, tick marks |
| `brand-slate-500` / `text-slate-500` | `#64748B` | Secondary explanatory copy, captions, legends |
| `brand-slate-700` / `text-slate-700` | `#334155` | Body text, readable descriptive copy |
| `brand-slate-900` / `text-slate-900` | `#0F172A` | Primary headings, numeric values, metric callouts |
| `brand-slate-950` | `#020617` | High-contrast hero accents |

### 2.2 Brand & Navigational Accents
| Semantic Token | Hex Value | Role / Usage |
| :--- | :--- | :--- |
| **Navy Accent** | `#1E3A8A` / `#1D4ED8` | Primary brand ink, active menu items, section headers |
| **Brand Teal 500** | `#14B8A6` | Active controls, focus rings, selected filters |
| **Brand Teal 600** | `#0D9488` | Isochrone fills, corridor polygon highlights |
| **Brand Teal 700** | `#0F766E` | Isochrone borders, primary transit accents |
| **Brand Rose 500/600** | `#F43F5E` / `#E11D48` | Negative SHAP values, warnings, low-equity alerts |

### 2.3 Equity Grade Quintile Palette
Grades follow a strict 5-tier semantic color assignment:

```typescript
export const GRADE_COLORS: Record<string, string> = {
  A: '#10B981', // Emerald - Grade A (Highest Equity Priority)
  B: '#3B82F6', // Blue    - Grade B (High Equity Priority)
  C: '#F59E0B', // Amber   - Grade C (Moderate Equity Priority)
  D: '#F97316', // Orange  - Grade D (Low Equity Priority)
  E: '#EF4444', // Red     - Grade E (Lowest Equity Priority)
  Regional: '#475569' // Slate - Out of scope / Regional Line
};
```

#### Corresponding Tailwind Badge Badging:
```html
<!-- Grade A Badge -->
<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
  Grade A
</span>
<!-- Grade B Badge -->
<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
  Grade B
</span>
<!-- Grade C Badge -->
<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
  Grade C
</span>
<!-- Grade D Badge -->
<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-50 text-orange-700 border border-orange-200">
  Grade D
</span>
<!-- Grade E Badge -->
<span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-50 text-red-700 border border-red-200">
  Grade E
</span>
```

### 2.4 The Four Pillars Core Palette
Each analytical pillar holds a permanent color assignment:
1. **Transit Vulnerability (CIMD)**: `#EF4444` (Red / Crimson)
2. **Destination Opportunity**: `#4F46E5` (Indigo / Purple)
3. **Off-Peak Service (Night Owl)**: `#10B981` (Emerald)
4. **Transit Monopoly**: `#F59E0B` (Amber / Golden Yellow)

---

## 3. Typography & Text Hierarchy

### 3.1 Font Families
Configured via Next.js Font Optimization (`next/font/google`):
- **Body & Headings**: `Inter` (`--font-inter`, sans-serif)
- **Data, Route Numbers, Coordinates & Metrics**: `ui-monospace, SFMono-Regular, Roboto Mono, Menlo, monospace`

### 3.2 Typographic Hierarchy Reference Table

| Role | Font Family | Size | Weight | Tracking | Lettercase | Sample Tailwind Classes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | Sans (`Inter`) | 5xl - 8xl (48–96px) | 900 (Black) | `-0.05em` (tightest) | Mixed | `text-6xl md:text-8xl font-black tracking-tighter leading-none` |
| **Section Header**| Sans (`Inter`) | xl - 2xl (20–24px) | 800 (Extrabold) | `-0.025em` | Mixed | `text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight` |
| **Card Title** | Sans (`Inter`) | lg (18px) | 700 (Bold) | `-0.02em` | Mixed | `text-lg font-bold text-slate-900 tracking-tight` |
| **Eyebrow / Overline** | Mono / Sans | 10px - 11px | 900 (Black) | `0.1em` (widest) | Uppercase | `text-[10px] font-black uppercase tracking-widest text-[#1e3a8a]` |
| **Body Primary** | Sans (`Inter`) | 14px - 15px | 500 (Medium) | Normal | Mixed | `text-sm text-slate-700 leading-relaxed font-normal` |
| **Data Metric Large** | Mono | 24px - 32px | 900 (Black) | `-0.02em` | Numbers | `text-2xl font-mono font-black text-slate-900` |
| **Metric Label** | Sans (`Inter`) | 10px | 700 (Bold) | `0.05em` | Uppercase | `text-[10px] font-bold text-slate-400 uppercase tracking-wider` |
| **Ticket Strip** | Mono | 11px - 12px | 900 (Black) | `0.15em` | Uppercase | `font-mono font-black text-white text-xs tracking-widest uppercase` |

---

## 4. Tactile Components & Design Details

### 4.1 The Transit "Ticket Card" Component (`RouteTicket.tsx`)
A tactile card designed to resemble an embossed, perforated public transit pass with an indented notch and rotated vertical header strip.

```tsx
// Complete component implementation
import React from 'react';

interface RouteTicketProps {
  routeNumber: string;
  theme: 'blue' | 'orange';
  title: string;
  description: string;
  metrics?: { label: string; value: string | number }[];
  heightClass?: string;
}

export const RouteTicket: React.FC<RouteTicketProps> = ({
  routeNumber,
  theme,
  title,
  description,
  metrics,
  heightClass = 'h-[200px]',
}) => {
  const isBlue = theme === 'blue';
  const stripeColor = isBlue ? 'bg-blue-600' : 'bg-yellow-500';
  const textColor = isBlue ? 'text-blue-900' : 'text-yellow-800';

  return (
    <div className={`flex w-full ${heightClass} bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg`}>
      {/* 1. Left Vertical Route Stripe with Perforation Punch */}
      <div className={`w-14 flex-shrink-0 ${stripeColor} flex items-center justify-center relative select-none`}>
        {/* Rotated text reading upwards */}
        <span 
          className="font-mono font-black text-white text-xs tracking-widest uppercase"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          ROUTE {routeNumber}
        </span>
        
        {/* Ticket Hole-Punch Notch */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-white rounded-l-full border-y border-l border-slate-100 shadow-inner" />
      </div>

      {/* 2. Main Content Body */}
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
        <div>
          <h3 className={`text-xl font-extrabold ${textColor} tracking-tight mb-2`}>
            {title}
          </h3>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-medium">
            {description}
          </p>
        </div>

        {/* 3. Dashed Tear-off Metrics Section */}
        {metrics && metrics.length > 0 && (
          <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {metrics.map((m, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</span>
                  <span className={`text-xs font-mono font-black ${textColor}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### 4.2 3D Retro Hard-Shadow Card Lift (`FourPillars.tsx` & `globals.css`)
Rather than relying on generic fuzzy drop-shadows, pillar cards use an isometric, multi-layered hard offset shadow matching the card's border color, shifting smoothly when hovered:

```css
/* In globals.css */
.pillar-card-lift {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
  transform: translate(0, 0);
  border-color: var(--pillar-color);
  box-shadow:
    1px 1px 0px 0px var(--pillar-color),
    2px 2px 0px 0px var(--pillar-color),
    3px 3px 0px 0px var(--pillar-color),
    4px 4px 0px 0px var(--pillar-color),
    5px 5px 0px 0px var(--pillar-color),
    6px 6px 0px 0px var(--pillar-color);
}

.pillar-card-lift:hover {
  transform: translate(-6px, -6px);
  box-shadow:
    1px 1px 0px 0px var(--pillar-color),
    2px 2px 0px 0px var(--pillar-color),
    3px 3px 0px 0px var(--pillar-color),
    4px 4px 0px 0px var(--pillar-color),
    5px 5px 0px 0px var(--pillar-color),
    6px 6px 0px 0px var(--pillar-color),
    7px 7px 0px 0px var(--pillar-color),
    8px 8px 0px 0px var(--pillar-color),
    9px 9px 0px 0px var(--pillar-color),
    10px 10px 0px 0px var(--pillar-color),
    11px 11px 0px 0px var(--pillar-color),
    12px 12px 0px 0px var(--pillar-color);
}
```

#### Component Markup:
```tsx
<div 
  className="w-full pillar-card-lift flex flex-col bg-white rounded-2xl border-2 overflow-hidden"
  style={{ '--pillar-color': '#4F46E5' } as React.CSSProperties}
>
  <div className="p-5 flex flex-col items-center justify-center text-center text-white bg-[#4F46E5]">
    <div className="p-2.5 bg-white/15 rounded-lg border border-white/20 mb-2">
      <Target className="w-5 h-5 text-white" />
    </div>
    <span className="text-xs font-black uppercase tracking-wider">
      Destination Opportunity
    </span>
  </div>
  <div className="flex-1 p-5 flex flex-col justify-start bg-white">
    <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
      Evaluates connections to hospitals, job centers, schools, and groceries within walk shed.
    </p>
  </div>
</div>
```

---

### 4.3 Interactive Physics Proximity Line Sidebar & Global Nav Menu
The navigation drawer (`GlobalNavMenu.tsx` + `LineSidebar.tsx`) uses a continuous requestAnimationFrame loop calculating exponential mouse proximity falloff:

```typescript
// Smooth spring damping interpolation inside LineSidebar
const runFrame = (now: number) => {
  const dt = Math.min((now - lastRef.current) / 1000, 0.05);
  lastRef.current = now;
  const tau = Math.max(smoothing, 1) / 1000;
  const k = 1 - Math.exp(-dt / tau);

  for (let i = 0; i < items.length; i++) {
    const el = itemRefs.current[i];
    if (!el) continue;
    const target = targetsRef.current[i] || 0;
    const cur = currentRef.current[i] || 0;
    const next = cur + (target - cur) * k;
    currentRef.current[i] = next;
    el.style.setProperty('--effect', next.toFixed(4));
  }
};
```

#### Menu Trigger Button & Dropdown Framing:
```tsx
{/* Header Menu Button */}
<button
  onClick={() => setIsNavOpen(true)}
  className="px-3 py-1.5 text-[10px] font-bold text-[#1e3a8a] bg-blue-50/80 hover:bg-blue-100/80 rounded-md border border-blue-200/80 transition-all uppercase tracking-wider shadow-xs flex items-center gap-1.5"
>
  <Menu className="w-3.5 h-3.5" />
  <span>MENU</span>
  <ChevronDown className="w-3 h-3" />
</button>

{/* Backdrop & Card Container */}
<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-start justify-start p-6 md:p-10">
  <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 sm:p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
      <span className="text-xs font-black uppercase tracking-widest text-[#1e3a8a]">
        TRANSIT SCORECARD MENU
      </span>
      <button onClick={() => setIsNavOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
        <X className="w-5 h-5" />
      </button>
    </div>
    {/* LineSidebar renders items here with code prefixes (e.g., "1.0", "1.1") */}
  </div>
</div>
```

---

### 4.4 "Tell Me More About the Math" Progressive Disclosure Modal
A consistent design pattern used whenever mathematical formulas, sigmoid normalization curves, or Census data integration are presented.

#### Button Trigger Style:
```tsx
<button
  onClick={() => setShowMathModal(true)}
  className="px-5 py-2.5 rounded-xl border border-blue-900/20 text-blue-900 bg-white hover:bg-blue-50/50 font-extrabold text-xs md:text-sm transition-all duration-200 flex items-center gap-2 shadow-sm hover:border-blue-900/40 active:scale-98"
>
  <span>Tell me more about the math</span>
</button>
```

#### Modal Container & Architecture:
```tsx
{showMathModal && (
  <div 
    onClick={() => setShowMathModal(false)}
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
  >
    <div 
      onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-4xl h-[85vh] bg-slate-100 border border-slate-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden cursor-default"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <button
          onClick={() => setShowMathModal(false)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all duration-150"
          title="Close methodology panel"
        >
          <span className="font-extrabold text-sm">✕</span>
        </button>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Methodology & Mathematical Proofs
        </span>
        <div className="w-8 h-8 opacity-0" aria-hidden="true" />
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Math explanation cards with white backgrounds and mono math notation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
            Sigmoidal S-Curve Compression
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Raw composite scores are standardized and mapped to a continuous range using a logistic function:
          </p>
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-blue-900 overflow-x-auto">
            S(x) = \frac{100}{1 + e^{-k \cdot (x - x_0)}}
          </div>
        </div>
      </div>
    </div>
  </div>
)}
```

---

## 5. Mapbox Cartographic Specification: Clean High-Contrast Light Basemap

### 5.1 Basemap Layer Foundation
The platform avoids dark maps or satellite imagery in favor of a crisp vector light base:
- **Style URL**: `mapbox://styles/mapbox/light-v11`
- **Projection**: `mercator`
- **Background Tweak**: Minimalist street visibility, subdued labels (`#94A3B8`), water bodies rendered in subtle pale cyan/slate (`#E2E8F0`).

### 5.2 Layer Stacking Architecture (Bottom to Top)
To guarantee high-contrast readability without visual collisions, layers follow this exact render hierarchy:
1. `da-heatmap-layer` (Bottom-most layer: polygon fill of Dissemination Areas, opacity `0.55`, outline `rgba(255, 255, 255, 0.4)`).
2. `odt-zones-fill` / `odt-zones-line` (Dashed zone bounds: `#0F766E`, width `1.5`, dash `[3, 3]`).
3. `isochrone-fill` / `isochrone-line` (400m walk catchments: `#0F766E`, opacity `0.18`, dashed border `1.5px [2, 2]`).
4. `selected-da-fill` / `selected-da-highlight` (Selected focus area: Amber `#F59E0B`, stroke `#D97706` width `4.5px`).
5. `routes-line` (All transit routes: width `2.5px`, opacity `0.7`).
6. `routes-highlight` (Active selected route: width `6.5px`, opacity `1.0`, casing layer white width `9px` beneath it).
7. `bus-stops-circle` (Bus stops: radius `3.5px`, white border `1.5px`, fill dynamically driven by equity grade).

### 5.3 Mapbox GL Expression for Dynamic Grade Color Coding
```javascript
// Route line color dynamically matching grade quintiles
'line-color': [
  'case',
  ['coalesce', ['get', 'is_regional'], false],
  '#475569', // Regional routes in neutral slate
  [
    'match', ['get', 'grade'],
    'A', '#10B981', // Emerald
    'B', '#3B82F6', // Blue
    'C', '#F59E0B', // Amber
    'D', '#F97316', // Orange
    'E', '#EF4444', // Red
    '#94A3B8'      // Fallback
  ]
],
'line-width': 2.5,
'line-opacity': 0.7
```

### 5.4 Mapbox Clean Custom Popup Styling
```css
/* Clean white card popups for Mapbox */
.mapboxgl-popup-content {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(8px);
  border: 1px solid #E2E8F0 !important;
  border-radius: 1rem !important;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1) !important;
  padding: 0.75rem 1rem !important;
}

.mapboxgl-popup-tip {
  border-top-color: rgba(255, 255, 255, 0.95) !important;
}
```

---

## 6. Analytical Visualizations

### 6.1 SHAP Waterfall Plot (`ShapWaterfall.tsx`)
A custom SVG chart decomposing an individual route's composite equity score from the network baseline mean.

#### Visual Structure
- **Baseline Vertical Line**: Dashed line at network baseline (e.g. `Score: 50.0`) in `#94A3B8`.
- **Positive Contributions**: Emerald bar (`#10B981`) extending to the right with a `+X.X` label.
- **Negative Contributions**: Rose bar (`#F43F5E`) extending to the left with a `-X.X` label.
- **Spring-Animated Floating Text**: Uses `framer-motion` (`useSpring`) to update numbers continuously as weights slide.

```tsx
// SVG Step Bar Rendering
<rect
  x={barX}
  y={yOffset}
  width={barWidth}
  height={18}
  rx={4}
  fill={contribution >= 0 ? '#10B981' : '#F43F5E'}
  opacity={0.85}
/>
```

---

### 6.2 Equity Quadrant Scatter Plot (`EquityQuadrant.tsx`)
A bivariate matrix contrasting Equity Score against Ridership or Operating Cost.

#### Aesthetic Highlights
- **Subtle Cartesian Grid**: Horizontal and vertical gridlines in `#F1F5F9`.
- **Crosshair Quadrant Anchors**: `ReferenceLine` at `x=50` and `y=50` styled with `stroke="#CBD5E1"` and `strokeDasharray="4 4"`.
- **Custom Scatter Cells**: Dots colored strictly by `GRADE_COLORS[point.grade]`, sized by population served, with interactive tooltip cards on hover.

```tsx
<ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
  <XAxis 
    type="number" 
    dataKey="composite_score" 
    name="Equity Score" 
    domain={[0, 100]} 
    tick={{ fontSize: 10, fill: '#64748B' }} 
    axisLine={false} 
  />
  <YAxis 
    type="number" 
    dataKey="trip_count" 
    name="Weekly Trips" 
    tick={{ fontSize: 10, fill: '#64748B' }} 
    axisLine={false} 
  />
  <ReferenceLine x={50} stroke="#CBD5E1" strokeDasharray="4 4" />
  <ReferenceLine y={1000} stroke="#CBD5E1" strokeDasharray="4 4" />
  <Scatter data={data}>
    {data.map((entry, index) => (
      <Cell 
        key={`cell-${index}`} 
        fill={GRADE_COLORS[entry.grade] || '#94A3B8'} 
        fillOpacity={0.75} 
      />
    ))}
  </Scatter>
</ScatterChart>
```

---

### 6.3 Monte Carlo Plinko & Distribution Simulation (`MonteCarloPlinko.tsx`)
Simulates 10,000 weight permutations to demonstrate route score stability.

- **Weight Gauge Strip**: Mini horizontal meters showing current weight allocation (`bg-slate-100` tracks with colored fills: `bg-fuchsia-500`, `bg-sky-500`, `bg-amber-500`, `bg-indigo-500`).
- **Score Distribution Curve**: Kernel density or binned histogram showing narrow bell curves (essential routes) versus wide bell curves (volatile routes).
- **Controls**: Pill-shaped action buttons with `active:scale-95` tactile responses.

---

## 7. Controls, Sliders & Micro-Interactions

### 7.1 Weight Slider Track & Thumbs
Weight controllers use soft slate backgrounds with colored active fills:

```tsx
<div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
  <div className="flex justify-between items-center">
    <span className="text-xs font-bold text-slate-800">Transit Vulnerability</span>
    <span className="text-xs font-mono font-black text-blue-900">{weightValue}%</span>
  </div>
  <input
    type="range"
    min="0"
    max="100"
    value={weightValue}
    onChange={(e) => setWeight(Number(e.target.value))}
    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
  />
  <span className="text-[10px] text-slate-400 font-medium">Demographics of Dissemination Area</span>
</div>
```

---

### 7.2 CIMD Equal-Weight Multi-Select Pill Bar
Horizontal pill controls with auto-updating percentages:

```tsx
<div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl p-1 shadow-2xs">
  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">
    CIMD Criteria ({pctPerActive}% each):
  </span>
  {dimensions.map((dim) => {
    const isActive = activeDimensions.includes(dim.key);
    return (
      <button
        key={dim.key}
        onClick={() => toggleDimension(dim.key)}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
          isActive
            ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        {dim.label}
      </button>
    );
  })}
</div>
```

---

## 8. Glassmorphic Overlays & Utility Classes

Add these reusable utility classes to `globals.css` or Tailwind config:

```css
@layer components {
  /* Soft frosted floating cards */
  .glass-panel {
    @apply bg-white/80 backdrop-blur-md border border-white/40 shadow-sm;
  }

  /* Command bar container */
  .command-card {
    @apply bg-white/95 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-xl transition-all duration-300;
  }

  /* Thin slate scrollbars */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #E2E8F0;
    border-radius: 9999px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #CBD5E1;
  }
}
```

---

## 9. Step-by-Step Regeneration Checklist

To reproduce this exact aesthetic in a new project:

1. **Configure Fonts**: Load `Inter` for sans and system monospace (`ui-monospace, SFMono-Regular, Roboto Mono`) for all numbers and route badges.
2. **Setup Tailwind Slate Base**: Set the application background to `bg-slate-50` (`#F8FAFC`) with primary content containers in pure white (`#FFFFFF`) framed by `border-slate-200` (`#E2E8F0`).
3. **Apply the 5-Tier Grade Palette**: Use Emerald (`#10B981`), Blue (`#3B82F6`), Amber (`#F59E0B`), Orange (`#F97316`), and Red (`#EF4444`) across maps, badges, and charts.
4. **Build the Route Ticket**: Recreate the 2-column flex layout with the rotated vertical strip, the semi-circle hole-punch notch, and the dashed metric separator.
5. **Implement Mapbox Clean Light Style**: Initialize `mapbox://styles/mapbox/light-v11` with `mercator` projection, hide default Mapbox attribution boxes, and draw route lines at `2.5px` opacity `0.7`.
6. **Implement Hard 3D Shadows**: Use the `.pillar-card-lift` CSS rule with repeating `1px` increments for tactile cards.
7. **Embed Progressive Math Modals**: Provide "Tell me more about the math" buttons that open blurred full-screen overlays with monospace formula cards.
