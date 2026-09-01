/**
 * Canonical page paths for Fathom Analytics.
 *
 * Mirrors legacy post redirect rules in infra/infra.yml StaticHTMLRoutingFunction
 * so pageviews aggregate under /posts/[slug] even if HTML loads on a legacy path.
 */

const RESERVED_SEGMENTS = new Set([
  "about",
  "colophon",
  "emails",
  "exposures",
  "galleries",
  "micro",
  "newsletter",
  "photos",
  "posts",
  "sketches",
  "tokens",
  "upload",
  "tags",
  "topics",
  "page",
]);

function isValidMonth(month: string): boolean {
  if (!/^\d{2}$/.test(month)) return false;
  const n = parseInt(month, 10);
  return n >= 1 && n <= 12;
}

function isFourDigitYear(segment: string): boolean {
  return /^\d{4}$/.test(segment);
}

function isTwoDigit(segment: string): boolean {
  return /^\d{2}$/.test(segment);
}

/**
 * Map a pathname to the canonical Fathom page path.
 * Archive pages (/YYYY, /YYYY/MM) and reserved routes are unchanged.
 */
export function toFathomPagePath(pathname: string): string {
  let path = pathname;
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  const parts = path.split("/").filter(Boolean);
  const count = parts.length;

  if (count === 0) {
    return pathname;
  }

  // /YYYY/MM/DD/slug
  if (
    count === 4 &&
    isFourDigitYear(parts[0]) &&
    isValidMonth(parts[1]) &&
    isTwoDigit(parts[2])
  ) {
    return `/posts/${parts[3]}`;
  }

  // /YYYY/MM/slug — month archives are only /YYYY/MM (count === 2)
  if (count === 3 && isFourDigitYear(parts[0]) && isValidMonth(parts[1])) {
    return `/posts/${parts[2]}`;
  }

  // /YYYY/slug where slug is not a month number
  if (count === 2 && isFourDigitYear(parts[0]) && !isValidMonth(parts[1])) {
    return `/posts/${parts[1]}`;
  }

  // /slug at site root (legacy WordPress-style permalinks)
  if (
    count === 1 &&
    !isFourDigitYear(parts[0]) &&
    !RESERVED_SEGMENTS.has(parts[0])
  ) {
    return `/posts/${parts[0]}`;
  }

  return pathname;
}
