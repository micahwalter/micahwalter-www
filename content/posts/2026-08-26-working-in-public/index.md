---
title: "You do not need an audience"
publishedAt: "2026-08-26"
excerpt: "Working in public is usually sold as a growth strategy. For me it is something quieter and more useful: a way to keep ideas moving, keep the builder muscle warm, and leave a trail I can come back to. This site is the experiment."
category: "Writing"
tags: ["working-in-public", "blogging", "github", "open-source", "ai"]
draft: false
---

Working in public is usually pitched as a marketing move. Build your thing where people can see it, narrate the journey, grow an audience, convert the audience into customers or a job or a course. There is a whole genre of advice about it, and most of it assumes the audience is the point.

I have been working in public for a while now, and for most of that time, almost nobody was watching. The repo behind this website is open. The issues, the pull requests (including the half-finished ones), and the commit history with its absurdly long AI-written commit messages are all public. For long stretches, the audience for all of it was me.

For me, the benefits of working in public were never about building an audience or a business. They were about exploring my own creativity and process as a maker, and those kicked in long before anyone was paying attention.

## What "public" means here

When I say working in public, I do not mean posting polished updates about a project. I mean the project itself is the public artifact, all the way down.

This blog is a good example because the blog *is* the repository. The posts are markdown files in git. The infrastructure is CloudFormation templates sitting next to them. The ideas are [GitHub issues](https://github.com/micahwalter/micahwalter-www/issues). The drafts are pull requests. The design decisions are documented in the repo, full of diagrams and process notes that no reasonable person would ever read. When I build a feature or fix something dumb, the whole trail is right there: the issue where the idea landed, the branch where it got built, the PR where it got reviewed, and sometimes a blog post about the sprint, which itself went through the same issue, draft, and PR loop.

It gets a little recursive. I have opened issues about writing blog posts about work that started as issues. A draft post sits in a pull request, in public, until I think it is good enough to merge. Some of them sit there a long time. That is not a quirk of the setup, it is the process working as intended. This is how code has always evolved: the first commit is a rough draft, and issues, commits, and PRs drive the thing forward from there. I decided to treat the writing exactly the same way, on purpose. A draft in a public pull request is the first commit of an essay, and it earns its way to merged just like everything else in the repo.

## Ideas as issues

The habit that changed the most for me is treating ideas as issues instead of notes.

I have kept idea backlogs in every notes app that has ever existed, and they all become the same thing: a graveyard with good intentions. A note is inert. It has no state, no direction, and no obligation. It sits in the vault being potential energy until you feel guilty enough to delete it.

I am not the only one who has landed on GitHub for this. Simon Willison wrote last year that "[GitHub issues is almost the best notebook in the world](https://simonwillison.net/2025/May/26/notes/)," and his list of reasons is hard to argue with: free and unlimited, comprehensive Markdown support, fantastic inter-linking between issues across repositories, and an API you can automate against. He is right on every count. The only thing I would add is that for ideas, the notebook framing undersells what issues actually do.

An issue is different from a note, and I think the word itself is doing some work. Filing an issue is a small claim that something about the world should be different. This site should have color search. Comments should exist here. That camera deserves an essay. The claim comes with an implied direction: toward closed. Not today, not on any schedule, but eventually an issue wants to either become real or get closed as not worth it, and both outcomes are progress. A notes vault never forces that decision.

The mechanics matter less than the posture, but the mechanics are also great. When an idea shows up somewhere inconvenient, on the train, in bed, in the middle of something else, I talk it through with Claude on my phone for a few minutes and the end result is a well-formed issue: the idea, the angle, a rough outline, acceptance criteria. Later, sometimes that same day, I open the issue in Cursor or Claude Code and say, let's build this. The idea made the jump from my head into something with a number and a state, and it survived the trip.

[Issue #126](https://github.com/micahwalter/micahwalter-www/issues/126) is one of mine that is still open: a post about a camera I have owned for ten years. There is no draft yet. Just the idea, structured, waiting. It will get written when it gets written, and in the meantime it is not rattling around in my head or rotting in a vault. It is queued, in public, where future me can find it.

## Rebuilding on purpose

This site is on something like its fifth generation. WordPress for years, then a parade of CMSs, each one built up and torn down. What kept pulling me back to rebuild it from scratch this time was wanting a place that works the way I want to work, and being willing to pay the tuition to figure out what that means.

By any practical measure the project is over-engineered. It is a static blog with its own newsletter system, its own photo pipeline with a database and an enrichment step, its own ticket server for allocating post IDs. Platforms exist that do all of this in a click, and I have had people from those platforms tell me, kindly, that the complexity I built by hand is precisely the thing their product deletes. They are right. That was never the point. I wanted to figure out how to do all of it, because the figuring-out is the project.

What changed recently is that AI collapsed the cost of the tedious parts. The small problems that used to eat a whole evening, the config wrestling, the boilerplate, the fourth attempt at a regex, are mostly gone. What is left is the interesting layer: what should this thing be, how should it work, is this idea worth building at all. I get to operate like a product owner on my own whimsical product, and the models do most of the typing.

AI also filled in the gaps where I was weakest. Designing front-ends was a deficiency I always felt held me back, and it is a big part of why I gravitated toward command line programs like [chat-cli](/posts/building-a-generative-ai-cli-with-amazon-bedrock-and-go). A terminal interface was a way to keep experimenting and moving forward without the frustration of fighting a layout. That frustration has dramatically faded. I can design with my eye now, reacting to what is on the screen and asking for changes, without worrying too much about the code at that layer. Between the tedium going away and the weak spots getting covered, the site shifted from something I periodically relaunch into something that is genuinely alive, a living project that keeps gathering features and essays and history instead of getting torn down every few years.

Because there are no stakes, the roadmap is able to match my own chaotic way of thinking and learning. One day it is [browsing photos by color](https://github.com/micahwalter/micahwalter-www/issues/52). Another day it is building comments in, or [tearing the photo system off the static build entirely](/posts/photos-without-the-deploy). No SOW, no stakeholders, no sprint commitments. Whimsy is a legitimate requirement here, maybe the only one.

## What I actually get out of it

The honest answer is continuity. The public trail is what keeps me going.

Momentum on a side project usually dies in the gap between sessions. You come back after two weeks and cannot remember where you were, why you made that choice, or what you were excited about, and the reconstruction cost is high enough that you quietly stop coming back. Working in public all but eliminates that gap. The issues remember what I wanted. The PRs remember what I did. The posts remember why. Every session starts warm. The same trail turns out to be ideal context for AI collaborators too, so the agents start warm along with me.

There is also something about the low, steady hum of publishing that keeps the creative side fed. Writing code, pushing it, writing about it, filing the next idea. Continually thinking on paper, somewhere, even when the room is empty. It keeps my hands dirty in the way I need them to be. I have watched skills atrophy during stretches when everything I built was private and provisional, and the difference is not subtle.

Eventually, people do notice. Not an audience in the influencer sense, but the right people at odd moments. A conversation opens up because someone wandered through the repo and could see everything: not a landing page about the work, but the actual work, with its false starts and its draft posts sitting unmerged because they were not good enough yet. It turns out that is still rare. Plenty of people ship open source code; far fewer leave the whole thinking process out in the open. The completeness of the trail is what people respond to, and none of it was produced for them. It is just the exhaust of a working process, and the exhaust turns out to be the portfolio.

## You do not need an audience

If there is a takeaway here, it is that the standard pitch for working in public gets things backwards. The audience, if one ever shows up, is a side effect. The real payoff starts on day one: ideas have somewhere to go, work piles up instead of evaporating, and a passing thought is only ever one issue and one session of building away from being real.

You need somewhere ideas can go to become slightly more real than a note. You need a history that remembers so you do not have to. You need stakes low enough that you can follow whims, because the whims are where the good stuff lives.

[The repo is public](https://github.com/micahwalter/micahwalter-www). Nobody has to look. That was never the point.
