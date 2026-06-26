---
id: 143
title: "Notes on upgrading my Mastodon server in about an hour with Claude"
publishedAt: "2026-04-20"
excerpt: "My single-user Mastodon server had drifted three years out of date. I opened Claude Code, pointed it at my AWS account, and asked it to help. Here's what happened."
category: "AI"
tags: ["mastodon", "aws", "claude", "ai-agents", "devops"]
coverImage: "./cover.jpg"
draft: false
---

📖

You can read more of my posts on running your own Mastodon server right here: [https://www.micahwalter.com/tags/mastodon/](https://www.micahwalter.com/tags/mastodon/)

It's been a little over three years since I [set up my own Mastodon server](https://www.micahwalter.com/posts/notes-on-running-a-mastodon-server-on-aws) on a single t4g.small EC2 instance. Since then I've written about [monitoring it with CloudWatch](https://www.micahwalter.com/posts/notes-on-configuring-amazon-cloudwatch-to-monitor-my-mastodon-server), [surviving an early outage](https://www.micahwalter.com/posts/notes-on-serving-images-and-a-brief-mastodon-server-outage), [what it costs to run](https://www.micahwalter.com/posts/how-much-ive-spent-so-far-running-my-own-mastodon-server-on-aws), and [backing it up to S3](https://www.micahwalter.com/posts/notes-on-backing-up-my-mastodon-server-to-s3). And then I mostly stopped writing about it, because once a single-user Mastodon server is up, it's pretty boring. It just runs.

Until it doesn't.

My server had been quietly drifting into a bad state. It was still on Mastodon 4.0.2 from November 2022. Ruby 3.0.4 and Node 16 were both long past end-of-life. The t4g.small was constantly swapping, CPU was spiking, and CloudWatch was yelling at me more often than I wanted to admit. I'd been putting off the upgrade for months because I remembered how long the original install had taken and I wasn't looking forward to stepping through every minor Mastodon version in order.

So this time I tried something different. I opened up Claude Code, pointed it at my AWS account, and said "here's my server, here's the problem, let's go." These are my notes.

## The setup

I wasn't doing anything clever. I just ran Claude Code in a terminal on my laptop, handed it my `mastodon` AWS profile, and asked it to log into the EC2 instance via Systems Manager Session Manager and figure out what was going on. No SSH, no bastion, no key pairs — SSM Session Manager is the way I've been connecting to this box for a while now, and Claude picked it up right away.

What I wanted:

- Figure out why CPU keeps spiking
- Plan an upgrade to a current Mastodon version
- Actually do the upgrade

What I did not want:

- To spend a weekend on it
- To get into a broken state with no way back

## Starting with backups

The first thing Claude did, before touching anything, was take two backups. An AMI snapshot of the whole instance, and a `pg_dump` of the `mastodon_production` database pushed to S3. The dump was 558MB and landed in the S3 bucket I had [set up a while back](https://www.micahwalter.com/posts/notes-on-backing-up-my-mastodon-server-to-s3). If any of the following went sideways, I had two independent ways to get back.

## Quick wins

Before doing anything structural, Claude poked at the configuration and found that my `mastodon-sidekiq` service was running 25 worker threads on a 2GB instance. That's way more than a single-user server needs, and it was a big part of why I was swapping 850MB. Dropped that to 10, and swap use immediately fell to around 700MB without any other changes.

Then we stopped the instance, scaled it vertically from `t4g.small` to `t4g.medium`, and started it back up. RAM went from 1.8GB to 3.7GB and swap went to zero.

That alone would have fixed the CPU complaints. But I was here to do the full upgrade.

## Stepping through the versions

Mastodon upgrades aren't a single `git pull`. You have to step through each minor version in order so that every database migration runs. Claude laid out the path:

```
4.0.2 → 4.0.15 → 4.1.25 → 4.2.29 → 4.3.22 → 4.4.16 → 4.5.9
```

And because the Ruby version requirements change along the way — 4.0 and 4.1 insist on Ruby < 3.1, while 4.2+ wants Ruby 3.2+ — we also had to install a newer Ruby via `rbenv` and switch between them at the right moments. Claude wrote a shell script, uploaded it to the server with `aws ssm send-command`, and ran it as the `mastodon` user. I watched the output scroll by.

A few things went wrong, and this was the part I was most curious about — would Claude actually diagnose and fix things, or would it get stuck?

**Mastodon 4.3+ needs ActiveRecord encryption keys.** Three new env vars that didn't exist in 4.0. Claude ran `rails db:encryption:init`, captured the output, and appended the three keys to `.env.production`.

**Mastodon 4.3+ uses Yarn 4 (Berry) instead of Yarn 1.** The script had been using `yarn install --pure-lockfile`, which Yarn Berry doesn't understand. Claude spotted the error, swapped it to `--immutable`, and re-ran.

**Mastodon 4.4+ needs libvips 8.13 or newer.** Ubuntu 22.04 ships 8.12. This one required compiling libvips 8.15.5 from source with `meson` and `ninja`, installing a bunch of `-dev` packages first. Claude handled it without complaint.

**The final checkout rewrote `.ruby-version` to 3.4.7**, which isn't installed on my box. Claude caught the resulting error, overwrote the file with `3.2.11`, and kept going.

Each of these is the kind of thing that would have sent me back to the Mastodon release notes for half an hour. Instead, Claude read the error, made the fix, and moved on.

## Redis and Sidekiq queues

Once I was on 4.5.9, `mastodon-sidekiq` started logging warnings that it wasn't running any of the expected queues — `default`, `push`, `ingress`, `mailers`, `pull`, `scheduler`, `fasp`. The systemd unit was calling `sidekiq -c 10` without pointing at `config/sidekiq.yml`, so Sidekiq had no idea those queues existed. We updated `ExecStart` to `sidekiq -C config/sidekiq.yml` and restarted.

Which then failed, because Sidekiq 8 (bundled with Mastodon 4.5) requires Redis 7+, and I was on Redis 6.0.16. We added the official Redis apt repo and upgraded to Redis 8.6.2, then restarted Sidekiq. All seven queues came up. Warnings gone.

## A little PostgreSQL tuning

With 4GB of RAM instead of 2, it was silly to leave PostgreSQL on the defaults. Claude appended some conservative settings to `/etc/postgresql/15/main/postgresql.conf`:

```ini
shared_buffers = 512MB
work_mem = 16MB
maintenance_work_mem = 128MB
effective_cache_size = 2048MB
```

`shared_buffers` needs a full restart, not a reload, which Claude knew and did correctly.

## One thing I didn't plan on

At some point during the audit, an AWS IAM access key used for SES SMTP got printed to the terminal. It was an old key from 2022, and now it was in my scrollback. Not a huge deal, but also not something I wanted sitting around.

Claude offered to rotate it, and I said yes. It created a new access key, derived a new SMTP password from the secret key using the AWS SES HMAC-SHA256 routine, updated `.env.production`, deleted the old key, and restarted `mastodon-web`.

## The result

About an hour of elapsed time, most of it me watching output scroll by. Final state:

| Component | Before | After |
|---|---|---|
| Mastodon | 4.0.2 | 4.5.9 |
| Ruby | 3.0.4 (EOL) | 3.2.11 |
| Node.js | 16.20.2 (EOL) | 20.20.2 LTS |
| Redis | 6.0.16 | 8.6.2 |
| libvips | 8.12.1 | 8.15.5 |
| Instance | t4g.small, 2GB | t4g.medium, 4GB |
| Sidekiq workers | 25 | 10 |
| Swap in use | ~850MB | ~93MB |

All six services — `mastodon-web`, `mastodon-sidekiq`, `mastodon-streaming`, `nginx`, `postgresql@15-main`, `redis-server` — came up clean and stayed that way. CPU has been flat since.

## What I thought about the experience

The thing that struck me most wasn't that Claude could run the commands. I can run the commands. The thing that saved me time was that Claude held the whole upgrade path in its head (which Ruby to use for which Mastodon version, which Yarn flag works, which libvips the image processing gem needs, which Redis Sidekiq 8 wants) and produced a coherent sequence without me having to go read six sets of release notes.

I still had to make the decisions. I approved every destructive step, I looked at the diffs, and I chose to rotate the SMTP key rather than just noting it for later. Claude didn't run off and do things I hadn't asked for. It just did the boring sequencing work very fast.

I also now have a detailed `UPGRADE_LOG.md` sitting in a local folder that Claude wrote up at the end, documenting every phase, every file it touched, every issue it hit. Having Claude produce the log at the end, while the context was still fresh, was almost as useful as the upgrade itself.

Now to see how long I can go before the next one.

Toot toot!
