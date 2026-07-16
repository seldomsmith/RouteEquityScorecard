# ☁️ Continuous Deployment Guide: Google Cloud Run & GitHub

This guide explains how to manage continuous deployment (CD) for the **Route Equity Scorecard** dashboard so that every `git push origin master` automatically builds and deploys the latest version to Google Cloud Run.

---

## 🚀 The "Elite Push" Workflow (Automatic Deployment)

Continuous deployment is fully automated. You do not need to manually compile code or build Docker images. Simply push your code to GitHub, and the servers will build and deploy themselves:

```powershell
# 1. Stage all changes
git add .

# 2. Commit the updates
git commit -m "Refactor: describe your new changes"

# 3. Push to master (triggers the Cloud Run builds instantly)
git push origin master
```

Once pushed, Cloud Build compiles the project and Google Cloud Run performs a **zero-downtime hot-swap** within **3 to 5 minutes**. The older revision remains active serving traffic until the new compile succeeds.

---

## 🛠️ Required Container Specifications (GCP Console Settings)

If you create a new service or modify settings, ensure the following specs are set in the Google Cloud Console:

| Setting | Value | Rationale |
| :--- | :--- | :--- |
| **Container Port** | **`3000`** | **CRITICAL:** Next.js runs on port `3000`. Setting this to `8080` will cause health-check timeouts and deployment crashes. |
| **Base Image (Dockerfile)** | `mirror.gcr.io/library/node:20-slim` | **CRITICAL:** Standard Docker Hub images use OCI manifests which crash legacy GCR (`gcr.io`). Using Google's `mirror.gcr.io` proxy bypasses this registry bug. |
| **Region** | `northamerica-northeast1` | Lowest latency for Canadian operations (Montreal). |
| **CPU & Memory** | **1 CPU** and **2 GiB Memory** | Minimum specs required to compile and run the DuckDB engine smoothly. |
| **Auto-scaling** | Min: `0` / Max: `5` | Prevents unnecessary costs when inactive, and limits bills during high-traffic spikes. |
| **Authentication** | Allow unauthenticated | Ensures public access is enabled. |

---

## 🔍 Troubleshooting & Manual Revision Selection

If a build successfully compiled but the website is not showing the new layout, follow these diagnostics:

### A. Check the Build History Logs
1. Navigate to the [Cloud Build History Console](https://console.cloud.google.com/cloud-build/builds).
2. Confirm the build status is **Green (Success)**.
3. If the build shows a **Red X (Failed)**, read the logs to see if a typescript compile or file permission error blocked the deployment.

### B. Manually Route Traffic / Select Image (Fallback)
If the trigger completed successfully but the new version didn't promote automatically:
1. Go to the **Cloud Run** console, click on your service, and select the **Revisions** tab.
2. Check if the newest revision is active. If not, click **Manage Traffic** at the top of the tab and set the latest revision to **100%** (or set it to "Route 100% to latest revision").
3. Alternatively, click **Edit & Deploy New Revision** at the top:
   * Under **Container image URL**, click **Select** on the right.
   * Choose your newest built image from the list (identifiable by the commit hash tag like `:7ba6257` or the latest timestamp).
   * Click **Done**, scroll to the bottom, and click **Deploy**.
