/**
 * Privacy-Preserving Analytics & UTM Tracking (U14)
 * Blueprint §10 U14, §12.1 T14
 * Strictly zero PII: no phone numbers, addresses, names, or secret tokens.
 */

export const ALLOWED_ANALYTICS_EVENTS = [
  'view_product',
  'add_to_list',
  'wishlist_add',
  'order_started',
  'order_created',
  'whatsapp_opened',
  'question_clicked',
  'track_lookup',
  'search',
  'filter_used',
] as const;

export type AnalyticsEventName = (typeof ALLOWED_ANALYTICS_EVENTS)[number];

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

const UTM_STORAGE_KEY = 'krn:utm:v1';

export function isValidAnalyticsEvent(name: string): name is AnalyticsEventName {
  return ALLOWED_ANALYTICS_EVENTS.includes(name as AnalyticsEventName);
}

/**
 * Extracts and sanitizes UTM parameters from search params.
 */
export function extractUtmParams(searchParams: URLSearchParams): UtmParams | null {
  const source = searchParams.get('utm_source')?.trim();
  const medium = searchParams.get('utm_medium')?.trim();
  const campaign = searchParams.get('utm_campaign')?.trim();
  const term = searchParams.get('utm_term')?.trim();
  const content = searchParams.get('utm_content')?.trim();

  if (!source && !medium && !campaign && !term && !content) {
    return null;
  }

  const utm: UtmParams = {};
  if (source) utm.source = source.slice(0, 100);
  if (medium) utm.medium = medium.slice(0, 100);
  if (campaign) utm.campaign = campaign.slice(0, 100);
  if (term) utm.term = term.slice(0, 100);
  if (content) utm.content = content.slice(0, 100);

  return utm;
}

/**
 * Persists detected UTM parameters into client sessionStorage/localStorage.
 */
export function persistUtmParams(utm: UtmParams): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // SessionStorage may be restricted in private mode
  }
}

/**
 * Retrieves stored UTM parameters to attach to order creations.
 */
export function getStoredUtmParams(): UtmParams | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Strips any potential PII fields from arbitrary telemetry payloads.
 */
function sanitizeEventPayload(payload?: Record<string, unknown>): Record<string, unknown> {
  if (!payload) return {};
  const cleaned: Record<string, unknown> = {};

  const forbiddenKeys = [
    'phone',
    'phone_number',
    'telephone',
    'customer_phone',
    'email',
    'name',
    'customer_name',
    'address',
    'delivery_address',
    'password',
    'token',
    'secret',
    'card',
    'cvv',
  ];

  for (const [key, val] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    if (forbiddenKeys.some((f) => lowerKey.includes(f))) {
      continue; // Filter out accidental PII
    }
    if (typeof val === 'string') {
      cleaned[key] = val.slice(0, 200);
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      cleaned[key] = val;
    }
  }

  return cleaned;
}

/**
 * Client-side privacy-first event tracking.
 */
export function trackEvent(name: AnalyticsEventName, payload?: Record<string, unknown>): void {
  if (!isValidAnalyticsEvent(name)) return;
  if (typeof window === 'undefined') return;

  const sanitized = sanitizeEventPayload(payload);
  const eventDetail = {
    event: name,
    timestamp: new Date().toISOString(),
    ...sanitized,
  };

  try {
    window.dispatchEvent(new CustomEvent('krn:analytics', { detail: eventDetail }));
  } catch {
    // Ignore dispatch errors
  }
}
