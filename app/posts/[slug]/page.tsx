import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/content";
import PostLayout from "@/components/PostLayout";
import PhotoLayout from "@/components/PhotoLayout";
import { getMDXComponents } from "@/components/MDXComponents";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const mdxContent = (
    <MDXRemote
      source={post.content}
      components={getMDXComponents(post.folderName)}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeHighlight],
        },
      }}
    />
  );

  // Use PhotoLayout for photo posts, PostLayout for blog posts
  if (post.type === 'photo') {
    return <PhotoLayout post={post}>{mdxContent}</PhotoLayout>;
  }

  return <PostLayout post={post}>{mdxContent}</PostLayout>;
}
