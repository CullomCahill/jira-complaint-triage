# Jira Complaint Triage — Forge App

AI-powered bug triage pipeline for regulated SaMD environments, built on Atlassian Forge.

---

## Dev Workflow (Windows / PowerShell)

`forge` is not globally aliased, so use `npx @forge/cli` for all forge commands.

### Standard deploy (after editing backend or frontend)

From the project root:

```powershell
npm run deploy
```

This builds the frontend and deploys in one command. Then hard-refresh the Jira issue page: **Ctrl+Shift+R**

### First time / after adding new scopes or permissions

Run this once after deploying, then redeploy:

```powershell
npx @forge/cli install --upgrade
```

### Install on a new Jira site

```powershell
npx @forge/cli install
```

### Lint check only (no deploy)

```powershell
npx @forge/cli lint
```

---

## Project Structure

```
src/
  index.js          — Forge resolver functions (backend entry point)
  storage.js        — Forge KVS helpers for secrets and config
  pipeline/         — LLM triage steps (no Forge dependencies)
static/hello-world/ — Custom UI React app
  src/
    App.js
reference/          — Original Python pipeline (for reference only)
manifest.yml        — App config, modules, permissions
```

---

## Support

See [Forge docs](https://developer.atlassian.com/platform/forge) or [Get help](https://developer.atlassian.com/platform/forge/get-help/).
