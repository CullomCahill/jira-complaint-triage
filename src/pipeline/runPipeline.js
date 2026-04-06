import { classifyDefect } from './defectClassification.js';
import { assessProbability } from './probability.js';
import { assessSeverity } from './severity.js';
import { calculateRisk } from './riskScoring.js';

/**
 * Runs the full four-step triage pipeline for a single bug.
 *
 * @param {object} bug - Bug fields: id, title, description, component, reported_by, date_reported, in_released_product, related_feature
 * @param {object} productContext - { user_needs: [...], product_requirements: [...] }
 * @param {object} defectCriteria - { must_meet_both: [string, string] }
 * @param {string} apiKey
 * @returns {object} Final triage report, or non-defect result if Step 1 rules it out
 */
export async function runPipeline(bug, productContext, defectCriteria, apiKey) {
  // Step 1: Defect classification
  const defect = await classifyDefect(bug, productContext, defectCriteria, apiKey);

  // If not a defect, skip remaining steps
  if (!defect.is_defect) {
    return {
      bug_id: defect.bug_id,
      classification: 'NON-DEFECT',
      defect_summary: defect.summary,
      criterion_1_rationale: defect.criterion_1_rationale,
      criterion_2_rationale: defect.criterion_2_rationale,
      disposition: 'No further action required. Fix at team discretion.',
      references: (defect.references || []).map(r => ({ ...r, step: 'Classification' })),
      generated_at: new Date().toISOString(),
    };
  }

  // Steps 2 + 3: Run in parallel since they are independent
  const [probability, severity] = await Promise.all([
    assessProbability(defect, bug, apiKey),
    assessSeverity(defect, bug, apiKey),
  ]);

  // Step 4: Risk scoring (no LLM)
  return calculateRisk(defect, probability, severity);
}