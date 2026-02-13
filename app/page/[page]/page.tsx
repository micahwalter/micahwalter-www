import { getPaginatedPosts, getSortedPosts } from "@/lib/content";
import PostGrid from "@/components/PostGrid";
import Pagination from "@/components/Pagination";

interface Props {
  params: Promise<{ page: string }>;
}

export async function generateStaticParams() {
  const posts = getSortedPosts();
  const totalPages = Math.ceil(posts.length / 10);

  return Array.from({ length: totalPages }, (_, i) => ({
    page: String(i + 1),
  }));
}

export default async function Page({ params }: Props) {
  const { page } = await params;
  const pageNumber = parseInt(page, 10);
  const { posts, totalPages, currentPage } = getPaginatedPosts(pageNumber, 10);

  return (
    <>
      <PostGrid posts={posts} featuredFirst={false} />
      <div className="max-w-wide mx-auto px-6 pb-12">
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
