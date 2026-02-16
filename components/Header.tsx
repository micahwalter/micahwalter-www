"use client";

import Link from "next/link";
import { useState } from "react";
import TopicsDropdown from "./TopicsDropdown";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-charcoal/10">
        <div className="max-w-wide mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            {/* Brand */}
            <Link
              href="/"
              className="text-xl font-bold tracking-wider no-underline hover:text-gray transition-colors"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              MICAH WALTER
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <TopicsDropdown />
              <Link
                href="/photos"
                className="text-charcoal no-underline hover:text-gray transition-colors"
              >
                Photos
              </Link>
              <Link
                href="/sketches"
                className="text-charcoal no-underline hover:text-gray transition-colors"
              >
                Sketches
              </Link>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-charcoal hover:text-gray transition-colors"
                aria-label="Search"
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
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-charcoal"
              aria-label="Open menu"
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
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onSearchOpen={() => setIsSearchOpen(true)}
      />

      {/* Search Modal */}
      <SearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
