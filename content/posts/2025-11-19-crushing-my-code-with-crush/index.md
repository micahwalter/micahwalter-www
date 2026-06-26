---
id: 141
title: "Crushing my code with Crush"
publishedAt: "2026-02-17"
excerpt: "I've been following the folks at Charm for a while now. If you're not familiar with them, they make some of the most beautiful terminal applications and..."
category: "AI"
tags: ["chat-cli", "amazon-bedrock", "go", "ai-agents", "terminal"]
coverImage: "./cover.png"
draft: false
# WordPress ID: 79479
# Original URL: https://www.micahwalter.com/2025/11/crushing-my-code-with-crush/
---

I've been following the folks at [Charm](https://charm.sh/) for a while now. If you're not familiar with them, they make some of the most beautiful terminal applications and libraries I've ever seen. Their [Lip Gloss](https://github.com/charmbracelet/lipgloss) toolkit and [Bubble Tea](https://github.com/charmbracelet/bubbletea) TUI framework are the kind of tools that make you excited about building command-line interfaces again.

So when I stumbled across [Crush](https://github.com/charmbracelet/crush), their new "glamourous AI coding agent for your favourite terminal," I knew I had to try it out immediately. Not just because it looked interesting, but because it's essentially the exact vision I had for my own [Chat-CLI project](https://www.micahwalter.com/tag/chat-cli/).

## Working code always wins

I've spent the past several months experimenting with agentic coding tools. [Claude Code](https://www.claude.com/product/claude-code), Amazon Q Developer CLI (which recently became [Kiro CLI](https://kiro.dev/cli/)), and various other tools have all found their way into my workflow at different points. Each one offers something different—Claude Code's thoughtful planning, Q Developer's deep AWS integration, Kiro's spec-driven approach.

What's been fascinating is watching how these tools approach the same fundamental problem: how do you go from "I want to build X" to actually having working code? Some focus on autonomy, others on structure, and still others on speed. I've been trying them all, seeing which patterns stick and which feel like fighting against the tool.

Through all this experimentation, I kept coming back to my own Chat-CLI project. It started simple—just a way to chat with LLMs on Amazon Bedrock from the terminal. Over time, I added features: conversation history, support for multiple models, even image generator models. But, what I really wanted was something more interactive, more visual, more… terminal-native.

## A terminal in the cloud

Back in December, I wrote about [the future of Chat-CLI](https://www.micahwalter.com/2024/12/the-future-of-chat-cli/). I'd been thinking about evolving it from a simple command-line chat interface into something more sophisticated—specifically, a Terminal User Interface (TUI) built with Charm's libraries. I even mentioned being inspired by projects like [terminal.shop](https://www.terminal.shop/) and wanting to create a TUI where people could ssh to a server and chat with LLMs right away. Eventually I experimented with building a more agentic coding tool based on Chat-CLI, but … priorities.

Well, the Charm team went ahead and built exactly that. Except they didn't stop at just chat—they built a full-fledged AI coding agent that can understand your codebase, execute commands, modify files, and work alongside you in your development workflow.

## What I like about Crush

Crush is written in Go (just like Chat-CLI), which immediately caught my attention. There's something satisfying about Go for these kinds of tools—it's fast, produces single binary executables, and has excellent concurrency support.

But what really sets Crush apart is its flexibility with LLM providers. It supports a wide range of models including:

-   Anthropic's Claude through direct API or Amazon Bedrock
-   OpenAI models
-   Google Gemini
-   Local models via Ollama or LM Studio
-   Groq, Cerebras, OpenRouter, and more

This multi-model approach is something I spent a lot of time thinking about with Chat-CLI. The ability to switch between models mid-session while preserving context is exactly the kind of flexibility that makes a tool truly useful for everyday work.

Crush makes it really intuitive and simple to switch between "simple" and "complex" models like Claude Haiku vs. Claude Sonnet.

## The Amazon Bedrock connection

One of the things I'm most excited about is Crush's support for Anthropic models through [Amazon Bedrock](https://aws.amazon.com/bedrock/). This was my original motivation for building Chat-CLI—to have an easy way to access Bedrock models from the terminal. Crush takes this concept and runs with it, making it trivial to work with Claude through AWS.

Setting it up is straightforward if you already have AWS credentials configured:

```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1
```

Once that's done, Crush automatically detects Bedrock as an available provider, and you can start using Claude models right away. No complicated setup, no API wrappers to figure out—it just works.

## First Impressions

After installing Crush (via Homebrew, naturally), I fired it up and was immediately impressed by the interface. The TUI is clean, intuitive, and feels native to the terminal in a way that's hard to describe.

What really struck me was how Crush handles context. It can:

-   Use Language Server Protocols (LSPs) to understand your codebase
-   Access files and directories
-   Execute shell commands with your permission
-   Maintain multiple work sessions per project
-   Integrate with Model Context Protocol (MCP) servers

This is leagues beyond simple chat. Crush understands your development environment and can actively participate in your workflow.

## Agentic capabilities

The term "agentic" gets thrown around a lot these days, but Crush genuinely earns it. When I asked it to help me refactor some code, it:

1.  Asked to view the relevant files
2.  Analyzed the structure and identified improvement opportunities
3.  Proposed specific changes
4.  Showed me a diff before applying anything
5.  Made the edits cleanly

At each step, it asked for permission before taking action. You can configure which tools run automatically in your `.crush.json` config, or go full YOLO mode with the `--yolo` flag (though I'd recommend using that carefully).

## The Charm.sh magic

What makes Crush such a joy to use is the attention to detail that Charm brings to all their projects. The TUI is built on their Bubble Tea framework, and you can feel the polish in every interaction. Keyboard shortcuts are intuitive, the layout adapts beautifully to different terminal sizes, and the whole experience just feels _right_.

This is what I was imagining for Chat-CLI's evolution. The Charm libraries enable a level of user experience that's frankly hard to achieve with standard CLI tools. It's not just functional—it's genuinely pleasant to use.

## What this means for Chat-CLI

Seeing Crush in action—along with my experiences with Claude Code, Kiro, and the other agentic tools I've been trying—has me thinking about Chat-CLI's future. The project served its original purpose wonderfully—it helped me learn Go, let me explore Bedrock's capabilities, and became a useful teaching tool at work. But Crush represents a more mature vision of what a terminal-based LLM interface can be.

The landscape has shifted. We've moved from "chat with an LLM" to "collaborate with an AI agent on actual development work." Crush, Claude Code, and Kiro all demonstrate different approaches to this, but they're all pointing in the same direction: AI assistants that understand context, can take action, and integrate deeply into development workflows.

I don't see this as competition, though. Chat-CLI remains valuable as a teaching tool, and I'll continue to play with it as I evolve my understanding of Go and more.

But for actual development work—the kind where you need planning, execution, and iteration—Crush is pretty nice. The team at Charm has created something special, and I'm excited to keep using it and watching it evolve. I may even submit a PR or two.

## Try it yourself

If you're interested in trying Crush, installation is easy:

```bash
# Homebrew
brew install charmbracelet/tap/crush

# Or npm
npm install -g @charmland/crush
```

You'll need API keys for your preferred LLM provider, or AWS credentials if you want to use Bedrock. The [documentation](https://github.com/charmbracelet/crush) is excellent and covers all the configuration options.

Fair warning: as the README says, "Productivity may increase when using Crush and you may find yourself nerd sniped when first using the application." They're not kidding.

## Final thoughts

Sometimes you have a vision for something, and then someone else builds exactly that vision—but better than you could have imagined. That's what Crush feels like to me. It's the terminal AI assistant I wanted to build, executed with the level of polish and thoughtfulness that Charm brings to everything they do.

If you're doing any kind of development work and want an AI assistant that lives in your terminal, do yourself a favor and check out Crush. And if you're working with Amazon Bedrock specifically, you're in for a treat.

Now, if you'll excuse me, I have some code to refactor. With Crush's help, of course.
