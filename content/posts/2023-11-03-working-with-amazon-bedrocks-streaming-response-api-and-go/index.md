---
id: 36
title: "Working with Amazon Bedrock's Streaming Response API and Go"
publishedAt: "2023-11-03"
excerpt: "While working on my chat-cli program, I realized that waiting for a response from Amazon Bedrock could take some time, depending on the nature of your prompt...."
category: "Writing"
coverImage: "./cover.jpg"
tags:
  - "ai"
  - "amazon-bedrock"
  - "chat-cli"
  - "GenerativeAI"
  - "go"
  - "TIL"
draft: false
# WordPress ID: 720
# Original URL: https://www.micahwalter.com/2023/11/working-with-amazon-bedrocks-streaming-response-api-and-go/
---

While working on my [chat-cli](https://www.micahwalter.com/building-a-generative-ai-cli-with-amazon-bedrock-and-go/) program, I realized that waiting for a response from [Amazon Bedrock](https://aws.amazon.com/bedrock) could take some time, depending on the nature of your prompt. To offer a better user experience, I looked into the `InvokeModelWithResponseStream` API method, which allows you to receive the response from Bedrock in chunks rather than all at once. This means you can begin to print out the response to the user as it arrives instead of just showing some equivalent of a spinning beach ball.

The problem was, I didn't really understand how to deal with the `InvokeModelWithResponseStream` in Go. I looked through the documentation and eventually figured out that it was leveraging Go's Channels feature, which I also didn't know much about.

It turns out that Go Channels, and Go Routines are pretty powerful and somewhat simple once you understand what's going on under the hood. I found a nice tutorial [here](https://gobyexample.com/goroutines), and [here](https://gobyexample.com/channels), and created my own playground to test things out on my own.

The way I understand this, Go Routines allow you to launch multiple non-blocking threads. This is nice, but it can be difficult to manage taking action on any of these threads when they are complete. To deal with that issue, there are Go Channels, which allow you to essentially send messages from one Go Routine to another.

In my sample code above, I am trying a few different approaches to calling a long running process. The first is a standard function call. Everything has to wait 10 seconds until that function is complete. The second is a started in a Go Routine, using the `go` syntax. This process is non-blocking, but if the program completes before this routine is done, we may not see its output. The third and fourth are Go Routines with a Go Channel. These allow us to launch non-blocking threads and send some output back to the main function once they are done.

For Bedrock's `InvokeModelWithResponseStream` API method it works pretty much the same.

First, you make the API call like this:

The response from this call will open a Go Channel, which you can react to in a loop like this:

In this code, we grab the Go Channel with `stream.Events()` and then in the loop we are capturing each event with the Go Channel syntax `event := <- events`. From here we are just testing to see if we have any new events before breaking out of the loop and closing the stream. If we have new events, we print them as they arrive. This winds up looking like a streaming response to the user, and is much better than waiting for the entire response to arrive!