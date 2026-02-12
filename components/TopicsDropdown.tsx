"use client";

import Link from "next/link";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

export default function TopicsDropdown() {
  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center gap-1 text-charcoal no-underline hover:text-gray transition-colors">
        Topics
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </MenuButton>

      <MenuItems
        className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-cream border border-charcoal/10 shadow-lg focus:outline-none"
        transition
      >
        <div className="p-2">
          <MenuItem>
            {({ focus }) => (
              <Link
                href="/topics/ai"
                className={`block px-4 py-2 rounded-md text-charcoal no-underline transition-colors ${
                  focus ? "bg-charcoal/5" : ""
                }`}
              >
                AI
              </Link>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <Link
                href="/topics/aws"
                className={`block px-4 py-2 rounded-md text-charcoal no-underline transition-colors ${
                  focus ? "bg-charcoal/5" : ""
                }`}
              >
                AWS
              </Link>
            )}
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
}
