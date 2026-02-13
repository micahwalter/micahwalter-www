"use client";

import { useState, useEffect, useCallback } from "react";

interface ZoomableImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export default function ZoomableImage({
  src,
  alt,
  className = "",
}: ZoomableImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle ESC key to close zoom
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isZoomed) {
        setIsZoomed(false);
      }
    };

    if (isZoomed) {
      document.addEventListener("keydown", handleEscape);
      // Prevent scrolling when zoomed
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isZoomed]);

  const handleClick = useCallback(() => {
    // Only enable zoom on desktop
    if (!isMobile) {
      setIsZoomed(!isZoomed);
    }
  }, [isMobile, isZoomed]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // Close if clicking the overlay (not the image)
      if (e.target === e.currentTarget) {
        setIsZoomed(false);
      }
    },
    []
  );

  if (!src) return null;

  return (
    <>
      {/* Original image with click handler */}
      <img
        src={src}
        alt={alt}
        className={`${className} ${!isMobile ? "cursor-zoom-in hover:opacity-90 transition-opacity" : ""}`}
        onClick={handleClick}
        loading="lazy"
      />

      {/* Zoom overlay (only rendered when zoomed) */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/95 cursor-zoom-out animate-fadeIn"
          onClick={handleOverlayClick}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] p-4">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl animate-zoomIn"
              onClick={() => setIsZoomed(false)}
            />

            {/* Close button */}
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-8 right-8 text-cream hover:text-accent transition-colors text-4xl font-light leading-none"
              aria-label="Close zoom"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
