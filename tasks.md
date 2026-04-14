# TASKS.md: Jira Complaint Triage Forge App

## Phase 1: Foundation


### Task 1: Forge Storage for API Key
Set up Forge Storage helpers to save and retrieve an Anthropic API key using storage.setSecret() and storage.getSecret().  Create src/storage.js with simple get/set functions for the API key.  Wire up a resolver function in src/index.js that the frontend can call to save and retrieve the key.  Test by hardcoding a test key, saving it, and reading it back via the resolver.

### Task 2: Settings UI for API Key
Build a minimal settings UI component in the Custom UI React app.  Just a text input for the API key and a save button.  On save, call the resolver to store it.  On load, check if a key exists and show a "key saved" indicator (don't display the actual key).  This can live in the issue panel for now.  We'll move it to a proper admin page later.

### Task 3: First Anthropic API Call
Create src/pipeline/anthropicClient.js as a shared wrapper for calling the Anthropic API.  It should accept a system prompt, user message, and API key, and return the parsed response.  Add https://api.anthropic.com to manifest.yml permissions.  Test with a simple "hello world" call triggered by a button in the issue panel.  Confirm the API call works end to end from the Forge backend.

## Phase 2: Port the Pipeline

### Task 4: Port Defect Classification (Step 1)
Port complaint_triage.py to src/pipeline/defectClassification.js.  This function should accept bug data and product context (requirements, user needs) and return a structured defect classification result.  Keep the prompt logic faithful to the original Python.  The function should have no Forge dependencies, just take inputs and return outputs.  Test with hardcoded sample bug data.

### Task 5: Port Probability Assessment (Step 2)
Port probability.py to src/pipeline/probability.js.  Accepts bug data plus the defect classification output from Step 1.  Returns a probability score (1 to 5) with rationale.  Same rules: no Forge dependencies, faithful to original prompts.

### Task 6: Port Severity Assessment (Step 3)
Port severity.py to src/pipeline/severity.js.  Accepts bug data and returns a severity score (1 to 5) with rationale.  Independent from probability (they don't influence each other).

### Task 7: Port Risk Scoring (Step 4)
Port final_scoring.py to src/pipeline/riskScoring.js.  No LLM call.  Takes probability and severity scores, calculates risk score (probability x severity), determines action tier (1 to 6 complaint, 7 to 14 consider CAPA, 15 to 25 CAPA required).  Assembles the final triage report object.

### Task 8: Wire Up Full Pipeline
Create a pipeline runner function that chains all four steps together.  Takes a Jira issue's data as input, runs it through Steps 1 through 4, returns the final triage report.  Test end to end with sample data.

## Phase 3: Connect to Jira

### Task 9: Read Jira Issue Data
Use the Forge bridge / requestJira to read the current issue's fields (summary, description, labels, priority, custom fields).  Map Jira issue fields to the bug data format the pipeline expects.  Display the raw issue data in the panel to confirm it's working.

### Task 10: Run Triage from Issue Panel
Add a "Run Triage" button to the issue panel.  When clicked, it reads the issue data (Task 9), runs the full pipeline (Task 8), and displays the triage results in the panel.  Show defect classification, probability, severity, risk score, and recommended action.

## Phase 4: Config and Polish

### Task 11: Storage for Product Context
Extend Forge Storage to save and retrieve product context: user needs, product requirements, defect criteria, and risk matrix definitions.  Create resolver functions for CRUD operations on this config data.

### Task 12: Settings UI for Product Context
  - A settings page (can live in the issue panel for now, move to a proper admin page later)
  - Simple text areas for each section — paste in your user needs, product requirements, and defect criteria as JSON or plain text
  - Save button per section
  - No per-item add/edit/remove UI yet — that's polish

### Task 13: Connect Config to Pipeline
Update the pipeline to pull product context from Forge Storage instead of using hardcoded data.  When "Run Triage" is clicked, the pipeline should load the user's saved requirements, criteria, etc. and pass them into the LLM calls.

### Task 14: Results Display and Polish
Clean up the triage results display.  Show results in a clear, readable format with risk level color coding.  Add loading states while the pipeline runs.  Handle errors gracefully (missing API key, API failures, missing config).
    1. Clean results display with risk color coding — worth doing, the 
  raw JSON is not presentable
    2. Loading states — already have "Running..." on the button, could 
  add a spinner but low value                                        
    3. Error handling for missing API key / API failures / missing     
  config — already have error messages for all three, so this is
  mostly done
    4. Loading states while pipeline runs — covered by the disabled
  button

## CI/CD (Future)

Set up GitHub Actions to enforce that production deploys only happen from main via CI, not locally.

- Workflow triggers on push to `main`, runs `npx @forge/cli deploy -e production`
- Requires `FORGE_EMAIL` and `FORGE_API_TOKEN` secrets in GitHub repo settings
- Dev deploys (`-e development`) stay manual/local
- Prevents accidental prod deploys from feature branches

## Stretch Goals (Later)

- refine ui
- Add a project level triage summary page (Global Page module)
- Batch triage multiple issues at once
- Export triage report as a comment on the Jira issue
- Store triage history per issue using Forge Storage
- Marketplace listing preparation
