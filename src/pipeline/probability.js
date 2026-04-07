import { callAnthropic, parseJsonResponse } from './anthropicClient.js';

/**
 * Step 2: Assess the probability that a user encounters this defect.
 *
 * @param {object} defect - Output from classifyDefect (bug_id, summary, failed_requirements)
 * @param {object} bug - Original bug fields: id, title, description, component, reported_by, date_reported
 * @param {string} apiKey
 * @returns {object} { bug_id, probability_score, probability_label, rationale }
 */
export async function assessProbability(defect, bug, apiKey, productInfo, additionalContext = '', scale = []) {
  const scaleLines = scale.map((s, i) => `${i + 1} - ${s.label}: ${s.description}`).join('\n');
  const validLabels = scale.map(s => `"${s.label}"`).join(' or ');

  const prompt = `You are a Quality Engineer performing a risk probability assessment for a ${productInfo.type} product called ${productInfo.name}, ${productInfo.description}.

Your task is to assess the PROBABILITY that this defect will occur for users of the product.

PROBABILITY SCALE:
${scaleLines}

FACTORS TO CONSIDER:
- How many users are likely to encounter the conditions that trigger this bug?
- Is it tied to a common user action or an edge case?
- How frequently would the triggering conditions occur in normal use?
- How many reports have been received (if mentioned)?
- Does it affect all users or a specific subset (certain OS, certain usage pattern, etc.)?

DEFECT TO ASSESS:
Bug ID: ${defect.bug_id}
Classification Summary: ${defect.summary}
Failed Requirements: ${JSON.stringify(defect.failed_requirements)}

ORIGINAL BUG DETAILS:
Title: ${bug.title}
Description: ${bug.description}
Component: ${bug.component}
Reported By: ${bug.reported_by}
${bug.comments?.length ? `\nCOMMENTS (${bug.comments.length}):\n${bug.comments.map(c => `[${c.date}] ${c.author}: ${c.body}`).join('\n\n')}` : ''}
${additionalContext ? `\nADDITIONAL CONTEXT:\n${additionalContext}\n` : ''}
INSTRUCTIONS:
Assess the probability that a user of the ${productInfo.name} product will encounter this defect during normal use. Base your assessment on the evidence available in the bug report, considering the factors listed above. Do not speculate beyond what is stated.

Respond in the following JSON format only, no other text:
{
    "bug_id": "${defect.bug_id}",
    "probability_score": 1 to 5,
    "probability_label": ${validLabels},
    "rationale": "two to three sentence explanation grounded in specific evidence from the bug report",
    "references": [{ "source": "Comment by [author] [date]", "quote": "relevant excerpt that influenced this conclusion" }]
}

Only include entries in "references" for comments that meaningfully influenced your probability assessment. Use an empty array if no comments were relied upon.`;

  const responseText = await callAnthropic(prompt, apiKey);
  return parseJsonResponse(responseText);
}