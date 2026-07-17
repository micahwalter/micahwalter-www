# Performance Tests — photo-ux-polish

## Scope
Soft / perceived-load only (NFR-4). No load-test harness.

## Checks
1. Homepage: skeleton reserves space → low CLS when featured image paints
2. Photo detail: map iframe `loading="lazy"` should not block caption/EXIF
3. `/photos?tag=`: prefetch up to ~200 photos — acceptable for current library size; revisit if catalog grows large

## Optional timing
```bash
curl -sS -o /dev/null -w "featured:%{time_total}s\n" \
  "https://api.micahwalter.com/photos/featured"
curl -sS -o /dev/null -w "list:%{time_total}s\n" \
  "https://api.micahwalter.com/photos/?limit=12"
```
