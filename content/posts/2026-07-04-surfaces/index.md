---
id: 145
title: "Surfaces"
publishedAt: "2026-07-04"
excerpt: "Somewhere out of view, something is doing work I used to do myself."
category: "AI"
tags: ["ai", "agents", "cursor", "vim", "orchestration"]
draft: false
---

It's late, and I am checking on something from my phone. Not the thing itself, just a status. A progress bar, a few lines of logs, a small green check that suggests things are going fine. What strikes me is that I have no real idea where the work is happening. Not which machine, not which region, maybe not even which continent. What I am looking at is a surface, and somewhere behind it, out of view, something is doing work I used to do myself, with my own hands, on a machine I could reach out and touch.

## What it is

A surface is the place where you touch the work. For most of my career that meant a text editor and a terminal, usually arranged just so, on a machine sitting in front of me. The surface was also where the work happened. The file I was editing lived on the disk spinning under my palms, the process I was watching ran on the CPU warming my desk. There was no reason to distinguish between where I looked and where things ran, because they were the same.

Lately a second word has entered the vocabulary, and has earned its keep. The harness is the scaffolding an agent operates inside, the permissions, the tools it can reach, the loop that decides what it is allowed to touch and how it reports back. The surface is where I am. The harness is where the agent is. For a long time nobody needed two words for this, because there was only one place. Now there are often several, and the space between them is quietly becoming the most interesting thing about how software gets built today.

## Why hasn't everything already disappeared?

I still really love Vim. Neovim now, technically, but the feeling is the same one I have had for thirty years. There is something lovely about a simple input where I can edit text without much cruft, where the interface asks almost nothing of my eyes and everything of my hands. The whole promise of that world is that your muscle memory can be tuned, sharpened, made faster and faster until the editor effectively vanishes. The surface gets out of your way. At its best there is almost no surface at all, just you and the text, the way a good lens disappears between you and the subject. It lives everywhere you live. Just sitting there, cursor blinking, waiting for your next move.

Every editor since has been a different theory about how much of that closeness to trade away, and for what. Sublime Text traded a little distance for speed and polish. VS Code traded more of it for an ecosystem, an extension for everything, a panel for everything, the system increasingly summarized rather than shown. None of these trades were wrong. Each one made a claim about what a developer should have to hold in their head, and each claim was reasonable for its moment. I just want to be clear that something was being traded, because the rest of this essay depends on you noticing it.

The thing about the Vim mode of working, the thing I miss most on the days I choose not to work that way, is that the friction taught you. You learned the system through your fingertips. When the surface and the system are the same place, proximity is a kind of education, and speed is a kind of understanding.

## Things open up a little

Codespaces and Gitpod were attempts to pull the surface and the system apart. Your editor stayed in front of you, the machine moved to the cloud, and the pitch was reproducibility, onboarding in minutes, no more works-on-my-machine. It was a good pitch, and it mostly did not take, at least not the way its makers hoped. I have come to think the bet was placed one layer too early. Moving the compute away from the developer solved a problem most developers did not feel acutely, and it created a distance that nothing yet justified. The remote machine was just your machine, farther away.

Then agents arrived, and suddenly the distance had a reason to exist.

I notice this most clearly in my own commute. I often find myself working through an idea in a Claude chat on the train, thumbs on glass, no repo in sight, shaping the problem until it has edges. When I sit down at my desk I carry that conversation, or the artifact it produced, into Cursor and use it to kick off a prototype. The work started on one surface and continued on another, and the whole time the actual execution, the harness, was somewhere else entirely. Ten years ago that sentence would not have parsed. The work was wherever your machine was, full stop. Now the work is a thing that flows between surfaces, and I meet it wherever I happen to be standing.

This is what Codespaces was reaching for and could not quite grab. The value was never remote compute for its own sake. The value shows up only when something on the other end can make progress without you.

## Orchestration

There is a design pattern that has shown up almost simultaneously in Claude Desktop, Cursor, and Codex (and others), and when competing tools converge on the same shape it usually means the shape reflects something true about the work. It is the sidebar of running agents. You set up a task, hand it off, and move to the next one. The agents work, you get alerted, you check back, you redirect. On a busy day I am orchestrating a dozen of these at once, sometimes more.

I want to be precise about what this does to my head, because it is the biggest change in my working life since I learned to type. When I built software the old way, I held one thing in my mind, a single codebase, its architecture, the feature I was threading through it. The state lived in me. Deep focus was the job. Now the thing I hold in my head is a portfolio, this agent is refactoring the auth flow, that one is writing tests, a third is stuck and does not know it yet. My attention has become the scarce resource, and I spend it the way a manager does, in slices, moving from one situation to the next, drawing focus differently depending on where I am and what is competing for me.

I am not sure yet whether this is a promotion or a loss. Some days it feels like both. What I can say is that it is a genuinely different kind of mind. The Vim mind is deep and narrow, tuned until the surface disappears. The orchestrator mind is wide and interruptible, tuned to notice which of many surfaces needs me next. I love the first one. I am becoming the second one. The essay you are reading was mostly drafted in the gaps between checking on agents, which feels like it proves the point.

## What is underneath

When the surface and the harness were the same place, my model of the system was built automatically, as a byproduct of touching everything myself. Every file I opened, every command I ran, every error I chased deposited a little sediment of understanding. Where does that model come from now?

Part of the answer, I think, is that the memory has moved into the workspace. People say their agents learn, and I catch myself saying it too, my agents and I adapt together, we morph, we scrap things and start over, we evolve toward something more. Strictly speaking the models do not learn between sessions. What accumulates is the harness, the conventions files, the artifacts in the repo, the documented decisions, the scar tissue of previous attempts. The agent forgets and the workspace remembers. I am co-evolving with a thing that has no memory of me, through a medium that remembers everything, and I find that stranger and more interesting than the version where the machine simply gets smarter.

The other part of the answer is less comfortable. Some of the understanding that used to come free with the typing now has to be sought deliberately, or it does not happen at all. Reviewing a diff is not the same as having written it. Approving a plan is not the same as having discovered it. The skill is relocating, from execution to judgment, and judgment without a model underneath it is just vibes. Keeping the model alive is now a discipline rather than a side effect, and I do not think our tools have fully reckoned with that yet.

## The seams

I spent years as a photographer before I spent years as an engineer, and the best description I have for agent output right now comes from that world. It is like a faked photograph. Convincing at a glance, plausible in its composition, and wrong in the details if you know where to look. The shadows fall a degree off. The edges are too clean. A hand has six fingers. The work my agents hand me has the same quality, impressive from across the room, brittle up close, and I have learned to review their work the way I learned to spot a doctored image, by going straight to the seams.

The faked photographs are getting better, just like the work. Every few months the seams get harder to find, and I have to look somewhere new. I do not know where this ends, whether the surface eventually becomes a place where I only ever see finished things, or whether some part of the work will always need my hands in it. For now I am on my phone again, late, looking at a small green check, holding a dozen running efforts in my head where a codebase used to be, still reaching for the seams. We are not there yet, but we are getting closer. Aren't we?