---
type: email
id: 142
title: "What I've been thinking about — March 2026"
publishedAt: "2026-03-08"
excerpt: "A test issue: AI agents, infrastructure as code, and a few links worth your time."
draft: true
---

Hi there,

Welcome to the first issue of this newsletter. I've been meaning to get this going for a while, and today felt like the right day to pull the trigger on sending something out.

Here's what's been on my mind lately.

---

## AI agents are getting real

I've spent a lot of time over the past few months working with AI coding assistants — not just for autocomplete, but for actual end-to-end tasks. The thing that's surprised me most isn't the capability, it's the *workflow shift*. The question has changed from "can it do this?" to "how do I structure the work so it can do this well?"

The biggest unlock for me has been keeping context tight. Smaller, well-scoped tasks with clear inputs and outputs work dramatically better than "here's the whole codebase, fix everything." That's probably obvious in retrospect, but it took me a while to internalize it.

---

## Infrastructure as code, actually

I've been doing a deep dive into CloudFormation for this site's infrastructure — API Gateway, Lambda, DynamoDB, EventBridge, SQS. The thing I keep coming back to is that the *writing* of the template is the easy part. The hard part is the mental model: understanding the dependency graph, knowing which resources need to exist before others, and debugging the cryptic rollback messages when something goes wrong.

One trick that's helped: treat your CloudFormation templates like code. They get reviewed, they get commented, they don't drift from what's actually deployed.

---

## A few links

- **[The Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html)** — Rich Sutton's 2019 essay on how general methods that leverage computation always win in the long run. Still the most important thing I've read about AI.

- **[Writing for Developers](https://rmoff.net/2023/07/19/blog-post-structure-and-readability/)** — Good practical advice on structuring technical writing. I've been trying to apply this to my own posts.

- **[The Age of Surveillance Capitalism](https://www.goodreads.com/book/show/26195941-the-age-of-surveillance-capitalism)** — I'm about halfway through. Dense but important.

---

That's it for this one. I'm planning to send these roughly monthly — no fixed schedule, just when I have something worth saying.

— Micah
