---
id: 107
title: "Anatomy of a AWS Lambda function in Go"
publishedAt: "2025-02-23"
excerpt: "Go or Golang is a great choice for building backends, APIs and all sorts of data processing programs for the cloud. Go is easy to learn, straightforward, and..."
category: "AWS"
tags:
  - "aws"
  - "go"
  - "Lambda"
  - "serverless"
draft: false
# WordPress ID: 79192
# Original URL: https://www.micahwalter.com/2025/02/anatomy-of-a-aws-lambda-function-in-go/
---

[Go](https://go.dev) (or Golang) is a great choice for building backends, APIs and all sorts of data processing programs for the cloud. Go is easy to learn, straightforward, and is surrounded by a vibrant and expansive community. It's also highly performant on [AWS Lambda](https://aws.amazon.com/lambda) and has great support for concurrency.

Go is awesome on AWS Lambda, but I always hear people complaining that it's difficult to get started. So, here is a super simple explainer post that will hopefully alleviate some of those worries.

## Hello Lambda

Below is a simple "Hello, World" function written in Go.

Let's take a close look.

![](./carbon.png)

There are basically three sections to every Go program.

1.  The first line defines this file as the main package. In Go, you can have many packages, and you can publish your own packages easily. In fact, one of the things I like most about Go is its [simple approach to package management](https://go.dev/doc/modules/managing-dependencies).
2.  The "import" section is where we define all our dependancies. In this example, we are importing a core package called "[fmt](https://pkg.go.dev/fmt)" which let's us do things like format strings and print them to the console, or in our case to [Amazon CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html). We are also importing `[github.com/aws/aws-lambda-go/lambda](https://pkg.go.dev/github.com/aws/aws-lambda-go)` which gives us a bunch of functionality including `lambda.Start` which we will use to get things started.
3.  The rest of the program is where you define all your functions, types, and so on. This is the meat of your program.

For AWS Lambda, your program needs to have a "handler" function. You can actually call this function whatever you like, but I've called it simply handler here. This is the code that is called first when you invoke your function.

In Go, the "main" function is necessary, and is the first bit of code that is run. So there is a single line here that kicks off the handler function.

That's it!

OK, not quite. We still need to upload this program to AWS Lambda to make it work. Since Go is a compiled programming language, you can't just edit the code in the AWS Console. It needs to be compiled first. There's a few steps to do this, but they are also easy!

1.  Install the [latest version of Go](https://go.dev/dl/).
2.  Create a folder for your code. I called mine `hello-lambda`
3.  Save that file above as `main.go`
4.  Type `go mod init` – This will create a `mod.go` file, which will manage the state of all your dependencies.
5.  Type `go mod tidy` – This will update `mod.go` and create a `mod.sum` file, which expands all the dependencies and their sub-dependencies into a flat file. This command will also download any external dependencies, like the `aws-lambda-go` package we are using.
6.  Compile your code for AWS Lambda with the following command: `GOARCH=arm64 GOOS=linux go build -tags lambda.norpc -o ./bin/bootstrap` – This command will compile your function into a binary for the Linux OS and Arm architecture ([Graviton](https://docs.aws.amazon.com/whitepapers/latest/aws-graviton-performance-testing/what-is-aws-graviton.html)) and will save the output to a file called `bootstrap` in the `bin` directory. – FYI the file needs to be called `bootstrap`.
7.  Now, you'll need to zip this binary file so you can upload it via the AWS Console. You can do this easily with the following command: `(cd bin && zip -FS bootstrap.zip bootstrap)`

Once you've done all this you can upload it via the AWS Console to a new AWS Lambda function. Be sure to select "Amazon Linux 2023" as the runtime and "arm64" as the architecture. Then use the the "Upload From" dialog to upload the zip file you created above.

![](./Screenshot-2025-02-23-at-11.12.01-E2-80-AFPM.png)

From here, you can test your function. You should see something like the following:

![](./Screenshot-2025-02-23-at-11.14.51-E2-80-AFPM.png)

A keen eye might catch the `Init!` statement in the Log output section above. This is because I added another special function to my code like the following:

```
func init() {
    fmt.Print("Init!\n")
}
```

`init` is a special function, which gets run before anything else, and only when AWS Lambda creates a new "[execution environment](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html)." This can be useful for setting global variables or other kinds of initializations that persist across invocations. But, be careful, as a complex or lengthy `init` can lead to longer cold starts and is often not necessary.

Ok, that's really it! You just wrote an AWS Lambda function, in Go, compiled it to a binary file, and deployed it manually via the AWS Console. Nice!