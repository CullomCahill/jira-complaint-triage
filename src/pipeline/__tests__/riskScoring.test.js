import { calculateRisk } from '../riskScoring.js';
import { DEFAULT_RISK_MATRIX } from '../riskMatrix.js';

// Helpers to build minimal input objects
function makeDefect(overrides = {}) {
  return {
    bug_id: 'TEST-001',
    is_defect: true,
    summary: 'Test defect summary',
    failed_requirements: ['REQ-01'],
    failed_user_needs: ['UN-01'],
    references: [],
    ...overrides,
  };
}

function makeProb(score, label = `P${score}`, overrides = {}) {
  return { probability_score: score, probability_label: label, rationale: 'test rationale', references: [], ...overrides };
}

function makeSev(score, label = `S${score}`, overrides = {}) {
  return { severity_score: score, severity_label: label, rationale: 'test rationale', references: [], ...overrides };
}

describe('calculateRisk — classification and disposition', () => {
  test('always returns classification: DEFECT', () => {
    const result = calculateRisk(makeDefect(), makeProb(1), makeSev(1), DEFAULT_RISK_MATRIX);
    expect(result.classification).toBe('DEFECT');
  });

  test('LOW risk → correct disposition text', () => {
    const result = calculateRisk(makeDefect(), makeProb(1), makeSev(1), DEFAULT_RISK_MATRIX);
    expect(result.disposition).toBe('Complaint - moderate timeline');
  });

  test('MEDIUM risk → correct disposition text', () => {
    const result = calculateRisk(makeDefect(), makeProb(3), makeSev(2), DEFAULT_RISK_MATRIX);
    expect(result.risk_assessment.risk_level).toBe('MEDIUM');
    expect(result.disposition).toBe('Complaint - evaluate for CAPA escalation');
  });

  test('HIGH risk → correct disposition text', () => {
    const result = calculateRisk(makeDefect(), makeProb(5), makeSev(5), DEFAULT_RISK_MATRIX);
    expect(result.risk_assessment.risk_level).toBe('HIGH');
    expect(result.disposition).toBe('CAPA Required');
  });
});

describe('calculateRisk — risk_assessment fields', () => {
  test('probability and severity scores pass through correctly', () => {
    const result = calculateRisk(makeDefect(), makeProb(3, 'Moderate'), makeSev(4, 'Severe'), DEFAULT_RISK_MATRIX);
    expect(result.risk_assessment.probability_score).toBe(3);
    expect(result.risk_assessment.probability_label).toBe('Moderate');
    expect(result.risk_assessment.severity_score).toBe(4);
    expect(result.risk_assessment.severity_label).toBe('Severe');
  });

  test('risk_level is included in risk_assessment', () => {
    const result = calculateRisk(makeDefect(), makeProb(5), makeSev(5), DEFAULT_RISK_MATRIX);
    expect(result.risk_assessment).toHaveProperty('risk_level', 'HIGH');
  });

  test('rationale strings pass through from probability and severity', () => {
    const prob = makeProb(2, 'Low', { rationale: 'prob rationale text' });
    const sev = makeSev(2, 'Minor', { rationale: 'sev rationale text' });
    const result = calculateRisk(makeDefect(), prob, sev, DEFAULT_RISK_MATRIX);
    expect(result.risk_assessment.probability_rationale).toBe('prob rationale text');
    expect(result.risk_assessment.severity_rationale).toBe('sev rationale text');
  });
});

describe('calculateRisk — references assembly', () => {
  test('references from all three steps are merged with correct step labels', () => {
    const defect = makeDefect({ references: [{ text: 'defect ref' }] });
    const prob   = makeProb(2, 'P2', { references: [{ text: 'prob ref' }] });
    const sev    = makeSev(2, 'S2', { references: [{ text: 'sev ref' }] });

    const result = calculateRisk(defect, prob, sev, DEFAULT_RISK_MATRIX);

    expect(result.references).toHaveLength(3);
    expect(result.references[0]).toMatchObject({ text: 'defect ref', step: 'Classification' });
    expect(result.references[1]).toMatchObject({ text: 'prob ref',   step: 'Probability' });
    expect(result.references[2]).toMatchObject({ text: 'sev ref',    step: 'Severity' });
  });

  test('empty references arrays produce empty merged array', () => {
    const result = calculateRisk(makeDefect(), makeProb(1), makeSev(1), DEFAULT_RISK_MATRIX);
    expect(result.references).toEqual([]);
  });
});

describe('calculateRisk — output shape', () => {
  test('result includes bug_id from defect', () => {
    const result = calculateRisk(makeDefect({ bug_id: 'BUG-42' }), makeProb(1), makeSev(1), DEFAULT_RISK_MATRIX);
    expect(result.bug_id).toBe('BUG-42');
  });

  test('result includes a generated_at ISO timestamp', () => {
    const before = new Date().toISOString();
    const result = calculateRisk(makeDefect(), makeProb(1), makeSev(1), DEFAULT_RISK_MATRIX);
    const after  = new Date().toISOString();
    expect(result.generated_at >= before).toBe(true);
    expect(result.generated_at <= after).toBe(true);
  });

  test('failed_requirements and failed_user_needs pass through from defect', () => {
    const defect = makeDefect({ failed_requirements: ['REQ-10', 'REQ-11'], failed_user_needs: ['UN-5'] });
    const result = calculateRisk(defect, makeProb(1), makeSev(1), DEFAULT_RISK_MATRIX);
    expect(result.failed_requirements).toEqual(['REQ-10', 'REQ-11']);
    expect(result.failed_user_needs).toEqual(['UN-5']);
  });
});

describe('calculateRisk — matrix boundary cases', () => {
  test('sev=1 prob=5 → LOW (severity 1 row is always LOW in default matrix)', () => {
    const result = calculateRisk(makeDefect(), makeProb(5), makeSev(1), DEFAULT_RISK_MATRIX);
    expect(result.risk_assessment.risk_level).toBe('LOW');
  });

  test('sev=5 prob=1 → HIGH (severity 5 row is always HIGH in default matrix)', () => {
    const result = calculateRisk(makeDefect(), makeProb(1), makeSev(5), DEFAULT_RISK_MATRIX);
    expect(result.risk_assessment.risk_level).toBe('HIGH');
  });
});
