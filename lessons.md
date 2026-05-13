# Lessons Learned

## Project: Route Equity Scorecard

### Tool Usage & Configuration
- **Artifact Paths**: Artifacts (`IsArtifact: true`) must be stored in the App Data directory (`C:\Users\matdow\.gemini\antigravity\brain\...`). Project files should have `IsArtifact: false` and use the workspace path.
- **Directory Creation**: `write_to_file` automatically creates parent directories if they don't exist, which is useful when the workspace is initially empty.

### Process
- **Plan Mode**: Always initialize `tasks/tasklist.md` before starting non-trivial work.
