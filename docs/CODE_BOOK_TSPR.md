# 🛡️ Technical Code Book: Route Resilience Score (TSPR 2.0)

## Overview
The **Tactical Service Protection & Resilience (TSPR)** framework identifies essential transit lifelines by modeling the social cost of service removal. It utilizes a four-pillar weighted multi-criteria decision analysis (MCDA) to assign every transit route a grade from **A (Essential Lifeline)** to **E (Infrequent or Occasional Rider Service)**.

---

## 📐 Scoring Pillars

### 👥 Pillar 1: Vulnerability Density (35%)
Measures the "Social Gravity" of the service corridor using distance-decay weighting.
- **Formula**: We count how many low-income or vulnerable residents live near the route, giving full points to homes right next to a bus stop and fewer points to those a walk away (up to 400 meters).
- **Logic**: Routes that penetrate directly into high-need dissemination areas receive higher scores than those merely bordering them.

### ⏱️ Pillar 2: Off Peak Service (25%)
Measures the reliability of service during off-peak windows critical for late night transit riders.
- **Formula**: We compare how many buses run late at night (9:30–10:30 PM) versus during the morning rush hour (7:30–8:30 AM). If a route keeps running frequently late at night, it acts as a lifeline for late night transit riders.
- **Logic**: Routes that maintain a high percentage of their peak frequency late at night provide 24/7 resilience for workers in hospitals, retail, and security.

### ⛓️ Pillar 3: Network Monopoly (25%)
Identifies "Monopoly" corridors where a route is the sole provider of transit access.
- **Formula**: We identify 'transit monopolies'—neighborhoods where a single bus route is the only way in or out. If this route is cut, residents face an immediate transit desert.
- **Logic**: Removing a monopoly route creates an immediate transit desert. We weight by frequency to distinguish vital high-frequency lifelines from infrequent regional connectors.

### 🏥 Pillar 4: Critical Opportunity Linkage (15%)
Direct cumulative opportunity measure using real Destination Access POI data.
- **Weights**:
  - **Hospital**: 5.0
  - **Employment Centre**: 3.0
  - **Post-Secondary**: 3.0
  - **Grocery / Food**: 2.0
  - **Primary/Secondary School**: 1.0
- **Formula**: `Σ [ POI_Count_within_400m × POI_Weight ]`

---

## 📊 Grade Thresholds
Scores are normalized using Min-Max scaling (0-100) and assigned the following grades based on their Composite Score:

| Grade | Score Range | Designation | Interpretation |
| :--- | :--- | :--- | :--- |
| **A** | 80 - 100 | Essential Lifeline | Critical infrastructure; removal causes extreme social/economic disruption. |
| **B** | 65 - 79 | Opportunity Link | High-value connection between vulnerable populations and major job hubs. |
| **C** | 50 - 64 | Protective Service | Meaningful service providing equitable mobility with alternatives available. |
| **D** | 35 - 49 | Standard Coverage | Standard coverage service with moderate social cost of removal. |
| **E** | 0 - 34 | Infrequent or Occasional Rider Service | Serves neighborhoods where most travel is done by car, and transit is used mainly for occasional or non-routine trips. |

---

## 📋 Data Sources
- **GTFS**: Edmonton Transit Service (ETS) Static Feed (2026 Snapshot).
- **Census**: Statistics Canada 2021 Dissemination Area profiles.
- **POIs**: OpenStreetMap (OSM) and City of Edmonton Open Data portals.
- **Network**: custom `r5py` travel time matrices.
