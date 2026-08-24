import type { Metadata } from "next";
import Link from "next/link";
import { getEmailPosts } from "@/lib/content";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Email Archive",
  description: "Archive of newsletter issues.",
  path: "/emails",
});

export default function EmailsPage() {
  const emails = getEmailPosts();

  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
        Email Archive
      </h1>
      <p className="text-gray text-lg leading-relaxed mb-10">
        Every newsletter issue, archived for the web.
      </p>

      {emails.length === 0 ? (
        <p className="text-gray">No issues published yet.</p>
      ) : (
        <ul className="space-y-6">
          {emails.map((email) => (
            <li key={email.slug}>
              <Link
                href={`/emails/${email.slug}`}
                className="no-underline group"
              >
                <p className="text-sm text-gray mb-1">{email.publishedAt}</p>
                <h2 className="font-serif text-2xl text-charcoal group-hover:text-accent transition-colors">
                  {email.title}
                </h2>
                {email.excerpt && (
                  <p className="text-gray mt-1 leading-relaxed">{email.excerpt}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
