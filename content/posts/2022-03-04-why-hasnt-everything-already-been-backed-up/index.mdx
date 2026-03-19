---
id: 11
title: "Why Hasn’t Everything Already Been Backed Up?"
publishedAt: "2022-03-04"
excerpt: "In the past month I’ve had two friends reach out to me in a panic because they lost all their data during the upgrade process to macOS Monterey. Yes, I am that..."
category: "Writing"
coverImage: "./cover.jpeg"
tags:
  - "aws"
  - "Heat"
  - "tech"
draft: false
# WordPress ID: 110
# Original URL: https://www.micahwalter.com/2022/03/why-hasnt-everything-already-been-backed-up/
---

In the past month I’ve had two friends reach out to me in a panic because they lost all their data during the upgrade process to macOS Monterey. Yes, I am that friend who gets called for IT advice.

The first friend reported that the upgrade process seemed to go according to plan, but when he looked for his files on an attached hard drive, everything was gone. The drive had been completely erased and re-partitioned into two volumes. It sounded like he may have accidentally erased the external drive during the upgrade process, but when he talked me through everything that had happened, I couldn’t think of any mistakes on his part.

The second friend came back to her computer after the upgrade had finished only to find the bulk of her iCloud Drive missing. Naturally, she tried everything to restore the missing files, called Apple Support, looked at her iCloud Drive online, etc. Nothing worked. She was sure everything had synced up to the cloud before the upgrade, but 90% of her files had vanished, without a trace and with no apparent way to restore from a previous state.

Before I heard about these two cases I had upgraded both of my laptops to Monterey. Both laptops upgraded without issue. One was a clean install (my personal laptop) and the other was an in-place upgrade (my work laptop). The work laptop took a lot longer to finish, but when it was done, everything seemed to be there as expected.

These two accounts from my friends got me thinking about how we deal with our data these days. We live in a cloud-centric world, where we expect everything to already be backed up automatically for us to our cloud of choice, sitting there, safe as can be.

## How the movie Heat inspired my backup philosophy

One of my favorite films is Michael Mann’s [Heat](https://www.imdb.com/title/tt0113277/). I’ve watched it way too many times, and I even made my wife suffer through the full three hours at a theatre. But, it’s a great film. There is one quote by Robert Di Nero’s character Neil, that sort of defines the film.

> Don't let yourself get attached to anything you are not willing to walk out on in 30 seconds flat if you feel the heat around the corner.

It’s Neil’s mantra, and, as he explains it in the film to several characters, it’s his North Star for how he lives his life. For me, it’s a mantra for my data. I’ve worked primarily on laptops for the past couple of decades. I don’t know why, but I’ve never found a desktop machine to be very useful. This means my stuff is always with me, wherever I go, but it also means nothing is ever really in one place. This laptop lifestyle has forced me to think about what would happen if I ever lost the machine itself, or if it just broke, or a hard drive failed, or if I drove over it with the car. Anything can happen, so I’ve always treated my laptops as though I might lose one at any given moment. With this in mind, I back them up religiously, and I don’t try and over-config. If I feel that Heat coming around the corner, I know my data is somewhere else, safe and sound.

There’s a couple of points built into my Heat based approach to backups. One is being sure your data is always somewhere safe—somewhere else, the other is being able to recover quickly from some kind of disaster.

To accomplish this, I do these three things.

1.  I have a backup app running on both of my laptops that continuously (every hour) backs up all the folders I care about to [Amazon Simple Storage Service (S3)](https://aws.amazon.com/s3). It’s important to note that it’s only the folders I care about. I don’t back up all the applications or the thousands and thousands of library files that those apps depend on. I know I can always re-install those apps and set them back up the way I like relatively quickly. I use an app called [Arq Backup](https://www.arqbackup.com), which is really simple and lets me pick from all the major cloud storage providers. The big thing here is, Arq provides the tools to set up a point-in-time recovery of any files or folder I care about, as well as a pretty nice interface for easily retrieving those files. It takes advantage of S3’s Infrequent Access storage tier, which is cheaper than the Standard Tier, and it will encrypt my data prior to uploading to S3, so I’m the only one who can ever access the backed up data.
2.  For all the data that won’t fit on my laptop, I have a [Synology Network Attached Storage (NAS)](https://www.synology.com) device on my home network. This is where I offload files I don’t need on my laptop, and it’s where I keep all the giant RAW image files I create with my digital cameras. It’s a really nice device which I can easily expand over time if needed. However, the important thing to remember is that even though it’s a great device, all the data is still just sitting in a cabinet in my home. So, I have a separate program running on the NAS that handles backing all of that data to the same cloud based Amazon S3 destination. This data is also encrypted, and the NAS has a very nice interface for restoring files and choosing what gets backed up and when. It runs once a night and sends me an email report when it’s done so I can make sure it’s working as expected.
3.  Lastly, I sometimes wind up with files or even whole hard drives that I don’t really know what to do with. I’m not ready to throw them away, but I also don’t really need them hanging around. For these kinds of files I create zip archives and upload them to Amazon S3 using the [Glacier Deep Archive](https://aws.amazon.com/s3/storage-classes/glacier/) tier which essentially trades immediate access for cost. I can store those archives on S3 Glacier Deep Archive for pennies as long as I am ok with waiting a few days if I ever need to retrieve them, or potentially paying a fee for early retrieval.

That’s it! That’s the whole solution. Ultimately everything is backed up to Amazon Simple Storage Service. I use other services like iCloud Drive and Dropbox, but I try and do my best to treat those services as if they were external hard drives. If I store a file on Dropbox, I also make sure its being backed up as part of my normal Arq based backup scheme.

## Test those backups!

One last reminder. A backup is only useful if you are able to restore it. Be sure to frequently test your backups to make sure they are working and that the data you are backing up can indeed be restored. Most backup tools like the app I have running on the Synology NAS and Arq have some kind of reporting feature where they will email you with any errors or alert you when something isn’t working as expected.

I hope this is helpful. Please, please, please, get all your data backed up somewhere safe and sound. I don’t need you calling me in the middle of the night too!