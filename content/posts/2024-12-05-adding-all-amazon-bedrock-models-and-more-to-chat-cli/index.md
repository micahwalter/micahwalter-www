---
id: 79
title: "Adding ALL Amazon Bedrock models and more to Chat-CLI"
publishedAt: "2024-12-05"
excerpt: "Earlier I wrote about updating my Chat-CLI project to support the latest Amazon Nova models. It occurred to me by the end of writing that post that I needed to..."
category: "AI"
coverImage: "./cover.png"
tags:
  - "ai"
  - "amazon-bedrock"
  - "aws"
  - "chat-cli"
  - "genai"
  - "go"
  - "nova"
draft: false
# WordPress ID: 78816
# Original URL: https://www.micahwalter.com/2024/12/adding-all-amazon-bedrock-models-and-more-to-chat-cli/
---

Earlier I [wrote about updating my Chat-CLI](https://www.micahwalter.com/2024/12/adding-amazon-nova-models-to-chat-cli/) project to support the latest [Amazon Nova](https://aws.amazon.com/ai/generative-ai/nova/) models. It occurred to me by the end of writing that post that I needed to rethink my code a little to be able to support any model, without the need to update the code at all.

I've done this. Chat-CLI can now use any model in Amazon Bedrock without the need for code updates. This means, as soon as a new model is available (and you enable access to it) you can use the model in Chat-CLI. This includes the all new [Amazon Nova Canvas](https://aws.amazon.com/ai/generative-ai/nova/creative/) image generator as well (which is what I used to generate the image for this blog post)!

Additionally I added a `models list` command so you can get a list of all the currently supported models in your region. This makes it pretty easy to grab a model-id and go.

There are of course a few caveats to work out later.

1.  I removed the "family name" idea which let you use a short version of the model. This would previously select the cheapest model from a family of similar models like Claude Haiku vs. Claude Sonnet. This feature is gone for now, but it may return at some point.
2.  The models list command returns the full list. There are models in there that wont work out of the box as they require provisioned throughput. You will get an error message saying so if you try to use one of them. I may add some flags or filtering for this list in the future.
3.  I've changed the default models for each command based on personal preferences for now. The `--help` flag will let you know which model is the default.
4.  I believe (have not yet tested this) you can substitute a model ARN for the model-id. This means you can use cross-region inference models, and over 100 models via the new Marketplace that was announced today. Like I said, not yet tested, but in theory this should work.

To update, if you are using Homebrew, just do the following:

```
$ brew update
$ brew upgrade
```