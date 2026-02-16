"use client";

import Link from "next/link";
import { Dialog, DialogPanel } from "@headlessui/react";
import { useState } from "react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchOpen: () => void;
}

export default function MobileMenu({ isOpen, onClose, onSearchOpen }: MobileMenuProps) {
  const [topicsExpanded, setTopicsExpanded] = useState(false);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm" />

      {/* Panel */}
      <div className="fixed inset-0 flex items-start justify-end">
        <DialogPanel className="w-full max-w-sm h-full bg-cream p-6 shadow-xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-charcoal"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Navigation */}
          <nav className="mt-16 space-y-2">
            <Link
              href="/"
              onClick={onClose}
              className="block px-4 py-3 text-lg text-charcoal no-underline hover:bg-charcoal/5 rounded-lg transition-colors"
            >
              Home
            </Link>

            {/* Topics Submenu */}
            <div>
              <button
                onClick={() => setTopicsExpanded(!topicsExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-lg text-charcoal hover:bg-charcoal/5 rounded-lg transition-colors"
              >
                Topics
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`w-5 h-5 transition-transform ${
                    topicsExpanded ? "rotate-180" : ""
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              {topicsExpanded && (
                <div className="ml-4 mt-2 space-y-2">
                  <Link
                    href="/topics/ai"
                    onClick={onClose}
                    className="block px-4 py-2 text-charcoal no-underline hover:bg-charcoal/5 rounded-lg transition-colors"
                  >
                    AI
                  </Link>
                  <Link
                    href="/topics/aws"
                    onClick={onClose}
                    className="block px-4 py-2 text-charcoal no-underline hover:bg-charcoal/5 rounded-lg transition-colors"
                  >
                    AWS
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/photos"
              onClick={onClose}
              className="block px-4 py-3 text-lg text-charcoal no-underline hover:bg-charcoal/5 rounded-lg transition-colors"
            >
              Photos
            </Link>

            <Link
              href="/sketches"
              onClick={onClose}
              className="block px-4 py-3 text-lg text-charcoal no-underline hover:bg-charcoal/5 rounded-lg transition-colors"
            >
              Sketches
            </Link>

            <button
              onClick={() => {
                onClose();
                onSearchOpen();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-lg text-charcoal hover:bg-charcoal/5 rounded-lg transition-colors text-left"
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
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              Search
            </button>
          </nav>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
