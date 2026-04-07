/**
 * Default ISO 14971-aligned 5×5 risk matrix.
 * Keys are severity (rows) and probability (cols), both 1–5.
 * Severity 1 is always LOW regardless of probability.
 */
export const DEFAULT_RISK_MATRIX = {
  1: { 1: 'LOW',    2: 'LOW',    3: 'LOW',    4: 'LOW',    5: 'LOW'    },
  2: { 1: 'LOW',    2: 'LOW',    3: 'MEDIUM', 4: 'MEDIUM', 5: 'HIGH'   },
  3: { 1: 'LOW',    2: 'MEDIUM', 3: 'MEDIUM', 4: 'HIGH',   5: 'HIGH'   },
  4: { 1: 'MEDIUM', 2: 'HIGH',   3: 'HIGH',   4: 'HIGH',   5: 'HIGH'   },
  5: { 1: 'HIGH',   2: 'HIGH',   3: 'HIGH',   4: 'HIGH',   5: 'HIGH'   },
};

/**
 * Look up a risk level from a 5×5 matrix.
 * Handles KVS JSON round-trip which converts numeric keys to strings.
 *
 * @param {number} sev  - Severity score 1–5
 * @param {number} prob - Probability score 1–5
 * @param {object} matrix - Nested { [sev]: { [prob]: 'LOW'|'MEDIUM'|'HIGH' } }
 * @returns {string} 'LOW' | 'MEDIUM' | 'HIGH'
 */
export function getRiskLevel(sev, prob, matrix) {
  const row = matrix?.[String(sev)] ?? matrix?.[sev] ?? DEFAULT_RISK_MATRIX[sev];
  return row?.[String(prob)] ?? row?.[prob] ?? DEFAULT_RISK_MATRIX[sev]?.[prob] ?? 'LOW';
}
