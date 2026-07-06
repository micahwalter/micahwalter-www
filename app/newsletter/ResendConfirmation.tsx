"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL;
const PENDING_KEY = "newsletter-pending";

type Props = {
  /** When true, always show the email field instead of relying on sessionStorage. */
  requireEmail?: boolean;
};

type Status = "idle" | "submitting" | "sent" | "error";

export function readPendingSubscription(): { email: string; name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string; name?: string };
    if (!parsed.email) return null;
    return { email: parsed.email, name: parsed.name ?? "" };
  } catch {
    return null;
  }
}

export function storePendingSubscription(email: string, name: string) {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ email, name }));
}

export default function ResendConfirmation({ requireEmail = false }: Props) {
  const pending = requireEmail ? null : readPendingSubscription();
  const [email, setEmail] = useState(pending?.email ?? "");
  const [name, setName] = useState(pending?.name ?? "");
  const [formToken, setFormToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/formtoken`)
      .then((r) => r.json())
      .then((data) => setFormToken(data.token ?? ""))
      .catch(() => {});
  }, []);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, website: "", formToken }),
      });

      if (res.status === 202) {
        storePendingSubscription(email, name);
        setStatus("sent");
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

  if (status === "sent") {
    return (
      <p className="text-gray leading-relaxed">
        A new confirmation email is on its way. Check your inbox (and spam folder).
      </p>
    );
  }

  return (
    <form onSubmit={handleResend} className="space-y-4 max-w-sm mt-8 pt-8 border-t border-gray/20">
      <p
        className="text-sm text-gray"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        Didn&apos;t get the email?
      </p>

      {(requireEmail || !pending?.email) && (
        <div>
          <label
            htmlFor="resend-email"
            className="block text-sm text-gray mb-1.5"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            Email
          </label>
          <input
            id="resend-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full border border-gray/30 px-4 py-3 text-charcoal bg-cream focus:outline-none focus:border-charcoal transition-colors"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-charcoal text-cream px-6 py-2.5 text-sm tracking-wide hover:bg-charcoal/80 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {status === "submitting" ? "Sending…" : "Resend confirmation email"}
      </button>

      {status === "error" && (
        <p
          className="text-sm text-red-700"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          {errorMsg}
        </p>
      )}
    </form>
  );
}
