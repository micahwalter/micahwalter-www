import type { Metadata } from "next";
import UploadForm from "./UploadForm";

// Private admin tool — keep it out of search engines and the sitemap.
export const metadata: Metadata = {
  title: "Upload photos",
  robots: { index: false, follow: false },
};

export default function UploadPage() {
  return (
    <main className="max-w-reading mx-auto px-6 py-12">
      <h1 className="font-serif font-semibold text-3xl text-charcoal mb-2">
        Upload photos
      </h1>
      <p className="text-gray mb-8">
        Select one or more JPEG/PNG files, set a title, caption, and featured
        flag per photo, then upload. Processing and AI tags run on the server —
        new photos show up through the photo API without waiting for a full
        site rebuild.
      </p>
      <UploadForm />
    </main>
  );
}
