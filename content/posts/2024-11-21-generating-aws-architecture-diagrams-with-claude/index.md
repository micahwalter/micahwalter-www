---
id: 59
title: "Generating AWS Architecture Diagrams with Claude"
publishedAt: "2024-11-21"
excerpt: "I've been really enjoying creating code artifacts with Anthropic's Claude. The interface is really simple and easy to use, and in many cases it can generate..."
category: "AI"
coverImage: "./cover.png"
tags:
  - "architecture"
  - "aws"
  - "claude"
  - "claude-convos"
  - "diagrams"
  - "javascript"
draft: false
# WordPress ID: 78732
# Original URL: https://www.micahwalter.com/2024/11/generating-aws-architecture-diagrams-with-claude/
---

I've been really enjoying creating code artifacts with [Anthropic's Claude](http://claude.ai). The interface is really simple and easy to use, and in many cases it can generate code that can instantly run in a browser. You can also easily download the artifact files and add them to your own repository or static website. Nice.

One cool trick I learned recently is that Claude can generate diagrams using [mermaid.js](https://mermaid.js.org/). This is super cool, since I can now have a conversation with Claude, describing what I want to build, and it will generate a visual architecture diagram as I type.

Here is a recent conversation I had with Claude where we discussed a pattern for routing requests to an [Amazon API Gateway](https://aws.amazon.com/api-gateway/) to a private [Amazon Elastic Container Service](https://aws.amazon.com/ecs/) (ECS) cluster.

> Me: Can you create AWS architecture diagrams as code artifacts?

> Claude: Yes, I can create AWS architecture diagrams using Mermaid. Here's a sample showing a typical web application setup. Would you like me to modify it or create a different architecture diagram?

![](./Screenshot-2024-11-21-at-11.44.14-E2-80-AFAM.png)

```
graph TB
    client[Client] --> alb[Application Load Balancer]

    subgraph "VPC"
        alb --> asg[Auto Scaling Group]

        subgraph "AZ 1"
            asg --> ec2_1[EC2 Instance]
            ec2_1 --> rds_1[(RDS Primary)]
        end

        subgraph "AZ 2"
            asg --> ec2_2[EC2 Instance]
            rds_1 --> rds_2[(RDS Standby)]
        end

        ec2_1 --> s3[(S3 Bucket)]
        ec2_2 --> s3
    end

    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px;
    class alb,asg,ec2_1,ec2_2,rds_1,rds_2,s3 aws;
```

> Me: Nice. Can you create an AWS Architecture diagram that shows a pattern for using an API Gateway to route requests securely to an Application Load Balancer in front of an ECS cluster?

> Claude: Key elements:
> 
> -   API Gateway provides authentication/authorization
> -   VPC Endpoint enables private communication
> -   NLB in public subnet routes traffic internally
> -   ALB in private subnet distributes to ECS services
> -   All components in VPC for security

![](./Screenshot-2024-11-21-at-11.45.49-E2-80-AFAM.png)

```
graph TB
    client[Client] --> apigw[API Gateway]

    subgraph "VPC"
        subgraph "Public Subnet"
            nlb[Network Load Balancer]
            vpce[VPC Endpoint]
        end

        subgraph "Private Subnet"
            alb[Application Load Balancer]

            subgraph "ECS Cluster"
                service1[ECS Service 1]
                service2[ECS Service 2]
            end
        end

        apigw --> vpce
        vpce --> nlb
        nlb --> alb
        alb --> service1
        alb --> service2
    end

    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px;
    class apigw,nlb,vpce,alb,service1,service2 aws;

    classDef subnet fill:#E8E8E8,stroke:#666,stroke-width:1px;
    class subnet subnet;
```

> Me: Can you change the color of the boxes so they are more easily readable?

> Claude: I've updated the diagram with a light blue color scheme and white text for better contrast and readability.

![](./Screenshot-2024-11-21-at-11.47.37-E2-80-AFAM.png)

> Me: What is the purpose of the Network Load Balancer ?

> Claude: The Network Load Balancer (NLB) serves two key purposes in this architecture:
> 
> 1.  It provides a fixed entry point in the public subnet for traffic coming from API Gateway through the VPC Endpoint
> 2.  It performs TLS termination and forwards traffic to the Application Load Balancer in the private subnet
> 
> The NLB is used here because API Gateway VPC endpoints can only target NLBs or private IP addresses, not ALBs directly. The NLB acts as a bridge between the VPC endpoint and the ALB.

> Me: What's the difference between this approach and using a VPC Private Link?

> Claude: The key differences:
> 
> VPC Private Link:
> 
> -   Allows services to be exposed directly to other AWS accounts/VPCs
> -   Service provider creates NLB target groups
> -   Consumers connect via VPC endpoint service
> -   Better for service-to-service communication across accounts
> 
> API Gateway with VPC Endpoint:
> 
> -   More control over API management (throttling, auth, transformations)
> -   Built-in API documentation and versioning
> -   Request/response validation and transformation
> -   Better for public-facing APIs that need gateway features
> 
> The Private Link approach is simpler but offers less API management capabilities compared to the API Gateway pattern.

> Me: What about using API Gateway with Private Link instead of a Network Load Balancer?

> Claude: Let me update the diagram to show the API Gateway with Private Link pattern:
> 
> This approach is simpler since PrivateLink can connect directly to the ALB, eliminating the need for an intermediate NLB. The ALB can stay in the private subnet, maintaining security while reducing the number of networking components.

![](./Screenshot-2024-11-21-at-12.42.57-E2-80-AFPM.png)

```
graph TB
    client[Client] --> apigw[API Gateway]

    subgraph "VPC"
        subgraph "Private Subnet"
            alb[Application Load Balancer]
            vpce[VPC Endpoint]

            subgraph "ECS Cluster"
                service1[ECS Service 1]
                service2[ECS Service 2]
            end
        end

        apigw --> |PrivateLink| vpce
        vpce --> alb
        alb --> service1
        alb --> service2
    end

    classDef aws fill:#2496ED,stroke:#232F3E,stroke-width:2px,color:white;
    class apigw,alb,vpce,service1,service2 aws;

    classDef subnet fill:#f9f9f9,stroke:#666,stroke-width:1px;
    class subnet subnet;
```

Finally I asked Claude something I kinda already knew the answer to, but just wanted to double check.

> Me: Can you replace the blue boxes with AWS Service icons?

> Claude: Unfortunately I cannot use actual AWS service icons in Mermaid diagrams – I can only use basic shapes and styling. If you need a diagram with the official AWS architecture icons, you would need to use a different diagramming tool like AWS's own Architecture Icons library with software like draw.io or Lucidchart.
> 
> Would you like me to adjust the styling of the boxes in another way to make them more distinctive, or would you prefer guidance on creating diagrams with official AWS icons?

> Me: That's ok, I can take it from here.

### Published Artifacts

One of my favorite features of Claude Artifacts is the ability to publish them as sharable URLs. Here's the final diagram Claude generated for me as a static website.

[https://claude.site/artifacts/89433aa9-716b-4045-9dfe-b1c0350859de](https://claude.site/artifacts/89433aa9-716b-4045-9dfe-b1c0350859de)

I've started collecting these and the artifacts generated from my experiments with the p5.js library. They are currently here (deployed with [AWS Amplify](https://aws.amazon.com/amplify)) [https://sketches.micahwalter.com](https://sketches.micahwalter.com) and I'll keep adding new ones as I create them.