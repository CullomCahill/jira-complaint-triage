import { callAnthropic, parseJsonResponse } from './anthropicClient.js';

/**
 * Step 1: Classify whether a bug is a formal defect.
 *
 * @param {object} bug - Bug fields: id, title, description, component, reported_by, date_reported, in_released_product, related_feature
 * @param {object} productContext - { user_needs: [...], product_requirements: [...] }
 * @param {object} defectCriteria - { must_meet_both: [string, string] }
 * @param {string} apiKey
 * @returns {object} Structured defect classification result
 */
export async function classifyDefect(bug, productContext, defectCriteria, apiKey) {
  const cleanBug = {
    id: bug.id,
    title: bug.title,
    description: bug.description,
    component: bug.component,
    reported_by: bug.reported_by,
    date_reported: bug.date_reported,
    in_released_product: bug.in_released_product,
    related_feature: bug.related_feature,
    comments: bug.comments || [],
  };

  const prompt = `You are a Quality Engineer performing defect classification for a regulated mental health Software as Medical Device (SaMD) product called MindBridge.

Your task is to determine whether the following bug qualifies as a DEFECT based on the defect criteria provided.

DEFECT CRITERIA (both must be true for a bug to be a defect):
1. ${defectCriteria.must_meet_both[0]}
2. ${defectCriteria.must_meet_both[1]}

USER NEEDS:
${JSON.stringify(productContext.user_needs, null, 2)}

PRODUCT REQUIREMENTS:
${JSON.stringify(productContext.product_requirements, null, 2)}

BUG TO CLASSIFY:
${JSON.stringify(cleanBug, null, 2)}

INSTRUCTIONS:
1. First assess whether this bug is present in the released product.
2. Then assess whether this bug represents a deviation from the intended function by checking it against the user needs and product requirements.
3. Both criteria must be met for it to be a defect.

Respond in the following JSON format only, no other text:
{
    "bug_id": "${bug.id}",
    "is_defect": true or false,
    "criterion_1_in_released_product": true or false,
    "criterion_1_rationale": "one sentence explaining why this is or is not in the released product",
    "criterion_2_deviates_from_intended_function": true or false,
    "criterion_2_failed_requirements": ["PR-XXX", "PR-YYY"] or [],
    "criterion_2_failed_user_needs": ["UN-XXX"] or [],
    "criterion_2_rationale": "one to two sentences explaining which requirements or user needs are failed and why, or why none are failed",
    "summary": "two to three sentence summary of the overall finding suitable for presentation at a Complaint Review Board meeting",
    "references": [{ "source": "Comment by [author] [date]", "quote": "relevant excerpt that influenced this conclusion" }]
}

Only include entries in "references" for comments that meaningfully influenced your conclusion. Use an empty array if no comments were relied upon.`;

  const responseText = await callAnthropic(prompt, apiKey);
  return parseJsonResponse(responseText);
}
