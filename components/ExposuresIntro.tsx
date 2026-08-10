import Link from "next/link";

/**
 * Shared project blurb for /exposures and /exposures/[n].
 */
export default function ExposuresIntro({ className = "" }: { className?: string }) {
  return (
    <p className={`text-lg text-gray max-w-reading leading-relaxed ${className}`.trim()}>
      Exposure is a periodic photo newsletter — one photograph and a few words,
      sent most Sundays.{" "}
      <Link
        href="/newsletter"
        className="text-charcoal underline underline-offset-2 hover:text-accent transition-colors"
      >
        Subscribe
      </Link>{" "}
      to get the next one by email.
    </p>
  );
}
