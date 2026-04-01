# Claude Code Prompt: Jira Complaint Triage Forge App

## Context

I'm building a Jira Cloud app using Atlassian Forge that runs an AI powered bug triage pipeline for regulated Software as a Medical Device (SaMD) environments.  I already have a working Python pipeline that does this (see the /reference folder for the original Python code).  The Forge app scaffold is already set up and deployed using the jira-issue-panel Custom UI template.

The original Python pipeline runs four sequential LLM calls per bug using the Anthropic API:

1. Defect Classification:  determines if a bug is a formal defect by checking if it's in the released product AND violates a User Need or Product Requirement
2. Probability Assessment:  scores likelihood a user encounters the defect (1 to 5 scale)
3. Severity Assessment:  scores realistic impact if the defect occurs (1 to 5 scale)
4. Risk Scoring:  combines probability x severity on a 5x5 matrix, no LLM call, just math

Each step outputs structured JSON that feeds into the next step.  The final output is a triage report suitable for a Complaint Review Board.

## What I'm Building

A Forge app with two main pieces:

1. **Settings/Config Page** (Global Page or Admin Page module):  where users enter their Anthropic API key, product requirements, user needs, defect criteria (SOP defect criteria, risk matrix, severity/probability scales), and hazard definitions.  All stored using Forge Storage API.  API key stored using storage.setSecret().

2. **Issue Panel** (jira:issuePanel module):  shows up on individual Jira issues.  Has a "Run Triage" button that pulls the issue data, runs it through the four step pipeline using the Anthropic API, and displays the triage results (defect classification, probability, severity, risk score, recommended action).

## Technical Constraints

- Forge runs on Node.js, so all Python logic needs to be ported to JavaScript/TypeScript
- External API calls require declaring domains in manifest.yml under permissions.external.fetch.backend (need https://api.anthropic.com)
- Use @forge/api for external fetch calls
- Use @forge/api storage and storage.setSecret for persisting config and API keys
- Use @forge/bridge for Custom UI communication with the backend resolver
- The Custom UI frontend is a React app in the static/ directory
- Keep the core triage logic as a clean standalone module with no Forge dependencies so it could be reused in other integrations later

## Current State

- Forge app scaffolded from jira-issue-panel Custom UI template
- App deployed to development environment
- App installed on my Jira dev site and showing on issues
- No pipeline logic ported yet
- No settings page yet

## How I Want to Work

Let's work through the TASKS.md file in order.  Start with Task 1 and don't move to the next task until the current one is working.  Ask me questions if something is unclear rather than making assumptions.  When porting the Python pipeline steps, reference the original Python files in /reference to keep the prompts and logic faithful to the original.

## File Structure Goal

```
jira-complaint-triage/
  manifest.yml
  src/
    index.js              (Forge resolver functions)
    storage.js            (Forge Storage helpers for config and secrets)
    pipeline/
      defectClassification.js   (Step 1, ported from complaint_triage.py)
      probability.js            (Step 2, ported from probability.py)
      severity.js               (Step 3, ported from severity.py)
      riskScoring.js            (Step 4, ported from final_scoring.py)
      anthropicClient.js        (shared API call wrapper)
  static/
    hello-world/          (Custom UI React app, will rename later)
      src/
        App.js
        components/
          TriagePanel.js        (issue panel UI)
          SettingsPage.js       (config/settings UI)
        ...
  reference/              (original Python files for reference during porting)
```