import type { Metadata } from "next";
import UploadHub from "./UploadHub";

// Private admin tool — keep it out of search engines and the sitemap.
export const metadata: Metadata = {
  title: "Photos admin",
  robots: { index: false, follow: false },
};

export default function UploadPage() {
  return (
    <main className="max-w-reading mx-auto px-6 py-12">
      <h1 className="font-serif font-semibold text-3xl text-charcoal mb-2">
        Photos admin
      </h1>
      <p className="text-gray mb-8">
        Upload new photos, edit metadata, manage galleries, or review the
        Exposure pool and what has already been sent. Changes go through the
        photo API — no site rebuild required.
      </p>
      <UploadHub />
    </main>
  );
}
