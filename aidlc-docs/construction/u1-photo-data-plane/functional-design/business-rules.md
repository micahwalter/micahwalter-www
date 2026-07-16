# U1 — Business Rules

## Identity & time

| ID | Rule |
|----|------|
| BR-U1-01 | Photo primary key is ticket-allocated `id` (string form of integer for API stability). |
| BR-U1-02 | Every write sets `updatedAt` (ISO-8601). Create also sets `createdAt`. |
| BR-U1-03 | `publishedAt` is the publish calendar date (`YYYY-MM-DD`) at process time (not EXIF capture date). |

## Visibility & enrichment

| ID | Rule |
|----|------|
| BR-U1-04 | New successful process writes use `enrichmentStatus = pending`. |
| BR-U1-05 | Pending photos are **publicly listable and gettable** (may lack tags/geo until U2). |
| BR-U1-06 | Public list/get **omit** records with `draft = true`. Authenticated get may include drafts. |

## Defaults

| ID | Rule |
|----|------|
| BR-U1-07 | If title missing/blank → sanitized filename (strip extension; humanize separators). |
| BR-U1-08 | If caption missing/blank → `Photo taken with {camera}` when EXIF camera present; else `""`. |
| BR-U1-09 | New uploads default `draft = false` unless init metadata explicitly sets draft (if supported later). |

## Listing & featured

| ID | Rule |
|----|------|
| BR-U1-10 | Public list sort: `publishedAt` DESC, then `id` DESC. |
| BR-U1-11 | Pagination: `limit` + opaque cursor (not offset pages). |
| BR-U1-12 | Featured: newest photo with `featured = true`; if none, newest photo overall among non-drafts. |

## Process integrity

| ID | Rule |
|----|------|
| BR-U1-13 | If image optimize fails → do not allocate id (or ignore id if already attempted) and **do not** write DynamoDB. |
| BR-U1-14 | If ticket allocation fails → **do not** write DynamoDB. |
| BR-U1-15 | Successful persist **must not** create or commit `content/posts/**/index.md`. |
| BR-U1-16 | Image keys (`folderName`, cover/original paths) are stored on the record for CDN URL construction. |

## Auth

| ID | Rule |
|----|------|
| BR-U1-17 | Process Lambda persists with **IAM** only (no HMAC). |
| BR-U1-18 | Browser/owner `PATCH` requires valid photo-upload **HMAC token** (same family as `/upload`). |
| BR-U1-19 | Public `GET` endpoints require no auth. |

## Updates (PATCH)

| ID | Rule |
|----|------|
| BR-U1-20 | Allowed patch fields in U1: `title`, `caption`, `tags`, `featured`, `draft` (and optionally `publishedAt` if needed — default **no** unless later unit). |
| BR-U1-21 | PATCH must not change `id`, image keys, or precise GPS fields (GPS owned by enrichment). |
| BR-U1-22 | Unknown photo id → not-found error to client. |
| BR-U1-23 | Invalid/expired token → unauthorized. |

## Errors

| ID | Rule |
|----|------|
| BR-U1-24 | Validation errors on PATCH (empty title after trim, invalid types) → 400-class error with message. |
| BR-U1-25 | Process failures are logged; no partial photo row on optimize/ticket failure. |
