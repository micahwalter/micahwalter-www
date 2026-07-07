import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/content";
import PostContent from "@/components/PostContent";
import PostLayout from "@/components/PostLayout";
import PhotoLayout from "@/components/PhotoLayout";
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

const SITE_URL = "https://micahwalter.com";

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

  const postUrl = `${SITE_URL}/posts/${slug}`;

  let ogImage: string | undefined;
  if (post.coverImage) {
    const coverFilename = post.coverImage
      .replace(/^\.\//, '')
      .replace(/\.(jpg|jpeg|png)$/i, '');
    ogImage = `${SITE_URL}/images/posts/${post.folderName}/${coverFilename}-1200.jpg`;
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: postUrl,
      publishedTime: post.publishedAt,
      tags: post.tags,
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            width: 1200,
            alt: post.title,
          },
        ],
      }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: post.title,
      description: post.excerpt,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const content = <PostContent content={post.content} folderName={post.folderName} />;

  if (post.type === 'photo') {
    return <PhotoLayout post={post}>{content}</PhotoLayout>;
  }

  return <PostLayout post={post}>{content}</PostLayout>;
}
