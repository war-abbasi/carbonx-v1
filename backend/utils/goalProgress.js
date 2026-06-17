/**
 * Pure goal-progress maths (no DB) so it can be unit-tested in isolation.
 *
 * @param {{targetKg:number}} goal
 * @param {number} monthKg  emissions logged this month (kg CO2e)
 */
function computeProgress(goal, monthKg) {
  const target = goal.targetKg || 0;
  const pct     = target > 0 ? Math.round((monthKg / target) * 100) : 0;
  const onTrack = monthKg <= target;
  return {
    currentKg: monthKg,
    progressPct: pct,
    onTrack,
    remainingKg: parseFloat((target - monthKg).toFixed(2)),
  };
}

module.exports = { computeProgress };
