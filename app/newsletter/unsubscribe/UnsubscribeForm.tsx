"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL;

type Status = "idle" | "loading" | "submitting" | "error";

export default function UnsubscribeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-submit if a signed token is present in the URL
  useEffect(() => {
    if (!token) return;
    setStatus("loading");

    async function autoUnsubscribe() {
      try {
        const res = await fetch(`${API_URL}/unsubscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          router.replace("/newsletter/goodbye");
          return;
        }

        const data = await res.json();
        setStatus("error");
        setErrorMsg(data.message || "Something went wrong.");
      } catch {
        setStatus("error");
        setErrorMsg("Something went wrong. Please try again.");
      }
    }

    autoUnsubscribe();
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        router.push("/newsletter/goodbye");
        return;
      }

      const data = await res.json();
      setStatus("error");
      setErrorMsg(data.message || "Something went wrong. Please try again.");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  // Token path: show loading while auto-submitting
  if (token && status === "loading") {
    return (
      <div className="max-w-reading mx-auto px-6 py-12">
        <p className="text-gray text-lg italic">Unsubscribing…</p>
      </div>
    );
  }

  // Token path: error state
  if (token && status === "error") {
    return (
      <div className="max-w-reading mx-auto px-6 py-12">
        <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
          Something went wrong
        </h1>
        <p className="text-gray text-lg leading-relaxed mb-8">{errorMsg}</p>
        <p className="text-gray">
          You can also enter your email below to unsubscribe manually.
        </p>
      </div>
    );
  }

  // Manual form path (no token, or token errored and we fall through)
  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-sm">
      <div>
        <label
          htmlFor="email"
          className="block text-sm text-gray mb-1.5"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full border border-gray/30 px-4 py-3 text-charcoal bg-cream focus:outline-none focus:border-charcoal transition-colors"
        />
      </div>

      {status === "error" && (
        <p
          className="text-sm text-red-700"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          {errorMsg}
        </p>
      )}

      <div className="flex items-center gap-6">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="bg-charcoal text-cream px-8 py-3 text-sm tracking-wide hover:bg-charcoal/80 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          {status === "submitting" ? "Unsubscribing…" : "Unsubscribe"}
        </button>
        <Link
          href="/newsletter"
          className="text-sm text-gray hover:text-charcoal transition-colors"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          Never mind
        </Link>
      </div>
    </form>
  );
}
