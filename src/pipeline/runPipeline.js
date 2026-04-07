import { classifyDefect } from './defectClassification.js';
import { assessProbability } from './probability.js';
import { assessSeverity } from './severity.js';
import { calculateRisk } from './riskScoring.js';

/**
 * Runs the full four-step triage pipeline for a single bug.
 *
 * @param {object} bug - Bug fields: id, title, description, component, reported_by, date_reported
 * @param {object} productContext - { user_needs: [...], product_requirements: [...], additional_context: string }
 * @param {string} apiKey
 * @returns {object} Final triage report, or non-defect result if Step 1 rules it out
 */
export async function runPipeline(bug, productContext, apiKey, productInfo) {
  // Step 1: Defect classification
  const defect = await classifyDefect(bug, productContext, apiKey, productInfo);

  // If not a defect, skip remaining steps
  if (!defect.is_defect) {
    return {
      bug_id: defect.bug_id,
      classification: 'NON-DEFECT',
      defect_summary: defect.summary,
      rationale: defect.rationale,
      disposition: 'No further action required. Fix at team discretion.',
      references: (defect.references || []).map(r => ({ ...r, step: 'Classification' })),
      generated_at: new Date().toISOString(),
    };
  }

  // Steps 2 + 3: Run in parallel since they are independent
  const additionalContext = productContext.additional_context;
  const [probability, severity] = await Promise.all([
    assessProbability(defect, bug, apiKey, productInfo, additionalContext),
    assessSeverity(defect, bug, apiKey, productInfo, additionalContext),
  ]);

  // Step 4: Risk scoring (no LLM)
  return calculateRisk(defect, probability, severity);
}