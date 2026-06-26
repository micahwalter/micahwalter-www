import { notFound } from "next/navigation";
import { getEmailPosts } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import type { Metadata } from "next";

interface EmailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const emails = getEmailPosts();
  if (emails.length === 0) return [{ slug: "_placeholder" }];
  return emails.map((email) => ({ slug: email.slug }));
}

const SITE_URL = "https://micahwalter.com";

export async function generateMetadata({
  params,
}: EmailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const emails = getEmailPosts();
  const email = emails.find((e) => e.slug === slug);

  if (!email) {
    return { title: "Not Found" };
  }

  return {
    title: email.title,
    description: email.excerpt,
    openGraph: {
      title: email.title,
      description: email.excerpt,
      type: "article",
      url: `${SITE_URL}/emails/${slug}`,
      publishedTime: email.publishedAt,
    },
  };
}

export default async function EmailPage({ params }: EmailPageProps) {
  const { slug } = await params;
  const emails = getEmailPosts();
  const email = emails.find((e) => e.slug === slug);

  if (!email) {
    notFound();
  }

  const htmlContent = await renderMarkdown(email.content, email.folderName);

  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <p className="text-sm text-gray mb-2">{email.publishedAt}</p>
      <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-8">
        {email.title}
      </h1>
      <div
        className="prose-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
