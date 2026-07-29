"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { format } from "date-fns";
import {
  clearAdminToken,
  getPhoto,
  listPhotos,
  parseTagsInput,
  photoCoverFilename,
  photoIdString,
  updatePhoto,
  sendExposureTest,
  PhotoApiError,
  type PublicPhoto,
} from "@/lib/photos-api";
import { CoverImage } from "@/components/ResponsiveImage";

const labelStyle = { fontFamily: "system-ui, -apple-system, sans-serif" };

type PhotoEditPanelProps = {
  token: string;
  initialEditId?: string | null;
  onSessionExpired: () => void;
};

export default function PhotoEditPanel({
  token,
  initialEditId,
  onSessionExpired,
}: PhotoEditPanelProps) {
  const formId = useId();
  const [items, setItems] = useState<PublicPhoto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(initialEditId || null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [featured, setFeatured] = useState(false);
  const [exposureEligible, setExposureEligible] = useState(false);
  const [exposureSentAt, setExposureSentAt] = useState<string | null>(null);
  const [exposureIssueNumber, setExposureIssueNumber] = useState<number | null>(null);
  const [preview, setPreview] = useState<PublicPhoto | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formError, setFormError] = useState("");
  const [saveOk, setSaveOk] = useState(false);
  const [testOk, setTestOk] = useState("");

  const loadList = useCallback(async (append = false, nextCursor?: string | null) => {
    if (!append) setListLoading(true);
    setListError("");
    try {
      const page = await listPhotos({
        limit: 12,
        cursor: append ? nextCursor : null,
      });
      setItems((prev) => (append ? [...prev, ...page.items] : page.items));
      setCursor(page.cursor);
    } catch {
      setListError("Could not load photos.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList(false);
  }, [loadList]);

  const loadPhoto = useCallback(
    async (id: string) => {
      setFormLoading(true);
      setFormError("");
      setSaveOk(false);
      setTestOk("");
      setSelectedId(id);
      try {
        const photo = await getPhoto(id);
        setPreview(photo);
        setTitle(photo.title || "");
        setCaption(photo.caption || "");
        setTagsText((photo.tags || []).join(", "));
        setFeatured(!!photo.featured);
        setExposureEligible(!!photo.exposureEligible);
        setExposureSentAt(photo.exposureSentAt || null);
        setExposureIssueNumber(
          photo.exposureIssueNumber != null ? Number(photo.exposureIssueNumber) : null,
        );
      } catch (err) {
        setPreview(null);
        if (err instanceof PhotoApiError && err.status === 404) {
          setFormError("Photo not found.");
        } else {
          setFormError("Could not load photo.");
        }
      } finally {
        setFormLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (initialEditId) {
      loadPhoto(initialEditId);
    }
  }, [initialEditId, loadPhoto]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || saving) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setFormError("Title cannot be empty.");
      return;
    }

    setSaving(true);
    setFormError("");
    setSaveOk(false);
    try {
      const updated = await updatePhoto(
        selectedId,
        {
          title: trimmed,
          caption,
          tags: parseTagsInput(tagsText),
          featured,
          exposureEligible,
        },
        token,
      );
      setPreview(updated);
      setTitle(updated.title || "");
      setCaption(updated.caption || "");
      setTagsText((updated.tags || []).join(", "));
      setFeatured(!!updated.featured);
      setExposureEligible(!!updated.exposureEligible);
      setExposureSentAt(updated.exposureSentAt || null);
      setExposureIssueNumber(
        updated.exposureIssueNumber != null ? Number(updated.exposureIssueNumber) : null,
      );
      setSaveOk(true);
      setItems((prev) =>
        prev.map((p) => (photoIdString(p) === photoIdString(updated) ? updated : p)),
      );
    } catch (err) {
      if (err instanceof PhotoApiError && err.status === 401) {
        clearAdminToken();
        onSessionExpired();
        setFormError(err.message);
      } else if (err instanceof PhotoApiError) {
        setFormError(err.message);
      } else {
        setFormError("Could not save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleExposureTest() {
    if (!selectedId || testing || saving) return;
    setTesting(true);
    setFormError("");
    setTestOk("");
    try {
      const result = await sendExposureTest(selectedId, token);
      setTestOk(result.message || "Test Exposure queued to AdminEmail.");
    } catch (err) {
      if (err instanceof PhotoApiError && err.status === 401) {
        clearAdminToken();
        onSessionExpired();
        setFormError(err.message);
      } else if (err instanceof PhotoApiError) {
        setFormError(err.message);
      } else {
        setFormError("Could not send test Exposure.");
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h2 className="font-serif text-xl text-charcoal mb-3">Recent photos</h2>
        {listLoading && <p className="text-sm text-gray" style={labelStyle}>Loading…</p>}
        {listError && (
          <p className="text-sm text-red-700 mb-2" style={labelStyle}>
            {listError}{" "}
            <button type="button" className="underline" onClick={() => loadList(false)}>
              Retry
            </button>
          </p>
        )}
        {!listLoading && items.length === 0 && !listError && (
          <p className="text-sm text-gray" style={labelStyle}>
            No photos in the API yet.
          </p>
        )}
        <ul className="divide-y divide-gray/20 border border-gray/20">
          {items.map((photo) => {
            const id = photoIdString(photo);
            const active = selectedId === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => loadPhoto(id)}
                  className={`w-full text-left px-3 py-3 flex gap-3 items-center hover:bg-charcoal/5 transition-colors ${
                    active ? "bg-charcoal/5" : ""
                  }`}
                  style={labelStyle}
                >
                  <div className="w-14 h-14 shrink-0 overflow-hidden bg-gray/10">
                    <CoverImage
                      folderName={photo.folderName}
                      filename={photoCoverFilename(photo)}
                      alt=""
                      className="w-full h-full object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-charcoal truncate">{photo.title}</p>
                    <p className="text-xs text-gray">
                      #{id}
                      {photo.publishedAt
                        ? ` · ${format(new Date(photo.publishedAt), "MMM d, yyyy")}`
                        : ""}
                      {photo.featured ? " · Featured" : ""}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        {cursor && (
          <button
            type="button"
            onClick={() => loadList(true, cursor)}
            className="mt-3 text-sm text-charcoal underline hover:text-accent"
            style={labelStyle}
          >
            Load more
          </button>
        )}
      </div>

      {selectedId && (
        <form onSubmit={handleSave} className="space-y-5 border-t border-gray/20 pt-8">
          <h2 className="font-serif text-xl text-charcoal">Edit photo #{selectedId}</h2>

          {formLoading && (
            <p className="text-sm text-gray" style={labelStyle}>
              Loading photo…
            </p>
          )}

          {!formLoading && preview && (
            <div className="w-full max-w-xs overflow-hidden rounded bg-gray/10">
              <CoverImage
                folderName={preview.folderName}
                filename={photoCoverFilename(preview)}
                alt={preview.title}
                className="w-full h-auto"
                sizes="320px"
              />
            </div>
          )}

          <div>
            <label htmlFor={`${formId}-title`} className="block text-sm text-gray mb-1" style={labelStyle}>
              Title
            </label>
            <input
              id={`${formId}-title`}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={formLoading || saving}
              required
              className="w-full border border-gray/30 px-3 py-2 text-charcoal bg-cream focus:outline-none focus:border-charcoal disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor={`${formId}-caption`} className="block text-sm text-gray mb-1" style={labelStyle}>
              Caption
            </label>
            <textarea
              id={`${formId}-caption`}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={formLoading || saving}
              rows={3}
              className="w-full border border-gray/30 px-3 py-2 text-charcoal bg-cream focus:outline-none focus:border-charcoal disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor={`${formId}-tags`} className="block text-sm text-gray mb-1" style={labelStyle}>
              Tags <span className="text-gray/60">(comma-separated)</span>
            </label>
            <input
              id={`${formId}-tags`}
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              disabled={formLoading || saving}
              placeholder="street, brooklyn, night"
              className="w-full border border-gray/30 px-3 py-2 text-charcoal bg-cream focus:outline-none focus:border-charcoal disabled:opacity-60"
            />
          </div>

          <label className="flex items-center gap-3 text-charcoal cursor-pointer" style={labelStyle}>
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              disabled={formLoading || saving || testing}
              className="h-4 w-4"
            />
            Feature on homepage
          </label>

          <label className="flex items-center gap-3 text-charcoal cursor-pointer" style={labelStyle}>
            <input
              type="checkbox"
              checked={exposureEligible}
              onChange={(e) => setExposureEligible(e.target.checked)}
              disabled={formLoading || saving || testing}
              className="h-4 w-4"
            />
            Eligible for Exposure
          </label>

          {(exposureSentAt || exposureIssueNumber != null) && (
            <p className="text-sm text-gray" style={labelStyle}>
              Sent as Exposure
              {exposureIssueNumber != null ? ` #${exposureIssueNumber}` : ""}
              {exposureSentAt
                ? ` · ${format(new Date(exposureSentAt), "MMM d, yyyy")}`
                : ""}
            </p>
          )}

          {formError && (
            <p className="text-sm text-red-700" style={labelStyle}>
              {formError}
            </p>
          )}
          {saveOk && (
            <p className="text-sm text-charcoal" style={labelStyle}>
              Saved. Public pages will show the update on next load (no site deploy).
            </p>
          )}
          {testOk && (
            <p className="text-sm text-charcoal" style={labelStyle}>
              {testOk}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={formLoading || saving || testing || !selectedId}
              className="bg-charcoal text-cream px-8 py-3 text-sm tracking-wide hover:bg-charcoal/80 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              style={labelStyle}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={handleExposureTest}
              disabled={formLoading || saving || testing || !selectedId || !preview}
              className="border border-charcoal text-charcoal px-8 py-3 text-sm tracking-wide hover:bg-charcoal/5 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              style={labelStyle}
            >
              {testing ? "Sending test…" : "Send test Exposure"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
