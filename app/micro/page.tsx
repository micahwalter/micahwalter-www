import type { Metadata } from "next";
import { getAllToots } from "@/lib/mastodon";
import PaginatedTootList from "@/components/PaginatedTootList";

export const metadata: Metadata = {
  title: "Micro",
  description:
    "Short posts and thoughts from my Mastodon account @micah@micah.social, archived here on my own site.",
};

export default function MicroPage() {
  const toots = getAllToots();

  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
        Micro
      </h1>
      <p className="text-gray text-lg leading-relaxed mb-2">
        Short posts and thoughts, fetched from my Mastodon account at{" "}
        <a
          href="https://micah.social/@micah"
          target="_blank"
          rel="noopener noreferrer"
          className="text-charcoal underline decoration-accent underline-offset-2 hover:text-accent transition-colors"
        >
          @micah@micah.social
        </a>
        .
      </p>
      <p className="text-gray text-base leading-relaxed mb-10">
        This archive is generated at build time — new posts appear here after
        each site deploy. To follow in real time, find me on Mastodon.
      </p>

      {toots.length === 0 ? (
        <p className="text-gray">No posts yet.</p>
      ) : (
        <PaginatedTootList toots={toots} />
      )}
    </div>
  );
}
