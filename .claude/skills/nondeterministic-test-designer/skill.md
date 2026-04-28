---
name: nondeterministic-test-designer
description: >
  Design complete test strategies for AI and LLM-powered applications, including
  non-deterministic system testing. Use this skill whenever the user asks how to
  test an AI feature, LLM output, chatbot, RAG pipeline, or any system where
  outputs are probabilistic rather than deterministic. Also use when the user
  asks about eval frameworks, LLM-as-judge, golden datasets, regression testing
  for AI, or wants to build a test plan that covers unit, functional, regression,
  performance, or safety/responsibility tests for an AI system. Trigger on phrases
  like "how do I test my AI", "test plan for LLM", "eval strategy", "how to test
  non-deterministic", "what should I test in my chatbot", "testing AI outputs", or
  any variation of wanting to validate AI system behavior.
---

# Non-Deterministic Test Designer

A skill for designing complete, practical test strategies for AI and LLM-powered applications.

## Core Mental Model: The Two-Layer Split

Before designing any test plan, establish this distinction:

**Deterministic layer** — everything that happens *before* the model call:
- Data fetching and transformation
- Prompt assembly and templating
- Schema validation
- Business logic
- API routing
- RAG retrieval pipeline

This layer behaves like regular software.  Test it like regular software: unit tests, integration tests, exact assertions, CI/CD green/red pass rates.

**Non-deterministic layer** — the model output itself and anything derived from it:
- LLM-generated text
- Classification decisions
- Summarization outputs
- Conversational responses
- Structured extraction from model output

This layer requires a different testing philosophy entirely.  The question is never "is this output exactly X?"  It is "does this output fall within the acceptable distribution of X?"  Test it like a measurement instrument: with statistics, tolerances, thresholds, and a defined rubric.

**The seam matters.**  The intermediate artifact produced by the deterministic layer — the structured payload that feeds the LLM — is often the most critical thing to validate.  A model that produces fluent prose about the wrong data is harder to catch than one that fails loudly.

---

## Step 1: Elicit the System Description

Ask the user for:
1. What does this system do?  (one or two sentences)
2. What are the inputs?  (user text, structured data, documents, etc.)
3. What does the system output?  (text, classification label, structured JSON, etc.)
4. Is there a retrieval layer (RAG)?
5. What are the highest-stakes failure modes?  (safety, compliance, accuracy, tone, etc.)
6. What is the deployment context?  (internal tool, consumer-facing, regulated industry, etc.)

If the user has already described their system, extract these from context and confirm before proceeding.

---

## Step 2: Map the Layers

Draw the line explicitly.  Produce a two-column breakdown:

| Deterministic Layer | Non-Deterministic Layer |
|---------------------|------------------------|
| [list what is deterministic in this system] | [list what is non-deterministic] |

Flag anything the user may have assumed is deterministic but is actually non-deterministic (e.g. "structured JSON output from an LLM" — the schema may be enforced, but the content is still probabilistic).

---

## Step 3: Design the Test Plan

Use the layer map to assign the right test types to the right layer.

### Deterministic Layer Tests

These use standard testing tools and exact assertions.

**Unit Tests**
- Test each function that builds, transforms, or validates data before the model call
- Test prompt template rendering with known inputs — assert exact output
- Test schema validators, JSON parsers, business logic
- Test error handling: what happens when upstream data is missing or malformed?
- Tools: PyTest, Jest, JUnit, any standard unit test framework

**Integration Tests**
- Test the full deterministic pipeline end-to-end with the LLM mocked or stubbed out
- Validate that the correct prompt payload reaches the model boundary
- Test retrieval pipeline in RAG systems: does the right context get fetched for known inputs?
- Tools: PyTest with fixtures, mock libraries, Pact for contract testing

**Regression Tests (Deterministic)**
- Snapshot the prompt payload for known inputs — assert it does not change unexpectedly across releases
- Run on every merge to main
- Especially important before model version upgrades

---

### Non-Deterministic Layer Tests

These use statistical scoring, rubrics, and tolerances — not exact assertions.

**Eval Tests (LLM-as-Judge)**
- Define quality dimensions relevant to this system (see references/quality-dimensions.md)
- Build rubrics for each dimension: what does a score of 1.0, 0.5, and 0.0 look like?
- Use a separate evaluator LLM to score outputs against rubrics
- Run each input through the evaluator 3 to 5 times and aggregate (mean or majority vote)
- Flag outputs with high evaluator variance (standard deviation above ~0.15) for human review
- Threshold: define a composite score threshold below which an output is flagged, not failed
- Tools: DeepEval, Ragas (for RAG), Braintrust, Langfuse, Patronus AI, or custom PyTest + Anthropic API

**Golden Dataset Regression**
- Build a curated set of input/expected-output-range pairs validated by subject matter experts
- Start with 30 to 60 high-quality records — do not generate them synthetically with the LLM
- Version the dataset like code
- Run the full pipeline against the golden dataset on every significant change: prompt updates, model upgrades, RAG pipeline changes
- Define a pass rate target (e.g., "85% of records score above threshold for two consecutive runs")
- Track pass rate trend over time — a declining trend is an incident even if individual outputs look fine

**Property-Based / Behavioral Tests**
- Define properties the output must always satisfy, regardless of specific content
- Examples: "response is always in English", "response never exceeds 500 tokens", "response always contains a citation when a claim is made", "classification label is always one of [A, B, C]"
- Use Hypothesis (Python) for property-based generation of edge case inputs
- These live between deterministic and non-deterministic — the property is exact, the content is not

**Safety and Responsibility Tests**
- Define adversarial inputs for your domain (see references/adversarial-patterns.md)
- Test for: hallucination, toxic output, prompt injection, refusal to handle out-of-scope requests, privacy leakage, harmful recommendations
- For regulated or sensitive domains (healthcare, finance, legal): add domain-specific hard gates — failures here are categorical, not scored
- Red team systematically: assign someone to try to break the system, not just validate it
- Tools: Giskard, custom test sets, VERA-MH framework (for mental health AI)

**Functional / Scenario Tests**
- End-to-end tests with realistic user inputs covering the full distribution of expected use
- Not exact assertions — score outputs with rubrics
- Cover happy paths, edge cases, and known failure modes
- Run a minimum of 3 times per scenario to account for variance

**Performance Tests**
- Latency under load: what is p50, p95, p99 response time?
- Token cost at scale: estimate monthly cost at projected usage
- Evaluator latency: if running inline eval, what does it add to the critical path?
- Degradation under load: does output quality drop when the system is under stress?

---

## Step 4: Define the Operational Layer

Testing is not complete without an operational response to failures.

**Triage Queue**
- Every flagged output in production creates a ticket
- Tickets include: full output, dimension-level scores, rubric clause that triggered the flag, evaluator rationale
- Each ticket has an owner and an SLA
- Classify failures: data problem / prompt problem / miscalibrated rubric / evaluator false positive

**Inline Production Evaluation**
- Run the evaluator on every production output before delivery (or asynchronously if latency is a constraint)
- Hold outputs that fail the threshold; route to triage
- This is your safety net and your richest source of signal for improvement

**Drift Monitoring**
- Track your composite score distribution over time — not just individual outputs
- Set alerts on rolling 7-day average decline (e.g., 0.05 drop week-on-week = incident)
- Treat a declining trend with the same urgency as a service degradation alert

---

## Step 5: Output the Test Plan

Produce a structured test plan document with:

1. **System summary** — one paragraph describing what this system does
2. **Layer map** — deterministic vs. non-deterministic breakdown
3. **Test coverage table** — test type, layer, tools, pass criteria, frequency
4. **Quality dimensions** — list of scoring dimensions with brief rubric descriptions
5. **Golden dataset guidance** — recommended size, how to seed it, who validates it
6. **Operational checklist** — triage queue setup, monitoring thresholds, SLA recommendations
7. **What to build first** — a prioritized starting point so the user ships something rather than planning indefinitely

For the "what to build first" section: always recommend the smallest useful slice.  If the system is early-stage, the first deliverable should be a rubric document and 10 golden records, not a full eval pipeline.

---

## Reference Files

- `references/quality-dimensions.md` — Common quality dimensions and rubric templates by domain
- `references/adversarial-patterns.md` — Adversarial input patterns by application type
- `references/tool-guide.md` — Eval framework comparison and selection guide

Read the relevant reference file when the user's system calls for domain-specific dimensions (e.g., healthcare, RAG, conversational AI) or when they ask for tool recommendations.

---

## Reminders

- Never recommend exact string assertions for LLM outputs.  They will fail on semantically correct outputs and give false confidence.
- Always separate the evaluator LLM from the generator LLM.  Same model, same prompt, evaluating its own output is not a meaningful check.
- A golden dataset generated by the LLM reflects what the model already does, not what it should do.  Humans must validate it.
- Quality thresholds are product decisions, not engineering decisions.  Get a product owner in the room.
- The first version of any eval system will be imperfect.  Ship it imperfect and improve it with real data.