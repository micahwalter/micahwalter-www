import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-reading">
        <p className="text-gray text-sm font-semibold tracking-widest uppercase mb-4">404</p>
        <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
          Page not found
        </h1>
        <p className="text-gray text-lg mb-8">
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-charcoal text-cream font-semibold tracking-wide no-underline hover:bg-gray transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
