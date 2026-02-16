import { format } from "date-fns";
import type { Post } from "@/lib/content";

interface ExifDisplayProps {
  post: Post;
}

export default function ExifDisplay({ post }: ExifDisplayProps) {
  const hasExif = post.camera || post.lens || post.aperture || post.shutterSpeed || post.iso || post.focalLength || post.dateTaken || post.location;

  if (!hasExif) {
    return null;
  }

  // Format date taken if available
  const formattedDateTaken = post.dateTaken
    ? format(new Date(post.dateTaken), "MMMM d, yyyy 'at' h:mm a")
    : null;

  // Check if we have any settings
  const hasSettings = post.aperture || post.shutterSpeed || post.iso || post.focalLength;

  return (
    <div className="bg-gray/5 rounded-lg p-6 border border-gray/10">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray mb-4">
        Photo Information
      </h3>

      <dl className="space-y-4">
        {/* Camera Equipment */}
        {(post.camera || post.lens) && (
          <div className="pb-4 border-b border-gray/10">
            <dt className="text-xs uppercase tracking-wide text-gray/70 mb-3 font-semibold">
              Equipment
            </dt>
            <dd className="space-y-2">
              {post.camera && (
                <div className="text-sm text-charcoal">
                  <span className="text-gray/60">Camera:</span>{' '}
                  <span className="font-medium">{post.camera}</span>
                </div>
              )}
              {post.lens && (
                <div className="text-sm text-charcoal">
                  <span className="text-gray/60">Lens:</span>{' '}
                  <span className="font-medium">{post.lens}</span>
                </div>
              )}
            </dd>
          </div>
        )}

        {/* Camera Settings */}
        {hasSettings && (
          <div className="pb-4 border-b border-gray/10">
            <dt className="text-xs uppercase tracking-wide text-gray/70 mb-3 font-semibold">
              Settings
            </dt>
            <dd className="grid grid-cols-2 gap-2">
              {post.aperture && (
                <div className="text-sm">
                  <div className="text-gray/60 text-xs">Aperture</div>
                  <div className="text-charcoal font-mono font-medium">{post.aperture}</div>
                </div>
              )}
              {post.shutterSpeed && (
                <div className="text-sm">
                  <div className="text-gray/60 text-xs">Shutter</div>
                  <div className="text-charcoal font-mono font-medium">{post.shutterSpeed}</div>
                </div>
              )}
              {post.iso && (
                <div className="text-sm">
                  <div className="text-gray/60 text-xs">ISO</div>
                  <div className="text-charcoal font-mono font-medium">{post.iso}</div>
                </div>
              )}
              {post.focalLength && (
                <div className="text-sm">
                  <div className="text-gray/60 text-xs">Focal Length</div>
                  <div className="text-charcoal font-mono font-medium">{post.focalLength}</div>
                </div>
              )}
            </dd>
          </div>
        )}

        {/* Photo Details */}
        {(formattedDateTaken || post.location) && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray/70 mb-3 font-semibold">
              Details
            </dt>
            <dd className="space-y-2">
              {formattedDateTaken && (
                <div className="text-sm text-charcoal">
                  <span className="text-gray/60">Captured:</span>{' '}
                  <span className="font-medium">{formattedDateTaken}</span>
                </div>
              )}
              {post.location && (
                <div className="text-sm text-charcoal">
                  <span className="text-gray/60">Location:</span>{' '}
                  <span className="font-medium">{post.location}</span>
                </div>
              )}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
