/**
 * ResponsiveImage Component
 *
 * Renders responsive images with WebP support and JPEG fallback.
 * Uses the <picture> element with srcset for optimal image selection.
 *
 * Features:
 * - Automatic WebP with JPEG fallback
 * - Responsive sizing (400px, 800px, 1200px)
 * - Lazy loading
 * - SEO-friendly alt text
 * - Optional zoom on click (desktop only)
 *
 * Usage:
 *   <ResponsiveImage
 *     src="/images/posts/slug/cover"
 *     alt="Cover image description"
 *     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 1200px"
 *     zoomable={true}
 *   />
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface ResponsiveImageProps {
  /** Base path to image without extension or size suffix (e.g., "/images/posts/slug/cover") */
  src: string;
  /** Alt text for accessibility and SEO */
  alt: string;
  /** Sizes attribute for responsive images (defaults to full width with max-width constraints) */
  sizes?: string;
  /** CSS class name for styling */
  className?: string;
  /** Priority loading (disables lazy loading) */
  priority?: boolean;
  /** Width for aspect ratio calculation (optional) */
  width?: number;
  /** Height for aspect ratio calculation (optional) */
  height?: number;
  /** Enable zoom on click (desktop only, defaults to false) */
  zoomable?: boolean;
  /** Constrain image to viewport height on desktop so the full image is visible without scrolling (Flickr-style) */
  viewportFit?: boolean;
}

const SIZES = [400, 800, 1200];
const CDN_BASE = process.env.NEXT_PUBLIC_CDN_URL || '';

/**
 * Generate srcset string for a given format
 */
function generateSrcSet(baseSrc: string, format: 'webp' | 'jpg'): string {
  return SIZES.map(size => `${CDN_BASE}${baseSrc}-${size}.${format} ${size}w`).join(', ');
}

/**
 * Default sizes attribute that works well for most layouts
 * - Mobile: full width
 * - Tablet: 800px max
 * - Desktop: 1200px max
 */
const DEFAULT_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 800px, 1200px';

export default function ResponsiveImage({
  src,
  alt,
  sizes = DEFAULT_SIZES,
  className = '',
  priority = false,
  width,
  height,
  zoomable = false,
  viewportFit = false,
}: ResponsiveImageProps) {
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
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isZoomed]);

  const handleClick = useCallback(() => {
    if (zoomable && !isMobile) {
      setIsZoomed(!isZoomed);
    }
  }, [zoomable, isMobile, isZoomed]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setIsZoomed(false);
      }
    },
    []
  );

  // Generate srcsets for WebP and JPEG
  const webpSrcSet = generateSrcSet(src, 'webp');
  const jpegSrcSet = generateSrcSet(src, 'jpg');

  // Fallback src (1200px JPEG for zoom, 800px for normal)
  const fallbackSrc = `${CDN_BASE}${src}-800.jpg`;
  const zoomedSrc = `${CDN_BASE}${src}-1200.jpg`;

  // Calculate aspect ratio for placeholder if dimensions provided
  const aspectRatio = width && height ? (height / width) * 100 : undefined;

  const pictureClassName = zoomable && !isMobile
    ? `${className} cursor-zoom-in hover:opacity-90 transition-opacity`
    : className;

  // When viewportFit, constrain the image to viewport height on desktop so
  // the full image (portrait or landscape) is always visible without scrolling.
  const imgStyle = viewportFit
    ? { width: '100%', height: 'auto' }
    : aspectRatio
      ? { aspectRatio: `${width} / ${height}`, width: '100%', height: 'auto' }
      : { width: '100%', height: 'auto' };

  const imgClassName = viewportFit
    ? 'object-contain md:max-h-[calc(100vh-180px)]'
    : 'object-cover';

  return (
    <>
      <picture className={pictureClassName} onClick={handleClick}>
        {/* WebP source (preferred, smaller file size) */}
        <source srcSet={webpSrcSet} type="image/webp" sizes={sizes} />

        {/* JPEG source (fallback for older browsers) */}
        <source srcSet={jpegSrcSet} type="image/jpeg" sizes={sizes} />

        {/* Fallback img element */}
        <img
          src={fallbackSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={imgStyle}
          className={imgClassName}
        />
      </picture>

      {/* Zoom overlay */}
      {isZoomed && zoomable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/95 cursor-zoom-out animate-fadeIn"
          onClick={handleOverlayClick}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] p-4">
            <picture>
              <source srcSet={webpSrcSet} type="image/webp" sizes="95vw" />
              <source srcSet={jpegSrcSet} type="image/jpeg" sizes="95vw" />
              <img
                src={zoomedSrc}
                alt={alt}
                className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl animate-zoomIn"
                onClick={() => setIsZoomed(false)}
              />
            </picture>

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

/**
 * Variant for cover images that uses folder name for image paths
 */
interface CoverImageProps extends Omit<ResponsiveImageProps, 'src'> {
  /** Post folder name (e.g., "2024-01-15-building-ai-agents") */
  folderName: string;
  /** Image filename without extension (e.g., "cover") */
  filename?: string;
}

export function CoverImage({
  folderName,
  filename = 'cover',
  ...props
}: CoverImageProps) {
  const src = `/images/posts/${folderName}/${filename}`;

  return <ResponsiveImage src={src} {...props} />;
}
