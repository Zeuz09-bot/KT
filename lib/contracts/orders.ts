/**
 * Keraunous Tech Store — Order Contracts (U10)
 *
 * Schemas and types for order placement, customer inputs, Nigerian phone/state validation,
 * and WhatsApp handoff responses.
 * Blueprint §8.3, §9.1, §9.4, §15.8
 */
import { z } from 'zod';

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
] as const;

export type NigerianState = typeof NIGERIAN_STATES[number];

/** Normalizes Nigerian phone formats (0803..., 234803..., +234803...) into E.164 (+234803...) */
export const ngPhoneSchema = z
  .string()
  .trim()
  .regex(
    /^(?:\+?234|0)?([789][01]\d{8})$/,
    'Invalid Nigerian phone number. Must start with 070, 080, 081, 090, 091, etc.',
  )
  .transform((val) => {
    const match = val.match(/^(?:\+?234|0)?([789][01]\d{8})$/);
    if (!match) return val;
    return `+234${match[1]}`;
  });

export const customerNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(60, 'Name cannot exceed 60 characters')
  .regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const deliveryDetailsSchema = z.object({
  state: z.enum(NIGERIAN_STATES, {
    errorMap: () => ({ message: 'Please select a valid Nigerian state' }),
  }),
  city: z.string().trim().min(2, 'City must be at least 2 characters').max(60, 'City cannot exceed 60 characters'),
  address: z.string().trim().min(5, 'Delivery address must be at least 5 characters').max(200, 'Address cannot exceed 200 characters'),
});

export const orderItemInputSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID'),
  qty: z.number().int().min(1, 'Quantity must be at least 1').max(5, 'Maximum quantity per line is 5'),
  expectedUnitPriceNgn: z.number().int().positive('Price must be greater than 0'),
});

export const CreateOrderRequestSchema = z
  .object({
    idempotencyKey: z.string().uuid('Invalid idempotency key'),
    turnstileToken: z.string().min(5, 'Captcha verification required'),
    customer: z.object({
      name: customerNameSchema,
      phone: ngPhoneSchema,
    }),
    fulfilment: z.enum(['delivery', 'pickup']),
    delivery: deliveryDetailsSchema.optional(),
    note: z.string().trim().max(300, 'Note cannot exceed 300 characters').optional(),
    items: z
      .array(orderItemInputSchema)
      .min(1, 'At least 1 item is required')
      .max(10, 'Maximum of 10 items per order'),
    expectedTotalNgn: z.number().int().positive('Total must be greater than 0'),
    utm: z.record(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.fulfilment === 'delivery') {
        return !!data.delivery && !!data.delivery.state && !!data.delivery.city && !!data.delivery.address;
      }
      return true;
    },
    {
      message: 'Delivery address details are required for home/office delivery',
      path: ['delivery'],
    },
  );

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export interface OrderItemSnapshot {
  name: string;
  label: string;
  qty: number;
  unitPriceNgn: number;
}

export interface CreateOrderResponseData {
  publicId: string;
  orderId: string;
  createdAt: string;
  items: OrderItemSnapshot[];
  subtotalNgn: number;
  totalNgn: number;
  whatsappUrl: string;
  waWebUrl: string;
  messageText: string;
  handoffToken: string;
}
