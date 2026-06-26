---
id: 21
title: "Transferring Amazon Glacier Deep Archives from one account to another"
publishedAt: "2022-11-09"
excerpt: "I recently decided to re-do my personal AWS accounts using AWS IAM Identity Center SSO and AWS Control Tower. For reasons mostly having to do with house..."
category: "Writing"
coverImage: "./cover.jpg"
tags:
  - "aws"
  - "Glacier"
  - "s3"
  - "TIL"
draft: false
# WordPress ID: 410
# Original URL: https://www.micahwalter.com/2022/11/transferring-amazon-glacier-deep-archives-from-one-account-to-another/
---

I recently decided to re-do my personal AWS accounts using [AWS IAM Identity Center](https://aws.amazon.com/iam/identity-center/) (SSO) and [AWS Control Tower](https://aws.amazon.com/controltower/). For reasons mostly having to do with house keeping, I decided to start from scratch with a new parent account and migrate things in while cleaning up others.

It’s pretty trivial to move a whole account over from one [AWS Organization](https://aws.amazon.com/organizations/) to another, but I didn’t want to do it this way, as I had a whole new structure in mind, and wanted a fresh and new environment to work in.

Most things were pretty easy to replicate in the new accounts. I use the [AWS CDK](https://aws.amazon.com/cdk/) as much as possible, so it wasn’t too hard to re-deploy the handful of side projects I have going.

All good, but what to do about my 5TB stored in [Amazon S3 Glacier Deep Archive](https://aws.amazon.com/s3/storage-classes/glacier/?nc2=h_ql_prod_st_s3g)?

About two years ago, I decided to zip up a whole bunch of files and put them somewhere for a future look. There are about 10 zip files, which add up to nearly 5TB. So, I ordered an [AWS Snowcone](https://aws.amazon.com/snowcone/), and put them on S3, and moved them to Glacier Deep Archive. It all went amazingly well, and the files have been sitting there, untouched all this time. I figure it’s kinda like the stuff I have sitting in a storage unit in Brooklyn. Eventually, I’ll get around to sorting through it all, and deciding what to trash and what to keep. But for now, Deep Archive is a nice resting place.

To move 5TB from one account to another, I needed to follow these steps.

1.  Restore the files. (This can take a couple days)
2.  Create a bucket policy to allow access from the destination account
3.  Do the transfer
4.  Tier the transferred files back to Deep Archive
5.  Delete the source files

I was a little worried this would cost me a lot of money. Restoring 5TB back to S3 Standard comes with some costs. Since it had been over 180 days, I wouldn’t have to pay for early restoration or early deletion. But, once I restored the data, I’d be paying for the data itself in both Deep Archive and S3 Standard while I completed the transfer to the new account. I’d also have to pay for the retrieval, which would be $0.0025 per GB using the lowest cost “Bulk Retrieval” option.

Fortunately, transferring files between S3 buckets in the same region is pretty fast. I used the AWS CLI to do the transfer with `aws s3 cp` and I noticed transfer speeds in the neighborhood of 300-700 MiB/s. The whole process to transfer nearly 5TB took just a few hours.

On the new bucket I set up a 0 day [lifecycle policy](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html) to tier the files down to Deep Archive. On the old bucket, once the transfer was complete, I just used to console to delete all the old files.

To get through all of this, I found this excellent [blog post](https://medium.com/@avadh.sharma/transfer-files-in-s3-glacier-storage-class-from-one-aws-account-to-another-54bf4d13c28f) outlining most of the steps above. One tip I picked up was that the CLI command needed to have the `--force-glacier-transfer` flag added. This is because you can’t normally transfer files stored in Glacier, unless they’ve been restored.

Here’s the full command I wound up using.

```bash
aws s3 cp s3://my-source-bucket s3://my-new-bucket --force-glacier-transfer --storage-class STANDARD
```

I also learned about the “[Bucket Owner Enforced](https://docs.aws.amazon.com/AmazonS3/latest/userguide/about-object-ownership.html)” setting, which is relatively new, and allows you to ensure that any new objects transferred in from another bucket will take on the new bucket as owner.

Here’s my usage bill on the old account for the week where I did the transfer. You can easily see the spike where I restored the 5TB back to S3 Standard, and then it going away after deleting the files.

![](https://www.micahwalter.com/content/images/2022/11/Screen-Shot-2022-11-09-at-10.35.17-AM.png)

And here is my usage bill on the new account for the new data coming in and immediately tiering down to Deep Archive.

![](https://www.micahwalter.com/content/images/2022/11/Screen-Shot-2022-11-09-at-10.37.35-AM.png)

Both of these charts include charges for other unrelated data I have in the same accounts. I filtered out a few things to make the charts make as much sense as possible.

In the end, I spent about $12 to do the data restoration, and about $6 for the Standard Storage while doing the transfer.