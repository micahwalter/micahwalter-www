"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Post } from "@/lib/content";

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);

  // Load posts on mount
  useEffect(() => {
    if (isOpen && allPosts.length === 0) {
      fetch("/posts.json")
        .then((res) => res.json())
        .then((posts) => setAllPosts(posts))
        .catch(() => {
          // Fallback: posts will be empty
        });
    }
  }, [isOpen, allPosts.length]);

  // Filter posts based on query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerms = query.toLowerCase().split(" ");
    const filtered = allPosts.filter((post) => {
      const searchableText = `
        ${post.title}
        ${post.excerpt}
        ${post.tags.join(" ")}
        ${post.category}
      `.toLowerCase();

      return searchTerms.every((term) => searchableText.includes(term));
    });

    setResults(filtered.slice(0, 10));
  }, [query, allPosts]);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm" />

      {/* Panel */}
      <div className="fixed inset-0 flex items-start justify-center p-4 pt-20">
        <DialogPanel className="w-full max-w-2xl bg-cream rounded-lg shadow-xl">
          {/* Search Input */}
          <div className="p-4 border-b border-charcoal/10">
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-gray"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search posts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-charcoal placeholder-gray outline-none text-lg"
                autoFocus
              />
              <button
                onClick={handleClose}
                className="text-gray hover:text-charcoal transition-colors"
                aria-label="Close search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query && results.length === 0 && (
              <div className="p-8 text-center text-gray">
                No posts found for "{query}"
              </div>
            )}

            {results.length > 0 && (
              <div className="divide-y divide-charcoal/10">
                {results.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/posts/${post.slug}`}
                    onClick={handleClose}
                    className="block p-4 hover:bg-charcoal/5 transition-colors no-underline"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="mb-1">
                          <span className="inline-block px-2 py-0.5 text-xs font-semibold tracking-wide uppercase bg-charcoal text-cream rounded">
                            {post.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-serif font-semibold text-charcoal mb-1">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!query && (
              <div className="p-8 text-center text-gray">
                Start typing to search posts...
              </div>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
