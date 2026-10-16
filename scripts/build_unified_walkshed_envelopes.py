"""
build_unified_walkshed_envelopes.py
Transforms fragmented street-buffer multi-polygons in public/data/isochrones/
into unified, contiguous 400m pedestrian walkshed envelopes using Shapely
morphological closing (dilation + erosion) in projected metric space (EPSG:32612).
"""

import os
import glob
import json
import time
import pyproj
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.ops import transform

# Coordinate transformers between WGS84 and UTM Zone 12N (metric meters)
transformer_to_utm = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:32612", always_xy=True).transform
transformer_to_wgs = pyproj.Transformer.from_crs("EPSG:32612", "EPSG:4326", always_xy=True).transform

def remove_small_holes(poly: Polygon, min_hole_area: float = 15000.0) -> Polygon:
    """Removes small interior holes (e.g. median gaps, building lots) while keeping major voids."""
    if not poly.interiors:
        return poly
    kept_interiors = [interior for interior in poly.interiors if Polygon(interior).area >= min_hole_area]
    return Polygon(poly.exterior, kept_interiors)

def unify_walkshed_geometry(geom_4326, closing_dist: float = 85.0, min_island_area: float = 5000.0, simplify_tol: float = 3.0):
    """
    Applies morphological closing to dissolve disconnected street network buffers into
    a unified corridor walking envelope.
    """
    if geom_4326.is_empty:
        return geom_4326

    # Project to metric coordinates
    geom_utm = transform(transformer_to_utm, geom_4326)

    # If it's already a single simple polygon with no internal fragmentation, close gently
    dilated = geom_utm.buffer(closing_dist, quad_segs=8)
    closed = dilated.buffer(-closing_dist, quad_segs=8).simplify(simplify_tol, preserve_topology=True)

    # Decompose into constituent polygons
    geoms = closed.geoms if isinstance(closed, MultiPolygon) else [closed]

    # Filter out tiny residual slivers and prune micro-holes
    cleaned_parts = []
    for g in geoms:
        if g.area >= min_island_area:
            cleaned_parts.append(remove_small_holes(g))

    if not cleaned_parts:
        # Fallback to original closed geometry if everything was filtered
        cleaned_parts = list(geoms)

    final_utm = MultiPolygon(cleaned_parts) if len(cleaned_parts) > 1 else cleaned_parts[0]

    # Reproject back to WGS84
    return transform(transformer_to_wgs, final_utm)

def process_all_isochrones(
    src_dir: str = "data/archive_isochrones_raw",
    dst_dir: str = "public/data/isochrones"
):
    print("=" * 70)
    print("CONTINUOUS WALKSHED ENVELOPE GENERATOR (PATHWAY 2)")
    print(f"Source:      {src_dir}")
    print(f"Destination: {dst_dir}")
    print("=" * 70)

    files = sorted(glob.glob(os.path.join(src_dir, "*.json")))
    if not files:
        print("No files found in source directory!")
        return

    os.makedirs(dst_dir, exist_ok=True)
    t0 = time.time()
    success_count = 0
    total_orig_size = 0
    total_new_size = 0
    total_orig_islands = 0
    total_new_islands = 0

    for idx, fpath in enumerate(files, 1):
        fname = os.path.basename(fpath)
        out_path = os.path.join(dst_dir, fname)

        orig_size = os.path.getsize(fpath)
        total_orig_size += orig_size

        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)

            if not data.get("features"):
                continue

            feature = data["features"][0]
            props = feature.get("properties", {})
            orig_geom = shape(feature["geometry"])

            orig_islands = len(orig_geom.geoms) if isinstance(orig_geom, MultiPolygon) else 1
            total_orig_islands += orig_islands

            # Apply unified morphological closing
            unified_geom = unify_walkshed_geometry(orig_geom)

            new_islands = len(unified_geom.geoms) if isinstance(unified_geom, MultiPolygon) else 1
            total_new_islands += new_islands

            updated_props = {
                **props,
                "envelope_type": "continuous_network_walkshed",
                "closing_radius_m": 85.0
            }

            out_payload = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": updated_props,
                        "geometry": mapping(unified_geom)
                    }
                ]
            }

            with open(out_path, "w", encoding="utf-8") as out_f:
                json.dump(out_payload, out_f, separators=(",", ":"))

            new_size = os.path.getsize(out_path)
            total_new_size += new_size
            success_count += 1

            if idx % 25 == 0 or idx == len(files) or fname == "008.json":
                pct = (idx / len(files)) * 100
                print(f"[{idx:3d}/{len(files):3d}] ({pct:5.1f}%) {fname:<10} | Islands: {orig_islands:3d} -> {new_islands:2d} | Size: {orig_size/1024:6.1f}KB -> {new_size/1024:5.1f}KB")

        except Exception as e:
            print(f"Error processing {fname}: {e}")

    elapsed = time.time() - t0
    print("\n" + "=" * 70)
    print("CONTINUOUS ENVELOPE SUMMARY")
    print("=" * 70)
    print(f"Files Processed:      {success_count} / {len(files)}")
    print(f"Total Polygon Islands: {total_orig_islands:,} -> {total_new_islands:,} ({100 - (total_new_islands / max(1, total_orig_islands) * 100):.1f}% reduction in fragments)")
    print(f"Total GeoJSON Weight:  {total_orig_size / (1024*1024):.2f} MB -> {total_new_size / (1024*1024):.2f} MB ({100 - (total_new_size / max(1, total_orig_size) * 100):.1f}% bandwidth reduction)")
    print(f"Processing Time:      {elapsed:.1f}s")
    print("=" * 70)

if __name__ == "__main__":
    process_all_isochrones()
