/**
 * Helper to determine if a bus stop's lat/lon coordinates place it inside
 * a regional transit partner community (St. Albert, Sherwood Park, or Fort Saskatchewan)
 */
export function checkIsRegional(lat: number, lon: number): boolean {
  // St. Albert bounding box
  const inStAlbert = lat >= 53.60 && lat <= 53.69 && lon >= -113.72 && lon <= -113.56;
  
  // Sherwood Park bounding box (Strathcona County)
  const inSherwoodPark = lat >= 53.48 && lat <= 53.58 && lon >= -113.35 && lon <= -113.15;
  
  // Fort Saskatchewan bounding box
  const inFortSask = lat >= 53.67 && lat <= 53.75 && lon >= -113.25 && lon <= -113.10;

  // Spruce Grove bounding box
  const inSpruceGrove = lat >= 53.51 && lat <= 53.57 && lon >= -113.95 && lon <= -113.83;
  
  return inStAlbert || inSherwoodPark || inFortSask || inSpruceGrove;
}
