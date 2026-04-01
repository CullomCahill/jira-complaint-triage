import { callAnthropic, parseJsonResponse } from './anthropicClient.js';

/**
 * Step 3: Assess the severity of harm if this defect occurs.
 * Independent from probability — does not use probability output.
 *
 * @param {object} defect - Output from classifyDefect (bug_id, summary, criterion_2_failed_requirements, criterion_2_failed_user_needs)
 * @param {object} bug - Original bug fields: id, title, description, component, reported_by, date_reported, related_feature
 * @param {string} apiKey
 * @returns {object} { bug_id, severity_score, severity_label, rationale }
 */
export async function assessSeverity(defect, bug, apiKey) {
  const prompt = `You are a Quality Engineer performing a risk severity assessment for a regulated mental health Software as Medical Device (SaMD) product called MindBridge, a CBT-based therapeutic chatbot.

Your task is to assess the SEVERITY of harm that could result if this defect occurs.

SEVERITY SCALE:
1 - Negligible: no impact on therapeutic experience
2 - Minor: slight inconvenience, user can continue
3 - Moderate: disrupts session but user can recover
4 - Major: prevents therapeutic function or causes distress
5 - Critical: potential for clinical harm or safety event

FACTORS TO CONSIDER:
- What is the worst realistic outcome if a user encounters this defect?
- Does it prevent the user from completing a therapeutic task?
- Could it cause psychological distress to a vulnerable user?
- Does it involve patient safety or crisis intervention?
- Does it involve protected health information (PHI)?
- Does it undermine the clinical efficacy of the therapeutic intervention?

DEFECT TO ASSESS:
Bug ID: ${defect.bug_id}
Classification Summary: ${defect.summary}
Failed Requirements: ${JSON.stringify(defect.criterion_2_failed_requirements)}
Failed User Needs: ${JSON.stringify(defect.criterion_2_failed_user_needs)}

ORIGINAL BUG DETAILS:
Title: ${bug.title}
Description: ${bug.description}
Component: ${bug.component}
Reported By: ${bug.reported_by}

INSTRUCTIONS:
Assess the severity of harm that could result from this defect. Ground your rationale in the specific impact on users of a mental health therapeutic product. Be realistic and do not inflate severity beyond what is supported by the evidence.

Respond in the following JSON format only, no other text:
{
    "bug_id": "${defect.bug_id}",
    "severity_score": 1 to 5,
    "severity_label": "Negligible" or "Minor" or "Moderate" or "Major" or "Critical",
    "rationale": "two to three sentence explanation focused on the realistic impact to the user"
}`;

  const responseText = await callAnthropic(prompt, apiKey);
  return parseJsonResponse(responseText);
}