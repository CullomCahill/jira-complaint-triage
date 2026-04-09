/**
 * Load test for the SaMD Complaint Triage pipeline.
 *
 * Runs each bug from bug_data_training.json through the full pipeline N times
 * and reports on output variance across runs.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=<key> node load_test.mjs
 *   ANTHROPIC_API_KEY=<key> node load_test.mjs --runs 5
 *
 * Self-contained — does not import from src/pipeline/ to avoid the @forge/api
 * dependency that only resolves inside the Forge runtime. Prompts are kept
 * faithful to src/pipeline/defectClassification.js, probability.js, severity.js.
 * Risk matrix logic mirrors src/pipeline/riskMatrix.js and riskScoring.js.
 *
 * Requires Node 18+ (native fetch).
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env file if present (no dotenv dependency needed)
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const runsArgIndex = process.argv.indexOf('--runs');
const RUNS = runsArgIndex !== -1 ? parseInt(process.argv[runsArgIndex + 1], 10) : 10;

// ---------------------------------------------------------------------------
// Context — mirrors storage.js defaults
// ---------------------------------------------------------------------------

const PRODUCT_INFO = {
  name: 'MindBridge',
  type: 'regulated mental health Software as Medical Device (SaMD)',
  description: 'a CBT-based therapeutic chatbot',
};

const PROBABILITY_SCALE = [
  { label: 'Remote',    description: 'unlikely to occur' },
  { label: 'Low',       description: 'could occur but rare' },
  { label: 'Moderate',  description: 'may occur occasionally' },
  { label: 'High',      description: 'likely to occur' },
  { label: 'Very High', description: 'almost certain to occur' },
];

const SEVERITY_SCALE = [
  { label: 'Negligible', description: 'no impact on therapeutic experience' },
  { label: 'Minor',      description: 'slight inconvenience, user can continue' },
  { label: 'Moderate',   description: 'disrupts session but user can recover' },
  { label: 'Major',      description: 'prevents therapeutic function or causes distress' },
  { label: 'Critical',   description: 'potential for clinical harm or safety event' },
];

// Mirrors DEFAULT_RISK_MATRIX in src/pipeline/riskMatrix.js
const DEFAULT_RISK_MATRIX = {
  1: { 1: 'LOW',    2: 'LOW',    3: 'LOW',    4: 'LOW',    5: 'LOW'    },
  2: { 1: 'LOW',    2: 'LOW',    3: 'MEDIUM', 4: 'MEDIUM', 5: 'HIGH'   },
  3: { 1: 'LOW',    2: 'MEDIUM', 3: 'MEDIUM', 4: 'HIGH',   5: 'HIGH'   },
  4: { 1: 'MEDIUM', 2: 'HIGH',   3: 'HIGH',   4: 'HIGH',   5: 'HIGH'   },
  5: { 1: 'HIGH',   2: 'HIGH',   3: 'HIGH',   4: 'HIGH',   5: 'HIGH'   },
};

const DISPOSITION = {
  LOW:    'Complaint - moderate timeline',
  MEDIUM: 'Complaint - evaluate for CAPA escalation',
  HIGH:   'CAPA Required',
};

// Load product context from reference config (user needs + product requirements)
const productContextRaw = JSON.parse(
  readFileSync(join(__dirname, 'reference/config/product_context.json'), 'utf8')
);
const PRODUCT_CONTEXT = {
  user_needs: productContextRaw.user_needs,
  product_requirements: productContextRaw.product_requirements,
  additional_context: '',
};

// ---------------------------------------------------------------------------
// Anthropic API wrapper — uses native fetch instead of @forge/api
// Mirrors src/pipeline/anthropicClient.js
// ---------------------------------------------------------------------------

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;

async function callAnthropic(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function parseJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim());
}

// ---------------------------------------------------------------------------
// Pipeline steps — prompts kept faithful to src/pipeline/*.js
// ---------------------------------------------------------------------------

async function classifyDefect(bug, apiKey) {
  const cleanBug = {
    id: bug.id,
    title: bug.title,
    description: bug.description,
    component: bug.component,
    reported_by: bug.reported_by,
    date_reported: bug.date_reported,
    comments: bug.comments || [],
  };

  const DEFECT_CRITERION =
    'It is a deviation from the intended function of the core product (fails a User Need or Product Requirement)';

  const prompt = `You are a Quality Engineer performing defect classification for a ${PRODUCT_INFO.type} product called ${PRODUCT_INFO.name}.

Your task is to determine whether the following bug qualifies as a DEFECT.

DEFECT CRITERION:
${DEFECT_CRITERION}

USER NEEDS:
${JSON.stringify(PRODUCT_CONTEXT.user_needs, null, 2)}

PRODUCT REQUIREMENTS:
${JSON.stringify(PRODUCT_CONTEXT.product_requirements, null, 2)}

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

async function assessProbability(defect, bug, apiKey) {
  const scaleLines = PROBABILITY_SCALE.map((s, i) => `${i + 1} - ${s.label}: ${s.description}`).join('\n');
  const validLabels = PROBABILITY_SCALE.map(s => `"${s.label}"`).join(' or ');

  const prompt = `You are a Quality Engineer performing a risk probability assessment for a ${PRODUCT_INFO.type} product called ${PRODUCT_INFO.name}, ${PRODUCT_INFO.description}.

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

INSTRUCTIONS:
Assess the probability that a user of the ${PRODUCT_INFO.name} product will encounter this defect during normal use. Base your assessment on the evidence available in the bug report, considering the factors listed above. Do not speculate beyond what is stated.

Respond in the following JSON format only, no other text:
{
    "bug_id": "${defect.bug_id}",
    "probability_score": 1 to 5,
    "probability_label": ${validLabels},
    "rationale": "two to three sentence explanation grounded in specific evidence from the bug report",
    "references": []
}

Only include entries in "references" for comments that meaningfully influenced your probability assessment. Use an empty array if no comments were relied upon.`;

  const responseText = await callAnthropic(prompt, apiKey);
  return parseJsonResponse(responseText);
}

async function assessSeverity(defect, bug, apiKey) {
  const scaleLines = SEVERITY_SCALE.map((s, i) => `${i + 1} - ${s.label}: ${s.description}`).join('\n');
  const validLabels = SEVERITY_SCALE.map(s => `"${s.label}"`).join(' or ');

  const prompt = `You are a Quality Engineer performing a risk severity assessment for a ${PRODUCT_INFO.type} product called ${PRODUCT_INFO.name}, ${PRODUCT_INFO.description}.

Your task is to assess the SEVERITY of harm that could result if this defect occurs.

SEVERITY SCALE:
${scaleLines}

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
Failed Requirements: ${JSON.stringify(defect.failed_requirements)}
Failed User Needs: ${JSON.stringify(defect.failed_user_needs)}

ORIGINAL BUG DETAILS:
Title: ${bug.title}
Description: ${bug.description}
Component: ${bug.component}
Reported By: ${bug.reported_by}

INSTRUCTIONS:
Assess the severity of harm that could result from this defect. Ground your rationale in the specific impact on users of the ${PRODUCT_INFO.name} product. Be realistic and do not inflate severity beyond what is supported by the evidence.

Respond in the following JSON format only, no other text:
{
    "bug_id": "${defect.bug_id}",
    "severity_score": 1 to 5,
    "severity_label": ${validLabels},
    "rationale": "two to three sentence explanation focused on the realistic impact to the user",
    "references": []
}

Only include entries in "references" for comments that meaningfully influenced your severity assessment. Use an empty array if no comments were relied upon.`;

  const responseText = await callAnthropic(prompt, apiKey);
  return parseJsonResponse(responseText);
}

// Mirrors getRiskLevel() in src/pipeline/riskMatrix.js
function getRiskLevel(sev, prob) {
  const row = DEFAULT_RISK_MATRIX[sev];
  return row?.[prob] ?? 'LOW';
}

async function runOneBug(bug, apiKey) {
  const defect = await classifyDefect(bug, apiKey);

  if (!defect.is_defect) {
    return { bug_id: defect.bug_id, is_defect: false, classification: 'NON-DEFECT' };
  }

  // Steps 2 + 3 in parallel — mirrors runPipeline.js
  const [probability, severity] = await Promise.all([
    assessProbability(defect, bug, apiKey),
    assessSeverity(defect, bug, apiKey),
  ]);

  const probScore = probability.probability_score;
  const sevScore  = severity.severity_score;
  const riskLevel = getRiskLevel(sevScore, probScore);

  return {
    bug_id: defect.bug_id,
    is_defect: true,
    classification: 'DEFECT',
    probability_score: probScore,
    probability_label: probability.probability_label,
    severity_score:    sevScore,
    severity_label:    severity.severity_label,
    risk_level:        riskLevel,
    disposition:       DISPOSITION[riskLevel] ?? DISPOSITION.HIGH,
  };
}

// ---------------------------------------------------------------------------
// Variance analysis
// ---------------------------------------------------------------------------

function analyzeVariance(bugId, runs, expected) {
  const errorRuns   = runs.filter(r => r.error);
  const validRuns   = runs.filter(r => !r.error);
  const defectRuns  = validRuns.filter(r => r.is_defect);
  const issues      = [];

  const defectCount    = defectRuns.length;
  const nonDefectCount = validRuns.length - defectCount;

  // Classification flip — highest priority: changes whether any action is taken
  if (defectCount > 0 && nonDefectCount > 0) {
    issues.push({
      severity: 'HIGH',
      field: 'classification',
      detail: `DEFECT ${defectCount}/${validRuns.length} runs, NON-DEFECT ${nonDefectCount}/${validRuns.length} runs`,
    });
  }

  if (defectRuns.length >= 2) {
    const probScores   = defectRuns.map(r => r.probability_score);
    const sevScores    = defectRuns.map(r => r.severity_score);
    const riskLevels   = defectRuns.map(r => r.risk_level);
    const dispositions = defectRuns.map(r => r.disposition);

    // Risk level change — changes regulatory action
    const uniqueRiskLevels = [...new Set(riskLevels)];
    if (uniqueRiskLevels.length > 1) {
      const counts = {};
      riskLevels.forEach(l => counts[l] = (counts[l] || 0) + 1);
      issues.push({
        severity: 'HIGH',
        field: 'risk_level',
        detail: Object.entries(counts).map(([k, v]) => `${k}: ${v}/${defectRuns.length}`).join(', '),
      });
    }

    // Disposition change — same concern as risk level but surfaced separately for clarity
    const uniqueDispositions = [...new Set(dispositions)];
    if (uniqueDispositions.length > 1) {
      issues.push({
        severity: 'HIGH',
        field: 'disposition',
        detail: uniqueDispositions.join(' | '),
      });
    }

    // Score spread — signals prompt ambiguity even when risk level holds
    const probRange = Math.max(...probScores) - Math.min(...probScores);
    const sevRange  = Math.max(...sevScores)  - Math.min(...sevScores);

    if (probRange >= 2) {
      issues.push({
        severity: 'MEDIUM',
        field: 'probability_score',
        detail: `Range ${Math.min(...probScores)}–${Math.max(...probScores)} (spread ${probRange})`,
      });
    }

    if (sevRange >= 2) {
      issues.push({
        severity: 'MEDIUM',
        field: 'severity_score',
        detail: `Range ${Math.min(...sevScores)}–${Math.max(...sevScores)} (spread ${sevRange})`,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Accuracy vs. expected values from bug_data_training.json
  // "Non-defect" → expected is_defect false; "Complaint"/"CAPA" → true
  // ---------------------------------------------------------------------------
  const expectedIsDefect = expected.expected_classification !== 'Non-defect';
  const classificationCorrect = validRuns.filter(r => r.is_defect === expectedIsDefect).length;

  let probAccuracy = null;
  let sevAccuracy  = null;

  if (expectedIsDefect && defectRuns.length > 0) {
    if (expected.expected_probability !== null) {
      const ep = expected.expected_probability;
      const exactP   = defectRuns.filter(r => r.probability_score === ep).length;
      const withinP  = defectRuns.filter(r => Math.abs(r.probability_score - ep) <= 1).length;
      probAccuracy = {
        expected:        ep,
        scores:          defectRuns.map(r => r.probability_score),
        exact_match:     exactP,
        within_one:      withinP,
        exact_rate:      exactP / defectRuns.length,
        within_one_rate: withinP / defectRuns.length,
      };
    }

    if (expected.expected_severity !== null) {
      const es = expected.expected_severity;
      const exactS   = defectRuns.filter(r => r.severity_score === es).length;
      const withinS  = defectRuns.filter(r => Math.abs(r.severity_score - es) <= 1).length;
      sevAccuracy = {
        expected:        es,
        scores:          defectRuns.map(r => r.severity_score),
        exact_match:     exactS,
        within_one:      withinS,
        exact_rate:      exactS / defectRuns.length,
        within_one_rate: withinS / defectRuns.length,
      };
    }
  }

  return {
    bug_id:           bugId,
    total_runs:       runs.length,
    error_count:      errorRuns.length,
    defect_count:     defectCount,
    non_defect_count: nonDefectCount,
    probability_scores: defectRuns.map(r => r.probability_score),
    severity_scores:    defectRuns.map(r => r.severity_score),
    risk_levels:        defectRuns.map(r => r.risk_level),
    dispositions:       defectRuns.map(r => r.disposition),
    issues,
    stable: issues.length === 0,
    accuracy: {
      expected_classification: expected.expected_classification,
      expected_is_defect:      expectedIsDefect,
      classification_correct:  classificationCorrect,
      classification_rate:     validRuns.length > 0 ? classificationCorrect / validRuns.length : null,
      probability: probAccuracy,
      severity:    sevAccuracy,
    },
  };
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function printAccuracy(acc) {
  const pct = r => r !== null ? `${(r * 100).toFixed(0)}%` : 'n/a';
  const classMatch = acc.classification_rate === 1 ? 'correct' : `WRONG (${pct(acc.classification_rate)} correct)`;
  console.log(`    Expected: ${acc.expected_classification} → classification ${classMatch}`);

  if (acc.probability) {
    const p = acc.probability;
    console.log(`    Probability — expected ${p.expected}, got [${p.scores.join(', ')}]  exact ${pct(p.exact_rate)}  within±1 ${pct(p.within_one_rate)}`);
  }
  if (acc.severity) {
    const s = acc.severity;
    console.log(`    Severity    — expected ${s.expected}, got [${s.scores.join(', ')}]  exact ${pct(s.exact_rate)}  within±1 ${pct(s.within_one_rate)}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set.');
    process.exit(1);
  }

  // Load bugs — strip answer-key fields before sending to the LLM,
  // but keep them in a separate lookup for accuracy comparison after all runs.
  const rawData = JSON.parse(
    readFileSync(join(__dirname, 'reference/examples/bug_data_training.json'), 'utf8')
  );
  const expectedLookup = {};
  const bugs = rawData.bugs.map(({ expected_classification, expected_probability, expected_severity, notes, ...bug }) => {
    expectedLookup[bug.id] = { expected_classification, expected_probability, expected_severity };
    return bug;
  });

  const estimatedCalls = bugs.length * RUNS * 2; // defect call + ~1 parallel pair avg
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  LOAD TEST — SaMD Complaint Triage Pipeline`);
  console.log(`  Bugs: ${bugs.length}  |  Runs per bug: ${RUNS}  |  Estimated API calls: ~${estimatedCalls}`);
  console.log(`  Model: ${MODEL}`);
  console.log(`${'='.repeat(70)}\n`);

  const allRuns = {}; // bug_id -> RunResult[]

  for (const bug of bugs) {
    console.log(`\n[${bug.id}] ${bug.title}`);
    const runs = [];

    for (let i = 1; i <= RUNS; i++) {
      process.stdout.write(`  Run ${String(i).padStart(2)}/${RUNS}... `);
      try {
        const result = await runOneBug(bug, apiKey);
        runs.push(result);
        if (result.is_defect) {
          process.stdout.write(`DEFECT   P${result.probability_score} S${result.severity_score} → ${result.risk_level}\n`);
        } else {
          process.stdout.write(`NON-DEFECT\n`);
        }
      } catch (e) {
        process.stdout.write(`ERROR: ${e.message}\n`);
        runs.push({ bug_id: bug.id, error: e.message, is_defect: null, classification: 'ERROR' });
      }
    }

    allRuns[bug.id] = runs;
  }

  // Analyze
  const analysis = bugs.map(bug => analyzeVariance(bug.id, allRuns[bug.id], expectedLookup[bug.id]));
  const unstable  = analysis.filter(a => !a.stable);
  const stable    = analysis.filter(a => a.stable);

  // Print results
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  RESULTS`);
  console.log(`${'='.repeat(70)}`);

  if (unstable.length > 0) {
    console.log(`\n  UNSTABLE (${unstable.length} bug${unstable.length !== 1 ? 's' : ''})`);
    console.log(`  ${'─'.repeat(67)}`);
    for (const a of unstable) {
      console.log(`\n  ${a.bug_id}  (defect ${a.defect_count}/${a.total_runs} runs)`);
      for (const issue of a.issues) {
        console.log(`    [${issue.severity}] ${issue.field}: ${issue.detail}`);
      }
      if (a.probability_scores.length) {
        console.log(`    Probability: [${a.probability_scores.join(', ')}]`);
        console.log(`    Severity:    [${a.severity_scores.join(', ')}]`);
        console.log(`    Risk levels: [${a.risk_levels.join(', ')}]`);
      }
      printAccuracy(a.accuracy);
    }
  }

  console.log(`\n  STABLE (${stable.length} bug${stable.length !== 1 ? 's' : ''})`);
  console.log(`  ${'─'.repeat(67)}`);
  for (const a of stable) {
    if (a.defect_count === 0) {
      console.log(`  ${a.bug_id}  NON-DEFECT (all ${a.total_runs} runs)`);
    } else {
      const p = [...new Set(a.probability_scores)].join('/');
      const s = [...new Set(a.severity_scores)].join('/');
      const r = [...new Set(a.risk_levels)].join('/');
      console.log(`  ${a.bug_id}  DEFECT  P=${p} S=${s} → ${r} (all ${a.defect_count} runs)`);
    }
    printAccuracy(a.accuracy);
  }

  const highIssues   = analysis.flatMap(a => a.issues).filter(i => i.severity === 'HIGH').length;
  const mediumIssues = analysis.flatMap(a => a.issues).filter(i => i.severity === 'MEDIUM').length;

  // Overall accuracy stats across all bugs
  const classTotal   = analysis.reduce((n, a) => n + (a.total_runs - a.error_count), 0);
  const classCorrect = analysis.reduce((n, a) => n + a.accuracy.classification_correct, 0);
  const probEntries  = analysis.flatMap(a => a.accuracy.probability ? [a.accuracy.probability] : []);
  const sevEntries   = analysis.flatMap(a => a.accuracy.severity    ? [a.accuracy.severity]    : []);
  const avgProbExact    = probEntries.length ? probEntries.reduce((n, e) => n + e.exact_rate, 0)      / probEntries.length : null;
  const avgProbWithin1  = probEntries.length ? probEntries.reduce((n, e) => n + e.within_one_rate, 0) / probEntries.length : null;
  const avgSevExact     = sevEntries.length  ? sevEntries.reduce((n, e)  => n + e.exact_rate, 0)      / sevEntries.length  : null;
  const avgSevWithin1   = sevEntries.length  ? sevEntries.reduce((n, e)  => n + e.within_one_rate, 0) / sevEntries.length  : null;

  const pct = r => r !== null ? `${(r * 100).toFixed(0)}%` : 'n/a';

  console.log(`\n${'='.repeat(70)}`);
  console.log(`  SUMMARY`);
  console.log(`  Stable bugs:                    ${stable.length}/${bugs.length}`);
  console.log(`  Unstable bugs:                  ${unstable.length}/${bugs.length}`);
  console.log(`  High-severity issues:           ${highIssues}`);
  console.log(`  Medium-severity issues:         ${mediumIssues}`);
  console.log(`  Classification accuracy:        ${pct(classTotal ? classCorrect / classTotal : null)} (${classCorrect}/${classTotal} runs)`);
  console.log(`  Probability — exact match avg:  ${pct(avgProbExact)}   within ±1: ${pct(avgProbWithin1)}`);
  console.log(`  Severity    — exact match avg:  ${pct(avgSevExact)}   within ±1: ${pct(avgSevWithin1)}`);
  console.log(`${'='.repeat(70)}\n`);

  // Save full report
  const report = {
    generated_at:  new Date().toISOString(),
    model:         MODEL,
    runs_per_bug:  RUNS,
    total_bugs:    bugs.length,
    summary: {
      stable:                    stable.length,
      unstable:                  unstable.length,
      high_severity_issues:      highIssues,
      medium_severity_issues:    mediumIssues,
      classification_accuracy:   classTotal ? classCorrect / classTotal : null,
      probability_exact_avg:     avgProbExact,
      probability_within1_avg:   avgProbWithin1,
      severity_exact_avg:        avgSevExact,
      severity_within1_avg:      avgSevWithin1,
    },
    bugs: analysis,
  };

  const outPath = join(__dirname, 'load_test_report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`  Full report saved to load_test_report.json\n`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
