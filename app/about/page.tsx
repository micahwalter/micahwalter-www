import type { Metadata } from "next";
import Link from "next/link";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "About",
  description: "About Micah Walter — technologist, photographer, and writer exploring AI, cloud, and creativity.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-charcoal mb-4">
          About
        </h1>
      </header>

      <div className="prose prose-lg font-serif text-charcoal space-y-6">
        <p>
          I&apos;m Micah Walter — a technologist, photographer, and writer based in the United
          States. My work sits at the intersection of artificial intelligence, cloud infrastructure,
          and creative practice.
        </p>

        <p>
          I spend most of my time thinking about how emerging technologies reshape the way we
          make things, share ideas, and understand the world. I&apos;ve spent years building
          software, leading engineering teams, and exploring what it means to work creatively
          in a field that moves as fast as this one does.
        </p>

        <p>
          Outside of writing and code, I make photographs. I&apos;m drawn to landscapes, light,
          and the quiet moments that don&apos;t announce themselves. Photography keeps me honest
          — it&apos;s a practice that rewards slowing down.
        </p>

        <p>
          This site is where I collect my thinking: essays on AI and cloud technology, photo
          posts, and occasional longer pieces on writing and craft. I also send a{" "}
          <Link href="/newsletter" className="text-charcoal underline hover:text-gray transition-colors">
            newsletter
          </Link>{" "}
          when I have something worth saying.
        </p>

        <h2 className="text-2xl font-serif font-semibold text-charcoal mt-12 mb-4">
          Elsewhere
        </h2>

        <ul className="space-y-2 list-none pl-0">
          <li>
            <a
              href="https://github.com/micahwalter"
              className="text-charcoal underline hover:text-gray transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/micahwalter"
              className="text-charcoal underline hover:text-gray transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
