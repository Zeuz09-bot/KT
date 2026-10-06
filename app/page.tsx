import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          Unit U00 · Foundation Ready
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Keraunous Tech Store
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Premium phones and gadgets showcase website for the Nigerian market. Prices in integer Naira (₦).
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/api/health"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Check System Health (/api/health)
          </Link>
        </div>
      </div>
    </main>
  );
}
