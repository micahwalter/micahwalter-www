import { notFound } from "next/navigation";
import Link from "next/link";
import { getSortedSketches, getSketchBySlug } from "@/lib/sketches";
import { renderMarkdown } from "@/lib/markdown";
import { format } from "date-fns";
import type { Metadata } from "next";

interface SketchPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const sketches = getSortedSketches();
  if (sketches.length === 0) return [{ slug: "_placeholder" }];
  return sketches.map((s) => ({ slug: s.slug }));
}

const SITE_URL = "https://micahwalter.com";

export async function generateMetadata({
  params,
}: SketchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sketch = getSketchBySlug(slug);

  if (!sketch) return { title: "Not Found" };

  return {
    title: `${sketch.title} - Micah Walter`,
    description: sketch.excerpt,
    openGraph: {
      title: sketch.title,
      description: sketch.excerpt,
      type: "article",
      url: `${SITE_URL}/sketches/${slug}`,
      publishedTime: sketch.publishedAt,
    },
  };
}

export default async function SketchPage({ params }: SketchPageProps) {
  const { slug } = await params;
  const sketch = getSketchBySlug(slug);

  if (!sketch || slug === "_placeholder") notFound();

  const htmlContent = sketch.content.trim()
    ? await renderMarkdown(sketch.content)
    : '';

  return (
    <div className="min-h-screen">
      <header className="max-w-wide mx-auto px-6 py-10 border-b border-gray/20">
        <Link
          href="/sketches"
          className="text-sm text-gray no-underline hover:text-charcoal transition-colors mb-6 inline-block"
        >
          ← Sketches
        </Link>
        <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-3">
          {sketch.title}
        </h1>
        <time className="text-sm text-gray">
          {format(new Date(sketch.publishedAt), "MMMM d, yyyy")}
        </time>
      </header>

      {/* Sketch viewer */}
      <div className="max-w-wide mx-auto px-6 py-10">
        {sketch.sketchType === "html" && (
          <div className="w-full border border-gray/20 rounded-lg overflow-hidden">
            <iframe
              src={`/sketch-files/${slug}/sketch.html`}
              title={sketch.title}
              className="w-full"
              style={{ height: "640px", border: "none" }}
              loading="lazy"
            />
          </div>
        )}

        {sketch.sketchType === "image" && sketch.previewImage && (
          <div className="w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sketch.previewImage}
              alt={sketch.title}
              className="w-full rounded-lg"
            />
          </div>
        )}

        {htmlContent && (
          <div
            className="prose-content max-w-reading mt-8"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>
    </div>
  );
}
