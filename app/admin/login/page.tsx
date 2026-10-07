import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Admin Sign In | Keraunous Tech Store',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen w-full bg-neutral-100 flex flex-col justify-center items-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white p-8 rounded-xl border border-neutral-200 animate-pulse text-center text-sm text-neutral-400">
            Loading secure administrative session...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      <div className="mt-6 text-xs text-neutral-500 font-mono text-center">
        Keraunous Tech Store · Internal Administrative Access
      </div>
    </div>
  );
}
