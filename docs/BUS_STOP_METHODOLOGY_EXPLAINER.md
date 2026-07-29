# How Bus Stop Equity Scores Work: A Plain-Language Guide

> **Quick Summary**: Every bus stop in Edmonton is evaluated based on who lives within a 5-minute walk (400 meters). To make comparisons fair and easy to understand, stops are scored from **1st percentile (lowest equity need)** to **100th percentile (highest equity need)** relative to every other stop in the city.

---

## 1. Why Raw Census Numbers Aren't Enough

The Canadian Census (Statistics Canada) measures neighborhood vulnerability in 5 broad categories (called quintiles): **20%, 40%, 60%, 80%, and 100%**.

If we used those raw numbers directly, thousands of bus stops in Edmonton would be lumped together with identical tied scores. For example:
- A stop in a slightly lower-income neighborhood would score **60.0**.
- A stop in a much lower-income neighborhood next door would also score **60.0**.
- The map would show abrupt, artificial jumps between areas (jumping straight from 60 to 80), hiding important details.

---

## 2. Step 1: The 400-Meter Walk Circle (Blended Score)

When a rider walks to a bus stop, they come from surrounding streets. We draw a **400-meter circle** (about a 5-minute walk) around each stop.

Because a 400-meter circle often overlaps two or three different census neighborhoods, we calculate a **Blended Score**:

$$\text{Blended Score} = (60\% \times \text{Neighborhood A}) + (30\% \times \text{Neighborhood B}) + (10\% \times \text{Neighborhood C})$$

### Why This Matters:
Instead of broad identical scores like `60.0`, every bus stop gets its own precise decimal score based on its exact surroundings (like `66.1`, `66.9`, or `67.7`).

---

## 3. Step 2: Continuous Percentile Ranking (1 to 100)

Once all 6,750+ bus stops in Edmonton have their blended scores, we place them all in a single line from **lowest need to highest need**.

Each stop is then assigned a **Percentile Rank from 1 to 100**:

- **1st to 20th Percentile (Grade E)**: Serves neighborhoods with the lowest equity need (higher income, higher vehicle ownership).
- **20th to 40th Percentile (Grade D)**: Below-average equity need.
- **40th to 60th Percentile (Grade C)**: Standard city-wide average coverage.
- **60th to 80th Percentile (Grade B)**: Above-average equity need.
- **80th to 100th Percentile (Grade A)**: Essential Lifelines (serves neighborhoods with the highest social and economic need).

> **Example**: If a stop has a score of **94.5th percentile**, it means this stop serves a higher social and economic equity need than **94.5% of all bus stops in Edmonton**.

---

## 4. Real Edmonton Bus Stop Examples

| Bus Stop Location | What's Around It (Walk Circle) | Blended Score | Percentile Rank (1–100) | Final Grade | What It Means |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Rossdale Rd & 96 Ave** | 67% Block #149 + 13% Block #150 | **48.1** | **8.4th %ile** | **Grade E** | **Low Equity Need** (Bottom 20% of city) |
| **107 St & Jasper Ave** | 37% Block #848 + 24% Block #294 | **54.3** | **27.0th %ile** | **Grade D** | **Below Average Need** |
| **124 St & 103 Ave** | 38% Block #178 + 28% Block #536 | **59.4** | **43.7th %ile** | **Grade C** | **Standard Coverage** (City Average) |
| **101 St & 104 Ave** | 32% Block #759 + 20% Block #522 | **66.1** | **63.5th %ile** | **Grade B** | **Above Average Need** |
| **Gretzky Dr & 118 Ave** | 42% Block #125 + 38% Block #104 | **75.9** | **86.0th %ile** | **Grade A** | **High Equity Need** (Top 20% of city) |
| **Abbottsfield Transit Centre** | 36% Block #085 + 23% Block #530 | **82.5** | **94.5th %ile** | **Grade A** | **Essential Lifeline** |

---

## 5. Regional Bus Stops (Outside Edmonton)

Bus stops located in neighboring municipalities like **St. Albert**, **Sherwood Park**, and **Fort Saskatchewan** are tagged as **Regional**:
- They are excluded from Edmonton's 1–100 percentile ranking so they do not distort city data.
- On the map, regional stops are colored **slate gray** (`#94A3B8`) with a "Regional / Outside City" tag.
