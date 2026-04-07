import { callAnthropic, parseJsonResponse } from './anthropicClient.js';

/**
 * Step 1: Classify whether a bug is a formal defect.
 *
 * @param {object} bug - Bug fields: id, title, description, component, reported_by, date_reported
 * @param {object} productContext - { user_needs: [...], product_requirements: [...] }
 * @param {string} apiKey
 * @returns {object} Structured defect classification result
 */
const DEFECT_CRITERION = 'It is a deviation from the intended function of the core product (fails a User Need or Product Requirement)';

export async function classifyDefect(bug, productContext, apiKey, productInfo) {
  const cleanBug = {
    id: bug.id,
    title: bug.title,
    description: bug.description,
    component: bug.component,
    reported_by: bug.reported_by,
    date_reported: bug.date_reported,
    comments: bug.comments || [],
  };

  const prompt = `You are a Quality Engineer performing defect classification for a ${productInfo.type} product called ${productInfo.name}.

Your task is to determine whether the following bug qualifies as a DEFECT.

DEFECT CRITERION:
${DEFECT_CRITERION}

USER NEEDS:
${JSON.stringify(productContext.user_needs, null, 2)}

PRODUCT REQUIREMENTS:
${JSON.stringify(productContext.product_requirements, null, 2)}
${productContext.additional_context ? `\nADDITIONAL CONTEXT:\n${productContext.additional_context}\n` : ''}
BUG TO CLASSIFY:
${JSON.stringify(cleanBug, null, 2)}

INSTRUCTIONS:
Assess whether this bug represents a deviation from the intended function by checking it against the user needs and product requirements above.

Respond in the following JSON format only, no other text:
{
    "bug_id": "${bug.id}",
    "is_defect": true or false,
    "deviates_from_intended_function": true or false,
    "failed_requirements": ["PR-XXX", "PR-YYY"] or [],
    "failed_user_needs": ["UN-XXX"] or [],
    "rationale": "one to two sentences explaining which requirements or user needs are failed and why, or why none are failed",
    "summary": "two to three sentence summary of the overall finding suitable for presentation at a Complaint Review Board meeting",
    "references": [{ "source": "Comment by [author] [date]", "quote": "relevant excerpt that influenced this conclusion" }]
}

Only include entries in "references" for comments that meaningfully influenced your conclusion. Use an empty array if no comments were relied upon.`;

  const responseText = await callAnthropic(prompt, apiKey);
  return parseJsonResponse(responseText);
}
