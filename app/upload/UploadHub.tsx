"use client";

import { Suspense, useEffect, useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  authWithPasscode,
  clearAdminToken,
  getAdminToken,
  setAdminToken,
  PhotoApiError,
} from "@/lib/photos-api";
import UploadForm from "./UploadForm";
import PhotoEditPanel from "./PhotoEditPanel";
import GalleryAdminPanel from "./GalleryAdminPanel";

const labelStyle = { fontFamily: "system-ui, -apple-system, sans-serif" };

type Tab = "upload" | "edit" | "galleries";

function UploadHubInner() {
  const formId = useId();
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");

  const [token, setToken] = useState("");
  const [passcode, setPasscode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [tab, setTab] = useState<Tab>(editParam ? "edit" : "upload");

  useEffect(() => {
    const existing = getAdminToken();
    if (existing) setToken(existing);
  }, []);

  useEffect(() => {
    if (editParam) setTab("edit");
  }, [editParam]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    try {
      const data = await authWithPasscode(passcode);
      setAdminToken(data.token);
      setToken(data.token);
      setPasscode("");
    } catch (err) {
      if (err instanceof PhotoApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Could not reach the server. Please try again.");
      }
    }
  }

  function handleSessionExpired() {
    clearAdminToken();
    setToken("");
    setErrorMsg("Your session expired. Please enter the passcode again.");
  }

  function handleLock() {
    clearAdminToken();
    setToken("");
  }

  if (!token) {
    return (
      <form onSubmit={handleUnlock} className="space-y-5 max-w-sm">
        <div>
          <label
            htmlFor={`${formId}-passcode`}
            className="block text-sm text-gray mb-1.5"
            style={labelStyle}
          >
            Passcode
          </label>
          <input
            id={`${formId}-passcode`}
            type="password"
            required
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoComplete="current-password"
            className="w-full border border-gray/30 px-4 py-3 text-charcoal bg-cream focus:outline-none focus:border-charcoal transition-colors"
          />
        </div>
        {errorMsg && (
          <p className="text-sm text-red-700" style={labelStyle}>
            {errorMsg}
          </p>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray/20 pb-4">
        <div className="flex gap-2" role="tablist" aria-label="Photos admin">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "upload"}
            onClick={() => setTab("upload")}
            className={`px-4 py-2 text-sm tracking-wide transition-colors ${
              tab === "upload"
                ? "bg-charcoal text-cream"
                : "text-charcoal border border-gray/30 hover:bg-charcoal/5"
            }`}
            style={labelStyle}
          >
            Upload
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "edit"}
            onClick={() => setTab("edit")}
            className={`px-4 py-2 text-sm tracking-wide transition-colors ${
              tab === "edit"
                ? "bg-charcoal text-cream"
                : "text-charcoal border border-gray/30 hover:bg-charcoal/5"
            }`}
            style={labelStyle}
          >
            Edit
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "galleries"}
            onClick={() => setTab("galleries")}
            className={`px-4 py-2 text-sm tracking-wide transition-colors ${
              tab === "galleries"
                ? "bg-charcoal text-cream"
                : "text-charcoal border border-gray/30 hover:bg-charcoal/5"
            }`}
            style={labelStyle}
          >
            Galleries
          </button>
        </div>
        <button
          type="button"
          onClick={handleLock}
          className="text-sm text-gray hover:text-charcoal"
          style={labelStyle}
        >
          Lock
        </button>
      </div>

      {errorMsg && (
        <p className="text-sm text-red-700" style={labelStyle}>
          {errorMsg}
        </p>
      )}

      {tab === "upload" && (
        <UploadForm token={token} onSessionExpired={handleSessionExpired} />
      )}
      {tab === "edit" && (
        <PhotoEditPanel
          token={token}
          initialEditId={editParam}
          onSessionExpired={handleSessionExpired}
        />
      )}
      {tab === "galleries" && (
        <GalleryAdminPanel token={token} onSessionExpired={handleSessionExpired} />
      )}
    </div>
  );
}

export default function UploadHub() {
  return (
    <Suspense fallback={<p className="text-gray text-sm">Loading…</p>}>
      <UploadHubInner />
    </Suspense>
  );
}
