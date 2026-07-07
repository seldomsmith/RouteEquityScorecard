# ☁️ Continuous Deployment Guide: Google Cloud Run & GitHub

This guide explains how to set up and manage continuous deployment (CD) for the **Route Equity Scorecard** dashboard so that every `git push origin master` automatically builds and deploys the latest version to Google Cloud Run.

---

## 🛠️ Step-by-Step Setup for Git-Triggered Deployments

Google Cloud Run integrates directly with GitHub using Google Cloud Build triggers. Follow these steps to connect your repository:

### 1. Enable GitHub Integration in Cloud Run
1. Go to the [Google Cloud Console Cloud Run page](https://console.cloud.google.com/run).
2. Click **Create Service** (or select your existing service and click **Set Up Continuous Deployment** at the top).
3. In the setup panel, select **"Continuously deploy new revisions from a source repository"**.
4. Click **Set Up Cloud Build**.

### 2. Connect Your GitHub Repository
1. Select **GitHub** as the provider.
2. Authenticate with your GitHub account.
3. Select your repository: `seldomsmith/RouteEquityScorecard`.
4. Click **Next**.

### 3. Build Configuration
1. **Branch:** Enter `^master$` (or select `master` from the dropdown list).
2. **Build Type:** Select **Dockerfile**.
3. **Source Location:** Leave as `/Dockerfile` (meaning the root Dockerfile).
4. Click **Save**.

### 4. Service Settings (Recommended Specifications)
Configure the service settings below before deploying:
- **Region:** `northamerica-northeast1` (Montreal) is recommended for low latency in Canada.
- **CPU & Memory:** Allocate **1 CPU** and **2 GiB Memory** (this ensures the Next.js server has enough memory to run the SQLite/DuckDB engine).
- **Auto-scaling:** Set **Min instances: 0** (saves money by scaling down when inactive) and **Max instances: 5** (prevents unexpected traffic costs).
- **Ingress:** Select **Allow all traffic** to make the scorecard accessible.
- **Authentication:** Select **Allow unauthenticated invocations** (so public users can access the site).

Click **Create** or **Save**.

---

## 🚀 How to Trigger a Deployment

Once connected, you no longer need to manually rebuild or push docker images to Google Cloud Registry. You only need to push your local code changes to GitHub:

```powershell
# 1. Stage all changes
git add .

# 2. Commit the updates
git commit -m "Refactor: describe your new changes"

# 3. Push to master (triggers the Cloud Run build instantly)
git push origin master
```

### 🔍 Monitoring Deployment Progress
1. Open the [Cloud Build History Console](https://console.cloud.google.com/cloud-build/builds).
2. You will see a new build job running.
3. Once the build turns **Green (Success)**, Cloud Run will redirect traffic to the new revision automatically.
