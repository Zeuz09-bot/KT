/**
 * Toast — lightweight notification system.
 * Use the useToast hook to push toasts from anywhere.
 * Rendered by <Toaster /> placed in the root layout.
 */
'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle2, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

/* ── Types ───────────────────────────────────────────────── */
export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  push: (msg: Omit<ToastMessage, 'id'>) => void;
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <Toaster>');
  return ctx;
}

/* ── Icons ───────────────────────────────────────────────── */
const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-brand-success" aria-hidden="true" />,
  error: <XCircle size={18} className="text-brand-danger" aria-hidden="true" />,
  info: <Info size={18} className="text-brand-blue" aria-hidden="true" />,
};

/* ── Toaster (provider + renderer) ──────────────────────── */
export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const push = React.useCallback((msg: Omit<ToastMessage, 'id'>) => {
    setToasts((prev) => [
      ...prev,
      { ...msg, id: `toast-${Date.now()}-${Math.random()}` },
    ]);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ push, toast: push }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            open
            onOpenChange={(open) => !open && dismiss(t.id)}
            duration={t.duration ?? 4000}
            className={cn(
              'flex items-start gap-3 rounded-card-md border bg-neutral-0 p-4 shadow-modal',
              'animate-slide-up data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
              'data-[state=closed]:animate-fade-in',
              'min-w-[280px] max-w-sm',
            )}
          >
            <span className="mt-0.5 shrink-0">{icons[t.variant]}</span>
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm font-semibold text-neutral-900">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="mt-0.5 text-xs text-neutral-600">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              aria-label="Dismiss notification"
              className="shrink-0 rounded p-0.5 text-neutral-400 hover:text-neutral-700 focus-visible:outline-brand-blue"
            >
              <X size={16} aria-hidden="true" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export const ToastProvider = Toaster;
