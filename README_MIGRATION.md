# Route Equity Scorecard OS: Migration Success 🚀

Your project has been successfully mirrored from the cloud Codespace to your local machine.

### 📁 Project Structure
*   `src/app`: Main dashboard layout and pages.
*   `src/components`: UI controls, Mapbox engine, and analytical widgets.
*   `src/lib`: DuckDB engine and export utilities.
*   `src/store`: Zustand state management (Weights & UI).
*   `public/data`: Your 235-route analytical assets (Parquet & GeoJSON).
*   `scripts/`: Data transformation pipeline.

### 🚀 Getting Started (Home Setup)
1.  **Install Node.js**: Ensure you have Node.js 18+ installed.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
4.  **View Dashboard**: Open [http://localhost:3000](http://localhost:3000) in your browser.

### 📊 Data Updates
If you update your `golden_route_record.json`, run the transformation script to refresh the dashboard:
```bash
python scripts/generate_analytical_asset.py
```

*Have a safe trip home! Your dashboard is ready.*
