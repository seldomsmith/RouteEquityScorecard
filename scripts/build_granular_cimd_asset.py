"""
Build Bus Stop Vulnerability Pre-Computation Asset with Min-Max Continuous Raw CIMD Factor Scores
Formula: Normalized Score = 1.0 + 99.0 * ((Raw - Min) / (Max - Min))
Outputs to `public/data/bus_stop_vulnerability.json`.
"""
import json
import os
import time
import zipfile
import xml.etree.ElementTree as ET
import pandas as pd

def parse_xlsx_raw(excel_path):
    """Native Python zipfile + XML parser for .xlsx to completely bypass openpyxl metadata corruptions."""
    print("  Executing native zipfile/xml parser for Excel...")
    with zipfile.ZipFile(excel_path, 'r') as z:
        # Load shared strings if available
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in ss_tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                text = "".join([t.text or "" for t in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')])
                shared_strings.append(text)

        # Parse sheet1.xml
        sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        sheet_data = sheet_tree.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheetData')

        rows = []
        for row_elem in sheet_data.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_vals = {}
            for cell in row_elem.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                r_ref = cell.attrib.get('r', '')
                t_type = cell.attrib.get('t', '')
                v_elem = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = v_elem.text if v_elem is not None else None

                if t_type == 's' and val is not None:
                    val = shared_strings[int(val)] if int(val) < len(shared_strings) else val

                col_letter = "".join([c for c in r_ref if c.isalpha()])
                row_vals[col_letter] = val
            rows.append(row_vals)

        df = pd.DataFrame(rows)
        # First row as header
        header = df.iloc[0]
        df = df[1:].copy()
        df.columns = header
        return df

def main():
    print("=" * 60)
    print("BUILDING MIN-MAX CONTINUOUS BUS STOP VULNERABILITY ASSET")
    print("=" * 60)
    start_time = time.time()

    # 1. Load Existing Bus Stop Vulnerability Asset (for stop list & DA catchments)
    asset_path = "public/data/bus_stop_vulnerability.json"
    if not os.path.exists(asset_path):
        raise FileNotFoundError(f"Asset file not found at '{asset_path}'")

    print(f"\n[1/4] Ingesting bus stops from '{asset_path}'...")
    with open(asset_path, "r") as f:
        existing_data = json.load(f)

    stops_list = existing_data.get("stops", [])
    print(f"  Loaded {len(stops_list)} bus stops.")

    # 2. Load Granular Raw Continuous CIMD Factor Scores from Excel
    excel_path = "data/prairies_scores_quintiles_EN.xlsx"
    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"Excel file not found at '{excel_path}'")

    print(f"\n[2/4] Loading raw continuous factor scores from Excel '{excel_path}'...")
    df_excel = parse_xlsx_raw(excel_path)

    # Clean column names
    df_excel.columns = [str(c).strip() for c in df_excel.columns]

    # Detect DA column
    da_col = next((c for c in df_excel.columns if 'DA' in c.upper() or 'DISSEMINATION' in c.upper()), None)
    if not da_col:
        raise ValueError(f"Could not find DAUID column in Excel file. Found columns: {list(df_excel.columns)}")

    # Detect Raw Factor Score Columns (prefer 'Factor score' or 'score' over 'Quintile')
    econ_col = next((c for c in df_excel.columns if 'ECONOMIC' in c.upper() and ('FACTOR' in c.upper() or 'SCORE' in c.upper()) and 'QUINTILE' not in c.upper()), None)
    res_col = next((c for c in df_excel.columns if 'RESIDENTIAL' in c.upper() and ('FACTOR' in c.upper() or 'SCORE' in c.upper()) and 'QUINTILE' not in c.upper()), None)
    eth_col = next((c for c in df_excel.columns if 'ETHNO' in c.upper() and ('FACTOR' in c.upper() or 'SCORE' in c.upper()) and 'QUINTILE' not in c.upper()), None)
    sit_col = next((c for c in df_excel.columns if 'SITUATIONAL' in c.upper() and ('FACTOR' in c.upper() or 'SCORE' in c.upper()) and 'QUINTILE' not in c.upper()), None)

    # Fallback if specific Factor Score title isn't separate
    if not econ_col: econ_col = [c for c in df_excel.columns if 'ECONOMIC' in c.upper()][0]
    if not res_col: res_col = [c for c in df_excel.columns if 'RESIDENTIAL' in c.upper()][0]
    if not eth_col: eth_col = [c for c in df_excel.columns if 'ETHNO' in c.upper()][0]
    if not sit_col: sit_col = [c for c in df_excel.columns if 'SITUATIONAL' in c.upper()][0]

    print(f"  Target Columns Identified:")
    print(f"    DA:   {da_col}")
    print(f"    Econ: {econ_col}")
    print(f"    Res:  {res_col}")
    print(f"    Eth:  {eth_col}")
    print(f"    Sit:  {sit_col}")

    # Prepare DataFrame & numeric values
    df_excel['da_str'] = df_excel[da_col].astype(str).str.split('.').str[0].str.strip()
    df_excel['raw_econ'] = pd.to_numeric(df_excel[econ_col], errors='coerce')
    df_excel['raw_res'] = pd.to_numeric(df_excel[res_col], errors='coerce')
    df_excel['raw_eth'] = pd.to_numeric(df_excel[eth_col], errors='coerce')
    df_excel['raw_sit'] = pd.to_numeric(df_excel[sit_col], errors='coerce')

    # Min-Max Scaling helper (1.0 to 100.0)
    def min_max_scale(series):
        min_v = series.min()
        max_v = series.max()
        if max_v == min_v:
            return pd.Series(50.0, index=series.index)
        return 1.0 + 99.0 * ((series - min_v) / (max_v - min_v))

    df_excel['norm_econ'] = min_max_scale(df_excel['raw_econ'])
    df_excel['norm_res'] = min_max_scale(df_excel['raw_res'])
    df_excel['norm_eth'] = min_max_scale(df_excel['raw_eth'])
    df_excel['norm_sit'] = min_max_scale(df_excel['raw_sit'])

    cimd_scores = {}
    da_scores_export = {}

    for _, row in df_excel.iterrows():
        da_str = row['da_str']
        if not da_str or da_str == 'nan':
            continue

        econ = round(float(row['norm_econ']), 1) if not pd.isna(row['norm_econ']) else 50.0
        res = round(float(row['norm_res']), 1) if not pd.isna(row['norm_res']) else 50.0
        eth = round(float(row['norm_eth']), 1) if not pd.isna(row['norm_eth']) else 50.0
        sit = round(float(row['norm_sit']), 1) if not pd.isna(row['norm_sit']) else 50.0

        equal_score = round((econ + res + eth + sit) / 4.0, 1)

        item = {
            "econ": econ,
            "res": res,
            "eth": eth,
            "sit": sit,
            "equal": equal_score,
            "economic": econ
        }
        cimd_scores[da_str] = item
        da_scores_export[da_str] = item

    print(f"  Successfully computed Min-Max continuous scores for {len(cimd_scores)} DAs.")

    # 3. Update Stop Catchment DA Scores with Min-Max Continuous Values
    print("\n[3/4] Re-calculating population-weighted catchment scores for all stops...")
    updated_stops = []

    for stop in stops_list:
        stop_id = stop["stop_id"]
        stop_name = stop["stop_name"]
        lon = stop["lon"]
        lat = stop["lat"]
        is_regional = stop.get("is_regional", False)
        das = stop.get("das", [])

        weighted_equal_score = 0.0
        weighted_econ_score = 0.0
        updated_da_list = []

        if das and len(das) > 0:
            for d in das:
                da_id = str(d["da_id"]).strip()
                pct = d["pct"]
                frac = pct / 100.0

                da_info = cimd_scores.get(da_id, {
                    "equal": d.get("equal_score", 50.0),
                    "economic": d.get("economic_score", 50.0),
                    "econ": d.get("econ", 50.0),
                    "res": d.get("res", 50.0),
                    "eth": d.get("eth", 50.0),
                    "sit": d.get("sit", 50.0)
                })

                weighted_equal_score += da_info["equal"] * frac
                weighted_econ_score += da_info["economic"] * frac

                updated_da_list.append({
                    "da_id": da_id,
                    "pct": pct,
                    "equal_score": da_info["equal"],
                    "economic_score": da_info["economic"],
                    "econ": da_info["econ"],
                    "res": da_info["res"],
                    "eth": da_info["eth"],
                    "sit": da_info["sit"]
                })
        else:
            weighted_equal_score = 50.0
            weighted_econ_score = 50.0

        updated_stops.append({
            "stop_id": stop_id,
            "stop_name": stop_name,
            "lon": lon,
            "lat": lat,
            "equal_score": round(weighted_equal_score, 1),
            "economic_score": round(weighted_econ_score, 1),
            "is_regional": is_regional,
            "das": updated_da_list
        })

    # Sort and calculate dynamic quintiles across stops
    municipal_stops = [s for s in updated_stops if not s["is_regional"]]
    sorted_equal = sorted(municipal_stops, key=lambda x: x["equal_score"])
    sorted_econ = sorted(municipal_stops, key=lambda x: x["economic_score"])
    n = len(municipal_stops) or 1

    equal_rank = {s["stop_id"]: idx for idx, s in enumerate(sorted_equal)}
    econ_rank = {s["stop_id"]: idx for idx, s in enumerate(sorted_econ)}

    for s in updated_stops:
        if s["is_regional"]:
            s["equal_percentile"] = None
            s["economic_percentile"] = None
            s["equal_grade"] = "Regional"
            s["economic_grade"] = "Regional"
        else:
            eq_pct = round((equal_rank[s["stop_id"]] / (n - 1 or 1)) * 100.0, 1)
            ec_pct = round((econ_rank[s["stop_id"]] / (n - 1 or 1)) * 100.0, 1)
            s["equal_percentile"] = eq_pct
            s["economic_percentile"] = ec_pct

            def get_grade(pct):
                if pct >= 80.0: return "A"
                if pct >= 60.0: return "B"
                if pct >= 40.0: return "C"
                if pct >= 20.0: return "D"
                return "E"

            s["equal_grade"] = get_grade(eq_pct)
            s["economic_grade"] = get_grade(ec_pct)

    # 4. Output Updated Asset
    output_asset = {
        "total_stops": len(updated_stops),
        "da_scores": da_scores_export,
        "stops": updated_stops
    }

    output_path = "public/data/bus_stop_vulnerability.json"
    with open(output_path, "w") as f:
        json.dump(output_asset, f, indent=None)

    elapsed = round(time.time() - start_time, 2)
    print(f"\n[4/4] ✅ SUCCESS: Continuous Min-Max asset generated at '{output_path}' with {len(updated_stops)} stops in {elapsed}s.")

if __name__ == '__main__':
    main()
