import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get('title') || 'Premium Gadget';
  const brand = searchParams.get('brand') || 'Keraunous Tech';
  const price = searchParams.get('price') || '';
  const condition = searchParams.get('condition') || '';
  const image = searchParams.get('image');

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0A1128',
          padding: '48px 56px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                backgroundColor: '#1E40AF',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 20,
                padding: '6px 14px',
                borderRadius: 8,
              }}
            >
              KT
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>
              Keraunous Tech Store
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(37, 211, 102, 0.15)',
              border: '1px solid #25D366',
              color: '#25D366',
              fontSize: 16,
              fontWeight: 700,
              padding: '6px 16px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Direct WhatsApp Handoff
          </div>
        </div>

        {/* Center Content: Product Details & Image */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '650px', gap: '12px' }}>
            <span style={{ fontSize: 18, color: '#93C5FD', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {brand}
            </span>

            <span
              style={{
                fontSize: 44,
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#ffffff',
                letterSpacing: '-1px',
              }}
            >
              {title}
            </span>

            {condition && (
              <span style={{ fontSize: 16, color: '#A3A3A3', fontWeight: 500 }}>
                Condition: {condition}
              </span>
            )}

            {price && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <div
                  style={{
                    backgroundColor: '#1D4ED8',
                    color: '#ffffff',
                    fontSize: 28,
                    fontWeight: 900,
                    padding: '8px 22px',
                    borderRadius: 12,
                  }}
                >
                  {price}
                </div>
                <span style={{ fontSize: 16, color: '#94A3B8' }}>Verified Naira Price</span>
              </div>
            )}
          </div>

          {/* Product Thumbnail if supplied */}
          {image ? (
            <div
              style={{
                width: '260px',
                height: '260px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : null}
        </div>

        {/* Footer Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: '20px',
            fontSize: 16,
            color: '#94A3B8',
          }}
        >
          <span>Ondo State, Nigeria · Nationwide Delivery</span>
          <span>WhatsApp Orders: +234 807 082 2409</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
