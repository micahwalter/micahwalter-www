---
id: 87
title: "I asked Claude to create an interactive website for producing sinusoidal test patterns and it took less than a minute"
publishedAt: "2024-12-11"
excerpt: "I can't really explain it, but for a long time like since the mid 90's I've been sort of obsessed with the image you see above. It's called a \"sinusoidal test..."
category: "AI"
coverImage: "./cover.png"
tags:
  - "000"
  - "333"
  - "ai"
  - "canvas"
  - "controls"
  - "genai"
  - "optics"
  - "sketches"
draft: false
# WordPress ID: 78896
# Original URL: https://www.micahwalter.com/2024/12/i-asked-claude-to-create-an-interactive-website-for-producing-sinusoidal-test-patterns-and-it-took-less-than-a-minute/
---

I can't really explain it, but for a long time (like since the mid 90's) I've been sort of obsessed with the image you see above. It's called a "[sinusoidal test pattern](https://www.appliedimage.com/product-category/sine-sinusoidal-targets-arrays/#:~:text=Sinusoidal%20Target%20Arrays%20have%20been,form%20and%20start%20the%20conversation.)" and they are used in the optics world to test the quality of lenses and complex optical systems.

I first learned about these patterns while working as an intern at this company in Rochester, NY called [Applied Image](https://www.appliedimage.com/). They wanted to produce these patterns and sell them to.. uh, scientists? I spent a whole summer trying to come up with a way to generate the patterns using photographic methods. I built an elaborate mechanism to "paint" the patterns with light onto high resolution photographic film. There were motors and actuators and control code involved. It never really worked out, but it was a really fun project.

Later, at different moments in my life, I've found myself drawn to the images over and over again. I tried again to produce them while in grad school by writing [Processing](https://processing.org/) code and printing them out as ink-jet prints. I did another project where I produced them using code I wrote in Go, and set them up as an image server, because why not?

Tonight though, I decided to try something new. I sent the following prompt to Claude, and within a minute, I got the result I had in sitting up there in my mind. Idea to reality in less than a minute. Amazing!

> Me: Use a graphics library like p5.js to generate an interactive website that displays a full screen sinusoidal test pattern, with controls at the top so the user can adjust the period and frequency. The test pattern should be grayscale and range from white to black. It should be two dimensional so it shows sine waves across the x axis and along the y axis it simply repeats, creating a sine wave test pattern, useful in measuring the modulation transfer function of optical systems.

Claude came back with the following:

> Claude: I'll create an interactive HTML page using p5.js to generate a sinusoidal test pattern with adjustable controls.

```

    Sinusoidal Test Pattern
    
    
        body {
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: #000;
            color: white;
            font-family: Arial, sans-serif;
        }
        #controls {
            padding: 20px;
            background: #333;
            display: flex;
            gap: 20px;
            align-items: center;
        }
        .control-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #canvas-container {
            flex-grow: 1;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    

    
        
            Frequency:
            
            10
        
        
            Amplitude:
            
            127
        
        
            Vertical Repetitions:
            
            5
        
    
    

    
        let frequency = 10;
        let amplitude = 127;
        let verticalRep = 5;

        function setup() {
            const canvas = createCanvas(windowWidth, windowHeight - document.getElementById('controls').offsetHeight);
            canvas.parent('canvas-container');
            pixelDensity(1);
            noStroke();

            // Add event listeners for controls
            document.getElementById('frequency').addEventListener('input', (e) => {
                frequency = parseInt(e.target.value);
                document.getElementById('freq-value').textContent = frequency;
            });

            document.getElementById('amplitude').addEventListener('input', (e) => {
                amplitude = parseInt(e.target.value);
                document.getElementById('amp-value').textContent = amplitude;
            });

            document.getElementById('verticalRep').addEventListener('input', (e) => {
                verticalRep = parseInt(e.target.value);
                document.getElementById('vert-value').textContent = verticalRep;
            });
        }

        function draw() {
            background(0);
            loadPixels();

            for (let y = 0; y < height; y++) {
                const normalizedY = (y / height) * verticalRep * TWO_PI;

                for (let x = 0; x < width; x++) {
                    const normalizedX = (x / width) * frequency * TWO_PI;

                    // Calculate sine wave value (-1 to 1)
                    const sineValue = sin(normalizedX);

                    // Convert to pixel value (0 to 255)
                    const pixelValue = 128 + (sineValue * amplitude);

                    // Calculate pixel index
                    const idx = 4 * (y * width + x);
                    pixels[idx] = pixelValue;     // R
                    pixels[idx + 1] = pixelValue; // G
                    pixels[idx + 2] = pixelValue; // B
                    pixels[idx + 3] = 255;        // A
                }
            }

            updatePixels();
        }

        function windowResized() {
            resizeCanvas(windowWidth, windowHeight - document.getElementById('controls').offsetHeight);
        }
    

```

> I've created an interactive test pattern generator with the following features:
> 
> 1.  A full-screen sinusoidal pattern that updates in real-time
> 2.  Three adjustable controls:
> 
> -   Frequency: Controls the number of sine wave cycles across the screen
> -   Amplitude: Controls the contrast between black and white
> -   Vertical Repetitions: Controls how many times the pattern repeats vertically
> 
> The pattern is generated using p5.js's pixel manipulation functions for optimal performance. The pattern is grayscale, ranging from black (0) to white (255), with the sine wave oscillating around the middle gray value (128).
> 
> You can:
> 
> 1.  Drag the frequency slider to adjust the spatial frequency of the pattern
> 2.  Adjust the amplitude to control the contrast
> 3.  Modify the vertical repetitions to change how many times the pattern repeats vertically
> 
> The pattern automatically resizes when the window size changes, and the controls stay fixed at the top of the screen.
> 
> Would you like me to modify anything about the pattern or add additional controls?

I asked Claude to remove the vertical repetitions control, but otherwise I thought it was perfect.

![](./Screenshot-2024-12-11-at-9.06.14-E2-80-AFPM.png)

Click [this link](https://sketches.micahwalter.com/sine-pattern) to try out the final result.