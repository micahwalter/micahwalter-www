---
id: 28
title: "How much I’ve spent so far running my own Mastodon server on AWS"
publishedAt: "2022-12-21"
excerpt: "📖 You can read more of my posts on running your own Mastodon server right here: https://www.micahwalter.com/tag/mastodon/ I’ve been running my own single-user..."
category: "Writing"
coverImage: "./cover.jpeg"
tags:
  - "aws"
  - "Mastodon"
  - "TIL"
draft: false
# WordPress ID: 550
# Original URL: https://www.micahwalter.com/2022/12/how-much-ive-spent-so-far-running-my-own-mastodon-server-on-aws/
---

📖

You can read more of my posts on running your own Mastodon server right here: [https://www.micahwalter.com/tag/mastodon/](https://www.micahwalter.com/tag/mastodon/)

I’ve been running my own single-user Mastodon server on AWS for about a month. Yesterday I [took a poll](https://micah.social/@micah/109546880093833597) to find out what would be most interesting to write about. I will abide by this poll and write about how much running my own single-user Mastodon server has cost me so far.

**Disclaimers and such:**

I need to preface this post by saying a few things. First and foremost, I work for AWS as a Solutions Architect. But, this is a personal project of mine, ran on my own personal AWS account, which I pay for, without any employee discounts or special considerations. All of my ideas and views in creating this project have been my own, and don’t necessarily reflect all of the best practices or prescriptive guidances you’ll hear from my employer.

Also, I started this project to accomplish a few things. First, I really just wanted to learn about Mastodon and how to set up and manage a small, single-user instance on my own. This is not meant to be a guide for running a server in a production environment for thousands of users. It’s just a hobby of mine. That said, I know there are lots of others out there who are interested in doing this same kind of thing, so I hope you’ll find this information useful.

Lastly, there are a few hosting providers out there who will get you all set up and running your own Mastodon server for a simple fee. This is not that. This is going to be a complex, messy experiment, where I will attempt to keep my own lights on and wiggle and change course whenever I see fit. If you want to run your own server, those hosting providers are probably a better place to get started!

### Architecture

I’ve already written a [few posts](https://www.micahwalter.com/tag/mastodon/) on the process of getting things up and running and why I chose the architecture I wound up with. A few things have changed since then, but for the most part, the architecture is still the same.

1.  For compute – a single Elastic Compute Cloud (EC2) `t4g.small` instance running Mastodon, it’s PostgresSQL database, and Redis.
2.  For storage – I’ve since moved all the static image assets to Amazon Simple Storage Service (S3) and have been using Amazon CloudFront to serve them.
3.  I’m using several other minor services all within AWS for monitoring, examining my bill, and backups.

### Costs to date

As of this writing, I’ve spent $52.74 on this project. As you can see in the chart below, $32 of this was spent on the first day for the registration of my domain name [micah.social](https://micah.social). This was a little expensive for a domain name in my opinion, but I really wanted it, so I splurged.

![](https://www.micahwalter.com/content/images/2022/12/Screen-Shot-2022-12-21-at-9.15.29-AM.png)

If we remove the Registrar fee (which I will have to pay annually) you can see I’ve spent $20.74 on additional AWS services outside any Free Tier or Free Trials.

![](https://www.micahwalter.com/content/images/2022/12/Screen-Shot-2022-12-21-at-9.16.32-AM.png)

### No compute cost until 2024

It’s important to point out here that I have yet to spend anything on compute. Well, that’s not entirely true. You can see a little blip on day one for compute, where I was tinkering with a different instance type, but overall, I haven’t seen any costs for compute. This is because the instance type I chose, the [Graviton2 ARM based t4g.small](https://aws.amazon.com/ec2/instance-types/t4/), comes with a [free trial until the end of 2023](https://aws.amazon.com/ec2/faqs/#t4g-instances) for up to 750 hours per month. This means that when the ball drops on 2023, I will start incurring hourly costs for my instance. When that happens, here are my options:

1.  I could begin paying the On-Demand hourly rate of $0.0168 / hour or about $12.26 per month
2.  I could purchase a [Compute or EC2 Instance Savings Plan](https://aws.amazon.com/savingsplans/). This is what I will likely do. A 3 year, All Up-Front EC2 Instance Savings Plan is $165.56, which equates to $4.60 per month and allows me to use it against another instance type within the same family if I choose to upgrade to t4g.medium.

### CloudWatch Costs, oops!

![](https://www.micahwalter.com/content/images/2022/12/Screen-Shot-2022-12-21-at-9.17.14-AM.png)

You’ll likely notice a spike of costs on the middle of the above chart. In my [post on monitoring](https://www.micahwalter.com/notes-on-configuring-amazon-cloudwatch-to-monitor-my-mastodon-server/), I mentioned I had installed the Amazon CloudWatch Agent on the instance in order to monitor a few key metrics. However, I failed to filter out all the metrics I didn’t care about and wound up sending the full suite of data back to CloudWatch, which got quite expensive. Once I realized this, I just turned off the agent. When I get around to it, I’ll go back and add the correct filter config.

### EBS Snapshots

![](https://www.micahwalter.com/content/images/2022/12/Screen-Shot-2022-12-21-at-9.18.23-AM.png)

OK, here is a zoomed in chart showing the cost of my EBS Snapshot storage. This has been growing over the course of the month but I expect it to level off based on my backup schedule.

When I started this project, I was looking for a simple way to backup the data on my EC2 instance. I wanted something easy to set up and manage and so I chose to just go with EBS Snapshots. I’m aware there are other, potentially cheaper ways to do this. I was mostly concerned with creating backups for the data stored on PostgresSQL. All the static assets are now stored in S3, so it’s really just the codebase, config and database on the server itself.

But, my snapshot schedule is probably a little overkill for this project. I’m currently running snapshots every hour, every day, and every month. The hourly snapshots recycle after 24 hours, the dailies after 30 days and the monthlies stick around for 2 years. Also, I am backing up the entire volume, and even with incremental backups, this can add up pretty quickly with data that I probably don’t need to worry about.

A better approach might be to just do backups of the PostgresSQL database itself on a similar schedule, with proper database locking, but that’s a project for another day.

### The S3 Elephant

![](https://www.micahwalter.com/content/images/2022/12/Screen-Shot-2022-12-21-at-9.19.02-AM.png)

The most significant cost for the project, next to the EBS Snapshots at the moment, is S3. It’s also the most complex to figure out, but I’ll do my best!

Here’s some notes on my S3 setup:

1.  Mastodon not only stores your own uploaded static assets, but also all the assets for all the accounts and tags you follow. It’s not entirely clear to me when it decides to make a copy of these, but it is easily the source of the most data being stored.
2.  There are settings in the Mastodon preferences to prune these cache’d assets, but I haven’t done this yet as I’ve been curious at first to just see how much data we are talking about. So far its close to 180GB.
3.  For the storage itself, Mastodon uploads assets using the S3 Standard tier. I have not seen a way to change this, but I did [file an issue](https://github.com/mastodon/mastodon/issues/22159) suggesting it would be a nice feature to allow this in the config. This would allow me to upload assets directly to [Intelligent-Tiering](https://aws.amazon.com/s3/storage-classes/intelligent-tiering/), which to me makes more sense.
4.  I’ve set up a [Lifecycle Policy](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html) to move all my data over to S3 Intelligent Tiering after a day. This is a little controversial, and I am going to have to wait and see how it turns out. S3 Intelligent-Tiering should automatically move my data from one tier to another based on access patterns. However, it doesn’t cover objects smaller than 128K, and it comes with a small data monitoring fee. It will take a few months to see if this is paying off.
5.  The hidden cost of storing data for Mastodon on S3 is the Requests. There are so many requests! I’m seeing about 40-50K requests per day! The requests are mainly PUT requests with less than 2,000 GET requests per day. This was surprising to me at first, but it sort of makes sense now that I understand how Mastodon works. I think it has a lot to do with the [Relay](https://joinfediverse.wiki/index.php?title=Fediverse_relays) I set up, and the number of accounts and tags I follow, but it’s definitely something to keep and eye on and learn more about. For now, I’ve set up [Amazon S3 Storage Lens](https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage_lens.html) with the advanced configuration, which lets me easily inspect the Activity aspects of my data on S3.

Overall my storage spend on S3 for the first 30 days has been about $9. This is a little more than I anticipated, and I think there are certainly some levers to pull in the months ahead to keep that cost down. I’m serving all my assets via [Amazon CloudFront](https://aws.amazon.com/cloudfront/), which has a [generous Free Tier](https://aws.amazon.com/blogs/aws/aws-free-tier-data-transfer-expansion-100-gb-from-regions-and-1-tb-from-amazon-cloudfront-per-month/) and is not costing me a thing so far.

### Budgets and surprise bills

Going forward I plan to keep things in check using [AWS Budgets](https://aws.amazon.com/aws-cost-management/aws-budgets/).

![](https://www.micahwalter.com/content/images/2022/12/Screen-Shot-2022-12-21-at-11.03.29-AM.png)

If you are running your own Mastodon server on AWS (or really anything at all on AWS) do yourself a favor and head over to AWS Budgets and set one up for yourself. You can set up various thresholds to alert you via email if you exceed your budget throughout the month. Mine is pretty simple. I set up a $50 per month budget with an alert at 50% ($25) so that as soon as I exceed $25 I’ll get an email alert.

This is actually a bit more generous than I’d like. Ideally, and for the next year while I’m still on the Free Trial for my server, I’d like to see the costs come in at less than $20 per month. I can do this by pruning my S3 storage, and reducing or re-thinking the EBS Snapshots I mentioned above. But, I’m gonna keep things as is for a few months so I can get more data to look at before making any more changes.

In an ideal world, running all of this as is would be nice if it cost me less than $25 a month overall. That’s not much more than Twitter Blue!

📖

You can read more of my posts on running your own Mastodon server right here: [https://www.micahwalter.com/tag/mastodon/](https://www.micahwalter.com/tag/mastodon/)