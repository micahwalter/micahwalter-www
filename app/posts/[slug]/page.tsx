import { notFound, redirect } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/content";
import PostContent from "@/components/PostContent";
import PostLayout from "@/components/PostLayout";
import PhotoLayout from "@/components/PhotoLayout";
import type { Metadata } from "next";
import { postCoverOgImage, withSocial } from "@/lib/seo";

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

  return withSocial({
    title: post.title,
    description: post.excerpt,
    path: `/posts/${slug}`,
    image: postCoverOgImage(post),
    type: "article",
    publishedTime: post.publishedAt,
    tags: post.tags,
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  // Dev/local parity with CloudFront: numeric photo ids live under /photos/<id>
  if (/^\d+$/.test(slug)) {
    redirect(`/photos/${slug}`);
  }

  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const content = <PostContent content={post.content} folderName={post.folderName} />;

  if (post.type === 'photo') {
    // Prefer canonical /photos/<id> when the markdown photo still has a numeric id
    if (post.id && /^\d+$/.test(String(post.id))) {
      redirect(`/photos/${post.id}`);
    }
    return <PhotoLayout post={post}>{content}</PhotoLayout>;
  }

  return <PostLayout post={post}>{content}</PostLayout>;
}
