'use client';

/**
 * WelcomePopup
 *
 * Shows a full-screen branded video popup on the customer's FIRST visit per
 * browser session. Dismissed state is written to sessionStorage so it does
 * NOT re-appear on in-session navigation, but DOES appear again on a fresh tab.
 *
 * WHY sessionStorage (not localStorage):
 *   - Gives the welcome moment on every fresh browser session.
 *   - Nothing persisted past the tab close – privacy-friendly.
 */

import { useEffect, useRef, useState } from 'react';

const SESSION_KEY = 'krn_welcome_seen';

export function WelcomePopup() {
  const [open, setOpen]           = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [revealed, setRevealed]   = useState(false); // fade-in gate
  const videoRef = useRef<HTMLVideoElement>(null);

  /* ── mount: decide whether to show ─────────────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (!seen) {
      setOpen(true);
      const t = setTimeout(() => setRevealed(true), 80);
      return () => clearTimeout(t);
    }
  }, []);

  /* ── auto-play once popup is open ──────────────────────────────── */
  useEffect(() => {
    if (!open || !videoRef.current) return;
    videoRef.current.play().catch(() => { /* autoplay blocked – fallback shown */ });
  }, [open]);

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Keraunous Tech Store"
      className={[
        'fixed inset-0 z-[9999] flex items-center justify-center',
        'bg-brand-charcoal/95 backdrop-blur-sm',
        'transition-opacity duration-700',
        revealed ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      onClick={dismiss}
    >
      {/* Card */}
      <div
        className={[
          'relative w-full max-w-2xl mx-4 overflow-hidden rounded-2xl',
          'border border-brand-silver/20 shadow-2xl',
          'transition-transform duration-700',
          revealed ? 'scale-100' : 'scale-95',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video or animated fallback */}
        {!videoError ? (
          <video
            ref={videoRef}
            src="/videos/welcome-hero.mp4"
            className="w-full object-cover max-h-[75vh]"
            muted
            playsInline
            loop={false}
            onEnded={dismiss}
            onError={() => setVideoError(true)}
          />
        ) : (
          <FallbackHero />
        )}

        {/* Skip button */}
        <button
          id="welcome-popup-skip"
          onClick={dismiss}
          className={[
            'absolute top-4 right-4 flex items-center gap-1.5 rounded-full',
            'bg-brand-charcoal/70 backdrop-blur-sm border border-brand-silver/30',
            'px-3 py-1.5 text-xs font-editorial uppercase tracking-editorial',
            'text-brand-silver hover:text-brand-white hover:border-brand-silver/60',
            'transition-all duration-200',
          ].join(' ')}
          aria-label="Skip intro"
        >
          <span>Skip</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Bottom branding strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/60 to-transparent px-6 pb-5 pt-12 pointer-events-none">
          <p className="text-[10px] font-editorial uppercase tracking-editorial text-brand-champagne mb-0.5">
            Excellence &amp; Authenticity
          </p>
          <p className="text-xl font-display font-bold text-brand-white tracking-display leading-tight">
            Keraunous Tech Store
          </p>
          <p className="text-xs text-brand-silver/70 mt-0.5">
            Nigeria&apos;s premier quiet-luxury gadget showcase
          </p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   FallbackHero – animated brand reveal shown when video cannot load.
──────────────────────────────────────────────────────────────────── */
function FallbackHero() {
  return (
    <div className="relative h-[480px] bg-brand-charcoal flex flex-col items-center justify-center overflow-hidden">
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #D4D8DD 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      {/* K-mark ring */}
      <div className="relative mb-6">
        <div
          className="w-20 h-20 rounded-full border-2 border-brand-champagne/50 flex items-center justify-center"
          style={{ animation: 'krn-ring-pulse 3s ease-in-out infinite' }}
        >
          <span
            className="text-3xl font-display font-bold text-brand-champagne tracking-widest"
            style={{ animation: 'krn-fade-up 0.8s ease-out forwards', opacity: 0 }}
          >
            K
          </span>
        </div>
        <div
          className="absolute inset-0 rounded-full border border-brand-champagne/20"
          style={{ animation: 'krn-ring-expand 3s ease-in-out infinite' }}
        />
      </div>

      {/* Wordmark + shimmer */}
      <div className="relative overflow-hidden" style={{ animation: 'krn-fade-up 0.9s 0.3s ease-out forwards', opacity: 0 }}>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-white tracking-display uppercase">
          Keraunous
        </h2>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 35%, rgba(197,180,156,0.45) 50%, transparent 65%)',
            animation: 'krn-shimmer 2.4s 0.6s ease-in-out forwards',
            backgroundSize: '200% 100%',
          }}
        />
      </div>

      <p className="mt-1 text-xs font-editorial uppercase tracking-editorial text-brand-champagne"
        style={{ animation: 'krn-fade-up 0.9s 0.6s ease-out forwards', opacity: 0 }}>
        Tech Store
      </p>

      <p className="mt-4 text-sm text-brand-silver/70 max-w-xs text-center"
        style={{ animation: 'krn-fade-up 0.9s 1s ease-out forwards', opacity: 0 }}>
        Nigeria&apos;s premier quiet-luxury gadget showcase
      </p>

      <style>{`
        @keyframes krn-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes krn-ring-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.8; }
          50%       { transform: scale(1.06); opacity: 1; }
        }
        @keyframes krn-ring-expand {
          0%   { transform: scale(1);   opacity: 0.4; }
          60%  { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
        @keyframes krn-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
