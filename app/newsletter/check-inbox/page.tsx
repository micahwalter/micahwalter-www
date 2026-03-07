import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Check your inbox",
};

export default function CheckInboxPage() {
  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
        Check your inbox
      </h1>
      <p className="text-gray text-lg leading-relaxed mb-4">
        I&apos;ve sent you a confirmation email. Click the link inside to
        activate your subscription.
      </p>
      <p className="text-gray leading-relaxed mb-10">
        The link expires in 24 hours. If you don&apos;t see it, check your spam
        folder. If it&apos;s not there either,{" "}
        <Link href="/newsletter" className="text-charcoal underline underline-offset-2">
          try subscribing again
        </Link>
        .
      </p>
    </div>
  );
}
