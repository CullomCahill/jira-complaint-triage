# Deniz Feedback — Summary & Next Steps

## Summary

**Core validation:** Deniz sees the tool as a solid pre-assessment system for prioritizing complaints as low/medium/high risk before manual review. Matches how his team worked at Robot.

**Biggest gap — risk controls aren't factored in:** In ISO 14971 / medical device risk management, severity is about *residual* risk after applying risk controls, not just the harm itself. The tool currently only sees user needs and requirements, so it can't reason about whether a hazard was already identified, whether a risk control is in place, or what the residual risk is after those controls. His example: a timezone bug might look high severity initially, but if there's already a "detect timezone change and prompt user" feature as a risk control, the residual risk could be much lower.

**His suggestion:** Add a dedicated field for known hazards and existing risk controls so the LLM has the full traceability layer — requirements → test cases → hazards → risk controls — to give a more accurate severity score.

**Validation concern:** For regulated environments, repeatability matters. If you run the same ticket twice, do you get the same result? Worth addressing in any future sales pitch to a regulated company.

## Next Action Items

1. Add a "Known Hazards & Risk Controls" settings field alongside user needs / requirements
2. Update the severity LLM prompt to explicitly reason about residual risk (post-control) vs. initial risk
3. Test with a real example where a known control exists and verify the score changes appropriately

---

# Raw Transcript

Cullom
• 00:00
Everything's AI. Yeah. Alright. So let me just share my screen here. Alright.
You see this?
SPEAKER 2
• 00:22
Okay. I made it. Yes.
Cullom
• 00:24
Okay. So, yeah, so I'll walk through the the plugin or the app, I guess they call it, in Jira. So, essentially and it's this one. It's a prod one. So it shows up as, like, a widget or whatever you wanna call it in your Jira ticket.
Like, so you you add it to your workspace, and then you could add it to individual tickets as needed. You know? So it doesn't show up in all of them automatically, but you, you know, manually add it when it's when it's relevant. And then in the settings pane here, it takes your Anthropic API key. And this is all saved within Forge, which is like a Atlassian's native thing.
So if you're, I assume that if you're using Jira, you know, Jira's tool validated and then, like, this system is, like, within the Jira ecosystem, right, and kind of validated by by Jira. So but that is a question I have. And then you put in some product info, so, like, your name, just kinda some context. Right? What what type of product in the in a in a brief description of what it is.
Uh-huh. And then there's, like, an additional context window. Get to it in a second. And then you put in your user needs, just in JSON format. Right?
SPEAKER 2
• 01:58
Okay.
Cullom
• 01:59
And then you put in all your product requirements, again, in JSON. And and then your probability scale, like, what your you know, what's unique to your organization, how you set up your probability, what, you know, what the
SPEAKER 2
• 02:15
definition looks like. This is the setup setup part. Right?
Cullom
• 02:18
This is the setting up part. Yeah. And so this is this this is held within, like, your system storage. You know? And so it's, you know, it's you just have to do this once.
Right? And then severity scale and then your risk matrix based on the probability and severity. Right? And and then there's, like, an additional context window for, like, just anything else, like, as you run it over time. If it's like, oh, this consistently is outputting the wrong answer here, like, just adding some context here.
It's just kinda like a dump dump dumping ground. Right? And so, yeah, so the friction point here is, like, user needs and product requirements just as they are now have to be manually entered and they're not, you know, synced to anything. But but then, yeah, when you so then when you come in here in the ticket itself and you run the assessment, it's going through let pull up the so it's going through, like, four step process of, like first, it's doing it it's doing these three different LLM calls and then it and then running a deterministic script based on the outputs of those calls. And so the first call is, like, did you know, defect classification, looking through your you know, ingesting the ticket, looking through your requirements, and seeing, like, is this is this, you know, conflicting with any of the requirements specifically?
And then running probability, like, against your predefined probability classes. Right? And then, like, additional context as well and and severity. And so each of those, like, it's a distinct LLM call with an output. And then, obviously, the risk is just, like, based on the the outcomes of those.
So this one, which is user who travels across time zones or changes their phone time zone setting do not receive daily mood use check-in prompts. Uh-huh. The system thinks they already completed it because the date calculation is based on the original time zone, affects users until the next calendar date, whatever. And so then it's it's rating this as medium risk because it fails this requirement specifically, and then this user need also. So, like, highlights the actual requirements that it Mhmm.
Thinks is failing. Right? Yes. And then gives us severity and and probability. So, like, yeah, for this in, like, Robot's case, our severity would have been lower probably for this type of thing.
But this would just kind of yeah. Toy dataset. Right?
SPEAKER 2
• 05:17
Yeah. Yeah. Yeah.
Cullom
• 05:18
But
SPEAKER 2
• 05:19
So when when calculating the the probability, it says, like, low because it says only four users. Right? I don't recall what you had written there, but what if the so the the determination of whether slow, medium, like, moderate, high is based is done by the LLM?
Cullom
• 05:47
Right. Right. So so that's based on the so, basically, it takes it takes the the description it takes the description, and then it and then it looks through, you know or it takes the ticket description and then looks through the probability description and, you know, makes an makes an assumption based on that. So this is something that, like, in practice, you would need more, like, additional context or or longer descriptions to kinda, like, refine it a bit more. Right?
But yeah. And there and there's another so, like, it also takes in comments. Right? So in this case, like, there would probably be probably be, like, a manual step of, like, looking in the logs of how many users this impacted or whatever. Right?
Adding that in a comment or something, and then it ingests that as well. So and then you can imagine, like, in iteration of this down the line of something that, you know, can do that more automatically. But this is just, like, you know, v zero type of thing. So
SPEAKER 2
• 07:06
Yeah. I think this is, you know, this is good, helpful in the sense that this could be more like a pre assessment type of thing. Right? And then it like, if you remember the the the robot days, what we were doing is, okay, reviewing each ticket and saying, okay, you know, this is this and, okay, what would you rate this? What would you rate that type of thing?
So this would eliminate maybe not eliminate totally, but at least help reduce that workload in advance to say, okay, these are potentially medium risk complaints. These are the low risk one. These are the high risk ones, and then you can do your prioritization, for for that. I mean, that's how I'm thinking. So do you so you need to so when this is doing the risk assessment, what are how does it determine the the the risks, though?
Like, the the the hazards that could because this is just looking at the probability of occurrence and the probability of the the hazard. Right? But how does that determine the hazard in the context of that device? You where do you feed that information?
Cullom
• 08:46
So yeah. Interesting question. So it's really it's like, it's just got the user needs and the requirements, but maybe and it's just basing it off of this, you know, severity scale. Right? So it's like, does this have no impact on the therapeutic experience?
Is this a slight inconvenience? You know? But, like, a whole maybe it makes sense to add, like, another, you know, section like this that's, like, all your existing hazards or something.
SPEAKER 2
• 09:21
Yeah. Just to give give more more context because the way, you know, obviously, this this works is just give me one second. Yeah. And I have the ISO fourteen nine seventy one. Do you know that standard?
The risk risk analysis. Yeah. So, you know, what FDA looks at or, you know, in ISO standard or any any standard is that you have your, you know, requirements, user needs, and the the functional requirements, the maybe the test cases, the risks. Right? Everything is, you know, tied together and traceable.
So for this type of, like, assessment, it would maybe you know, I would I would try maybe adding also a field for, as you said, like, risks or known hazards, at least to give more context. Or you could you could put that into that context box to say, okay. These are my known hazards, and these are the the residual, risk levels type of thing. Right? And then it may say, okay.
Considering that and your, you know, existing controls, it may score the same thing maybe differently on the severity scale because now it knows more information and and makes a better outputs.
Cullom
• 10:55
Right. Right.
SPEAKER 2
• 10:56
Like, if Maybe, you know, without changing anything in your workflow, just to say, you know, like, it says, okay, affects users until the next calendar day in the new in their new time zone. But maybe, you know, let's say there's an automated auto change time zone setting that is disabled, but there is that feature, right, as a as a potential risk control for this. But maybe the user didn't follow that instruction to turn that on or, you know, I I don't know. Like, just maybe the the output would come to user training needs as as a result of the risk assessment rather than a defect in the software. Because it will know that there's a a risk, like this risk has potentially maybe has been already identified, and there is a a potential risk control there.
But the residual risk is may still be high because it is user, user makes that decision to turn this feature on or off. And with that context, maybe let's see how that, would change this risk assessment results. You know, obviously, I know this is, like, early, for you and you're looking for, you know, for more feedback. But I would consider putting that some sort of, like, information there to see how how this how this workflow would react.
Cullom
• 12:46
Right. So, like like so, like, in here, if we say, you know, mitigated hazards or how how would it how would it like, you know, if I were to add something to here, would it be because if you have your list in hazard mitigations or, like, known areas I guess, like, for me, when I was kinda testing, I would put things in, like, you know, whatever flags specifically. Like, if if if it's a time zone issue Uh-huh. Like, if I put in here if if it if if the issue oops. What's going on?
If the issue touches time zones, it's a high severity or something.
SPEAKER 2
• 13:40
Not no. But if you give this information, then it would it would be because think think about this. Like, if you were to do this assessment by yourself, you know, without the help of this tool, obviously, you have what you need to do is you have the issue, then you need to do that evaluation. Right? The risk risk assessment.
And how would you do that? You would look at, okay, first, do I have, you know, a test case or a requirement around this issue, which in in your case, like, you have the user need and the and the and the product requirement, then you would say, okay. Does my test cases cover this type of scenario? And do I have any, like, hazards or risks already identified for this similar or for this requirement set? Right?
Then you would have that traceability. If you remember, like, we have the requirements, we have the test cases, we have the hazards associated with the with those requirements. We have that, you know, traceability tree. With that information in our mobile assessments, you would say, oh, like, although this risk may seem high, we already have risk controls around this, you know, and that's that's why the severity is low rather than considering the initial severity after, you know, without controls. Because when it comes to the risk assessment or, you know, risk management in the context of the medical device Mhmm.
You're not only looking at the harm or potential harm itself, you need to consider if you have a risk control system in place or
Cullom
• 15:40
not. Right.
SPEAKER 2
• 15:42
You know, the the risk the initial risk might be really high before a risk control, but you may have implemented the risk control and that brought down the the residual risk to maybe very low. The probability is very slim to none because you already implemented risk control. So you have to think about that as well when you're doing your risk assessment. Not just, what would be the probability of occurrence and what is the harm. You need to also consider what is the harm considering the existing risk controls, not just what is the harm itself.
Cullom
• 16:23
Right.
SPEAKER 2
• 16:24
So I think if you can put something to that, you know, obviously, to that effect in the additional context column right now. I I mean, obviously, you can test that out to see how would that change this assessment. You know, maybe, you know, make make up a a risk control to say, you know, maybe the system should pop up it it pops up a notification to say, do you wanna update your time zones or something? Maybe the system detects that change based on your location and says, do you wanna change the time zone? And then you may ignore that message or or, you know, change it.
And then this may let's see if the risk would, you know, the risk the risk calculation would would change
Cullom
• 17:29
Right.
SPEAKER 2
• 17:29
Considering considering that.
Cullom
• 17:33
Yeah. I wonder. Yeah. Because the risk or the hazard risk controls so it didn't change. Let's see if it pulled in.
Yeah. I mean, I think I'd have to reevaluate some of the
SPEAKER 2
• 18:01
It's not maybe it's not pull pulling that information in when it is determining that severity.
Cullom
• 18:07
I think it's I think it's ignoring it because I've done some initial testing. I'm just, like like, to, you know, artificially spike the severity based on the additional context window. So it is pulling it in, but I think that it it's a bit more of a, like, what you're describing here is is Yeah.
SPEAKER 2
• 18:24
Yeah. Maybe.
Cullom
• 18:25
Accurate, but it's
SPEAKER 2
• 18:26
You need to describe it in a way. And, also, the other thing I I need to jump is consider the the validation aspect. Obviously, you know, because think about this, if you were to implement this in a in a company, let's say, you know, you were higher than okay. They say, like, we see this I think this is a really valuable tool. I mean, it would increase the efficiency a lot, but you need to also think about how to validate or, you know, make sure that it would give you the right risk assessment.
Right? Over time, that repeatability. If you put in the same information, would it give you the same result? Or I mean I mean, obviously, you know better than me on on those topics how to do the validation of software. But
Cullom
• 19:15
Sure. Sure. Yeah. Well, that's an interesting question. But because it is probabilistic still.
You know?
SPEAKER 2
• 19:21
Yeah. And we can touch base, you know, anytime. So Yeah. Awesome. Maybe once you, you know, do some additional work, we can touch base again.
Cullom
• 19:33
Right. Right. Right. Right. Cool.
Well, yeah, I really appreciate your your expertise, Dennis.
SPEAKER 2
• 19:39
Alright. No worries, man. Anytime. So I'll always go good to talk to you.
Cullom
• 19:44
Likewise. Likewise, sir.
SPEAKER 2
• 19:46
Alright. Take care.
Cullom
• 19:47
Take care. Thanks again. Bye.