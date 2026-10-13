/**
 * Unit U16: Notifications Test Suite
 *
 * Blueprint §10.3 (U16) & master prompt:
 * 1. Strict Privacy Rules: New order notification NEVER contains customer phone or address
 * 2. Message formatters: HTML escaping, order alerts, low stock, uncontacted orders, daily summary
 * 3. Telegram Bot integration: HTTP API dispatch, logger fallback
 * 4. Fault tolerance & fire-and-forget: Notification failure NEVER fails or delays an order
 * 5. Cron monitoring security: CRON_SECRET authorization enforcement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  escapeHtml,
  formatNewOrderMessage,
  formatUncontactedOrdersMessage,
  formatLowStockMessage,
  formatOwnerAlertMessage,
  formatDailySummaryMessage,
} from '@/modules/notifications/formatters';
import { sendTelegramMessage } from '@/modules/notifications/telegram';
import { notifyAdmin, notifyAdminAsync } from '@/modules/notifications/dispatcher';
import { GET as notificationsCronHandler } from '@/app/api/cron/notifications/route';
import { GET as dailySummaryCronHandler } from '@/app/api/cron/daily-summary/route';
import { NextRequest } from 'next/server';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock Supabase admin
const mockFrom = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  delete process.env.CRON_SECRET;
});

describe('1. Strict Privacy Protection in Notifications', () => {
  it('includes public order ID, item count, formatted Naira total, and fulfilment state', () => {
    const formatted = formatNewOrderMessage({
      orderId: 'KRN-261013-ABC78',
      itemCount: 2,
      totalNgn: 1650000,
      fulfilmentState: 'Lagos',
      itemsSummary: 'iPhone 15 Pro Max (x1), AirPods Pro (x1)',
    });

    expect(formatted).toContain('KRN-261013-ABC78');
    expect(formatted).toContain('2 item(s)');
    expect(formatted).toContain('₦1,650,000');
    expect(formatted).toContain('Lagos');
    expect(formatted).toContain('iPhone 15 Pro Max');
  });

  it('CRITICAL PRIVACY RULE: NEVER contains customer phone numbers or street addresses', () => {
    const sensitivePayload = {
      orderId: 'KRN-261013-ABC78',
      itemCount: 1,
      totalNgn: 950000,
      fulfilmentState: 'Oyo',
      itemsSummary: 'Samsung S24 Ultra (x1)',
    };

    const formatted = formatNewOrderMessage(sensitivePayload);

    // Negative assertions ensuring no phone patterns exist
    expect(formatted).not.toMatch(/\+?234[0-9]{10}/);
    expect(formatted).not.toMatch(/0[789][01][0-9]{8}/);
    // Negative assertions ensuring no street address phrases exist
    expect(formatted).not.toContain('Street');
    expect(formatted).not.toContain('Avenue');
    expect(formatted).not.toContain('Close');
    expect(formatted).not.toContain('Road');
  });
});

describe('2. HTML Escaping and Formatting', () => {
  it('escapes &, <, and > characters for Telegram HTML parse mode', () => {
    expect(escapeHtml('iPhone & iPad <15>')).toBe('iPhone &amp; iPad &lt;15&gt;');
    expect(escapeHtml('')).toBe('');
  });

  it('formats uncontacted orders warning correctly', () => {
    const message = formatUncontactedOrdersMessage({
      count: 2,
      orders: [
        { orderId: 'KRN-261013-AAA01', createdAt: '2026-10-13T10:00:00Z', totalNgn: 500000 },
        { orderId: 'KRN-261013-AAA02', createdAt: '2026-10-13T10:05:00Z', totalNgn: 750000 },
      ],
    });

    expect(message).toContain('Pending WhatsApp Contact (>30m)');
    expect(message).toContain('2 uncontacted order(s)');
    expect(message).toContain('KRN-261013-AAA01');
    expect(message).toContain('₦500,000');
  });

  it('formats low stock alerts with SOLD OUT and count badges', () => {
    const message = formatLowStockMessage({
      items: [
        { productName: 'iPhone 15 Pro', variantLabel: '256GB · Natural Titanium', stockQty: 0 },
        { productName: 'Pixel 8 Pro', variantLabel: '128GB · Obsidian', stockQty: 2 },
      ],
    });

    expect(message).toContain('Low Stock Alert');
    expect(message).toContain('SOLD OUT');
    expect(message).toContain('2 left');
    expect(message).toContain('iPhone 15 Pro');
  });

  it('formats owner security alerts with severity indicators', () => {
    const message = formatOwnerAlertMessage({
      type: 'whatsapp_changed',
      severity: 'critical',
      title: 'Business WhatsApp Number Modified',
      message: 'Changed from +2348070822409 to +2348099999999',
    });

    expect(message).toContain('🚨');
    expect(message).toContain('CRITICAL');
    expect(message).toContain('Business WhatsApp Number Modified');
    expect(message).toContain('Changed from +2348070822409');
  });

  it('formats daily store summary', () => {
    const message = formatDailySummaryMessage({
      date: '13 Oct 2026',
      totalOrdersToday: 8,
      totalRevenueNgn: 9400000,
      deliveredOrders: 4,
      pendingHolds: 3,
      lowStockItemsCount: 2,
    });

    expect(message).toContain('Daily Store Summary — 13 Oct 2026');
    expect(message).toContain('New Orders Today:</b> 8');
    expect(message).toContain('Total Revenue:</b> ₦9,400,000');
    expect(message).toContain('Orders Delivered Today:</b> 4');
  });
});

describe('3. Telegram Bot Integration & Fallbacks', () => {
  it('falls back to structured logger when Telegram credentials are not set', async () => {
    const res = await sendTelegramMessage('<b>Test Alert</b>');
    expect(res.success).toBe(true);
    expect(res.channel).toBe('log');
  });

  it('posts to Telegram Bot API when credentials are configured', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token-12345';
    process.env.TELEGRAM_CHAT_ID = '-100987654321';

    const globalFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, result: { message_id: 888 } }),
    });
    vi.stubGlobal('fetch', globalFetch);

    const res = await sendTelegramMessage('<b>Test Order</b>');

    expect(globalFetch).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-token-12345/sendMessage',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(res.success).toBe(true);
    expect(res.channel).toBe('telegram');
    expect(res.messageId).toBe(888);

    vi.unstubAllGlobals();
  });

  it('never throws on network error and returns error result', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token-12345';
    process.env.TELEGRAM_CHAT_ID = '-100987654321';

    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Network offline')));

    const res = await sendTelegramMessage('<b>Test Order</b>');
    expect(res.success).toBe(false);
    expect(res.channel).toBe('telegram');
    expect(res.error).toContain('Network offline');

    vi.unstubAllGlobals();
  });
});

describe('4. Fault Tolerance & Fire-and-Forget Dispatcher', () => {
  it('notifyAdmin returns clean failure without throwing when formatting fails', async () => {
    const result = await notifyAdmin({ type: 'unknown_type' as any, data: {} as any });
    expect(result.success).toBe(false);
  });

  it('notifyAdminAsync executes in background without blocking or throwing', () => {
    expect(() => {
      notifyAdminAsync({
        type: 'new_order',
        data: {
          orderId: 'KRN-261013-ZZZ99',
          itemCount: 1,
          totalNgn: 1500000,
          fulfilmentState: 'Pickup',
        },
      });
    }).not.toThrow();
  });
});

describe('5. Scheduled Cron Endpoints Security', () => {
  it('rejects /api/cron/notifications with 401 when CRON_SECRET is set and missing', async () => {
    process.env.CRON_SECRET = 'super-secret-cron-key';

    const req = new NextRequest('http://localhost:3000/api/cron/notifications');
    const res = await notificationsCronHandler(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects /api/cron/notifications with 401 on wrong secret', async () => {
    process.env.CRON_SECRET = 'super-secret-cron-key';

    const req = new NextRequest('http://localhost:3000/api/cron/notifications', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = await notificationsCronHandler(req);
    expect(res.status).toBe(401);
  });

  it('authorizes /api/cron/notifications with 200 when valid secret is passed via Bearer header', async () => {
    process.env.CRON_SECRET = 'super-secret-cron-key';

    const createChain = () => {
      const q: any = {
        eq: () => q,
        is: () => q,
        lt: () => q,
        lte: () => q,
        gte: () => Promise.resolve({ data: [] }),
        order: () => q,
        limit: () => Promise.resolve({ data: [] }),
        then: (fn: any) => Promise.resolve({ data: [] }).then(fn),
      };
      return {
        select: () => q,
        update: () => q,
      };
    };

    mockFrom.mockImplementation(() => createChain());

    const req = new NextRequest('http://localhost:3000/api/cron/notifications', {
      headers: { authorization: 'Bearer super-secret-cron-key' },
    });
    const res = await notificationsCronHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.timestamp).toBeDefined();
  });

  it('authorizes /api/cron/daily-summary with 200 when valid secret is passed via query param', async () => {
    process.env.CRON_SECRET = 'super-secret-cron-key';

    const createChain = () => {
      const q: any = {
        eq: () => q,
        is: () => q,
        lt: () => q,
        lte: () => Promise.resolve({ count: 1 }),
        gte: () => Promise.resolve({ data: [{ status: 'delivered', total_ngn: 1500000 }] }),
        order: () => q,
        limit: () => Promise.resolve({ data: [] }),
        then: (fn: any) => Promise.resolve({ count: 2 }).then(fn),
      };
      return {
        select: () => q,
      };
    };

    mockFrom.mockImplementation(() => createChain());

    const req = new NextRequest('http://localhost:3000/api/cron/daily-summary?secret=super-secret-cron-key');
    const res = await dailySummaryCronHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.summarySent).toBe(true);
  });
});
