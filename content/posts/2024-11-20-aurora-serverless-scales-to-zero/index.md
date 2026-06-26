---
id: 54
title: "Aurora Serverless Scales to Zero"
publishedAt: "2024-11-20"
excerpt: "Introducing scaling to 0 capacity with Amazon Aurora Serverless v2..."
category: "AWS"
tags:
  - "aws"
  - "database"
  - "serverless"
draft: false
# WordPress ID: 78698
# Original URL: https://www.micahwalter.com/2024/11/aurora-serverless-scales-to-zero/
---

Introducing scaling to 0 capacity with Amazon Aurora Serverless v2

[https://aws.amazon.com/blogs/database/introducing-scaling-to-0-capacity-with-amazon-aurora-serverless-v2/](https://aws.amazon.com/blogs/database/introducing-scaling-to-0-capacity-with-amazon-aurora-serverless-v2/)

This is a really nice launch and makes me think I’ll be reaching for Aurora more often in the near future.

> With 0 ACUs, Aurora Serverless v2 DB instances can automatically pause after a period of inactivity. Aurora pauses an Aurora Serverless v2 instance if it doesn’t have connections initiated by user activity within the speciﬁed time period. For the paused duration, there are no charges for compute as the database is at 0 ACUs.