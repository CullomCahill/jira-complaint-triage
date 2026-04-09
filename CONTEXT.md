# Claude Code Prompt: SaMD Complaint Risk Assessment — Forge App

## Context

A Jira Cloud app built on Atlassian Forge that runs an AI-powered complaint risk assessment pipeline for regulated Software as a Medical Device (SaMD) environments. The app is fully built and deployed. Active work is focused on polish, testing, and Marketplace submission preparation.

The pipeline runs four steps per complaint ticket using the Anthropic API:

1. **Defect Classification** — determines if a bug is a formal defect by checking whether it violates a User Need or Product Requirement
2. **Probability Assessment** — scores likelihood a user encounters the defect (configurable 1–5 scale)
3. **Severity Assessment** — scores realistic patient impact if the defect occurs (configurable 1–5 scale)
4. **Risk Scoring** — looks up probability × severity on a configurable 5×5 matrix, no LLM call

Each step outputs structured JSON that feeds into the next. The final output is a triage report suitable for a Complaint Review Board.

## What's Built

1. **Issue Panel** (`jira:issuePanel` module, Custom UI): appears on Jira issues via "View app actions" → "SaMD Complaint Risk Assessment". Has a "Run Risk Assessment" button that reads the issue data, runs the four-step pipeline, and displays the triage results (defect classification, probability, severity, risk level, recommended action, evidence citations). Optionally auto-posts the result as a formatted Jira comment.

2. **Settings Panel** (embedded in the issue panel): where users configure their Anthropic API key, product info (name, type, description), user needs, product requirements, additional context, probability scale, severity scale, and risk matrix. All stored using Forge Storage API. API key stored using `storage.setSecret()`.

## Current State

- App fully built and deployed to development environment
- Installed on a Jira dev site, accessible via "View app actions" on any issue
- 52 Jest unit tests covering the full pipeline, running in CI via GitHub Actions
- Preparing for Atlassian Marketplace submission

## Pipeline Locations

- **Active pipeline (JS):** `src/pipeline/` — the real pipeline used by the Forge app. All new work targets this.
- **Reference pipeline (Python):** `reference/pipeline/` — the original Python implementation the JS was ported from. Read-only, do not modify.

## Forge Runtime Constraint

`src/pipeline/anthropicClient.js` uses `import { fetch } from '@forge/api'`, which only runs inside the Forge serverless runtime. Any standalone scripts (load tests, dev utilities) that invoke the pipeline outside of Forge must substitute native Node.js `fetch` or the Anthropic SDK — they cannot import `@forge/api` directly. The Jest test suite handles this via `__mocks__/@forge/api.js`.

## Technical Constraints

- Forge runs on Node.js — all pipeline logic is in JavaScript
- External API calls require declaring domains in `manifest.yml` under `permissions.external.fetch.backend` (`https://api.anthropic.com` is declared)
- Use `@forge/api` for external fetch calls from the backend
- Use `@forge/api` storage and `storage.setSecret` for persisting config and API keys
- Use `@forge/bridge` for Custom UI communication with the backend resolver
- The Custom UI frontend is a React app in `static/ui/`
- Pipeline logic in `src/pipeline/` has no Forge dependencies by design — pure functions that can be unit tested without a Forge runtime

## File Structure

```
manifest.yml                  — App config, modules, permissions
src/
  index.js                    — Forge resolver functions (backend entry point)
  storage.js                  — Forge KVS helpers for secrets and config
  pipeline/                   — LLM triage steps (no Forge dependencies)
    anthropicClient.js        — Shared Anthropic API call wrapper
    defectClassification.js   — Step 1
    probability.js            — Step 2
    severity.js               — Step 3
    riskScoring.js            — Step 4
    riskMatrix.js             — 5×5 risk matrix lookup + default matrix
    runPipeline.js            — Chains all four steps
    __tests__/                — Jest unit tests for all pipeline functions
static/ui/                    — Custom UI React app
  src/
    App.js
    components/
      SettingsPanel.js
      TriageReport.js
__mocks__/
  @forge/api.js               — Jest mock for Forge platform SDK
.github/workflows/
  test.yml                    — GitHub Actions CI (runs npm test on push/PR)
reference/                    — Original Python pipeline and example data (read-only)
  pipeline/                   — Python source
  config/                     — Example product context JSON
  examples/                   — Example bug data and triage reports
TEST_PLAN.md                  — Manual and automated test cases
```
