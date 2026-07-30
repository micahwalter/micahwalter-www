"use client";

import { useId, useState } from "react";
import {
  clearAdminToken,
  getUploadUrl,
  putToPresignedUrl,
  PhotoApiError,
} from "@/lib/photos-api";

const MAX_FILES = 20;
const CONCURRENCY = 3;
const ALLOWED = new Set(["image/jpeg", "image/png"]);

type ItemStatus = "pending" | "uploading" | "done" | "error";

type UploadItem = {
  localId: string;
  file: File;
  title: string;
  caption: string;
  featured: boolean;
  exposureEligible: boolean;
  status: ItemStatus;
  progress: number | null;
  errorMessage: string | null;
  previewUrl: string;
};

const labelStyle = { fontFamily: "system-ui, -apple-system, sans-serif" };

function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  return base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function newLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const next = queue.shift();
      if (!next) return;
      await worker(next);
    }
  });
  await Promise.all(runners);
}

type UploadFormProps = {
  token: string;
  onSessionExpired: () => void;
};

export default function UploadForm({ token, onSessionExpired }: UploadFormProps) {
  const formId = useId();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadingBatch, setUploadingBatch] = useState(false);

  function updateItem(localId: string, patch: Partial<UploadItem>) {
    setItems((prev) =>
      prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it)),
    );
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) return;
    setErrorMsg("");

    const incoming: UploadItem[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(fileList)) {
      if (!ALLOWED.has(file.type)) {
        rejected.push(file.name);
        continue;
      }
      incoming.push({
        localId: newLocalId(),
        file,
        title: titleFromFilename(file.name),
        caption: "",
        featured: false,
        exposureEligible: false,
        status: "pending",
        progress: null,
        errorMessage: null,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (rejected.length) {
      setErrorMsg(
        `Only JPEG and PNG are supported. Skipped: ${rejected.slice(0, 3).join(", ")}${
          rejected.length > 3 ? "…" : ""
        }`,
      );
    }

    setItems((prev) => {
      const room = MAX_FILES - prev.length;
      if (room <= 0) {
        setErrorMsg(`You can select at most ${MAX_FILES} files.`);
        incoming.forEach((it) => URL.revokeObjectURL(it.previewUrl));
        return prev;
      }
      if (incoming.length > room) {
        setErrorMsg(`Only ${MAX_FILES} files allowed; added the first ${room}.`);
        incoming.slice(room).forEach((it) => URL.revokeObjectURL(it.previewUrl));
        return [...prev, ...incoming.slice(0, room)];
      }
      return [...prev, ...incoming];
    });
  }

  function removeItem(localId: string) {
    setItems((prev) => {
      const target = prev.find((it) => it.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((it) => it.localId !== localId);
    });
  }

  function clearDone() {
    setItems((prev) => {
      prev.filter((it) => it.status === "done").forEach((it) => URL.revokeObjectURL(it.previewUrl));
      return prev.filter((it) => it.status !== "done");
    });
  }

  async function handleUploadAll(e: React.FormEvent) {
    e.preventDefault();
    const pending = items.filter((it) => it.status === "pending" || it.status === "error");
    if (!pending.length || uploadingBatch) return;

    setUploadingBatch(true);
    setErrorMsg("");

    let sessionExpired = false;

    await mapPool(pending, CONCURRENCY, async (item) => {
      if (sessionExpired) return;
      updateItem(item.localId, { status: "uploading", progress: 0, errorMessage: null });
      try {
        const { url, headers } = await getUploadUrl({
          token,
          filename: item.file.name,
          contentType: item.file.type || "application/octet-stream",
          title: item.title.trim(),
          caption: item.caption,
          featured: item.featured,
          exposureEligible: item.exposureEligible,
        });
        await putToPresignedUrl(url, headers, item.file, (percent) => {
          updateItem(item.localId, { progress: percent });
        });
        updateItem(item.localId, { status: "done", progress: 100 });
      } catch (err) {
        if (err instanceof PhotoApiError && err.status === 401) {
          sessionExpired = true;
          clearAdminToken();
          onSessionExpired();
          setErrorMsg(err.message);
          updateItem(item.localId, {
            status: "error",
            progress: null,
            errorMessage: "Session expired",
          });
          return;
        }
        updateItem(item.localId, {
          status: "error",
          progress: null,
          errorMessage: err instanceof Error ? err.message : "Upload failed",
        });
      }
    });

    setUploadingBatch(false);
  }

  const pendingCount = items.filter((it) => it.status === "pending" || it.status === "error").length;
  const doneCount = items.filter((it) => it.status === "done").length;

  return (
    <form onSubmit={handleUploadAll} className="space-y-6 max-w-xl">
      <div>
        <label htmlFor={`${formId}-photos`} className="block text-sm text-gray mb-1.5" style={labelStyle}>
          Photos <span className="text-charcoal">*</span>
          <span className="text-gray/60"> (JPEG/PNG, up to {MAX_FILES})</span>
        </label>
        <input
          id={`${formId}-photos`}
          type="file"
          multiple
          accept="image/jpeg,image/png"
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
          className="w-full text-charcoal"
          style={labelStyle}
          disabled={uploadingBatch || items.length >= MAX_FILES}
        />
      </div>

      {items.length > 0 && (
        <ul className="space-y-6">
          {items.map((item) => (
            <li
              key={item.localId}
              className="border-t border-gray/20 pt-5 first:border-t-0 first:pt-0"
            >
              <div className="flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt=""
                  className="h-20 w-20 object-cover bg-gray/10 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-gray truncate" style={labelStyle}>
                      {item.file.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.localId)}
                      disabled={item.status === "uploading" || uploadingBatch}
                      className="text-sm text-gray hover:text-charcoal disabled:opacity-40"
                      style={labelStyle}
                    >
                      Remove
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor={`${formId}-title-${item.localId}`}
                      className="block text-sm text-gray mb-1"
                      style={labelStyle}
                    >
                      Title
                    </label>
                    <input
                      id={`${formId}-title-${item.localId}`}
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(item.localId, { title: e.target.value })}
                      disabled={item.status === "uploading" || item.status === "done"}
                      className="w-full border border-gray/30 px-3 py-2 text-charcoal bg-cream focus:outline-none focus:border-charcoal transition-colors disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`${formId}-caption-${item.localId}`}
                      className="block text-sm text-gray mb-1"
                      style={labelStyle}
                    >
                      Caption <span className="text-gray/60">(optional)</span>
                    </label>
                    <textarea
                      id={`${formId}-caption-${item.localId}`}
                      value={item.caption}
                      onChange={(e) => updateItem(item.localId, { caption: e.target.value })}
                      disabled={item.status === "uploading" || item.status === "done"}
                      rows={2}
                      className="w-full border border-gray/30 px-3 py-2 text-charcoal bg-cream focus:outline-none focus:border-charcoal transition-colors disabled:opacity-60"
                    />
                  </div>

                  <label className="flex items-center gap-3 text-charcoal cursor-pointer" style={labelStyle}>
                    <input
                      type="checkbox"
                      checked={item.featured}
                      onChange={(e) => updateItem(item.localId, { featured: e.target.checked })}
                      disabled={item.status === "uploading" || item.status === "done"}
                      className="h-4 w-4"
                    />
                    Feature on homepage
                  </label>

                  <label className="flex items-center gap-3 text-charcoal cursor-pointer" style={labelStyle}>
                    <input
                      type="checkbox"
                      checked={item.exposureEligible}
                      onChange={(e) =>
                        updateItem(item.localId, { exposureEligible: e.target.checked })
                      }
                      disabled={item.status === "uploading" || item.status === "done"}
                      className="h-4 w-4"
                    />
                    Eligible for Exposure
                  </label>

                  <p className="text-sm" style={labelStyle}>
                    {item.status === "pending" && <span className="text-gray">Ready</span>}
                    {item.status === "uploading" && (
                      <span className="text-charcoal">
                        Uploading{item.progress != null ? `… ${item.progress}%` : "…"}
                      </span>
                    )}
                    {item.status === "done" && (
                      <span className="text-charcoal">Done — processing on the server (no site deploy needed)</span>
                    )}
                    {item.status === "error" && (
                      <span className="text-red-700">{item.errorMessage || "Failed"}</span>
                    )}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {errorMsg && (
        <p className="text-sm text-red-700" style={labelStyle}>{errorMsg}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={uploadingBatch || pendingCount === 0}
          className="bg-charcoal text-cream px-8 py-3 text-sm tracking-wide hover:bg-charcoal/80 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          style={labelStyle}
        >
          {uploadingBatch
            ? "Uploading…"
            : pendingCount
              ? `Upload ${pendingCount} photo${pendingCount === 1 ? "" : "s"}`
              : "Upload"}
        </button>
        {doneCount > 0 && (
          <button
            type="button"
            onClick={clearDone}
            disabled={uploadingBatch}
            className="border border-charcoal/30 text-charcoal px-6 py-3 text-sm tracking-wide hover:bg-charcoal/5 transition-colors disabled:opacity-50"
            style={labelStyle}
          >
            Clear finished
          </button>
        )}
      </div>
    </form>
  );
}
