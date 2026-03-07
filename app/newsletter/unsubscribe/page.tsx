import type { Metadata } from "next";
import { Suspense } from "react";
import UnsubscribeForm from "./UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe",
};

export default function UnsubscribePage() {
  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
        Unsubscribe
      </h1>
      <p className="text-gray text-lg leading-relaxed mb-10">
        Enter your email address and I&apos;ll remove you from the list immediately.
      </p>
      <Suspense
        fallback={
          <p className="text-gray italic">Loading…</p>
        }
      >
        <UnsubscribeForm />
      </Suspense>
    </div>
  );
}
