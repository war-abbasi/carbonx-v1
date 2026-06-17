const { computeProgress } = require('../utils/goalProgress');

describe('computeProgress', () => {
  test('under target → on track with headroom', () => {
    const r = computeProgress({ targetKg: 1000 }, 400);
    expect(r.progressPct).toBe(40);
    expect(r.onTrack).toBe(true);
    expect(r.remainingKg).toBe(600);
  });

  test('over target → flagged, negative remaining', () => {
    const r = computeProgress({ targetKg: 1000 }, 1200);
    expect(r.progressPct).toBe(120);
    expect(r.onTrack).toBe(false);
    expect(r.remainingKg).toBe(-200);
  });

  test('exactly on target counts as on track', () => {
    const r = computeProgress({ targetKg: 500 }, 500);
    expect(r.onTrack).toBe(true);
    expect(r.progressPct).toBe(100);
  });

  test('zero / missing target does not divide by zero', () => {
    const r = computeProgress({ targetKg: 0 }, 300);
    expect(r.progressPct).toBe(0);
    expect(Number.isFinite(r.progressPct)).toBe(true);
  });
});
