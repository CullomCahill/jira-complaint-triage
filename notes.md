## Future add ons
- Teams can store their requirements, hazards etc on jira itself.  So there are probably two options for this tool: 1. upload all your requirements and test cases etc in a file, or map to existing requirements/test cases
    - but then are we just essentially rebuilding ketryx? I guess there must be this functionality in ketryx, this is just a dialed back tool
    - start with just uploading reqs

- `defectClassification.js`
    - Hard coded in the prompt is like "you are a qe for samd product called mindbridge" will want to make this more universal

- Need to adjust risk assessment to be in line with matrix, but this needs to be configurable


- Will need to tweak the prompts a lot before releasing 
    `One thing worth noting — the risk score came back 12 (MEDIUM) this run vs 16 (HIGH) last time, because probability landed at 3 instead of 4. That's the LLM non-determinism again. In a real regulated context this is something to think about — you may want to lock temperature to 0 in the API call to get more consistent scoring.`

- 