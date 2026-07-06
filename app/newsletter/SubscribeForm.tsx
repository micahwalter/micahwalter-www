"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "fathom-client";
import { storePendingSubscription } from "./ResendConfirmation";

const API_URL = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL;

type Status = "idle" | "submitting" | "conflict" | "error";

export default function SubscribeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [formToken, setFormToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/formtoken`)
      .then((r) => r.json())
      .then((data) => setFormToken(data.token ?? ""))
      .catch(() => {
        // Non-fatal: token will be empty and the Lambda will silently drop the
        // submission, but we don't surface an error to the user here.
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, website, formToken }),
      });

      if (res.status === 202) {
        if (res.headers.get("X-Newsletter-Queued") === "true") {
          trackEvent("Newsletter Signup");
          storePendingSubscription(email, name);
        }
        router.push("/newsletter/check-inbox");
        return;
      }

      const data = await res.json();

      if (res.status === 409) {
        setStatus("conflict");
        return;
      }

      setStatus("error");
      setErrorMsg(data.message || "Something went wrong. Please try again.");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  if (status === "conflict") {
    return (
      <p className="text-gray">
        That address is already subscribed. Check your inbox for previous emails,
        or{" "}
        <button
          onClick={() => setStatus("idle")}
          className="underline text-charcoal"
        >
          try a different address
        </button>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-sm">
      {/* Honeypot: hidden from real users, bots will fill this in */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div>
        <label
          htmlFor="name"
          className="block text-sm text-gray mb-1.5"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          Name <span className="text-gray/60">(optional)</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          className="w-full border border-gray/30 px-4 py-3 text-charcoal bg-cream focus:outline-none focus:border-charcoal transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm text-gray mb-1.5"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          Email <span className="text-charcoal">*</span>
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

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-charcoal text-cream px-8 py-3 text-sm tracking-wide hover:bg-charcoal/80 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {status === "submitting" ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}
