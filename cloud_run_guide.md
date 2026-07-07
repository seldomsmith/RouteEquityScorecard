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

---

## 🛠️ How to Manually Force-Deploy a Specific Container Image

If you want to manually redeploy or select a specific successfully built image (e.g. if a trigger succeeded but did not release automatically, or if you need to roll back to a specific commit):

1. Go to the **Cloud Run** console and select your service.
2. Click the **Edit & Deploy New Revision** button at the top of the page.
3. In the **Edit Container** panel, locate the **Container image URL** field.
4. Click the blue **Select** button to the right of the URL.
5. In the drawer that appears, locate and select your image tag (the tags correspond to git commit hashes, such as `:3b7d117` or the latest timestamp).
6. Click **Done** at the bottom of the container configuration panel.
7. Scroll to the very bottom of the main page and click **Deploy**.

---

## 💡 Important CD Mechanics (Must Know)

To avoid confusion during updates, keep the following behaviors in mind:

### 1. 🔄 `git pull` vs `git push`
* **`git pull` does NOT trigger deployments:** Pulling only downloads updates from GitHub to your local machine. It does not send anything to GitHub, so Google Cloud doesn't trigger any builds.
* **Only `git push` triggers deployments:** Only pushing local code changes to the GitHub repository triggers Cloud Build.

### 2. 🗂️ Build Logs vs. Runtime Logs
* **Build Logs:** Show the compile-time logs (Next.js compilation, TypeScript checking, and Docker packaging). Access these by clicking **Build History** or the active spinner on the Cloud Run **Service details** page.
* **Runtime Logs:** Show web server traffic (GET/POST requests, errors, and page views) from the *currently active container*. Access these on the **Logs** tab of the Cloud Run console. If a new version is still compiling, these logs will only show activity for the old version.

### 3. ⏳ Compilation & Zero-Downtime Swapping
* **Compilation Time:** When you push, Next.js takes **3 to 5 minutes** to compile.
* **Zero-Downtime:** The old version remains live handling users while the new one compiles. Once the new build succeeds, Cloud Run instantly routes 100% of traffic to the new revision, replacing the old one seamlessly.

### 4. 📈 Rapid Successive Pushes (Queueing)
* If you perform multiple `git push` commands in rapid succession, Google Cloud Build will queue the build jobs. 
* Cloud Run automatically cancels or updates traffic allocation to the newest successfully compiled revision as soon as it is ready, meaning older pending builds won't get stuck serving traffic.
