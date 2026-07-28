export const mapStabilityClass = (cls: string): string => {
  if (!cls) return 'Moderate Swing Routes';
  const clean = cls.trim();
  if (clean === 'Bedrock Essential' || clean === 'Bedrock Essentials') {
    return 'Essential Equity Routes';
  }
  if (clean === 'Policy Swing Corridor' || clean === 'Policy Swing Route' || clean === 'Policy Swing' || clean === 'High Swing') {
    return 'High Swing Routes';
  }
  if (clean === 'Moderate Stability' || clean === 'Moderate Swing') {
    return 'Moderate Swing Routes';
  }
  if (clean === 'Bedrock Resilient' || clean === 'Bedrock Resilients' || clean === 'Low Equity-Priority') {
    return 'Low Equity-Priority Routes';
  }
  return clean;
};

export const STABILITY_COLORS: Record<string, string> = {
  'Essential Equity Routes': '#3B82F6',       // Blue
  'High Swing Routes': '#EF4444',             // Red
  'Moderate Swing Routes': '#F59E0B',         // Yellow / Amber
  'Low Equity-Priority Routes': '#10B981',    // Emerald
};

export const STABILITY_TAILWIND_COLORS: Record<string, string> = {
  'Essential Equity Routes': 'bg-blue-600',
  'High Swing Routes': 'bg-red-500',
  'Moderate Swing Routes': 'bg-amber-500',
  'Low Equity-Priority Routes': 'bg-emerald-600',
};
