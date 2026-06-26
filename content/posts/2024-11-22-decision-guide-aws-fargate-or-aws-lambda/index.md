---
id: 62
title: "Decision Guide: AWS Fargate or AWS Lambda?"
publishedAt: "2024-11-22"
excerpt: "AWS Fargate or AWS Lambda? https://docs.aws.amazon.com/decision-guides/latest/fargate-or-lambda/fargate-or-lambda.html There is a new and very useful decision..."
category: "AWS"
tags:
  - "aws"
  - "compute"
  - "containers"
  - "fargate"
  - "Lambda"
  - "serverless"
draft: false
# WordPress ID: 78753
# Original URL: https://www.micahwalter.com/2024/11/decision-guide-aws-fargate-or-aws-lambda/
---

AWS Fargate or AWS Lambda?

[https://docs.aws.amazon.com/decision-guides/latest/fargate-or-lambda/fargate-or-lambda.html](https://docs.aws.amazon.com/decision-guides/latest/fargate-or-lambda/fargate-or-lambda.html)

There is a new and very useful decision making guide for those wondering if AWS Fargate or AWS Lambda is the right kind of compute. It's very thorough and well organized.

Coincidentally, I was just having a discussion about this very topic with a customer yesterday. It's always surprising to me what kinds of factors influence decisions like these. Popularity of a particular tech stack vs. simplicity and user experience are big ones. But, things like confusion around [package size limits](https://www.micahwalter.com/2024/01/lambda-package-size-limits/) or potential edge case scaling issues once "we get tons of traffic" are the kind of thinking that very often lead us down a weird road.

Hopefully this guide will help customers make sound decisions at the right moments in their dev cycles.