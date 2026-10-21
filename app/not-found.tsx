import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-cream text-brand-charcoal">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-bold font-display text-brand-navy">404</h1>
        <h2 className="text-2xl font-semibold font-display">Page not found</h2>
        <p className="text-sm text-brand-charcoal/70">
          Sorry, we couldn&apos;t find the page or device you&apos;re looking for.
        </p>
        <Button asChild variant="primary">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
