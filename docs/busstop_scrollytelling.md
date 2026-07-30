# Bus Stop Scrollytelling Architecture — "Explain this to me!"

This document outlines the detailed narrative structure, visual concepts, case study selections, and methodological limitations for the standalone **Bus Stop Analysis Scrollytelling Page** (`/scrollytelling-bus-stops`).

---

## 1. Hero & Introduction
* **Title**: *Beyond the Shelter: Understanding Neighborhood Equity at the Bus Stop Level*
* **Core Narrative**: While route-level analysis evaluates corridor connectivity across the entire city, individual bus stops represent the exact physical locations where transit riders experience waiting times, shelter conditions, and local neighborhood environments.
* **Mapbox Visual**: Starts with a full-city overview of Edmonton displaying 6,700+ glowing GTFS stop points, smoothly zooming into a high-density neighborhood corridor.

---

## 2. The Canadian Index of Multiple Deprivation (CIMD)
* **Title**: *Measuring Local Social Need via the CIMD*
* **Core Narrative**: Explains Statistics Canada's 4 socio-economic dimensions used to quantify neighborhood vulnerability:
  1. **Economic Dependency**: Ratio of population relying on transfer payments, pensions, or non-employment income.
  2. **Residential Instability**: High housing turnover, renter-dominated DAs, and multi-unit dwellings.
  3. **Ethno-cultural Composition**: Proportion of recent immigrants, racialized populations, and non-official language speakers.
  4. **Situational Vulnerability**: Educational attainment, single-parent households, and housing suitability.
* **Mapbox Visual**: Interactive 4-card scroll transition toggling DA choropleth maps across Edmonton for each dimension.

---

## 3. The 400-Meter Walk Catchment Radius
* **Title**: *The 5-Minute Walk: Projecting Catchments onto Geography*
* **Core Narrative**: 
  - Transit equity evaluates who lives within walking distance of each stop.
  - Explains the 400-meter buffer radius (standard 5-minute walk).
  - Details how area overlap percentages ($\%$) across multiple Dissemination Areas (DAs) are calculated to produce a population-weighted composite score.
* **Mapbox Visual**: Animated close-up of a bus stop coordinate expanding a 400m radial buffer that intersects 3 distinct DA boundaries with percentage labels.

---

## 4. Quintile Grading Scale (Grades A through E)
* **Title**: *Relative Quintiles: Sorting 6,700+ Stops into Five Equity Tiers*
* **Core Narrative**:
  - Scores are graded on a dynamic **20% quintile distribution** of all municipal Edmonton stops:
    - **Grade A** (Top 20% highest vulnerability need — Emerald)
    - **Grade B** (Next 20% — Royal Blue)
    - **Grade C** (Middle 20% — Amber Yellow)
    - **Grade D** (Lower 20% — Orange)
    - **Grade E** (Bottom 20% lowest vulnerability — Red)
    - **Regional Partner Stops** (Grayed out in St. Albert, Strathcona County, Spruce Grove).
* **Mapbox Visual**: Animated histogram sorting stops into equal 20% buckets while Mapbox camera flies through 5 representative stop locations across the city.

---

## 5. Real-World Case Studies (Three Representative Stops)
* **Case Study 1: High Vulnerability Node (Abbottsfield / 118th Ave Corridor)**
  - *Context*: High Residential Instability and Ethnocultural composition.
  - *Map Visual*: Fly-to camera view over 118 Ave highlighting multi-DA intersection with bright Grade A indicator.
* **Case Study 2: Mixed Catchment Hub (Oliver / Grandin LRT Connector)**
  - *Context*: Bridges high-density renters and commercial cores, demonstrating how weighted spatial intersection balances competing DA profiles (5+ DAs).
  - *Map Visual*: Fly-to camera position displaying multi-DA catchment split.
* **Case Study 3: Low Vulnerability Suburban Stop (Windermere / Terwillegar)**
  - *Context*: Single-DA catchment in low-density, high-income single-family neighborhood.
  - *Map Visual*: Fly-to camera position showing Grade E classification.

---

## 6. Methodological Limitations
* **Title**: *Understanding the Model's Boundaries*
* **Limitations Documented**:
  1. **Ecological Fallacy (DA-Level Aggregation)**: A high vulnerability score for a DA does not imply every single individual waiting at that bus stop is in high socio-economic need.
  2. **Euclidean (Circular) vs. Network Catchments**: A 400m straight-line buffer assumes riders can walk through blocks; in reality, fences, cul-de-sacs, and arterial roads restrict actual walking paths.
  3. **Demographic Data Currency (Census Timelines)**: Statistics Canada census data is updated every 5 years, meaning rapid neighborhood redevelopment or new housing builds may not immediately reflect in DA scores.
  4. **Unweighted Ridership Volume**: The baseline model evaluates *demographic equity need* surrounding the stop rather than boardings/alightings (GTFS-Ride volume).

---

## 7. Call to Action
* **Title**: *Explore the Bus Stop Scorecard*
* **Interactive Options**:
  - Button 1: *"Jump to Interactive Bus Stop Map"*
  - Button 2: *"Explore Bus Stop Directory"*
