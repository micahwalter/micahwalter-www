import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You're subscribed",
};

export default function ThankYouPage() {
  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
        You&apos;re subscribed
      </h1>
      <p className="text-gray text-lg leading-relaxed mb-4">
        Thanks for confirming. I&apos;ll be in touch.
      </p>
      <p className="text-gray leading-relaxed mb-10">
        In the meantime,{" "}
        <Link href="/posts" className="text-charcoal underline underline-offset-2">
          read the latest posts
        </Link>
        .
      </p>
    </div>
  );
}
