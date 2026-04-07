import { getRiskLevel, DEFAULT_RISK_MATRIX } from '../riskMatrix.js';

describe('DEFAULT_RISK_MATRIX', () => {
  test('severity 1 is always LOW regardless of probability', () => {
    for (let prob = 1; prob <= 5; prob++) {
      expect(DEFAULT_RISK_MATRIX[1][prob]).toBe('LOW');
    }
  });

  test('severity 5 / probability 5 is HIGH', () => {
    expect(DEFAULT_RISK_MATRIX[5][5]).toBe('HIGH');
  });

  test('severity 5 / probability 1 is HIGH', () => {
    expect(DEFAULT_RISK_MATRIX[5][1]).toBe('HIGH');
  });
});

describe('getRiskLevel — default matrix', () => {
  test('1×1 → LOW', () => {
    expect(getRiskLevel(1, 1, DEFAULT_RISK_MATRIX)).toBe('LOW');
  });

  test('2×3 → MEDIUM', () => {
    expect(getRiskLevel(2, 3, DEFAULT_RISK_MATRIX)).toBe('MEDIUM');
  });

  test('3×4 → HIGH', () => {
    expect(getRiskLevel(3, 4, DEFAULT_RISK_MATRIX)).toBe('HIGH');
  });

  test('5×5 → HIGH', () => {
    expect(getRiskLevel(5, 5, DEFAULT_RISK_MATRIX)).toBe('HIGH');
  });

  test('4×1 → MEDIUM (low prob saves a high severity)', () => {
    expect(getRiskLevel(4, 1, DEFAULT_RISK_MATRIX)).toBe('MEDIUM');
  });

  test('2×5 → HIGH (high prob elevates moderate severity)', () => {
    expect(getRiskLevel(2, 5, DEFAULT_RISK_MATRIX)).toBe('HIGH');
  });
});

describe('getRiskLevel — string keys from KVS round-trip', () => {
  // Forge KVS serializes JSON which converts numeric keys to strings.
  // getRiskLevel must handle both.
  const stringKeyMatrix = {
    '1': { '1': 'LOW', '2': 'LOW', '3': 'LOW', '4': 'LOW', '5': 'LOW' },
    '2': { '1': 'LOW', '2': 'LOW', '3': 'MEDIUM', '4': 'MEDIUM', '5': 'HIGH' },
    '3': { '1': 'LOW', '2': 'MEDIUM', '3': 'MEDIUM', '4': 'HIGH', '5': 'HIGH' },
    '4': { '1': 'MEDIUM', '2': 'HIGH', '3': 'HIGH', '4': 'HIGH', '5': 'HIGH' },
    '5': { '1': 'HIGH', '2': 'HIGH', '3': 'HIGH', '4': 'HIGH', '5': 'HIGH' },
  };

  test('numeric inputs with string-key matrix still resolve correctly', () => {
    expect(getRiskLevel(3, 4, stringKeyMatrix)).toBe('HIGH');
    expect(getRiskLevel(2, 2, stringKeyMatrix)).toBe('LOW');
    expect(getRiskLevel(4, 1, stringKeyMatrix)).toBe('MEDIUM');
  });
});

describe('getRiskLevel — custom matrix', () => {
  // Verify that a user-configured matrix overrides the defaults
  const allHighMatrix = {
    1: { 1: 'HIGH', 2: 'HIGH', 3: 'HIGH', 4: 'HIGH', 5: 'HIGH' },
    2: { 1: 'HIGH', 2: 'HIGH', 3: 'HIGH', 4: 'HIGH', 5: 'HIGH' },
    3: { 1: 'HIGH', 2: 'HIGH', 3: 'HIGH', 4: 'HIGH', 5: 'HIGH' },
    4: { 1: 'HIGH', 2: 'HIGH', 3: 'HIGH', 4: 'HIGH', 5: 'HIGH' },
    5: { 1: 'HIGH', 2: 'HIGH', 3: 'HIGH', 4: 'HIGH', 5: 'HIGH' },
  };

  test('1×1 → HIGH when custom matrix overrides all cells to HIGH', () => {
    expect(getRiskLevel(1, 1, allHighMatrix)).toBe('HIGH');
  });
});

describe('getRiskLevel — null/undefined matrix fallback', () => {
  test('null matrix falls back to DEFAULT_RISK_MATRIX', () => {
    expect(getRiskLevel(3, 4, null)).toBe('HIGH');
  });

  test('undefined matrix falls back to DEFAULT_RISK_MATRIX', () => {
    expect(getRiskLevel(2, 3, undefined)).toBe('MEDIUM');
  });
});
