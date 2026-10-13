/**
 * WhatsApp Message and URL Builder (U10)
 * Blueprint §9.4, §10.3
 *
 * Rules:
 * - Show at most 8 lines, then `+ N more items (see order {public_id})`.
 * - URL kept under 1,800 characters; shorten customer note first, never order ID or total.
 * - Server builds URL strictly from saved business number.
 */
import { formatNgn } from '@/lib/money';

export interface WhatsAppOrderInput {
  publicId: string;
  customerName: string;
  customerPhone: string;
  fulfilment: 'delivery' | 'pickup';
  deliveryState?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  customerNote?: string;
  items: Array<{
    productName: string;
    variantLabel: string;
    qty: number;
    unitPriceNgn: number;
  }>;
  totalNgn: number;
}

export function buildOrderMessage(order: WhatsAppOrderInput): string {
  const MAX_LINES = 8;
  const items = order.items;
  const displayItems = items.slice(0, MAX_LINES);
  const remainingCount = items.length - MAX_LINES;

  const itemLines = displayItems.map((item) => {
    const lineTotal = item.unitPriceNgn * item.qty;
    return `${item.qty}x ${item.productName} · ${item.variantLabel}: ${formatNgn(lineTotal)}`;
  });

  if (remainingCount > 0) {
    itemLines.push(`+ ${remainingCount} more items (see order ${order.publicId})`);
  }

  const fulfilmentLine =
    order.fulfilment === 'delivery'
      ? `Delivery: ${[order.deliveryAddress, order.deliveryCity, order.deliveryState].filter(Boolean).join(', ')}`
      : 'Fulfilment: In-store Pickup';

  const baseHeader = `Hello Keraunous 👋\nI'd like to place an order.\n\nOrder ID: ${order.publicId}\n${itemLines.join('\n')}\n\nTotal: ${formatNgn(order.totalNgn)}\nName: ${order.customerName}\n${fulfilmentLine}`;
  const closing = `\nPlease confirm availability and the final price. Thank you!`;

  let noteSection = '';
  if (order.customerNote && order.customerNote.trim()) {
    noteSection = `\nNote: ${order.customerNote.trim()}`;
  }

  let fullMessage = `${baseHeader}${noteSection}${closing}`;

  // Length guard: keep URL / text under ~1,800 characters
  // If too long, trim note first
  if (fullMessage.length > 1800 && order.customerNote) {
    const overflow = fullMessage.length - 1790;
    const trimmedNoteLength = Math.max(10, order.customerNote.length - overflow);
    const trimmedNote = `${order.customerNote.slice(0, trimmedNoteLength)}...`;
    noteSection = `\nNote: ${trimmedNote}`;
    fullMessage = `${baseHeader}${noteSection}${closing}`;
  }

  return fullMessage;
}

/** Formats a phone number for wa.me / WhatsApp Web: digits only, removes leading + or 0 */
export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }
  return digits;
}

export function buildWaUrl(businessPhone: string, messageText: string): string {
  const phoneDigits = normalizePhoneForWhatsApp(businessPhone);
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(messageText)}`;
}

export function buildWaWebUrl(businessPhone: string, messageText: string): string {
  const phoneDigits = normalizePhoneForWhatsApp(businessPhone);
  return `https://web.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(messageText)}`;
}

export function buildQuestionUrl(
  businessPhone: string,
  productName: string,
  productUrl?: string,
): string {
  const text = productUrl
    ? `Hi, I'm interested in ${productName} ${productUrl}`
    : `Hi, I'm interested in ${productName}`;
  return buildWaUrl(businessPhone, text);
}
