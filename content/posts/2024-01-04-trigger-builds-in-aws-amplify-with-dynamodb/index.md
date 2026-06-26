---
id: 40
title: "Trigger builds in AWS Amplify with DynamoDB"
publishedAt: "2024-01-04"
excerpt: "I'm building a thing. I'll write more about that thing in the near future. But, in the meantime, I thought I'd write a little about one small other thing I..."
category: "Writing"
coverImage: "./cover.jpg"
tags:
  - "Amplify"
  - "aws"
  - "DynamoDB"
  - "Lambda"
  - "SAM"
  - "TIL"
draft: false
# WordPress ID: 850
# Original URL: https://www.micahwalter.com/2024/01/trigger-builds-in-aws-amplify-with-dynamodb/
---

I'm building a thing. I'll write more about that thing in the near future. But, in the meantime, I thought I'd write a little about one small other thing I learned along the way.

The thing I am building has two main components.

1.  A back-end workflow that uses [AWS Step Functions](https://aws.amazon.com/step-functions/) to periodically orchestrate fetching and processing some data before storing it in an [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) table.
2.  A front-end website built using [Next.js](https://nextjs.org/) that displays the data as a static website, hosted on [AWS Amplify](https://aws.amazon.com/amplify/).

The front-end needs to be rebuilt whenever there is new data to display. With AWS Amplify, you can easily create a [Webhook](https://docs.aws.amazon.com/amplify/latest/userguide/webhooks.html) to invoke a new build. Here's how it works.

In my SAM template, I configure DynamoDB streams like this:

Then I need an AWS Lambda function to trigger off the DynamoDB stream. It's defined in my SAM template like this:

The function code itself is super simple. It just makes a POST request to the Webhook.

There is one little trick I am doing here you may have noticed. I am storing the Amplify Webhook URL in [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html) and setting it as an environmental variable in my Lambda function. This way I don't have to hard-code anything into my SAM template.

`AMPLIFY_WEBHOOK_URL: '{{resolve:ssm:/new-thing/amplify-webhook-url:1}}'`

Now, whenever my State Machine runs, it updates DynamoDB, which triggers a Lambda, which tells Amplify to rebuild the site. Yay!