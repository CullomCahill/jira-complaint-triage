# Jira Complaint Triage — Forge App

AI-powered bug triage pipeline for regulated SaMD environments, built on Atlassian Forge.

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

Open any Jira issue on your site. The **"Complaint Risk Assessment"** panel appears in the right-hand sidebar under issue panels. If it doesn't show up, hard-refresh the page (**Ctrl+Shift+R**).

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
