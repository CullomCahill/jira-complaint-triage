# Improvements / Bugs for next iteration
- Will want to be able to lock the settings menu, or have it only be editable by certain individuals
- "Run Triage" should really be more like "risk assessment"
- Have to refresh ticket if you make edits to the description before running triage again - probably unavoidable but just make a note - maybe add "refresh ticket after changes" in title or something?
- This should also pull in comments on the ticket
- Risk assessment output does not persist if close ticket and reopen - I guess would need like a database for this? - i guesss exporting the triager report as a comment is the way to do this?
- Should be a block if you click back from settings without saving

# Tasks for more information gathering
- Go through each prompt and see what pieces of it may need to be editable by users, then bring those into variables that users can edit in settings menu
- Figure out some kind of testing methodology, like a rubric to evaluate the output against to improve.  

# Other tasks
- refine ui - make it look nicer
- Add a project level triage summary page (Global Page module)
- Export triage report as a comment on the Jira issue
- Store triage history per issue using Forge Storage - question: is this necessary if we're doign the comment?maybe makes more sense in enxt iteration
- Marketplace listing preparation


# Next/future versions
- Batch triage multiple issues at once
