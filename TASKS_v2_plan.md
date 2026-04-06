# TASKS v2: Complaint Risk Assessment — Next Iteration

## Task 15: Rename Throughout
Update all user-facing labels and the manifest to reflect "risk assessment" rather than "triage":
- Button: `Run Triage` → `Run Risk Assessment`
- Panel title: `Complaint Triage` → `Complaint Risk Assessment`
- Running state text: `Running triage...` → `Running risk assessment...`
- Report headers/labels in `TriageReport.js`
- `manifest.yml` app/module name

## Task 16: Pull Jira Comments into Pipeline
Extend `getIssueData` to also fetch the issue's comments via `requestJira`. Append them to the bug data object passed to the pipeline so the LLM has full context — description + comment thread.

## Task 17: Auto-Post Risk Assessment as Jira Comment
After the pipeline completes and results display in the panel, automatically post a formatted comment to the ticket via `requestJira`. Format using Jira's Atlassian Document Format (ADF) — structured sections for risk score/classification, probability, severity, and rationale. This replaces the need for any in-app persistence (resolves: results not persisting when ticket is closed and reopened).

## Task 18: Unsaved Changes Guard in Settings
Track dirty state per `ConfigSection` in `SettingsPanel.js`. If the user clicks Back with any unsaved changes, show a confirmation prompt before navigating away.

## Task 19: Editable Prompt Variables in Settings
Audit all three LLM prompts (`defectClassification.js`, `probability.js`, `severity.js`) and identify hardcoded values that should be user-configurable — e.g. product name ("MindBridge"), product description ("CBT-based therapeutic chatbot"), probability scale labels, severity scale labels, and factors to consider. Move these into Forge Storage and surface them as editable fields in the Settings panel so the tool is not hardcoded to a single product.

## Task 20: UI Refinement
General polish pass on the panel UI — improve visual hierarchy, spacing, and typography. Make the results display cleaner and more presentable for use in Complaint Review Board meetings.

## Task 21: Project-Level Triage Summary Page
Add a Jira Global Page module that shows a summary across all triaged issues in the project — risk distribution, recent assessments, CAPA counts, etc. Requires Forge Global Page module in `manifest.yml` and a new page component.

## Task 22: Marketplace Listing Preparation
Prepare the app for Atlassian Marketplace submission — app description, screenshots, privacy policy, support contact, production deployment, and Forge eligibility check (`forge eligibility`).

---

## Resolved
- **Triage history per issue** — resolved by Task 17. Comments posted to the ticket serve as the audit trail, with timestamps and full assessment detail. No separate Forge Storage history needed.

## Future Version (Post-Beta)
- **Settings lock toggle** — restrict who can modify product context config. Relevant for SaMD audit trail and change control requirements. Likely Jira role-based or a lock toggle only an admin can disable.
- **Editable severity scale descriptions** — the five severity level descriptions ("no impact on therapeutic experience", "disrupts session but user can recover", etc.) are product-specific and should be user-configurable. Requires 5 paired label/description fields in Settings.
- **Batch triage** — run risk assessment across multiple issues at once from a project view.
- **Testing rubric** — define a scoring rubric to evaluate assessment output quality and drive prompt improvements.
