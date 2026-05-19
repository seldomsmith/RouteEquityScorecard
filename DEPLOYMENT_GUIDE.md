# ☁️ Deployment Guide: Google Cloud Run & GitHub

This guide outlines how to prepare and deploy the Transit Equity Dashboard to Google Cloud Run while managing large datasets.

## 1. 📂 File Management & GitHub Essentials

GitHub has a strict **100MB file limit**. We have already configured `.gitignore` to prevent massive raw files from being pushed, while keeping essential processed data.

### ✅ Deployment Process: "The Gatekeeper"

To prevent unnecessary redeployments, we use an approval-based workflow:

1. **Iterate**: Antigravity makes changes locally on the `\\cepfile2` drive.
2. **Commit**: Antigravity commits changes locally to save progress.
3. **Deploy**: The user says **"DEPLOY NOW"** to trigger the push to GitHub and the Cloud Run build.

### 📁 Files to include in your Upload

These are the files required for the app to function in the cloud:

1.  **Code**: `app.py`, `tabs/`, `components/`, `data/`, `utils/`, `analysis/`
2.  **Config**: `Dockerfile`, `.dockerignore`, `requirements.txt`
3.  **Essential Data**:
    - `data/EDM/processed/da_boundaries.geojson`
    - `data/EDM/processed/travel_times_*.csv` (Ensure these are < 100MB each)
    - `data/EDM/processed/destination_access_cube.csv`
    - `data/EDM/processed/pois_mapped.csv`
    - `data/EDM/processed/vlw_overlay.json`
    - `data/EDM/raw/demographics.csv`
    - `data/EDM/region/centroids.gpkg` (Low-res coordinates)

### ❌ Files to EXCLUDE (Already in .gitignore)

Do **NOT** upload these to GitHub (they are too large or Redundant):

- `data/EDM/raw/*.osm.pbf` (Large OSM data)
- `data/EDM/region/region.gpkg` (Large GeoPackage)
- `*.pbf`, `*.shp`, `*.mbtiles`, `*.zip`
- Folders: `ted-data-main/`, `ted-data-main2/`, `github_backup/`

---

## 2. 🚀 Deployment Workflow

### Step A: The "Elite Push" to GitHub

Use these commands in your PowerShell to sync your local changes to GitHub while bypassing the browser's file size limits.

```powershell
# 1. Navigate to project
cd "\\cepfile2\users4\matdow\Home\Desktop\Antigravity Folder\Transit Equity Dashboard"

# 2. Add and Commit
& "C:\Users\matdow\AppData\Local\Programs\Git\cmd\git.exe" add .
& "C:\Users\matdow\AppData\Local\Programs\Git\cmd\git.exe" commit -m "Elite Update: [Describe your changes]"

# 3. Push to GitHub
& "C:\Users\matdow\AppData\Local\Programs\Git\cmd\git.exe" push origin main
```

---

### Step B: Google Cloud Run Setup (Smooth Like Butter)

For the first deployment, or to set up auto-deployment:

1.  **Google Cloud Console**: Go to [Cloud Run](https://console.cloud.google.com/run).
2.  **Create Service**: Select "Continuously deploy from a repository".
3.  **Link Repository**: Select `seldomsmith/YEGTransitEquityModel3.0-2.26.26`.
4.  **Hardware Config**:
    - **Memory**: 2 GiB (Minimum required for travel matrices).
    - **CPU**: 1 or 2 (Standard).
    - **Region**: `northamerica-northeast1`.
5.  **Networking & Security**:
    - **Authentication**: "Allow unauthenticated" (Safe due to our internal Password Gate).
    - **Autoscaling**: Min instances 0, Max instances 10 (To save costs).

---

## 3. � Security & Stealth

This app implements "Security by Obscurity" + an Internal Gate:

- **No-Index**: The `app.py` contains a `noindex` tag, meaning the site will never appear in Google search results.
- **Random URL**: The Cloud Run URL is a long, unguessable string.
- **Password Gate**: Users must enter the City Access Code to see any data.
  - **Code**: `welikebuses2`

---

## 4. �️ Configuration & Troubleshooting

- **Workers**: 1 worker with 8 threads (Optimized for memory).
- **Timeout**: Set to 0 (Prevents connection drops).
- **Out of memory**: If the app status shows "OOM Killed", increase memory to 4GiB in the Cloud Console.
- **System Dependencies**: The `Dockerfile` includes `libgdal-dev` and `libspatialindex-dev` for Geopandas support.
