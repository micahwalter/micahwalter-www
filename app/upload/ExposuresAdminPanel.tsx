"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  clearAdminToken,
  getExposureQueue,
  photoCoverFilename,
  photoIdString,
  PhotoApiError,
  type PublicPhoto,
} from "@/lib/photos-api";
import {
  listExposures,
  exposureCoverFilename,
  ExposuresApiError,
  type PublicExposure,
} from "@/lib/exposures-api";
import { CoverImage } from "@/components/ResponsiveImage";

const labelStyle = { fontFamily: "system-ui, -apple-system, sans-serif" };

type ExposuresAdminPanelProps = {
  token: string;
  onSessionExpired: () => void;
};

export default function ExposuresAdminPanel({
  token,
  onSessionExpired,
}: ExposuresAdminPanelProps) {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<PublicPhoto[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState("");

  const [sent, setSent] = useState<PublicExposure[]>([]);
  const [sentCursor, setSentCursor] = useState<string | null>(null);
  const [sentLoading, setSentLoading] = useState(true);
  const [sentError, setSentError] = useState("");

  const loadUpcoming = useCallback(async () => {
    setUpcomingLoading(true);
    setUpcomingError("");
    try {
      const page = await getExposureQueue(token);
      setUpcoming(page.upcoming);
    } catch (err) {
      if (err instanceof PhotoApiError && err.status === 401) {
        clearAdminToken();
        onSessionExpired();
      }
      setUpcomingError(
        err instanceof PhotoApiError ? err.message : "Could not load the Exposure queue.",
      );
    } finally {
      setUpcomingLoading(false);
    }
  }, [token, onSessionExpired]);

  const loadSent = useCallback(async (append = false, nextCursor?: string | null) => {
    if (!append) setSentLoading(true);
    setSentError("");
    try {
      const page = await listExposures({
        limit: 12,
        cursor: append ? nextCursor : null,
      });
      setSent((prev) => (append ? [...prev, ...page.items] : page.items));
      setSentCursor(page.cursor);
    } catch (err) {
      setSentError(
        err instanceof ExposuresApiError ? err.message : "Could not load sent Exposures.",
      );
    } finally {
      setSentLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  useEffect(() => {
    loadSent(false);
  }, [loadSent]);

  function openEdit(id: string) {
    router.push(`/upload?edit=${encodeURIComponent(id)}`);
  }

  const weeks = upcoming.length;

  return (
    <div className="space-y-10 max-w-xl">
      <section>
        <h2 className="font-serif text-xl text-charcoal mb-2">Upcoming pool</h2>
        <p className="text-sm text-gray mb-4" style={labelStyle}>
          These photos are eligible and not yet sent. Each Sunday at 9:00 AM Eastern,
          one is chosen at random — this is not a fixed order.
          {weeks > 0 ? ` About ${weeks} week${weeks === 1 ? "" : "s"} of inventory.` : ""}
        </p>

        {upcomingLoading && (
          <p className="text-sm text-gray" style={labelStyle}>
            Loading…
          </p>
        )}
        {upcomingError && (
          <p className="text-sm text-red-700" style={labelStyle}>
            {upcomingError}{" "}
            <button type="button" className="underline" onClick={loadUpcoming}>
              Retry
            </button>
          </p>
        )}
        {!upcomingLoading && !upcomingError && upcoming.length === 0 && (
          <p className="text-sm text-gray" style={labelStyle}>
            Nothing in the pool. Mark photos Eligible for Exposure on the Edit tab
            (or when uploading). Sunday will email you if the pool is still empty.
          </p>
        )}

        {!upcomingLoading && !upcomingError && upcoming.length > 0 && (
          <ul className="divide-y divide-gray/20 border border-gray/20">
            {upcoming.map((photo) => {
              const id = photoIdString(photo);
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => openEdit(id)}
                    className="w-full text-left px-3 py-3 flex gap-3 items-center hover:bg-charcoal/5 transition-colors"
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
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl text-charcoal mb-2">Already sent</h2>
        <p className="text-sm text-gray mb-4" style={labelStyle}>
          Production Exposure issues, newest first.
        </p>

        {sentLoading && sent.length === 0 && (
          <p className="text-sm text-gray" style={labelStyle}>
            Loading…
          </p>
        )}
        {sentError && (
          <p className="text-sm text-red-700" style={labelStyle}>
            {sentError}{" "}
            <button type="button" className="underline" onClick={() => loadSent(false)}>
              Retry
            </button>
          </p>
        )}
        {!sentLoading && !sentError && sent.length === 0 && (
          <p className="text-sm text-gray" style={labelStyle}>
            No Exposures have been sent yet.
          </p>
        )}

        {sent.length > 0 && (
          <ul className="divide-y divide-gray/20 border border-gray/20">
            {sent.map((exp) => (
              <li key={exp.issueNumber} className="px-3 py-3 flex gap-3 items-center">
                <Link
                  href={`/exposures/${exp.issueNumber}`}
                  className="w-14 h-14 shrink-0 overflow-hidden bg-gray/10"
                >
                  {exp.folderName ? (
                    <CoverImage
                      folderName={exp.folderName}
                      filename={exposureCoverFilename(exp)}
                      alt=""
                      className="w-full h-full object-cover"
                      sizes="56px"
                    />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1" style={labelStyle}>
                  <p className="font-serif text-charcoal truncate">{exp.title}</p>
                  <p className="text-xs text-gray">
                    Exposure #{exp.issueNumber}
                    {exp.sentAt ? ` · ${format(new Date(exp.sentAt), "MMM d, yyyy")}` : ""}
                  </p>
                  <p className="text-xs mt-1 space-x-3">
                    <Link
                      href={`/exposures/${exp.issueNumber}`}
                      className="underline text-charcoal hover:text-accent"
                    >
                      Archive
                    </Link>
                    {exp.photoId ? (
                      <button
                        type="button"
                        onClick={() => openEdit(String(exp.photoId))}
                        className="underline text-charcoal hover:text-accent"
                      >
                        Edit photo
                      </button>
                    ) : null}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {sentCursor && (
          <button
            type="button"
            onClick={() => loadSent(true, sentCursor)}
            className="mt-3 text-sm text-charcoal underline hover:text-accent"
            style={labelStyle}
          >
            Load more
          </button>
        )}
      </section>
    </div>
  );
}
