---
id: 144
title: "Notes on exploring the AI-Driven Development Life Cycle"
publishedAt: "2026-06-26"
excerpt: "I've been delivering AI-DLC workshops for AWS customers for the past nine months. Here is what I have seen teams learn about building software when agents can plan, code, and operate alongside you."
category: "AI"
tags: ["ai", "aidlc", "spec-driven-development", "agentic-ai", "software-engineering"]
draft: false
---

For the past nine months I have been delivering **AI-DLC** workshops for AWS customers, at least one a month and usually two or three full days each. The demand has been steady, and teams keep lining up.

AI-DLC stands for the **AI-Driven Development Life Cycle**, a methodology for building software with AI as a central collaborator across the entire product and software development lifecycle. In these workshops we do not just talk about it. Teams bring real projects, greenfield and brownfield, and we work through requirements, architecture, code, and operations together with agentic AI tools. We have helped customers deliver hundreds of use cases in days instead of months.

Yes, the speed is real. Teams ship in days instead of months. But, to me, the more interesting story is the cultural shift happening inside organizations as they rethink how product managers, architects, and engineers work together, which rituals still earn their place, and which tools actually belong in the loop. This post walks through what that looks like in practice: the vocabulary, the lifecycle phases, the shifting roles, the tooling choices, and where spec driven development fits in.

## The problem with bolting AI onto the old process

In the couple of years since agentic coding tools showed up, most teams I have worked with still treat AI as a faster autocomplete, using it for code completion in the IDE, explaining errors in a chat window, or for quickly generating function definitions and unit tests. On the other end you have **vibe coding**, where you describe what you want in plain language and let the agent iterate until something feels right. Both can be genuinely useful, and I have done plenty of each myself, but neither really changes how software gets built. Product managers still write requirements in Confluence, engineers still break work into Jira tickets, architects still draw boxes in Lucidchart, and developers still branch off main, open pull requests, and wait for review.

That whole model was designed for humans doing human paced work, with sprint planning, backlog grooming, design reviews, and the usual rituals that stretch from idea to shipped feature over weeks or months. When you drop a capable agent into that same process without changing anything else, something weird happens: the agent can generate a requirements document in minutes, propose an architecture, and write thousands of lines of code, but if nobody has validated what it should actually build, you end up with velocity over fidelity.

The [AWS DevOps blog post on AI-DLC](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/) describes this tension well. AI assisted development, where AI acts as a helper, and AI autonomous development, where AI is expected to build the whole thing from a prompt, both fall short on their own. What we need is a new lifecycle where AI is a central collaborator, not a sidecar and not an oracle.

## What is AI-DLC?

AI-DLC is a methodology for building software with AI as a first class participant in every phase, built around a simple loop: **the AI creates a plan, asks clarifying questions, waits for human validation, then executes**. That pattern repeats for every activity in the lifecycle.

Two dimensions make it work in practice. First, **AI powered execution with human oversight**, where the agent does the heavy lifting of drafting requirements, writing code, and generating tests, but defers critical decisions to humans who understand business context. Second, **dynamic team collaboration**, where instead of everyone working in isolation on their piece, the team comes together for rapid validation. We call this "Mob Elaboration" during planning and "Mob Construction" during building.

The methodology is organized into three phases:

```
INCEPTION       →  What and why (planning, requirements, architecture)
CONSTRUCTION    →  How (design, code, tests)
OPERATIONS      →  Deploy and run (infrastructure, monitoring)
```

Each phase feeds context into the next, and artifacts like requirements, design docs, and plans are stored in the project repository so work can continue across sessions. That persistence matters because agents forget and files do not.

The open source rules for all of this live in the [awslabs/aidlc-workflows](https://github.com/awslabs/aidlc-workflows) repository, and you can drop them into tools like [Kiro](https://kiro.dev/), Cursor, or Claude Code so the agent follows the workflow.

## Inception: turning intent into something buildable

The Inception phase is where business intent becomes structured, validated work, and it tends to be the phase product people and architects care about most.

### Workspace Detection

Every AI-DLC engagement starts by figuring out what you are working with: whether this is a greenfield project or a brownfield codebase, what documentation already exists, and whether there are prior AI-DLC artifacts from a previous session. The agent scans the workspace and decides what comes next.

I have been running AI-DLC on this very blog (yes, the one you are reading). I wired up the workflow in [PR #74](https://github.com/micahwalter/micahwalter-www/pull/74), then ran a full brownfield examination in [PR #75](https://github.com/micahwalter/micahwalter-www/pull/75), where the agent detected a brownfield Next.js project, ran reverse engineering to document the architecture, and established a living docs folder at `aidlc-docs/` for ongoing work. That baseline means every future session starts with context instead of cold.

### Reverse Engineering (brownfield only)

When you have an existing codebase, the agent analyzes it before planning changes and produces artifacts like a business overview, architecture documentation, component inventory, API docs, and technology stack analysis. This is essentially the agent doing what would take a new engineer weeks of reading code.

### Requirements Analysis

This is where the agent takes your request, whether that is "add a newsletter signup form" or "migrate from [AWS Lambda](https://aws.amazon.com/lambda/) to containers," and turns it into structured requirements. Depth varies by complexity, from **minimal** for simple clear requests, to **standard** for normal feature work, to **comprehensive** for high risk or ambiguous changes. The agent asks clarifying questions in a structured format with multiple choice and an "other" option, and waits for your answers before proceeding rather than guessing.

### User Stories

When the work affects users or has multiple scenarios, the agent creates user stories with acceptance criteria and personas, though this stage is conditional since a bug fix might skip it while a new checkout flow would not. In the traditional world, user stories live in Jira, and many of our customers still prefer it that way. In workshops I have seen teams use MCP servers to connect their Jira instances directly to AI-DLC, so stories get drafted, reviewed, and approved inside the workflow without forcing everyone to abandon their existing tooling. The product manager role shifts either way, from writing stories from scratch in a ticket tracker to reviewing and approving stories the agent drafts, whether those artifacts live in the repo as markdown or sync back to Jira.

### Workflow Planning

Before any code gets written, the agent creates an execution plan describing which stages to run, in what order, and at what depth. This is adaptive: a one line bug fix might go straight from requirements to code generation, while a new microservice gets the full treatment with application design, unit decomposition, non-functional requirements (NFR) analysis, and infrastructure design.

### Application Design and Units of Work

For larger changes, the agent identifies components, services, methods, and business rules, then decomposes the work into **units of work** that replace the traditional "epic" concept. A unit might be a single deployable service or a logical module within a monolith. AI-DLC also replaces "sprints" with **bolts**, shorter and more intense cycles measured in hours or days rather than weeks, and the terminology reflects that speed change.

## Construction: from design to working code

Once Inception artifacts are validated, Construction begins. This is where engineers traditionally spend most of their time, and it is where agents are most visibly powerful.

### Per unit design stages (conditional)

For each unit of work, the agent may run additional design stages covering **functional design** (business logic, data models, business rules), **NFR requirements** (non-functional requirements like performance, security, and scalability), **NFR design** (patterns for meeting those requirements), and **infrastructure design** (mapping to actual cloud resources like [Amazon Elastic Container Service (ECS)](https://aws.amazon.com/ecs/), Lambda, or [Amazon DynamoDB](https://aws.amazon.com/dynamodb/)). These stages are conditional, since a CSS tweak does not need infrastructure design but a new API endpoint with auth and rate limiting does.

### Code Generation

This stage always runs in two parts: first the agent creates a detailed implementation plan with checkboxes, then it executes that plan by writing code and tests. The planning step matters because without it you get undirected code dumps, and with it you get traceable implementation that maps back to requirements and design artifacts.

### Build and Test

After all units are complete, the agent generates build instructions along with unit and integration test instructions. This is where you confirm the work actually compiles, passes tests, and holds together before anyone calls it done.

One thing I like about AI-DLC is that the framework is moldable. In workshops I often introduce test driven development, where the agent writes tests first and implementation second, and the workflow adapts to that preference rather than forcing a single approach. You can tune the rules to match how your team already works, whether that means strict TDD, tests after code, or something in between. On this blog the bar is simpler since there is no test runner configured and `npm run build` is the primary correctness signal, but the stage still matters for the same reason: generated code is not finished until something validates it.

## Operations: where the story is still being written

The Operations phase is a placeholder in the current AI-DLC spec, but the intent is clear: the agent should eventually manage infrastructure as code, deployments, monitoring, and incident response using all the context accumulated during Inception and Construction. New tools and agents are already pointing in that direction. [AWS DevOps Agent](https://aws.amazon.com/devops-agent/) spans release management and production operations, from reviewing release readiness to investigating incidents and recommending fixes. [AWS Transform](https://aws.amazon.com/transform/) is taking on a different slice of the same problem: continuous modernization across large code portfolios. I recently wrote about [AWS Transform continuous modernization on the AWS News Blog](https://aws.amazon.com/blogs/aws/proactively-reduce-tech-debt-autonomously-with-aws-transform-continuous-modernization-preview/), where the idea is to add an observability and orchestration layer that watches production codebases over time, surfaces tech debt as it appears, prioritizes what matters, and autonomously opens pull requests to fix it. Instead of periodic modernization sprints that never quite keep up, you get a steady loop of detect, prioritize, remediate, and verify. I think about this as the phase where the agent stops being a developer and starts being an operator, proposing [AWS CloudFormation](https://aws.amazon.com/cloudformation/) changes, running deploys, and setting up alarms, always with human oversight but doing the tedious sequencing work that eats ops time.

## Spec driven development and how it relates

If AI-DLC is the lifecycle, **spec driven development** is one way to structure the artifacts within it, and Kiro, Amazon's agentic IDE, has a particularly well defined take on this. A Kiro spec produces three files for every feature:

| File | Purpose |
|------|---------|
| `requirements.md` | User stories and acceptance criteria |
| `design.md` | Architecture, sequence diagrams, error handling |
| `tasks.md` | Discrete, trackable implementation tasks |

The workflow moves through Requirements, Design, and Tasks, with approval gates at each phase so the agent does not skip ahead without human sign off. Kiro also supports **bugfix specs** with a parallel structure focused on root cause analysis instead of user stories, and a **Quick Plan** mode for well understood features where all three artifacts generate in one pass.

The relationship to AI-DLC is straightforward: Kiro specs are the artifact format, and AI-DLC is the lifecycle that tells you when to create them, what comes before and after, and how they connect to code generation and testing. You can read more in the [Kiro specs documentation](https://kiro.dev/docs/specs/).

### Specs vs vibe coding

Kiro draws a useful line between the two modes. Use specs when building complex features, fixing costly bugs, collaborating with a team, or when requirements need iteration. Use vibe coding when prototyping, exploring, or when you do not yet know what you want. I have been guilty of vibe coding far too often, and it is fun and fast until you need to come back to the code a week later and have no idea what the agent was thinking.

## The roles: who does what in an agentic world

Lately there has been no shortage of talk about roles collapsing, junior developers being cut in favor of agents, and whole job categories simply disappearing. A framing I find useful comes from [Matt Pocock](https://www.youtube.com/watch?v=nQwJVHCtDDY&t=1428s), who draws a line between **tactical** and **strategic** programming. Tactical work is the day to day writing of code, fixing bugs, and landing commits. Strategic work is the longer view: how the codebase should be shaped, how modules connect, how you scope work, and how you delegate effectively. His argument, and one I hear echoed constantly in workshops, is that agents are very good at tactical programming and getting better fast, which pushes humans toward strategic work. That does not mean roles vanish. It means they move up the stack.

### Product Manager / Product Owner

The PM still owns the "what" and "why," but instead of writing PRDs in Confluence and grooming a Jira backlog, they review and approve requirements and user stories that the agent drafts, answer clarifying questions, and validate that what the agent understood matches business intent. The Jira backlog might still exist for tracking, but the source of truth for a given piece of work lives in the repo as markdown artifacts. I have been following [Hannah Stulberg's Substack, In the Weeds](https://hannahstulberg.substack.com/), which is full of tips, resources, and opinions on how the life of a product manager is changing fast, and her core argument keeps landing with me: PMs who want to stay relevant need to learn Claude Code and Git, not because they are becoming engineers, but because the work is moving closer to the codebase.

### Architect

The architect still owns structural decisions around which services to create, how components communicate, and what the deployment model looks like, reviewing application design and infrastructure design artifacts while the agent proposes and the architect approves or redirects. In practice I have found the architect role merging with the senior engineer role.

### Engineer / Developer

The engineer still owns implementation quality, but the job shifts from typing code to reviewing code, validating plans, running builds, and making judgment calls the agent cannot make. They approve code generation plans, review diffs, and decide when something is good enough to merge. This is the shift the AWS blog describes as moving from routine coding to critical problem solving, and I felt it acutely during my [Mastodon server upgrade with Claude](/posts/notes-on-upgrading-my-mastodon-server-in-about-an-hour-with-claude), where I was not typing commands so much as approving sequences and watching for things that looked wrong.

### QA / Test Engineer

The agent generates test instructions and test code, but someone still needs to validate that the tests cover the right scenarios. In AI-DLC, this role is less about writing test cases and more about reviewing test plans and ensuring edge cases are covered.

### DevOps / SRE

This role owns the Operations phase, reviewing infrastructure designs, approving deployment plans, and validating monitoring and alerting. As the Operations phase matures, it will increasingly involve reviewing agent proposed infrastructure changes rather than writing CloudFormation by hand. I predict this role follows the same tactical to strategic shift we are seeing elsewhere: less time writing templates and running deploy commands, more time deciding what the infrastructure should look like, how systems should fail safely, and whether what the agent proposed actually matches production reality.

## Git workflows in an agentic world

Agents need somewhere to work, which means thinking carefully about Git. But the bigger change happening here is cultural. Product owners, product managers, and other personas who never lived in the repo are starting to treat it as the source of truth for documentation, not just code. Requirements, specs, and design artifacts live alongside the application in version control, and the branch, pull request, and merge workflow is extending into how those people think about getting work done. Draft on a branch, review in a PR, merge when approved. That is why Hannah's perspective feels so important right now. It is not just that PMs should learn Git as a technical skill. It is that the entire product development loop is moving into the same workflow engineers have used for years.

### Branching

Every piece of agent work should happen on a branch. This blog post was written on a branch called `cursor/ai-dlc-blog-post-b0c6`, where the agent creates the branch, makes commits, and opens a pull request while main stays clean. Branch naming conventions matter when agents are creating branches autonomously, and a predictable pattern like `cursor/<description>-<id>` makes it easy to see what the agent was working on.

### Pull Requests

PRs become the primary review surface, where instead of reviewing code line by line in an IDE you review the agent's PR along with the commit messages and ideally the linked artifacts (requirements, design, tasks) that explain why the changes exist. And the review itself is increasingly agent assisted. PR review agents are proliferating, and I have seen teams in workshops build their own as a use case. Off the shelf options include [Cursor Bugbot](https://cursor.com/bugbot), [CodeRabbit](https://coderabbit.ai/), and [GitHub Copilot code review](https://docs.github.com/en/copilot/using-github-copilot/code-review/using-copilot-code-review), each taking a pass at the diff before a human ever looks at it. The human review still matters, especially for judgment calls about business intent and architectural fit, but the first line of defense is often another agent.

### Forking

Forking is less relevant for solo or small team work on a single repo, but it matters when agents work across organizational boundaries or when you want isolation between experimental agent runs and production code.

### Worktrees

This is the one I find most interesting. [Git worktrees](https://git-scm.com/docs/git-worktree) let you check out multiple branches simultaneously in separate directories, which for agentic development means you can have one agent working on a feature in one worktree while you review its previous PR in another, without stashing or switching branches. [Cursor](https://cursor.com/docs/configuration/worktrees) already uses worktrees under the hood for parallel agents and best of N runs, and a growing list of agentic tools are heading the same direction. I can see a future where multiple agents or multiple sessions work in parallel worktrees on different units of work, each with its own set of AI-DLC artifacts.

### Where this leaves Jira and Confluence

I do not think Jira and Confluence go away, because they serve different purposes. **Confluence** (or Notion, or whatever your team uses) is still where high level product vision, roadmaps, and cross team communication live, and AI-DLC artifacts are not a replacement for your company wiki but rather the implementation level specs that feed into code. **Jira** (or Linear, or GitHub Issues) is still where you track work status, assign owners, and manage priorities across the team. On this blog, [GitHub Issues is the backlog](https://github.com/micahwalter/micahwalter-www/issues), and I have modified my personal AI-DLC workflow to use it that way explicitly. The rules live in [`aidlc-docs/workflow-conventions.md`](https://github.com/micahwalter/micahwalter-www/blob/main/aidlc-docs/workflow-conventions.md), which supplements the generic AI-DLC rules in the repo and defines how agents should reference issues by number, pull context from GitHub when scoping work, and avoid duplicating the backlog in markdown. AI-DLC docs reference issues but do not replace them.

The shift is that detailed specs, designs, and plans move from Jira and Confluence into the repo, versioned alongside the code they describe, so traceability improves because you can follow a line from a requirement to a design decision to a line of code to a test, all in git history.

## What I have been doing with all of this

I recently wired AI-DLC into this blog repo, where the agent reverse engineered the codebase, produced architecture docs, and established conventions for how artifacts relate to [GitHub Issues](https://github.com/micahwalter/micahwalter-www/issues). But this blog is just one place I use it. At work, as a Customer Development Engineer, I use AI-DLC to build demos for customers and to co-build directly in their non prod environments, sitting alongside their teams and working through the same Inception and Construction phases in real codebases with real constraints. I use it on personal projects and experiments too.

I also swap between agents constantly: Claude Code, Cursor, Codex, Kiro, and whatever else is new this week. Partly that is practical, since different customers and projects have different tooling preferences, but mostly I do it because I want to stay current on the state of the art and see how each harness handles the same workflow differently. The AI-DLC rules travel with the repo, so the lifecycle stays consistent even when the agent changes.

It is not perfect. The Operations phase is still a placeholder, some stages feel heavy for small changes, and I still catch myself vibe coding when I should be writing a spec first. But the direction feels right, and I am using it enough across enough contexts now to trust that it is not just a workshop trick.

## The mental model that stuck with me

The pattern is this:

```
Plan → Ask → Validate → Execute → Repeat
```

The AI plans and asks questions, the human validates, the AI executes, and then the cycle starts again for the next stage. That is the opposite of "prompt and pray," where you describe what you want and hope the model figures it out, and it is also the opposite of traditional waterfall, where humans plan for weeks before anyone writes code. It is something in between: fast enough that you can iterate in hours, structured enough that you build the right thing, and human enough that critical decisions still belong to people who understand the business.

If you want to go deeper, start with the [AI-DLC workflows repository](https://github.com/awslabs/aidlc-workflows), read the [AWS blog post](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/), and try the [Kiro specs workflow](https://kiro.dev/docs/specs/) on a real feature. Or watch the [livestream I did with Riya Dani](https://www.youtube.com/watch?v=5kUb_IZdlB8), where we walked through an intro to AI-DLC in about an hour on our show, covering workspace detection, requirements analysis, and the Plan → Ask → Validate → Execute loop in real time. The best way to understand this stuff is to run it on something you actually care about.

More notes to come as I keep exploring.
