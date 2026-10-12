/**
 * Public Layout
 * Wraps all public-facing pages with PublicLayout from components.
 */
import { PublicLayout } from '@/components/layout/public-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
