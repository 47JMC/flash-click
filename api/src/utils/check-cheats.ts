export function getMultiplier(
  powerupsEnabled: boolean,
  activePowerup: { type: string; expiresAt: number } | undefined,
): number {
  const isExpired = !activePowerup || Date.now() > activePowerup.expiresAt;
  if (!powerupsEnabled || isExpired) return 1;
  if (activePowerup.type === "overclock") return 3;
  if (activePowerup.type === "double") return 2;
  return 1;
}

export function getElapsedMs(
  key: string,
  now: number,
  playerLastSyncTime: Map<string, number>,
): number {
  const lastSyncTime = playerLastSyncTime.get(key) ?? now;
  playerLastSyncTime.set(key, now);
  return lastSyncTime === now ? 500 : now - lastSyncTime;
}

export function varianceCheck(timestamps: number[]): boolean {
  if (timestamps.length <= 5) return false;

  const gaps = timestamps
    .map((t, i) => (i > 0 ? t - timestamps[i - 1] : 0))
    .slice(1);

  const gapDiffs = gaps.map((g, i) => (i > 0 ? g - gaps[i - 1] : 0)).slice(1);

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

  const variance =
    gaps.reduce((a, b) => a + Math.pow(b - avgGap, 2), 0) / gaps.length;

  const avgGapDiff = gapDiffs.reduce((a, b) => a + b, 0) / gapDiffs.length;

  const gapDiffVariance =
    gapDiffs.reduce((a, b) => a + Math.pow(b - avgGapDiff, 2), 0) /
    gapDiffs.length;

  const flagged =
    (variance < 20 && avgGap < 60) || (gapDiffVariance < 5 && avgGap < 60);

  if (flagged) {
    console.log(
      `[varianceCheck] Flagged! Variance: ${variance.toFixed(2)}, GapDiffVariance: ${gapDiffVariance.toFixed(2)}, AvgGap: ${avgGap.toFixed(2)}ms`,
    );
  }

  return flagged;
}

export function deltaCheck(
  delta: number,
  lastClicks: number,
  maxCPS: number,
  elapsedMs: number,
  reportedClicks: number,
): number {
  const maxAllowedDelta = Math.floor((maxCPS * elapsedMs) / 1000);
  if (delta > maxAllowedDelta) {
    console.log(
      `[deltaCheck] Flagged! Delta: ${delta}, Max: ${maxAllowedDelta}`,
    );
    return lastClicks + maxAllowedDelta;
  }
  return reportedClicks;
}

export function applyPenalty(delta: number, lastClicks: number): number {
  return lastClicks + Math.floor(delta * 0.1);
}
