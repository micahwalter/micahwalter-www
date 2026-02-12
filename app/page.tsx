import { getPaginatedPosts } from "@/lib/content";
import PostGrid from "@/components/PostGrid";
import Pagination from "@/components/Pagination";

export default function Home() {
  const { posts, totalPages, currentPage } = getPaginatedPosts(1, 10);

  return (
    <>
      <PostGrid posts={posts} featuredFirst />
      <div className="max-w-wide mx-auto px-6 pb-12">
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
