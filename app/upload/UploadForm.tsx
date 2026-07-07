"use client";

import { useState } from "react";

// Base URL for the photo upload API, e.g. https://api.micahwalter.com/photos
const API_URL = process.env.NEXT_PUBLIC_PHOTO_API_URL;

type Phase = "locked" | "ready" | "uploading" | "done" | "error";

const labelStyle = { fontFamily: "system-ui, -apple-system, sans-serif" };

export default function UploadForm() {
  const [phase, setPhase] = useState<Phase>("locked");
  const [passcode, setPasscode] = useState("");
  const [token, setToken] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [featured, setFeatured] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ---- Step 1: exchange the passcode for a short-lived signed token --------
  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setPasscode("");
        setPhase("ready");
        return;
      }
      setErrorMsg(
        res.status === 401
          ? "Incorrect passcode."
          : "Could not sign in. Please try again."
      );
    } catch {
      setErrorMsg("Could not reach the server. Please try again.");
    }
  }

  // ---- Step 2: get a presigned URL, then PUT the file straight to S3 -------
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setPhase("uploading");
    setErrorMsg("");

    try {
      // Ask the API for a presigned PUT URL. Title + featured ride along as
      // object metadata so the processing step can read them.
      const initRes = await fetch(`${API_URL}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          title: title.trim(),
          featured,
        }),
      });

      if (initRes.status === 401) {
        setToken("");
        setPhase("locked");
        setErrorMsg("Your session expired. Please enter the passcode again.");
        return;
      }
      if (!initRes.ok) {
        throw new Error("init failed");
      }

      const { url, headers } = await initRes.json();

      // Upload the original bytes directly to S3 using the signed headers.
      const putRes = await fetch(url, {
        method: "PUT",
        headers,
        body: file,
      });
      if (!putRes.ok) {
        throw new Error("upload failed");
      }

      setPhase("done");
    } catch {
      setPhase("error");
      setErrorMsg("Upload failed. Please try again.");
    }
  }

  // -------------------------------------------------------------------------
  if (phase === "locked") {
    return (
      <form onSubmit={handleUnlock} className="space-y-5 max-w-sm">
        <div>
          <label htmlFor="passcode" className="block text-sm text-gray mb-1.5" style={labelStyle}>
            Passcode
          </label>
          <input
            id="passcode"
            type="password"
            required
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoComplete="current-password"
            className="w-full border border-gray/30 px-4 py-3 text-charcoal bg-cream focus:outline-none focus:border-charcoal transition-colors"
          />
        </div>
        {errorMsg && (
          <p className="text-sm text-red-700" style={labelStyle}>{errorMsg}</p>
        )}
        <button
          type="submit"
          className="bg-charcoal text-cream px-8 py-3 text-sm tracking-wide hover:bg-charcoal/80 transition-colors cursor-pointer"
          style={labelStyle}
        >
          Unlock
        </button>
      </form>
    );
  }

  if (phase === "done") {
    return (
      <div className="max-w-sm space-y-4">
        <p className="text-charcoal">
          ✅ Uploaded. The photo is being processed and will appear in the feed
          {featured ? " and on the homepage" : ""} once the site rebuilds
          (about 3&ndash;4 minutes).
        </p>
        <button
          onClick={() => {
            setFile(null);
            setTitle("");
            setFeatured(false);
            setPhase("ready");
          }}
          className="bg-charcoal text-cream px-8 py-3 text-sm tracking-wide hover:bg-charcoal/80 transition-colors cursor-pointer"
          style={labelStyle}
        >
          Upload another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleUpload} className="space-y-5 max-w-sm">
      <div>
        <label htmlFor="photo" className="block text-sm text-gray mb-1.5" style={labelStyle}>
          Photo <span className="text-charcoal">*</span>
        </label>
        <input
          id="photo"
          type="file"
          required
          accept="image/jpeg,image/png"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-charcoal"
          style={labelStyle}
        />
      </div>

      <div>
        <label htmlFor="title" className="block text-sm text-gray mb-1.5" style={labelStyle}>
          Title <span className="text-gray/60">(optional)</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Leave blank to use the filename"
          className="w-full border border-gray/30 px-4 py-3 text-charcoal bg-cream focus:outline-none focus:border-charcoal transition-colors"
        />
      </div>

      <label className="flex items-center gap-3 text-charcoal cursor-pointer" style={labelStyle}>
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="h-4 w-4"
        />
        Feature on homepage
      </label>

      {phase === "error" && errorMsg && (
        <p className="text-sm text-red-700" style={labelStyle}>{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={phase === "uploading" || !file}
        className="bg-charcoal text-cream px-8 py-3 text-sm tracking-wide hover:bg-charcoal/80 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        style={labelStyle}
      >
        {phase === "uploading" ? "Uploading…" : "Upload photo"}
      </button>
    </form>
  );
}
