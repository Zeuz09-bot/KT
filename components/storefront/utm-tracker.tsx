'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { extractUtmParams, persistUtmParams } from '@/lib/analytics/tracker';

function UtmCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;
    const utm = extractUtmParams(searchParams);
    if (utm) {
      persistUtmParams(utm);
    }
  }, [searchParams]);

  return null;
}

export function UtmTracker() {
  return (
    <Suspense fallback={null}>
      <UtmCapture />
    </Suspense>
  );
}
