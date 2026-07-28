import subprocess
import time
import os
import sys

repo_dir = r"C:\Antigravity Projects in C\Route Equity Scorecard"

def sync_git(message="auto-sync: automated push from workspace session"):
    try:
        # Check if there are modified/untracked files
        res_status = subprocess.run("git status --porcelain", cwd=repo_dir, capture_output=True, text=True, shell=True)
        if not res_status.stdout.strip():
            return

        print("[GitAutoSync] Detected pending changes. Syncing...")
        
        # Abort stuck rebase if any
        subprocess.run("git rebase --abort", cwd=repo_dir, capture_output=True, text=True, shell=True)
        
        # Stage & commit
        subprocess.run("git add -A", cwd=repo_dir, capture_output=True, text=True, shell=True)
        subprocess.run(f'git commit -m "{message}"', cwd=repo_dir, capture_output=True, text=True, shell=True)
        
        # Push to remote
        res_push = subprocess.run("git push origin master", cwd=repo_dir, capture_output=True, text=True, shell=True)
        if res_push.returncode == 0:
            print("[GitAutoSync] Successfully pushed to origin master!")
        else:
            print(f"[GitAutoSync] Push output: {res_push.stderr or res_push.stdout}")
    except Exception as e:
        print(f"[GitAutoSync] Error during sync: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        sync_git()
    else:
        print("[GitAutoSync] Starting continuous background Git watcher loop (polling every 10s)...")
        while True:
            sync_git()
            time.sleep(10)
