import type { Metadata } from "next";
import Link from "next/link";
import MermaidDiagram from "@/components/MermaidDiagram";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Colophon",
  description: "How this site is built — tech stack, infrastructure, and design.",
  path: "/colophon",
});

const architectureDiagram = `%%{init: {"flowchart": {"curve": "linear"}} }%%
flowchart TD
    Visitor([Visitor]) --> R53[Route53 DNS]

    R53 -->|www.micahwalter.com| CFMain[CloudFront\\nOrigin Groups]
    R53 -->|micahwalter.com| CFApex[CloudFront Apex Redirect]
    CFApex -->|301 to www| CFMain

    CFMain -->|HTML / CSS / JS\\nprimary| S3Web[(S3 Website\\nus-east-1)]
    CFMain -->|Images\\nprimary| S3Img[(S3 Images\\nus-east-1)]
    CFMain -. failover .-> S3WebSec[(S3 Website\\nus-east-2)]
    CFMain -. failover .-> S3ImgSec[(S3 Images\\nus-east-2)]

    S3Web -->|CRR| S3WebSec
    S3Img -->|CRR| S3ImgSec

    Dev([Developer]) -->|git push| GH[GitHub]
    Dev -->|blog images:sync| S3Img
    GH -->|GitHub Actions CI/CD| Build[Next.js Static Build]
    Build -->|sync out/| S3Web
    Build -->|invalidate cache| CFMain

    classDef people fill:#F5B684,stroke:#c47d3e,color:#191919
    classDef dns fill:#c9e6f0,stroke:#5ba3be,color:#191919
    classDef cdn fill:#b3d9f5,stroke:#3a8fc7,color:#191919
    classDef storage fill:#c8f0d8,stroke:#3da85e,color:#191919
    classDef secondary fill:#d8f0c8,stroke:#5a9e3a,color:#191919
    classDef cicd fill:#e0d4f5,stroke:#8a5ec7,color:#191919

    class Visitor,Dev people
    class R53 dns
    class CFMain,CFApex cdn
    class S3Web,S3Img storage
    class S3WebSec,S3ImgSec secondary
    class GH,Build cicd`;

export default function ColophonPage() {
  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-charcoal mb-4">
          Colophon
        </h1>
        <p className="text-gray text-lg font-serif">
          How this site is made.
        </p>
      </header>

      <div className="prose prose-lg font-serif text-charcoal space-y-10">

        <p>
          This is a statically exported site built with{" "}
          <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">
            Next.js 15
          </a>{" "}
          and hosted on AWS. Every page is pre-rendered at build time and served
          from S3 via CloudFront — no server required at runtime.
        </p>

        <section>
          <h2 className="text-2xl font-serif font-semibold text-charcoal mb-4">
            Frontend
          </h2>
          <ul className="space-y-2 list-none pl-0">
            <li>
              <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">Next.js 15</a>
              {" — "}React framework with App Router and static export
            </li>
            <li>
              <a href="https://www.typescriptlang.org" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">TypeScript</a>
              {" — "}type-safe development
            </li>
            <li>
              <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">Tailwind CSS</a>
              {" — "}utility-first styling with a custom design system
            </li>
            <li>
              <a href="https://github.com/unifiedjs/unified" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">unified / remark / rehype</a>
              {" — "}markdown content rendered to HTML at request time
            </li>
            <li>
              <a href="https://fonts.google.com/specimen/EB+Garamond" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">EB Garamond</a>
              {" — "}serif typeface for body text and headings
            </li>
            <li>
              <a href="https://highlightjs.org" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">rehype-highlight</a>
              {" — "}syntax highlighting for code blocks
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-semibold text-charcoal mb-4">
            Infrastructure
          </h2>
          <ul className="space-y-2 list-none pl-0">
            <li>
              <a href="https://aws.amazon.com/s3/" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">AWS S3</a>
              {" — "}static file storage with versioning and cross-region replication
            </li>
            <li>
              <a href="https://aws.amazon.com/cloudfront/" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">CloudFront</a>
              {" — "}global CDN with HTTP/2, HTTP/3, and origin-group failover
            </li>
            <li>
              <a href="https://aws.amazon.com/route53/" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">Route 53</a>
              {" — "}DNS with A/AAAA alias records and health-check failover
            </li>
            <li>
              <a href="https://aws.amazon.com/certificate-manager/" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">ACM</a>
              {" — "}SSL/TLS certificate (DNS validated) for{" "}
              <code className="text-sm">www.micahwalter.com</code>
            </li>
            <li>
              <a href="https://github.com/features/actions" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">GitHub Actions</a>
              {" — "}CI/CD with OIDC authentication (no stored credentials)
            </li>
            <li>
              <a href="https://usefathom.com" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">Fathom Analytics</a>
              {" — "}privacy-first analytics; no cookies, no personal data
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-semibold text-charcoal mb-4">
            Architecture
          </h2>
          <p className="mb-6">
            Visitors hit Route 53, which routes to a CloudFront distribution backed
            by two S3 origin groups. A secondary set of S3 buckets in{" "}
            <code className="text-sm">us-east-2</code> receive all objects via
            Cross-Region Replication — CloudFront fails over to them automatically
            if the primary region has an outage. Deployment is fully automated:
            a push to <code className="text-sm">main</code> builds the static
            export and syncs it to S3 in about 3–4 minutes.
          </p>
          <div className="border border-charcoal/10 rounded p-4 bg-cream">
            <MermaidDiagram chart={architectureDiagram} />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-semibold text-charcoal mb-4">
            Content
          </h2>
          <p>
            Posts are{" "}
            <a href="https://mdxjs.com" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">MDX</a>{" "}
            files stored in <code className="text-sm">content/posts/</code> with
            date-prefixed folder names. Three content types share the same system:
          </p>
          <ul className="space-y-1 list-none pl-0 mt-3">
            <li><strong>Blog posts</strong> — essays on AI, cloud, and creativity</li>
            <li><strong>Photo posts</strong> — imported with EXIF extraction and AI-assisted tagging via{" "}
              <a href="https://aws.amazon.com/bedrock/" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">Amazon Bedrock</a>
            </li>
            <li><strong>Email posts</strong> — newsletter issues with a permanent archive URL</li>
          </ul>
          <p className="mt-4">
            Images are optimized into WebP and JPEG at 400, 800, and 1200 px
            widths using{" "}
            <a href="https://sharp.pixelplumbing.com" target="_blank" rel="noopener noreferrer" className="text-charcoal underline hover:text-gray transition-colors">Sharp</a>.
            Originals and processed files are stored in S3 so the repository stays lean.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-semibold text-charcoal mb-4">
            Newsletter
          </h2>
          <p>
            The newsletter backend is serverless, deployed alongside the site on AWS.
            Subscribers double opt-in via HMAC-signed confirmation tokens. Campaigns
            are authored as email posts in MDX and dispatched via EventBridge →
            SQS → a Go Lambda → SES. The subscription API has active-passive
            failover to <code className="text-sm">us-east-2</code> with roughly
            90-second recovery time. You can{" "}
            <Link href="/newsletter" className="text-charcoal underline hover:text-gray transition-colors">
              subscribe here
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-semibold text-charcoal mb-4">
            Design
          </h2>
          <p>
            The palette is intentionally restrained: cream{" "}
            <span className="inline-block w-4 h-4 rounded-sm bg-[#fafaf2] border border-charcoal/20 align-middle" />{" "}
            backgrounds, charcoal{" "}
            <span className="inline-block w-4 h-4 rounded-sm bg-[#191919] align-middle" />{" "}
            text, and a warm accent{" "}
            <span className="inline-block w-4 h-4 rounded-sm bg-[#F5B684] align-middle" />{" "}
            for links and highlights. Body text is set in EB Garamond at a
            645 px reading line length. UI chrome uses system sans-serif fonts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-semibold text-charcoal mb-4">
            Source
          </h2>
          <p>
            The source code for this site is on{" "}
            <a
              href="https://github.com/micahwalter/micahwalter-www"
              target="_blank"
              rel="noopener noreferrer"
              className="text-charcoal underline hover:text-gray transition-colors"
            >
              GitHub
            </a>.
          </p>
        </section>

      </div>
    </div>
  );
}
