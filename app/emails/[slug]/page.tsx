import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getEmailPosts } from "@/lib/content";
import { getMDXComponents } from "@/components/MDXComponents";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Metadata } from "next";

interface EmailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  if (process.env.NODE_ENV !== "production") return [];
  const emails = getEmailPosts();
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

  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <p className="text-sm text-gray mb-2">{email.publishedAt}</p>
      <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-8">
        {email.title}
      </h1>
      <div className="prose-styles">
        <MDXRemote
          source={email.content}
          components={getMDXComponents(email.folderName)}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeHighlight],
            },
          }}
        />
      </div>
    </div>
  );
}
