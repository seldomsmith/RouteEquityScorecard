# Project Proposal: Route Equity Scorecard

## Executive Summary
The Route Equity Scorecard provides a standardized method for evaluating the social equity value of transit corridors. This framework offers a high-performance spatial intelligence platform to highlight the variances among routes. By integrating socioeconomic census data with the ETS transit network, the Scorecard makes network dependencies visible. It serves as a tool for planners to identify "Essential Lifelines," ensuring that investment decisions remain grounded in objective, equity-focused data.

## Data Foundation and Methodology
The Scorecard is built upon a high-fidelity spatial routing engine that moves beyond static, "as-the-crow-flies" circles. Instead, we employ Network-Based Isochrones—"walking blobs"—that follow actual sidewalk networks and account for pedestrian friction such as ravines, high-speed arterials, and urban superblocks. By shifting to dynamic, door-to-door simulation, the platform provides a rigorous foundation for transit equity analysis.

### The Routing Engine
The framework integrates with the r5py engine (Rapid Realistic Routing) to simulate over three million unique transit trips. It processes three primary data streams:
- **Official GTFS Feeds**: Provides the complete transit schedule, including stop locations and frequency patterns.
- **OpenStreetMap (OSM)**: Supplies granular, network-based pedestrian connectivity data, exposing isolated pockets where physical barriers impede access.
- **Statistics Canada Dissemination Areas (DAs)**: Serves as the base unit of analysis. With 1,762 DAs in the model, each containing 400 to 700 residents, the platform delivers a hyper-localized view of urban transit needs.

### Precision and Reliability: The "Equity Mismatch" Z-Score
To move beyond simple averages, the Scorecard incorporates a statistical "Supply vs. Demand" Z-Score. By calculating the difference between the Z-Score of Vulnerability and the Z-Score of Accessibility, the model identifies "Strategic Intervention Zones"—areas of high need coupled with low service. This provides an empirical layer of rigor that elevates the Scorecard from a descriptive dashboard to a predictive scientific model.

### Door-to-Door Connectivity
The model calculates access by simulating the complete journey from the centroid of a residential DA to the destination DA. This process captures the four essential components of public transit travel:
- **First-Mile Walk**: Captures the pedestrian journey from the DA centroid to the nearest transit stop.
- **Transit Segments**: Calculates time spent on board vehicles, derived directly from the GTFS schedule.
- **Scheduled Transfers**: Incorporates realistic wait times and a 3-minute transfer penalty to reflect the friction of moving between routes.
- **Last-Mile Walk**: Accounts for the final pedestrian leg from the destination stop to the target centroid.

### Precision and Reliability
While the model utilizes DA centroids as the origin for travel simulations, this method provides an accurate proxy for the average resident’s experience in Edmonton. In dense urban environments where transit service is present, the centroid approach effectively balances computational efficiency with the granular requirements of social equity assessment. By standardizing the "access" measurement across millions of permutations, the Scorecard ensures that transit utility is defined not by scheduled service alone, but by the actual capability of a resident to reach their destination within a reasonable timeframe.

## The Analytical Engine: Route Equity Index (REI)
The REI is a normalized 0–100 score built on four additive pillars. To ensure mathematical rigour, the engine utilizes a "Fair Share" Algorithm based on SHAP (Shapley Additive Explanations). This approach quantifies exactly how much each pillar contributes to a route’s final score relative to the city-wide baseline, transforming a "black box" model into a "glass box" inspector.

1. **Vulnerability Density (35%)**: Utilizes a gravity model with distance-decay weighting to measure low-income household concentration within 400m of stops, effectively mitigating the "cliff effect" of arbitrary boundary lines.
2. **Temporal Resilience (25%)**: Employs a Service Retention Factor (SRF). This detects "Ghost Routes" by identifying blackout windows exceeding 60 minutes, ensuring the model accounts for the needs of shift workers and late-night medical staff.
3. **Network Monopoly (25%)**: We calculate the "Sole-Provider" status through spatial redundancy audits. This logic identifies routes where the total alternative service frequency within a 400m zone is insufficient to replace the primary route, flagging these as high-fragility lifelines.
4. **Critical Opportunity Access (15%)**: Calculates the "Economic Power" of a corridor by weighting access to essential infrastructure, including ERs, dialysis centres, and primary schools.

*The weighting of these REI factors is to be customizable.*

### Scoring Calibration Logic

To ensure the distribution of scores reflects genuine policy intent rather than mathematical volatility (e.g., volume bias in raw POI counts or ratio instability in low-frequency routes), the Scorecard's mathematical engine applies a rigorous normalization pipeline:

1. **Unified Index (Z-Score Normalization)**: Raw scores for each pillar are normalized to a standard distribution (where 50 represents the network mean and 20 represents one standard deviation). This prevents "pillar dilution," where a route with a very high raw score in one area mathematically drowns out its performance in others.
2. **Sigmoid Distribution (S-Curve)**: Our scoring engine utilizes a sigmoid distribution function to ensure that 'Essential Lifelines' are statistically distinct from 'Standard Coverage' routes, providing planners with an unambiguous hierarchy of network criticality. This compresses the "average" routes into a tighter band and stretches the critical lifelines to the extremes.

**Future Methodological Refinements (PhD-Level Calibration)**
As the engine matures, the raw formulas defining the four pillars will transition to the following refined logic:
- **Pillar 1 (Vulnerability)**: Cap scores at the 95th percentile to prevent extreme outliers from skewing the network mean.
- **Pillar 2 (Temporal Resilience)**: Replace the basic night-to-peak ratio with a `Service Retention Delta` using a saturation function: `Score = 100 × tanh(Trips_night / Trips_peak × K)`. This caps scores naturally and solves low-frequency volatility.
- **Pillar 3 (Monopoly)**: Switch to a `Redundancy Index` measuring desert risk directly: `1 - (Alternative_Capacity / Route_Capacity)`.
- **Pillar 4 (Opportunity)**: Replace raw counts with `Access Density` to eliminate hub-and-spoke volumetric bias. Formula: `Σ (POI_i × Weight_i) / Length_route × Log(Ridership + 1)`. This rewards routes that are target-rich relative to their operational cost.

## Visualization: Interactive Spatial Intelligence Map
The primary interface is a minimalist, interactive map built on Mapbox GL JS, designed to help planners "see" the skeleton of the transit system—distinguishing between vital infrastructure and fragile segments. The map features a white, minimalist background with the Edmonton street grid.

### Route Rendering and Stress Testing
The map distinguishes between transit infrastructure through a visual hierarchy. Routes with high equity scores (Grades A and B) are rendered in deep teal with thicker lines, signifying their role as essential service corridors. Routes with lower scores (Grades D and E) are rendered in gray with thinner lines, representing standard coverage or choice-based services.

The platform includes a service impact simulation tool. Selecting a route removes it from the network simulation, causing the line to transition to red. Simultaneously, the map highlights affected Dissemination Areas (DAs) in red to indicate potential service gaps. These zones identify neighbourhoods where residents lose their primary transit connection, providing planners with an empirical view of service loss impacts on specific populations.

### Interactive Features and Transparency
The interface allows for granular spatial analysis and data inspection:
- **Spatial Analysis**: When a route is selected, the map highlights DAs served within the 800-metre LRT or 600-metre bus catchment radii. Users can toggle filters based on trip viability, identifying areas where residents can complete trips within 30, 45, or 60 minutes.
- **Dynamic Equity Visualization**: Users toggle Route Equity Index (REI) pillars to update DA colour scales. When all factors are selected, the map displays the composite score, providing a holistic view of a route’s social utility.
- **Data Inspection**: Selecting a route generates a table below the map detailing the score for each REI pillar per DA. Furthermore, clicking any individual DA triggers a diagnostic panel that displays detailed population and demographic profiles, providing context for the route’s performance.
- **Resilience Metrics**: A Resilience Risk Index (RRI) provides a 0 to 1 summary of risk for the current simulation, while real-time counters report the number of people and DAs affected by the simulated removal of specific routes.

## Technical Architecture
The system functions as a high-performance command centre. To achieve zero-latency interaction, the application utilizes DuckDB-Wasm on the frontend. By delivering the "Golden Route Record"—the pre-calculated scores for all DAs—as a compressed Parquet/Arrow file directly to the browser, weighting sliders update the map in under 16ms, eliminating the need for server round-trips. The backend leverages PostgreSQL with the PostGIS extension for heavy spatial computation, while the frontend utilizes Next.js and Zustand for high-performance state management. This hybrid architecture ensures the platform remains responsive regardless of the complexity of the spatial dataset.

## User Experience and Explainability
The Scorecard integrates SHAP (Shapley Additive Explanations) logic to provide a transparent, additive breakdown for every route score.

- **Reactive Weighting Sandbox**: Sidebar sliders allow planners to adjust the importance of each REI pillar. If policy priorities shift toward employment access, planners can adjust weights and see the map update instantly.
- **Strategic Explainability Panel**: When a user selects a specific route, this panel opens, utilizing a waterfall chart to display how each pillar influenced the final score.
- **Time-Pulse Simulation**: Allows users to scrub through the day to visualize how network equity changes between peak and late-night hours.
- **Scenario Comparison Engine**: Enables a "Draft Mode," where users can simulate rerouting or decommissioning lines to observe the delta in network resilience.

### The "Why This Route?" Inspector
The Scorecard integrates a SHAP-based diagnostic panel to ensure every score is defensible:
- **The Waterfall Panel**: A visual breakdown of performance starting at a city-wide baseline of 50.0. Emerald bars indicate strengths; rose bars highlight gaps.
- **Narrative Insight Generator**: Automatically generates a plain-language summary (e.g., "This route is an Essential Lifeline...").
- **The Fragility Map**: High-redundancy corridors in solid blue; "Essential Lifelines" in neon red glow.

## Implementation Roadmap
1. **Foundation**: Establish PostGIS database, perform ingestion of GTFS and census data.
2. **Analytical Core**: Implement the four core algorithms and SHAP engine in the Python backend.
3. **Reactive Interface**: Connect frontend state management to the calculation engine, integrating sliders and map updates.
4. **Optimization and Reporting**:
    - **Network-Based Isochrones**: Integrate r5py-generated walking isochrones.
    - **Narrative Briefing Generator**: Implement automated narrative module for reporting.
    - **Performance**: Finalize DuckDB-Wasm integration.

## Visualizations Detail
### Interactive Spatial Intelligence Map
- **Minimalist Canvas**: White canvas, navy blue routes.
- **Catchment Analysis**: LRT (800m), Bus (600m).
- **Trip Viability**: 30/45/60 min thresholds.

### The Equity Dissemination Matrix
Maps REI against specific DAs served by a route.
- **Segmented Analysis**: X-axis (sequential stops/DAs), Y-axis (performance/metrics).
- **Contextual Sensitivity**: Data point size reflects population density or ridership.

### The "Equity-Ridership" Scatterplot
- **X-Axis**: Operational Ridership (proxy for demand).
- **Y-Axis**: Route Equity Index (normalized score).
- **Quadrants**: Workhorse Routes, Essential Lifelines, High-Performing Corridors, Under-Optimized Segments.

## Interface Design and Spatial Layout
- **Main Viewport**: Spatial Stage (Map).
- **Weighting Cockpit**: Sidebar Interaction (Sliders).
- **Analytical Stack**: Visualizations Below (Matrix, Scatterplot).
- **Interaction Loop**: Side-Panel Inspection (SHAP Waterfall).

## Model Limitations and Calibration
- **Point-in-Time Simulation**: Snapshot based on current GTFS/Census data.
- **Theoretical vs. Observed Friction**: OSM-based sidewalks; doesn't account for weather/construction.
- **Collaborative Weighting Calibration**: Weights should be democratically calibrated with stakeholders.
