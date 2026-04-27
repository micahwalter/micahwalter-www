import type { Metadata } from "next";
import Link from "next/link";
import { getSortedSketches } from "@/lib/sketches";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Sketches - Micah Walter",
  description: "Visual explorations, creative experiments, and interactive projects.",
  openGraph: {
    title: "Sketches - Micah Walter",
    description: "Visual explorations, creative experiments, and interactive projects.",
  },
};

const TYPE_LABELS: Record<string, string> = {
  html: "HTML",
  image: "Image",
  p5js: "p5.js",
};

export default function SketchesPage() {
  const sketches = getSortedSketches();

  return (
    <div className="min-h-screen">
      <header className="max-w-wide mx-auto px-6 py-12 border-b border-gray/20">
        <h1 className="font-serif font-semibold text-4xl md:text-5xl mb-4 text-charcoal">
          Sketches
        </h1>
        <p className="text-lg text-gray max-w-reading">
          Visual explorations, creative experiments, and small interactive projects.
        </p>
      </header>

      {sketches.length === 0 ? (
        <div className="max-w-wide mx-auto px-6 py-24 text-center">
          <p className="text-gray text-lg">No sketches yet. Check back soon!</p>
        </div>
      ) : (
        <ul className="max-w-wide mx-auto px-6 py-12 space-y-8">
          {sketches.map((sketch) => (
            <li key={sketch.slug}>
              <Link
                href={`/sketches/${sketch.slug}`}
                className="group no-underline block"
              >
                <article className="border border-gray/20 rounded-lg p-6 hover:border-gray/50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <time className="text-sm text-gray">
                      {format(new Date(sketch.publishedAt), "MMMM d, yyyy")}
                    </time>
                    <span className="text-xs font-semibold tracking-wide uppercase px-2 py-0.5 bg-charcoal text-cream rounded-full">
                      {TYPE_LABELS[sketch.sketchType] ?? sketch.sketchType}
                    </span>
                    {sketch.draft && process.env.NODE_ENV === "development" && (
                      <span className="text-xs font-semibold tracking-wide uppercase px-2 py-0.5 bg-accent/80 text-charcoal rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif font-semibold text-2xl md:text-3xl text-charcoal group-hover:text-gray transition-colors mb-2">
                    {sketch.title}
                  </h2>
                  <p className="text-gray leading-relaxed">{sketch.excerpt}</p>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
