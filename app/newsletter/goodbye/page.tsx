import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You've been unsubscribed",
};

export default function GoodbyePage() {
  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
        You&apos;ve been unsubscribed
      </h1>
      <p className="text-gray text-lg leading-relaxed mb-4">
        You won&apos;t receive any more emails from me.
      </p>
      <p className="text-gray leading-relaxed mb-10">
        Changed your mind?{" "}
        <Link
          href="/newsletter"
          className="text-charcoal underline underline-offset-2"
        >
          Subscribe again
        </Link>
        .
      </p>
    </div>
  );
}
