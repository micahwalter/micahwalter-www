"use client";

import { useCallback, useEffect, useId, useState } from "react";
import {
  clearAdminToken,
  createGallery,
  listGalleries,
  updateGallery,
  PhotoApiError,
  type PublicGallery,
} from "@/lib/photos-api";

const labelStyle = { fontFamily: "system-ui, -apple-system, sans-serif" };

type GalleryAdminPanelProps = {
  token: string;
  onSessionExpired: () => void;
};

function parseIdList(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function GalleryAdminPanel({
  token,
  onSessionExpired,
}: GalleryAdminPanelProps) {
  const formId = useId();
  const [items, setItems] = useState<PublicGallery[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [coverPhotoId, setCoverPhotoId] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [photoIdsText, setPhotoIdsText] = useState("");
  const [draft, setDraft] = useState(false);
  const [creating, setCreating] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [saveOk, setSaveOk] = useState(false);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const galleries = await listGalleries({ includeDrafts: true, token });
      setItems(galleries);
    } catch (err) {
      if (err instanceof PhotoApiError && err.status === 401) {
        clearAdminToken();
        onSessionExpired();
      }
      setListError("Could not load galleries.");
    } finally {
      setListLoading(false);
    }
  }, [token, onSessionExpired]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  function selectGallery(g: PublicGallery) {
    setCreating(false);
    setSelectedSlug(g.slug);
    setSlug(g.slug);
    setTitle(g.title);
    setDescription(g.description || "");
    setCoverPhotoId(g.coverPhotoId != null ? String(g.coverPhotoId) : "");
    setPublishedAt(g.publishedAt || "");
    setPhotoIdsText((g.photoIds || []).join("\n"));
    setDraft(!!g.draft);
    setFormError("");
    setSaveOk(false);
  }

  function startCreate() {
    setCreating(true);
    setSelectedSlug(null);
    setSlug("");
    setTitle("");
    setDescription("");
    setCoverPhotoId("");
    setPublishedAt(new Date().toISOString().slice(0, 10));
    setPhotoIdsText("");
    setDraft(false);
    setFormError("");
    setSaveOk(false);
  }

  function moveId(index: number, dir: -1 | 1) {
    const ids = parseIdList(photoIdsText);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    const tmp = ids[index];
    ids[index] = ids[j];
    ids[j] = tmp;
    setPhotoIdsText(ids.join("\n"));
  }

  function removeId(index: number) {
    const ids = parseIdList(photoIdsText);
    ids.splice(index, 1);
    setPhotoIdsText(ids.join("\n"));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    setSaveOk(false);
    const photoIds = parseIdList(photoIdsText);
    try {
      if (creating) {
        const created = await createGallery(
          {
            slug,
            title: title.trim(),
            description,
            coverPhotoId: coverPhotoId.trim() || null,
            publishedAt: publishedAt || undefined,
            photoIds,
            draft,
          },
          token,
        );
        setCreating(false);
        selectGallery(created);
        setSaveOk(true);
        await loadList();
      } else if (selectedSlug) {
        const updated = await updateGallery(
          selectedSlug,
          {
            title: title.trim(),
            description,
            coverPhotoId: coverPhotoId.trim() || null,
            publishedAt: publishedAt || undefined,
            photoIds,
            draft,
          },
          token,
        );
        selectGallery(updated);
        setSaveOk(true);
        await loadList();
      }
    } catch (err) {
      if (err instanceof PhotoApiError && err.status === 401) {
        clearAdminToken();
        onSessionExpired();
      }
      setFormError(err instanceof PhotoApiError ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const orderedIds = parseIdList(photoIdsText);

  return (
    <div className="space-y-8 max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-charcoal">Galleries</h2>
        <button
          type="button"
          onClick={startCreate}
          className="text-sm text-charcoal border border-gray/30 px-3 py-1.5 hover:bg-charcoal/5"
          style={labelStyle}
        >
          New gallery
        </button>
      </div>

      {listLoading && (
        <p className="text-sm text-gray" style={labelStyle}>
          Loading…
        </p>
      )}
      {listError && (
        <p className="text-sm text-red-700" style={labelStyle}>
          {listError}{" "}
          <button type="button" className="underline" onClick={loadList}>
            Retry
          </button>
        </p>
      )}

      <ul className="divide-y divide-gray/20 border border-gray/20">
        {items.map((g) => (
          <li key={g.slug}>
            <button
              type="button"
              onClick={() => selectGallery(g)}
              className={`w-full text-left px-3 py-3 hover:bg-charcoal/5 ${
                selectedSlug === g.slug ? "bg-charcoal/5" : ""
              }`}
              style={labelStyle}
            >
              <span className="font-serif text-charcoal">{g.title}</span>
              <span className="block text-xs text-gray">
                /{g.slug}
                {g.draft ? " · draft" : ""}
                {` · ${(g.photoIds || []).length} photos`}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {(creating || selectedSlug) && (
        <form onSubmit={handleSave} className="space-y-4 border-t border-gray/20 pt-8">
          <h3 className="font-serif text-lg text-charcoal">
            {creating ? "Create gallery" : `Edit ${selectedSlug}`}
          </h3>

          {creating && (
            <div>
              <label htmlFor={`${formId}-slug`} className="block text-sm text-gray mb-1" style={labelStyle}>
                Slug
              </label>
              <input
                id={`${formId}-slug`}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                className="w-full border border-gray/30 px-3 py-2 bg-cream"
              />
            </div>
          )}

          <div>
            <label htmlFor={`${formId}-title`} className="block text-sm text-gray mb-1" style={labelStyle}>
              Title
            </label>
            <input
              id={`${formId}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray/30 px-3 py-2 bg-cream"
            />
          </div>

          <div>
            <label htmlFor={`${formId}-desc`} className="block text-sm text-gray mb-1" style={labelStyle}>
              Description
            </label>
            <textarea
              id={`${formId}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray/30 px-3 py-2 bg-cream"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${formId}-cover`} className="block text-sm text-gray mb-1" style={labelStyle}>
                Cover photo id
              </label>
              <input
                id={`${formId}-cover`}
                value={coverPhotoId}
                onChange={(e) => setCoverPhotoId(e.target.value)}
                className="w-full border border-gray/30 px-3 py-2 bg-cream"
              />
            </div>
            <div>
              <label htmlFor={`${formId}-date`} className="block text-sm text-gray mb-1" style={labelStyle}>
                Published
              </label>
              <input
                id={`${formId}-date`}
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full border border-gray/30 px-3 py-2 bg-cream"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer" style={labelStyle}>
            <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} />
            Draft (hidden from public)
          </label>

          <div>
            <label htmlFor={`${formId}-ids`} className="block text-sm text-gray mb-1" style={labelStyle}>
              Photo ids (one per line, order = display order)
            </label>
            <textarea
              id={`${formId}-ids`}
              value={photoIdsText}
              onChange={(e) => setPhotoIdsText(e.target.value)}
              rows={6}
              className="w-full border border-gray/30 px-3 py-2 bg-cream font-mono text-sm"
              placeholder={"140\n139\n138"}
            />
            {orderedIds.length > 0 && (
              <ul className="mt-2 space-y-1">
                {orderedIds.map((id, index) => (
                  <li
                    key={`${id}-${index}`}
                    className="flex items-center gap-2 text-sm text-charcoal"
                    style={labelStyle}
                  >
                    <span className="w-8 text-gray">{index + 1}.</span>
                    <span className="flex-1 font-mono">{id}</span>
                    <button type="button" onClick={() => moveId(index, -1)} className="underline text-xs">
                      Up
                    </button>
                    <button type="button" onClick={() => moveId(index, 1)} className="underline text-xs">
                      Down
                    </button>
                    <button type="button" onClick={() => removeId(index)} className="underline text-xs text-red-700">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {formError && (
            <p className="text-sm text-red-700" style={labelStyle}>
              {formError}
            </p>
          )}
          {saveOk && (
            <p className="text-sm text-charcoal" style={labelStyle}>
              Saved. Public pages update on next load (no site deploy).
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-charcoal text-cream px-8 py-3 text-sm tracking-wide hover:bg-charcoal/80 disabled:opacity-50"
            style={labelStyle}
          >
            {saving ? "Saving…" : creating ? "Create gallery" : "Save changes"}
          </button>
        </form>
      )}
    </div>
  );
}
