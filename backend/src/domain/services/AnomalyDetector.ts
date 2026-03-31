export interface AnomalyFlag {
  type: 'zscore_exceeded' | 'negative_value' | 'exceeds_capacity' | 'zero_production_daylight';
  message: string;
}

export interface AnomalyResult {
  valid: boolean;
  flags: AnomalyFlag[];
}

export interface DeviceStats {
  mean: number;
  stddev: number;
  count: number;
}

export function detectAnomalies(
  wattsH: number,
  ratedCapacityWh: number,
  stats: DeviceStats | null,
  zScoreThreshold: number = 3.0,
): AnomalyResult {
  const flags: AnomalyFlag[] = [];

  if (wattsH < 0) {
    flags.push({
      type: 'negative_value',
      message: `Negative reading: ${wattsH} Wh`,
    });
  }

  if (wattsH > ratedCapacityWh) {
    flags.push({
      type: 'exceeds_capacity',
      message: `Reading ${wattsH} Wh exceeds rated capacity ${ratedCapacityWh} Wh`,
    });
  }

  if (stats && stats.count >= 10 && stats.stddev > 0) {
    const zScore = Math.abs(wattsH - stats.mean) / stats.stddev;
    if (zScore > zScoreThreshold) {
      flags.push({
        type: 'zscore_exceeded',
        message: `Z-score ${zScore.toFixed(2)} exceeds threshold ${zScoreThreshold} (mean=${stats.mean.toFixed(1)}, stddev=${stats.stddev.toFixed(1)})`,
      });
    }
  }

  return {
    valid: flags.length === 0,
    flags,
  };
}
