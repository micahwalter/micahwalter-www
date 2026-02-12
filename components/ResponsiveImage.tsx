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
 *
 * Usage:
 *   <ResponsiveImage
 *     src="/images/posts/slug/cover"
 *     alt="Cover image description"
 *     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 1200px"
 *   />
 */

import React from 'react';

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
}: ResponsiveImageProps) {
  // Generate srcsets for WebP and JPEG
  const webpSrcSet = generateSrcSet(src, 'webp');
  const jpegSrcSet = generateSrcSet(src, 'jpg');

  // Fallback src (800px JPEG)
  const fallbackSrc = `${CDN_BASE}${src}-800.jpg`;

  // Calculate aspect ratio for placeholder if dimensions provided
  const aspectRatio = width && height ? (height / width) * 100 : undefined;

  return (
    <picture className={className}>
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
        style={
          aspectRatio
            ? {
                aspectRatio: `${width} / ${height}`,
                width: '100%',
                height: 'auto',
              }
            : { width: '100%', height: 'auto' }
        }
        className="object-cover"
      />
    </picture>
  );
}

/**
 * Variant for cover images that extracts slug and filename from path
 */
interface CoverImageProps extends Omit<ResponsiveImageProps, 'src'> {
  /** Post slug */
  slug: string;
  /** Image filename without extension (e.g., "cover") */
  filename?: string;
}

export function CoverImage({
  slug,
  filename = 'cover',
  ...props
}: CoverImageProps) {
  const src = `/images/posts/${slug}/${filename}`;

  return <ResponsiveImage src={src} {...props} />;
}
