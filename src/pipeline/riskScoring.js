/**
 * Step 4: Calculate risk score and assemble the final triage report.
 * No LLM call — deterministic math only.
 *
 * @param {object} defect - Output from classifyDefect
 * @param {object} probability - Output from assessProbability
 * @param {object} severity - Output from assessSeverity
 * @returns {object} Final triage report for a single issue
 */
export function calculateRisk(defect, probability, severity) {
  const probScore = probability.probability_score;
  const sevScore = severity.severity_score;
  const riskScore = probScore * sevScore;

  let riskLevel, disposition;
  if (riskScore >= 15) {
    riskLevel = 'HIGH';
    disposition = 'CAPA Required';
  } else if (riskScore >= 7) {
    riskLevel = 'MEDIUM';
    disposition = 'Complaint - evaluate for CAPA escalation';
  } else {
    riskLevel = 'LOW';
    disposition = 'Complaint - moderate timeline';
  }

  return {
    bug_id: defect.bug_id,
    classification: 'DEFECT',
    failed_requirements: defect.failed_requirements,
    failed_user_needs: defect.failed_user_needs,
    defect_summary: defect.summary,
    risk_assessment: {
      probability_score: probScore,
      probability_label: probability.probability_label,
      probability_rationale: probability.rationale,
      severity_score: sevScore,
      severity_label: severity.severity_label,
      severity_rationale: severity.rationale,
      risk_score: riskScore,
      risk_level: riskLevel,
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