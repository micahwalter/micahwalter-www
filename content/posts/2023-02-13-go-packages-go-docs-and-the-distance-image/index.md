---
id: 32
title: "Go Packages, Go Docs, and the Distance Image"
publishedAt: "2023-02-13"
excerpt: "The past couple weeks have been pretty productive in terms of my mission to learn Go. I started reading this excellent book called \"The Go Programming..."
category: "Writing"
coverImage: "./cover.jpg"
tags:
  - "go"
  - "Imaging"
  - "TIL"
draft: false
# WordPress ID: 630
# Original URL: https://www.micahwalter.com/2023/02/go-packages-go-docs-and-the-distance-image/
---

The past couple weeks have been pretty productive in terms of my mission to learn [Go](https://go.dev). I started reading this excellent book called "[The Go Programming Language](https://www.amazon.com/Programming-Language-Addison-Wesley-Professional-Computing/dp/0134190440)" by Alan Donovan and Brian Kernighan. It's been helpful because it does a good job at explaining why things are the way they are in Go, while working your way through each core principal. I'm about 15% through the book already.

I also spent a good deal of time learning what I could about [packages](https://pkg.go.dev/) in Go. This seems to be a pretty important core concept, and something I've struggled with in other languages like Python and Node. I think Go has taken a really smart approach to package and dependency management by simplifying things, removing the need for a complex package manager, and creating a [global namespace](https://en.wikipedia.org/wiki/Global_Namespace) by just piggybacking off the World Wide Web's global namespace.

I also started building a [package of my own](https://github.com/go-micah/imaging) to collect together some basic image processing functions. It's really just an exercise to learn more about Go and about building and documenting packages, but also has been a fun way to remind myself of some of the interesting concepts I learned about many years ago while studying [imaging in college](https://www.rit.edu/study/photographic-sciences-bs).

Here are my notes.

## I learned all about Go Packages

Packages in Go are a core concept to understand. Here are some key takeaways:

-   I'm not entirely sure what the difference is between a "package" and a "module" in Go, or if there even is a difference. Packages appear to be collections of Go files that can be imported into another Go program. Modules appear to be referenced in the form of `go mod` which is a command line tool that does the actual importing and documenting of versions.
-   There is a special package called `main` that every Go program implements once and it's where your program begins. A Go Package doesn't need to have a `main` package.
-   Packages can span multiple files and folders and your package namespace can use these folders to divide things up into logical groups. For example, you can have a package called "imaging" with a sub-folder called "generators" and you can import "generators" separately and parallel to anything else found within the "imaging" package.
-   Your Go program can have many packages within the code-base. They get imported in the same way as a third party package from GitHub or elsewhere. I'm not entirely sure how Go works out which one to import, but it seems to prioritize local packages first.
-   The namespace is global, which is nice because someone can publish a package at `https://github.com/username/imaging` and I can publish a package at `https://github.com/go-micah/imaging` and we can import both, giving one or both an alias so they don't conflict in the program we are writing.
-   There is a website called [pkg.go.dev](https://pkg.go.dev) where you can search for and browse packages and documentation. As a developer you don't need to upload your packages, you just let the site know you have one and it pulls in all the details from wherever you host your code. This is much nicer than PyPi or NPM in my opinion because there is always just a single source of truth for your code.

## I learned a little about Go Documentation

Documentation in Go is pretty simple as well. In a nutshell, just add comments to your code.

-   There is an old thing called `godoc` and there is a new thing called `pkgsite` which both allow you to view your docs in a web browser. The newer version presents a website that looks exactly like `pkg.go.dev` so you can preview how your documentation will appear once it's been crawled.
-   The official docs on writing docs leaves me a little wanting. It's basically this [blog post](https://go.dev/blog/godoc), which outlines most of what you need to know. At the top there is a link to this page, which has all the details of how to do things the right way. I also found [this blog post](https://mdaverde.com/posts/golang-local-docs/) useful in terms of getting `pkgsite` working.
-   You can add an additional file to the top level of a package called `doc.go` where you can add high level documentation and examples.

## I made a package of my own and a "Distance Image" function

As I mentioned earlier, I decided to learn by doing and created a package called `imaging`. This package currently has just one public function, but I plan to keep adding to it.

The function is called "Dist" and allows anyone to generate something called a "[Distance Image](https://notes.micahwalter.com/Distance+Image)" where the value of each pixel is relative to the distance to the center of the image. This is a useful thing to have anytime you need a quick test image.

It winds up looking something like this!

![](https://imaging.micahwalter.com/dist?width=400&height=400)

To do this, I made two functions in my imaging package. This first is a public function called `Dist` which takes the desired height and width of the image. (Capitalizing the first letter of a function makes it public.) The second is a private function called `calculateDistance` which uses the quadratic equation to calculate distance from any pixel to the center of the image. (There is some fun with rounding and converting ints to floats, which I will dig into in another post.)

Within the `Dist` function I wrote up a nested `for` loop, which will traverse the image, pixel by pixel. This is an important pattern to know about when dealing with images, and maybe in a future version, I will move it out to a `draw` function as I am sure I'll need to use it more than once.

You can already import this package into your own Go program like this:

```
import "https://github.com/go-micah/imaging"
```

And, you can already [read the docs here](https://pkg.go.dev/github.com/go-micah/imaging).

That's all for now. Yay!