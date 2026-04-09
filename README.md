# SaMD Complaint Risk Assessment — Forge App

AI-powered complaint risk triage for medical device quality teams, built on Atlassian Forge.

---

## First-time setup (new contributors)

Each contributor needs their own registered Forge app to deploy and test. You cannot install the app owner's registration — you'll get an authorization error if you try.

**Prerequisites:** Node.js 18+, an Atlassian account with access to a Jira site.

### 1. Log in to Forge

```bash
npx @forge/cli login
```

Enter your Atlassian email and a [Forge CLI API token](https://go.atlassian.com/forge-cli-api-token).

### 2. Register your own app instance

```bash
npx @forge/cli register
```

This creates a new app under your account and updates `manifest.yml` with your app ID. **Do not commit this change** — your app ID is yours, not shared.

### 3. Install dependencies

```bash
npm install
cd static/ui && npm install && cd ../..
```

### 4. Deploy

```bash
npm run deploy
```

This builds the React frontend (`static/ui`) and deploys the Forge backend in one step.

### 5. Install on your Jira site

```bash
npx @forge/cli install --site <your-site>.atlassian.net
```

### 6. See it in Jira

Open any Jira issue on your site. Under "View app actions" button below issue title, see **"SaMD Complaint Risk Assessment"** button.  Click it to add the complaint risk assessment window to the present ticket. 

---

## Configuration

After installing, open the app on any Jira issue and go to **Settings**. The two most important fields are User Needs and Product Requirements — the pipeline uses these to determine whether a complaint is a defect and which requirements it violates.

Both fields expect a specific JSON format. The `id` field is required — it's what appears in the assessment output (e.g. `failed_requirements: ["PR-001"]`).

### User Needs

```json
[
  { "id": "UN-001", "description": "User shall be able to log in and access their account on all supported platforms." },
  { "id": "UN-002", "description": "User shall be able to save and retrieve their session progress across app sessions." }
]
```

### Product Requirements

```json
[
  { "id": "PR-001", "description": "The system shall support login on iOS 15 and above.", "traces_to": "UN-001" },
  { "id": "PR-002", "description": "The system shall persist session data and restore it on next launch without data loss.", "traces_to": "UN-002" }
]
```

`traces_to` links each requirement back to the user need it satisfies. The LLM uses this to understand your traceability chain. It should match an `id` from your User Needs list.

A full example for a mental health SaMD product is in `reference/config/product_context.json`.

---

## Running tests

Unit tests cover the core pipeline logic (risk scoring, defect classification, probability, severity). No Jira instance or API key needed.

```bash
npm test
```

Tests also run automatically on every push and pull request via GitHub Actions.

---

## Dev Workflow (after initial setup)

`forge` is not globally aliased, so use `npx @forge/cli` for all forge commands.

### Standard deploy (after editing backend or frontend)

From the project root:

```bash
npm run deploy
```

This builds the frontend and deploys in one command. Then hard-refresh the Jira issue page: **Ctrl+Shift+R**

### After adding new scopes or permissions

Run this once after deploying, then redeploy:

```bash
npx @forge/cli install --upgrade
```

### Lint check only (no deploy)

```bash
npx @forge/cli lint
```

---

## Project Structure

```
src/
  index.js          — Forge resolver functions (backend entry point)
  storage.js        — Forge KVS helpers for secrets and config
  pipeline/         — LLM triage steps (no Forge dependencies)
static/ui/          — Custom UI React app
  src/
    App.js
    components/
      SettingsPanel.js
      TriageReport.js
reference/          — Original Python pipeline (for reference only)
manifest.yml        — App config, modules, permissions
```

---

## Support

See [Forge docs](https://developer.atlassian.com/platform/forge) or [Get help](https://developer.atlassian.com/platform/forge/get-help/).
