/**
 * Helper to determine if a bus stop's lat/lon coordinates or stop_id place it inside
 * a regional transit partner community (Leduc, Fort Saskatchewan, St. Albert, Sherwood Park,
 * Spruce Grove, EIA/Nisku, Devon, Beaumont).
 */
export function checkIsRegional(lat: number, lon: number, stopId?: string): boolean {
  if (stopId) {
    const sid = String(stopId);
    // Explicit regional prefix matches:
    // L0 = Leduc Transit, F1-F6 = Fort Sask Transit
    if (sid.startsWith('L0') || /^F[1-6]/.test(sid)) {
      return true;
    }
  }

  // 1. Leduc, Nisku, and Edmonton International Airport (EIA) (South of Edmonton boundary ~53.35)
  const inLeducOrAirport = lat < 53.35;

  // 2. Fort Saskatchewan (expanded to include Westpark down to -113.28)
  const inFortSask = lat >= 53.665 && lat <= 53.76 && lon >= -113.285 && lon <= -113.10;

  // 3. St. Albert
  const inStAlbert = lat >= 53.60 && lat <= 53.70 && lon >= -113.72 && lon <= -113.56;

  // 4. Sherwood Park & Strathcona County
  const inSherwoodPark = lat >= 53.48 && lat <= 53.59 && lon >= -113.35 && lon <= -113.15;

  // 5. Spruce Grove & Parkland County
  const inSpruceGrove = lat >= 53.50 && lat <= 53.58 && lon >= -113.95 && lon <= -113.80;

  // 6. Beaumont (South / South-East)
  const inBeaumont = lat < 53.38 && lon > -113.45;

  // 7. Devon (South-West)
  const inDevon = lat < 53.38 && lon < -113.68;

  return (
    inLeducOrAirport ||
    inFortSask ||
    inStAlbert ||
    inSherwoodPark ||
    inSpruceGrove ||
    inBeaumont ||
    inDevon
  );
}
