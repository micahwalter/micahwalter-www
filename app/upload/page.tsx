import type { Metadata } from "next";
import UploadForm from "./UploadForm";

// Private admin tool — keep it out of search engines and the sitemap.
export const metadata: Metadata = {
  title: "Upload a photo",
  robots: { index: false, follow: false },
};

export default function UploadPage() {
  return (
    <main className="max-w-reading mx-auto px-6 py-12">
      <h1 className="font-serif font-semibold text-3xl text-charcoal mb-2">
        Upload a photo
      </h1>
      <p className="text-gray mb-8">
        Pick a photo, give it an optional title, and choose whether it should
        headline the homepage. Resizing and metadata extraction happen
        automatically — it&rsquo;ll appear in the photo feed once the site
        rebuilds.
      </p>
      <UploadForm />
    </main>
  );
}
