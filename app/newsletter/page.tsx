import type { Metadata } from "next";
import SubscribeForm from "./SubscribeForm";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "Occasional writing on AI, cloud infrastructure, and creativity — plus a photograph most Sundays.",
};

export default function NewsletterPage() {
  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
        Newsletter
      </h1>
      <p className="text-gray text-lg leading-relaxed mb-10">
        Occasional writing on AI, cloud infrastructure, and creativity — plus a
        photograph most Sundays. No noise. Unsubscribe any time.
      </p>
      <SubscribeForm />
    </div>
  );
}
