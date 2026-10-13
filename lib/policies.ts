/**
 * Keraunous Tech Store — Authoritative Store Policies & Trust Data (U13)
 * Blueprint §10 U13, §12.1 T12, §12.2
 */

export interface PaymentAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
  antiScamNotice: string;
}

export interface OfficialContact {
  whatsappE164: string;
  displayPhone: string;
  email: string;
  state: string;
  addressSummary: string;
  operatingHours: string;
}

export interface WarrantyTier {
  condition: 'brand_new' | 'open_box' | 'uk_used';
  name: string;
  durationLabel: string;
  durationDays: number;
  returnSwapWindowDays: number;
  summary: string;
  highlights: string[];
}

export interface DeliveryZone {
  id: string;
  name: string;
  states: string[];
  turnaround: string;
  courierType: string;
  description: string;
}

export interface OrderStep {
  step: number;
  title: string;
  subtitle: string;
  description: string;
  actionHint: string;
}

export interface FaqItem {
  id: string;
  category: 'ordering' | 'payment' | 'delivery' | 'warranty' | 'authenticity';
  question: string;
  answer: string;
}

export const OFFICIAL_PAYMENT_ACCOUNT: PaymentAccount = {
  bank: 'OPay',
  accountNumber: '8070822409',
  accountName: 'KERAUNOUS TECH / OFFICIAL BUSINESS ACCOUNT',
  antiScamNotice:
    'Keraunous Tech Store only accepts bank payments into this official OPay account. Never send funds to any personal account, agent account, crypto wallet, airtime, or via payment links. Always confirm the account name before authenticating any transfer.',
};

export const OFFICIAL_CONTACT: OfficialContact = {
  whatsappE164: '+2348070822409',
  displayPhone: '0807 082 2409 / +234 807 082 2409',
  email: 'support@keraunous.ng',
  state: 'Ondo State',
  addressSummary: 'Ondo State, Nigeria (Store pickup available on request)',
  operatingHours: '24/7 (Always active for WhatsApp order coordination)',
};

export const WARRANTY_POLICIES = {
  brandNew: {
    condition: 'brand_new' as const,
    name: 'Brand New (Factory Sealed)',
    durationLabel: '12 Months (1 Year)',
    durationDays: 365,
    returnSwapWindowDays: 7,
    summary:
      'Comes with full manufacturer & store limited warranty against technical and factory assembly defects.',
    highlights: [
      'Factory-sealed box with intact security pull tabs',
      'Original factory accessories and documentation',
      'Eligible for direct manufacturer service support',
      '7-day instant replacement window for any verified out-of-box hardware flaw',
    ],
  },
  openBox: {
    condition: 'open_box' as const,
    name: 'Open Box (Certified Clean)',
    durationLabel: '90 Days (3 Months)',
    durationDays: 90,
    returnSwapWindowDays: 7,
    summary:
      'Display, demo or opened customer return units inspected for zero flaws, near-100% battery, and zero cosmetic wear.',
    highlights: [
      '95%+ to 100% battery health certified',
      '24-point hardware check completed (cameras, Face ID/fingerprint, true tone, speakers, ports)',
      'Genuine charging cable and power accessories',
      '7-day replacement window for verified hardware malfunctions',
    ],
  },
  ukUsed: {
    condition: 'uk_used' as const,
    name: 'UK Used / Pre-Owned (Grade A)',
    durationLabel: '30 Days',
    durationDays: 30,
    returnSwapWindowDays: 7,
    summary:
      'Thoroughly tested pre-owned devices direct from UK enterprise trade-ins. 100% genuine parts, factory unlocked to all Nigerian networks.',
    highlights: [
      '85%+ battery health guaranteed',
      'Never iCloud locked, network locked, or MDM supervised',
      'Every sensor, microphone, display digitizer, and antenna rigorously tested',
      '7-day replacement guarantee if any internal hardware defect emerges',
    ],
  },
  exclusions: [
    'Liquid, moisture, steam, or accidental water submersion damage (water damage indicators tripped).',
    'Physical impact damage: cracked display, crushed chassis, chipped camera lens, or internal impact fractures.',
    'Unauthorized technician repair, case tampering, unsealed screws, or third-party component swap.',
    'Software modification including custom ROMs, jailbreaks, rooting, or bootloader unlocking that bricks the device.',
    'Normal cosmetic wear and tear accumulated after delivery inspection and acceptance.',
  ],
};

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'ondo_local',
    name: 'Local Ondo State Delivery & In-Store Pickup',
    states: ['Ondo'],
    turnaround: 'Same-day to 24 hours',
    courierType: 'Direct store dispatch rider / In-person pickup',
    description:
      'Immediate delivery within Ondo State. Free in-store pickup is available upon order confirmation.',
  },
  {
    id: 'south_west_corridor',
    name: 'South-West Interstate Express',
    states: ['Ekiti', 'Oyo', 'Osun', 'Ogun', 'Lagos'],
    turnaround: '24 to 48 hours',
    courierType: 'Registered Interstate Express Logistics (Waybill + Tracking)',
    description:
      'Swift road & express park logistics to major cities including Ibadan, Akure corridor, Abeokuta, Osogbo, and Lagos metropolitan hubs.',
  },
  {
    id: 'fct_kogi_national',
    name: 'Abuja & North-Central Corridor',
    states: ['FCT', 'Kogi'],
    turnaround: '48 to 72 hours (2–3 business days)',
    courierType: 'Dedicated interstate courier partner (Waybill with phone dispatch)',
    description:
      'Secure transit to Abuja (FCT) and Kogi state hubs with waybill tracking number sent directly to your phone.',
  },
];

export const HOW_TO_ORDER_STEPS: OrderStep[] = [
  {
    step: 1,
    title: 'Browse Catalogue & Select Your Variant',
    subtitle: 'Choose storage, colour, and condition',
    description:
      'Explore phones, tablets, laptops, and original accessories. Pick the exact variant you want — Brand New, Open Box, or UK Used — with completely transparent Nigerian Naira pricing.',
    actionHint: 'Tap "Order on WhatsApp" or "Add to List" on any product card.',
  },
  {
    step: 2,
    title: 'Enter Delivery Information',
    subtitle: 'Zero upfront card payment required',
    description:
      'Provide your full name, WhatsApp phone number, and delivery city/state. No online card details, CVVs, or logins are ever required.',
    actionHint: 'Click "Continue to WhatsApp" to generate your unique Order ID.',
  },
  {
    step: 3,
    title: 'Confirm with Us on WhatsApp',
    subtitle: 'Direct conversation with our verified sales desk',
    description:
      'Your order summary and unique reference (e.g. KRN-261013-ABCDE) are pre-filled in WhatsApp. Our sales rep confirms live inventory, answers any questions, and provides official payment details.',
    actionHint: 'Simply press "Send" in WhatsApp to start chatting.',
  },
  {
    step: 4,
    title: 'Bank Transfer & Live Tracking',
    subtitle: 'Verified payment confirmation & delivery',
    description:
      'Transfer to our official OPay business account. Once verified in our banking app, your device is packed, assigned a waybill tracking number, and dispatched to your destination.',
    actionHint: 'Use your Order ID and phone number anytime on /track.',
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-whatsapp-order',
    category: 'ordering',
    question: 'Why do I complete my order on WhatsApp?',
    answer:
      'WhatsApp ordering lets you speak directly with our team in real-time, inspect live photos/videos of the exact gadget variant before paying, confirm stock availability, and coordinate personalized delivery or pickup. It eliminates payment gateway fees and safeguards you from card fraud.',
  },
  {
    id: 'faq-payment-methods',
    category: 'payment',
    question: 'How do I make payment for my gadget?',
    answer:
      'We accept direct bank transfers exclusively into our verified official business account: OPay (Account Number: 8070822409, Name: KERAUNOUS TECH). We NEVER ask for payments to personal accounts or via third-party web links. We confirm credit directly inside our banking app before releasing any device.',
  },
  {
    id: 'faq-delivery-duration',
    category: 'delivery',
    question: 'How long does delivery take across Nigeria?',
    answer:
      'Orders within Ondo State are delivered same-day or within 24 hours. Deliveries to Ekiti, Oyo (Ibadan), Osun, Ogun, and Lagos take 24 to 48 hours. Deliveries to Abuja (FCT) and Kogi take 2 to 3 business days via registered interstate logistics.',
  },
  {
    id: 'faq-in-store-pickup',
    category: 'delivery',
    question: 'Can I pick up my gadget in person?',
    answer:
      'Yes! Customers in or traveling to Ondo State can choose In-Store Pickup during checkout. Once your order is confirmed on WhatsApp, we will provide pickup coordinates and hold your device safely.',
  },
  {
    id: 'faq-warranty-coverage',
    category: 'warranty',
    question: 'What warranty is included with my device?',
    answer:
      'Brand New devices come with a 12-month manufacturer & store limited warranty. Certified Open Box devices have 90 days of coverage. UK Used devices include a 30-day testing warranty with a 7-day swap window for any verified factory hardware flaw. Note: liquid and physical impact damage are excluded.',
  },
  {
    id: 'faq-device-authenticity',
    category: 'authenticity',
    question: 'Are UK Used phones tested and original?',
    answer:
      'Every single UK Used gadget undergoes a comprehensive 24-point hardware inspection. We verify 85%+ battery health, cameras, Face ID / Touch ID, speakers, microphones, displays, and ensure zero iCloud or MDM locks. All devices are factory unlocked for all Nigerian networks (MTN, Airtel, Glo, 9mobile).',
  },
  {
    id: 'faq-order-tracking',
    category: 'ordering',
    question: 'How can I track my order after payment?',
    answer:
      'Visit /track anytime and enter your Order ID (e.g. KRN-261013-ABCDE) and phone number. You will see a live vertical timeline showing confirmation, payment receipt, packaging, courier waybill number, and delivery status.',
  },
  {
    id: 'faq-returns-refunds',
    category: 'warranty',
    question: 'What is your replacement and return policy?',
    answer:
      'If you notice a hardware defect within 7 days of receiving your device, report it immediately to our WhatsApp desk. Following physical diagnosis to confirm the absence of liquid or accidental drop damage, we will swap the device for an identical model or arrange a mutually agreed resolution.',
  },
];
