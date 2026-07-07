'use client';

import { load, trackPageview } from 'fathom-client';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { toFathomPagePath } from '@/lib/fathom-url';

function TrackPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    load(process.env.NEXT_PUBLIC_FATHOM_SITE_ID!, {
      auto: false,
    });
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    const canonicalPath = toFathomPagePath(pathname);
    trackPageview({
      url: canonicalPath + (query ? `?${query}` : ''),
      referrer: document.referrer,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function Fathom() {
  return (
    <Suspense fallback={null}>
      <TrackPageView />
    </Suspense>
  );
}
