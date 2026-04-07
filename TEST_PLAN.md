# TEST_PLAN.md — SaMD Complaint Risk Assessment

Tests are divided into **automated** (Jest unit tests against pipeline logic) and **manual** (requires a deployed Forge app on a live Jira instance).

---

## Automated Tests (Jest)

Run with `npm test`. Test files live in `src/pipeline/__tests__/`.

### riskMatrix.test.js ✅ implemented

| # | Test | Status |
|---|------|--------|
| A1 | severity=1 is LOW for all probability values (1–5) | ✅ |
| A2 | severity=5 / probability=5 → HIGH | ✅ |
| A3 | severity=5 / probability=1 → HIGH | ✅ |
| A4 | 1×1 → LOW | ✅ |
| A5 | 2×3 → MEDIUM | ✅ |
| A6 | 3×4 → HIGH | ✅ |
| A7 | 5×5 → HIGH | ✅ |
| A8 | 4×1 → MEDIUM (low probability saves high severity) | ✅ |
| A9 | 2×5 → HIGH (high probability elevates moderate severity) | ✅ |
| A10 | String-key matrix (KVS round-trip) resolves correctly | ✅ |
| A11 | Custom all-HIGH matrix overrides defaults | ✅ |
| A12 | null matrix falls back to DEFAULT_RISK_MATRIX | ✅ |
| A13 | undefined matrix falls back to DEFAULT_RISK_MATRIX | ✅ |

### riskScoring.test.js ✅ implemented

| # | Test | Status |
|---|------|--------|
| A14 | Result always has classification: DEFECT | ✅ |
| A15 | LOW risk → "Complaint - moderate timeline" disposition | ✅ |
| A16 | MEDIUM risk → "Complaint - evaluate for CAPA escalation" disposition | ✅ |
| A17 | HIGH risk → "CAPA Required" disposition | ✅ |
| A18 | Probability score and label pass through to risk_assessment | ✅ |
| A19 | Severity score and label pass through to risk_assessment | ✅ |
| A20 | risk_level present in risk_assessment | ✅ |
| A21 | Rationale strings pass through from probability and severity | ✅ |
| A22 | References from all three steps merged with correct step labels | ✅ |
| A23 | Empty references arrays produce empty merged array | ✅ |
| A24 | bug_id passes through from defect input | ✅ |
| A25 | generated_at is a valid ISO timestamp | ✅ |
| A26 | failed_requirements and failed_user_needs pass through | ✅ |
| A27 | sev=1, prob=5 → LOW (severity 1 row always LOW) | ✅ |
| A28 | sev=5, prob=1 → HIGH (severity 5 row always HIGH) | ✅ |

### defectClassification.js / probability.js / severity.js (not yet implemented)

These call the Anthropic API so tests require mocking the client.

| # | Test | Status |
|---|------|--------|
| A29 | Mock returns malformed JSON — verify graceful error, not a crash | ⬜ not implemented |
| A30 | Mock returns valid classification — verify output shape matches schema | ⬜ not implemented |
| A31 | Empty bug description — verify prompt runs without throwing | ⬜ not implemented |

---

## Manual Tests

All manual tests require: app deployed (`npm run deploy`), installed on a Jira site (`forge install`), and a valid Anthropic API key saved in Settings.

---

### 1. First-time contributor setup

| # | Steps | Expected |
|---|-------|----------|
| M1 | Follow README "First-time setup" from scratch on a clean machine | All steps complete without errors, panel appears in Jira |
| M2 | Try `forge install` without first running `forge register` | Auth error — README warns about this |
| M3 | Run `npm run deploy` (not `npm run build --prefix static/ui` manually) | Build succeeds, deploys cleanly |

---

### 2. App appearance and UI labels

| # | Steps | Expected |
|---|-------|----------|
| M4 | Open any Jira issue | Panel titled "SaMD Complaint Risk Assessment" appears in right sidebar |
| M5 | Check the run button label | Reads "Run Risk Assessment" |
| M6 | Click Run Risk Assessment | Button reads "Running risk assessment..." and is disabled while running |
| M7 | After module key rename: run `forge install --upgrade`, redeploy, open Jira | Panel still loads correctly |

---

### 3. Settings panel

| # | Steps | Expected |
|---|-------|----------|
| M8 | Open Settings, paste user needs, click Save | Checkmark appears, value persists after page refresh |
| M9 | Open Settings, paste product requirements, click Save | Same |
| M10 | Open Settings, enter API key, click Save | "Key saved" indicator shown, key not displayed in plain text |
| M11 | Clear the API key, save | "No key saved" state shown |
| M12 | Edit probability scale options, save, run triage | Output uses updated scale labels |
| M13 | Edit severity scale options, save, run triage | Output uses updated scale labels |
| M14 | Edit 5×5 risk matrix values, save, run triage | Risk score reflects updated matrix thresholds |
| M15 | Edit the free-form additional context field, save, run triage | LLM response reflects added context |
| M16 | Open Settings, edit any textarea, click Back without saving | Yellow "unsaved changes" warning appears |
| M17 | Warning appears → click "Stay" | Remains on Settings page, edits preserved |
| M18 | Warning appears → click "Leave without saving" | Returns to main panel, changes discarded |
| M19 | Open Settings, edit and click Save, then click Back | No warning — dirty flag cleared after save |

---

### 4. Triage pipeline — defect classification

| # | Ticket setup | Expected |
|---|--------------|----------|
| M20 | Ticket describing a clear software bug | Classified as DEFECT |
| M21 | Ticket describing a user request or feature ask | Classified as NON-DEFECT, no risk score shown |
| M22 | NON-DEFECT result | Grey badge, no probability/severity rows |
| M23 | Run with no API key saved | Red error card with clear message pointing to Settings |
| M24 | Run with API key but no product requirements saved | Red error card pointing to Settings |

---

### 5. Triage pipeline — probability and severity scoring

| # | Ticket setup | Expected |
|---|--------------|----------|
| M25 | Well-documented bug with high patient impact | Probability and severity both score high (4–5) |
| M26 | Minor cosmetic bug with no patient-facing impact | Low scores (1–2) |
| M27 | Ambiguous ticket | Mid-range scores, rationale explains uncertainty |

---

### 6. Risk result display

| # | Steps | Expected |
|---|-------|----------|
| M28 | HIGH risk result (score 15–25) | Large red badge, red score pills on probability and severity rows |
| M29 | MEDIUM risk result (score 7–14) | Orange badge, appropriate pill colors |
| M30 | LOW risk result (score 1–6) | Green badge |
| M31 | NON-DEFECT result | Grey badge, no score rows |
| M32 | Evidence section present | Individual bordered cards with step badge and indented quote |

---

### 7. Comments as context

| # | Ticket setup | Expected |
|---|--------------|----------|
| M33 | Ticket with one relevant comment, run assessment | Output references the comment in Evidence if relevant |
| M34 | Add a comment saying the issue only occurs in development, run assessment | Classified as NON-DEFECT, Evidence cites the comment |
| M35 | Add a new comment after panel loads, click Run without refreshing | New comment is included (fresh fetch on each run) |
| M36 | Check LLM context sent for assessment | Previously generated triage reports are NOT included in comment context |

---

### 8. Auto-post comment

| # | Steps | Expected |
|---|-------|----------|
| M37 | Run assessment with auto-post enabled | After 10–20 seconds a formatted comment appears on the ticket |
| M38 | Comment content | Shows risk level, disposition, probability, severity, evidence (if any), generated timestamp |
| M39 | Go to Settings → disable "Auto-post risk assessment as Jira comment" → run | No comment posted |
| M40 | Re-enable toggle → run | Comment posts again |

---

### 9. Product info / prompt variables

| # | Steps | Expected |
|---|-------|----------|
| M41 | Go to Settings → verify Product Name, Product Type, Product Description fields exist | Fields present and pre-populated |
| M42 | Update Product Name, save, run assessment | New name appears in output summary |
| M43 | Edit Product Info, click Back without saving | Unsaved changes warning appears |

---

### 10. Session persistence

| # | Steps | Expected |
|---|-------|----------|
| M44 | Save API key, close browser, reopen Jira | Key still saved ("Key saved" indicator shown) |
| M45 | Save all settings, redeploy app, reopen Jira | All settings persist across deploys |

---

## What Playwright Would Add (and Why It's Not Worth It Yet)

Playwright can technically automate browser interactions, but for a Forge app:

- The panel renders inside a **sandboxed iframe** — Atlassian's CSP restrictions make reliable iframe interaction difficult
- Every test run requires a **deployed app on a live Jira instance** — no local test server
- LLM calls are **non-deterministic** — output assertions would be fragile
- The deploy cycle is slow (~30–60 seconds), making test iteration painful

The right automation investment here is Jest unit tests on `src/pipeline/` (tests A1–A10 above). Those run in milliseconds, cover the core scoring logic, and have no external dependencies. Everything else stays manual until there's a meaningful regression problem to solve.
