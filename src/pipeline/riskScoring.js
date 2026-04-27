import { getRiskLevel } from './riskMatrix.js';

const DISPOSITION = {
  LOW:    'Complaint - moderate timeline',
  MEDIUM: 'Complaint - evaluate for CAPA escalation',
  HIGH:   'CAPA Required',
};

/**
 * Step 4: Calculate risk level and assemble the final triage report.
 * No LLM call — deterministic matrix lookup only.
 *
 * @param {object} defect      - Output from classifyDefect
 * @param {object} probability - Output from assessProbability
 * @param {object} severity    - Output from assessSeverity
 * @param {object} matrix      - 5×5 risk matrix from storage
 * @returns {object} Final triage report for a single issue
 */
const toRationaleText = (rationale, points) => {
  if (typeof rationale === 'string' && rationale.trim().length > 0) return rationale;
  if (Array.isArray(points)) return points.join(' ');
  return '';
};

const safePoints = (points) => (Array.isArray(points) ? points : []);

export function calculateRisk(defect, probability, severity, matrix) {
  const probScore = probability.probability_score;
  const sevScore  = severity.severity_score;

  const riskLevel  = getRiskLevel(sevScore, probScore, matrix);
  const disposition = DISPOSITION[riskLevel] ?? DISPOSITION.HIGH;

  return {
    bug_id: defect.bug_id,
    classification: 'DEFECT',
    failed_requirements: defect.failed_requirements,
    failed_user_needs:   defect.failed_user_needs,
    defect_summary:      defect.summary,
    risk_assessment: {
      probability_score:         probScore,
      probability_label:         probability.probability_label,
      probability_rationale:        toRationaleText(probability.rationale, probability.rationale_points),
      probability_rationale_points: safePoints(probability.rationale_points),
      probability_confidence:       probability.confidence,
      severity_score:               sevScore,
      severity_label:               severity.severity_label,
      severity_rationale:           toRationaleText(severity.rationale, severity.rationale_points),
      severity_rationale_points:    safePoints(severity.rationale_points),
      severity_confidence:          severity.confidence,
      risk_level:                riskLevel,
    },
    disposition,
    references: [
      ...(defect.references || []).map(r => ({ ...r, step: 'Classification' })),
      ...(probability.references || []).map(r => ({ ...r, step: 'Probability' })),
      ...(severity.references || []).map(r => ({ ...r, step: 'Severity' })),
    ],
    generated_at: new Date().toISOString(),
  };
}
