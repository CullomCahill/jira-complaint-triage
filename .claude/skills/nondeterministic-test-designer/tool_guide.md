# Eval Framework and Tool Guide

Use this when helping the user select tools for their non-deterministic test layer.

---

## The Core Choice: Build vs. Buy

Before recommending a specific framework, clarify what the user actually needs:

- **Prototyping / learning** — start with DeepEval or a simple custom PyTest + LLM-as-judge setup
- **RAG-focused evaluation** — Ragas is purpose-built for this
- **Production monitoring at scale** — Langfuse or Braintrust give you the observability layer
- **Regulated / high-stakes domain** — Patronus AI or custom rubric system where you control the eval logic entirely

Do not recommend shopping around between frameworks.  Pick one and go deep.

---

## Framework Comparison

### DeepEval (Confident AI)
**Best for:** QA engineers building eval suites; teams with PyTest experience; general-purpose LLM eval

- PyTest integration — evals run like regular test files
- Built-in metrics: G-Eval, faithfulness, answer relevancy, hallucination detection, toxicity, bias
- Supports LLM-as-judge with chain-of-thought scoring
- Good documentation; active community
- Docs: docs.confident-ai.com

**Pick this if:** The user is a QA engineer, already knows PyTest, and wants to get started fast.

---

### Ragas
**Best for:** RAG pipelines specifically

- Purpose-built for retrieval-augmented generation evaluation
- Metrics: faithfulness, answer relevancy, context recall, context precision
- Works well with LangChain and LlamaIndex
- Docs: docs.ragas.io

**Pick this if:** The system has a retrieval layer and RAG quality is the primary concern.

---

### Langfuse
**Best for:** Production monitoring and observability; teams that need dashboards over test suites

- Traces LLM calls in production
- Scores can be logged and tracked over time
- Good for behavioral drift monitoring
- Can integrate with DeepEval for the eval layer
- Docs: langfuse.com/docs

**Pick this if:** The user needs production monitoring of score distributions over time, not just offline regression testing.

---

### Braintrust
**Best for:** Teams that want a managed eval platform with dataset management and logging built in

- Dataset management for golden datasets
- Eval runs with logging and comparison
- Good for teams that do not want to manage eval infrastructure themselves
- Docs: braintrust.dev/docs

**Pick this if:** The team wants an opinionated, batteries-included eval platform.

---

### Patronus AI
**Best for:** Compliance-heavy or regulated domains; teams that need pre-built judges for hallucination, toxicity, and compliance

- Managed Evaluation API
- Pre-built judges for common failure modes
- Good audit trail
- Docs: patronus.ai

**Pick this if:** The domain is regulated (healthcare, finance, legal) and pre-built compliance-focused judges are valuable.

---

### Custom PyTest + Anthropic / OpenAI API
**Best for:** Teams that want full control over rubrics and eval logic; learning the fundamentals

- Write your own rubric prompts
- Use the Anthropic or OpenAI API as the evaluator LLM
- Wire into PyTest for CI integration
- No dependency on a third-party eval platform

**Pick this if:** The user wants to understand the mechanics deeply, has unusual domain requirements, or wants to avoid vendor lock-in.

---

### Hypothesis (Python)
**Best for:** Property-based testing on the deterministic layer and behavioral properties of the non-deterministic layer

- Generates edge case inputs automatically based on defined properties
- Not an LLM eval framework — it is a testing library for defining invariants
- Docs: hypothesis.readthedocs.io

**Use alongside** one of the frameworks above, not instead of it.

---

## Tool Selection Decision Tree

```
Is the system RAG-based?
  YES → Start with Ragas
  NO  → Continue

Does the team already use PyTest?
  YES → Start with DeepEval
  NO  → Continue

Is production monitoring / dashboards the primary need?
  YES → Start with Langfuse
  NO  → Continue

Is the domain regulated or compliance-heavy?
  YES → Consider Patronus AI or custom rubric system
  NO  → Start with DeepEval or custom PyTest setup
```

---

## CI/CD Integration Notes

All of the frameworks above can be integrated into GitHub Actions.  The pattern is the same:
1. Run your eval suite as part of the test step
2. Fail the build if the pass rate drops below your defined threshold
3. Publish eval results as build artifacts for human review

The key decision is whether to run against the full golden dataset (slower, more comprehensive) or a fast subset (faster, good for PR checks).  Use the fast subset for PRs; run the full golden dataset on merge to main and before releases.

---

## GitHub Repos Worth Cloning

- `danilop/non-deterministic-software-testing` — runnable Python examples of semantic similarity testing, property-based testing with Hypothesis, structured test data generation
- `confident-ai/deepeval` — DeepEval source and examples
- `explodinggradients/ragas` — Ragas source and examples