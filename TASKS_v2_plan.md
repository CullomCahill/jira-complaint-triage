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

---

## Future Version (Post-Beta)
- **Settings lock toggle** — restrict who can modify product context config. Relevant for SaMD audit trail and change control requirements. Likely Jira role-based or a lock toggle only an admin can disable.
