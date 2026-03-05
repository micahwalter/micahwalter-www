import Link from "next/link";
import { getAllPosts } from "@/lib/content";
import { CoverImage } from "@/components/ResponsiveImage";

export default function Home() {
  const posts = getAllPosts();
  const post = posts.find((p) => p.id === "126");

  if (!post || !post.coverImage) return null;

  const coverFilename = post.coverImage
    .replace(/^\.\//, "")
    .replace(/\.(jpg|jpeg|png)$/i, "");

  return (
    <main className="max-w-wide mx-auto px-6 py-12">
      <Link href={`/posts/${post.id}`} className="block no-underline">
        <CoverImage
          folderName={post.folderName}
          filename={coverFilename}
          alt={post.title}
          className="rounded-lg"
          priority={true}
          sizes="(max-width: 768px) 100vw, 1340px"
        />
      </Link>
    </main>
  );
}
