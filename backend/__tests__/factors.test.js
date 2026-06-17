const { FACTORS } = require('../services/carbonService');

describe('emission factor catalogue', () => {
  test('includes Pakistan industrial + agriculture categories', () => {
    expect(Object.keys(FACTORS)).toEqual(
      expect.arrayContaining(['commute', 'energy', 'travel', 'food', 'industry', 'agriculture'])
    );
  });

  test('industry factors are well-formed (factor/unit/label/scope)', () => {
    for (const [sub, f] of Object.entries(FACTORS.industry)) {
      expect(typeof f.factor).toBe('number');
      expect(f.factor).toBeGreaterThan(0);
      expect(f.unit).toBeTruthy();
      expect(f.label).toBeTruthy();
      expect(['scope1', 'scope2', 'scope3', 'personal']).toContain(f.scope);
    }
  });

  test('industrial process emissions are classified as Scope 1', () => {
    expect(FACTORS.industry.coal.scope).toBe('scope1');
    expect(FACTORS.agriculture.rice_paddy.scope).toBe('scope1');
  });

  test('valueKg = quantity × factor (cement example)', () => {
    const f = FACTORS.industry.cement_process.factor; // 0.53
    const qty = 1000; // kg cement
    expect(parseFloat((qty * f).toFixed(4))).toBe(530);
  });
});
