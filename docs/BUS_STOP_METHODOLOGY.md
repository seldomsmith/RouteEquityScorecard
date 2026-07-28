# BUS STOP VULNERABILITY ANALYSIS METHODOLOGY
*Spatial Catchment Modeling & Proportional Demographic Allocation for Edmonton Transit Services*

---

## 1. Executive Overview

The **Bus Stop Vulnerability Analysis** evaluates socio-demographic need at the individual stop level across Edmonton's transit network. While route-level analysis assesses overall corridor equity, passengers experience transit at specific physical locations: bus stops and transit centers. 

Evaluating vulnerability at the bus stop level allows planners to identify micro-level equity priority zones, optimize passenger amenities (such as shelters, lighting, and seating), and ensure service investments directly support vulnerable riders where they board.

---

## 2. Spatial Catchment Area (400-Meter Walk Zone)

Transit access research establishes that most bus passengers walk up to **400 meters** (approximately 5 minutes at standard walking speeds) to reach a local transit stop.

* **Catchment Buffer**: A circular catchment zone with a 400-meter radius is constructed around each GTFS bus stop location.
* **Geodesic Accuracy**: All spatial distances and area calculations are performed using the **Alberta 10-TM Resource coordinate system (EPSG:3400)**, ensuring metric precision without distortion across Edmonton.

---

## 3. Proportional Spatial Overlap Weighting

Bus stop catchments frequently cross the administrative boundaries of Statistics Canada Dissemination Areas (DAs). Rather than assigning a bus stop to a single neighborhood or arbitrary census tract, this methodology uses **proportional spatial area weighting**.

$$\text{Stop Vulnerability Score} = \sum_{i=1}^{k} \left( \text{DA Score}_i \times \frac{\text{Area of Catchment inside DA}_i}{\text{Total Catchment Area}} \right)$$

### How it Works in Practice:
* If a 400-meter catchment circle around a bus stop lies **75% in DA 1** and **25% in DA 2**:
  * **DA 1** contributes 75% of the bus stop's score.
  * **DA 2** contributes 25% of the bus stop's score.
* This ensures bus stops located on boundary streets accurately reflect the surrounding population on both sides of the corridor.

---

## 4. Vulnerability Scoring Models

Demographic vulnerability is derived from the **Canadian Index of Multiple Deprivation (CIMD)** compiled by Statistics Canada, which measures four dimensions of socio-economic equity:

1. **Economic Dependency**: Ratio of population relying on transfer payments, unemployment support, or low income.
2. **Ethno-Cultural Composition**: Concentration of recent immigrants, non-official language speakers, and visible minority populations.
3. **Residential Instability**: Percentage of renters, multi-unit housing, and high residential mobility.
4. **Situational Vulnerability**: Housing conditions and demographic isolation factors.

### Dynamic Weighting Toggles:
* **CIMD Equal Weighting (25% per dimension)**: Provides a balanced, policy-neutral assessment across all four deprivation dimensions.
* **100% Economic Dependency**: Focuses specifically on financial hardship and low-income transit reliance to highlight financial equity priorities.

All scores are standardized onto a continuous **0 to 100 scale**, where higher scores represent higher socio-demographic priority.

---

## 5. Summary Tiers & Planning Applications

Bus stop scores are grouped into four clear priority bands:

| Score Range | Priority Tier | Recommended Service & Infrastructure Actions |
| :--- | :--- | :--- |
| **70.0 – 100.0** | High Vulnerability | Priority for heated shelters, real-time arrival displays, winter snow clearing, and frequency protections. |
| **50.0 – 69.9** | Moderate-High | Standard shelter coverage, seating, and lighting enhancements. |
| **35.0 – 49.9** | Moderate | Basic bus stop pole and timetable signage maintenance. |
| **0.0 – 34.9** | Low Vulnerability | Baseline stop infrastructure maintained as needed. |

---

## 6. Data Sources

* **Bus Stop Locations**: City of Edmonton Open Data & GTFS Feed (~6,750 active stops).
* **Census Boundaries**: Statistics Canada 2021 Dissemination Area Boundaries (1,762 DAs in Edmonton).
* **Demographic Data**: Statistics Canada Canadian Index of Multiple Deprivation (CIMD) 2021 Census Cycle.
