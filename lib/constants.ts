/**
 * Keraunous Tech Store — Core Constants
 */

export const NG_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

export type NgState = (typeof NG_STATES)[number];

export const ORDER_STATUSES = [
  'new',
  'confirmed',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CUSTOMER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Order received',
  confirmed: 'Confirmed, awaiting payment',
  paid: 'Payment received',
  processing: 'Preparing your order',
  shipped: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const FULFILMENT_TYPES = ['delivery', 'pickup'] as const;
export type FulfilmentType = (typeof FULFILMENT_TYPES)[number];

export const ITEM_CONDITIONS = ['brand_new', 'uk_used', 'open_box'] as const;
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];

export const ITEM_CONDITION_LABELS: Record<ItemCondition, string> = {
  brand_new: 'Brand New',
  uk_used: 'UK Used',
  open_box: 'Open Box',
};

export const DEFAULT_BUSINESS_SETTINGS = {
  businessName: 'Keraunous Tech Store',
  brandName: 'Keraunos Tech',
  whatsappNumber: '+2348070822409',
  location: 'Ondo State, Nigeria',
  operatingHours: '24/7',
  paymentAccount: 'OPay (8070822409)',
  holdHours: 24,
  ordersEnabled: true,
} as const;
