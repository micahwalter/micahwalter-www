"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackEvent } from "fathom-client";

const API_URL = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL;

type Status = "loading" | "success" | "expired" | "error" | "no-token";

export default function ConfirmHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    async function confirm() {
      try {
        const res = await fetch(`${API_URL}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          trackEvent("Newsletter Confirmed");
          router.replace("/newsletter/thank-you");
          return;
        }

        const data = await res.json();
        setMessage(data.message || "Something went wrong.");
        setStatus(res.status === 410 ? "expired" : "error");
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    }

    confirm();
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="max-w-reading mx-auto px-6 py-12">
        <p className="text-gray text-lg italic">Confirming your subscription…</p>
      </div>
    );
  }

  if (status === "no-token") {
    return (
      <div className="max-w-reading mx-auto px-6 py-12">
        <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
          Invalid link
        </h1>
        <p className="text-gray text-lg leading-relaxed mb-8">
          This confirmation link is missing a token.
        </p>
        <Link
          href="/newsletter"
          className="text-charcoal underline underline-offset-2"
        >
          Subscribe again →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-reading mx-auto px-6 py-12">
      <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
        {status === "expired" ? "Link expired" : "Invalid link"}
      </h1>
      <p className="text-gray text-lg leading-relaxed mb-8">{message}</p>
      <Link
        href="/newsletter"
        className="text-charcoal underline underline-offset-2"
      >
        Subscribe again →
      </Link>
    </div>
  );
}
