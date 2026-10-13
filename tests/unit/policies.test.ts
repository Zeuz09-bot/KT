import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_PAYMENT_ACCOUNT,
  OFFICIAL_CONTACT,
  WARRANTY_POLICIES,
  DELIVERY_ZONES,
  HOW_TO_ORDER_STEPS,
  FAQ_ITEMS,
} from '@/lib/policies';

describe('Policy & Trust Configuration (U13)', () => {
  it('has verified official OPay payment account matching blueprint', () => {
    expect(OFFICIAL_PAYMENT_ACCOUNT.bank).toBe('OPay');
    expect(OFFICIAL_PAYMENT_ACCOUNT.accountNumber).toBe('8070822409');
    expect(OFFICIAL_PAYMENT_ACCOUNT.accountName).toContain('KERAUNOUS TECH');
    expect(OFFICIAL_PAYMENT_ACCOUNT.antiScamNotice).toBeDefined();
  });

  it('has verified official WhatsApp and Ondo State contact details', () => {
    expect(OFFICIAL_CONTACT.whatsappE164).toBe('+2348070822409');
    expect(OFFICIAL_CONTACT.displayPhone).toContain('0807 082 2409');
    expect(OFFICIAL_CONTACT.state).toBe('Ondo State');
    expect(OFFICIAL_CONTACT.operatingHours).toContain('24/7');
  });

  it('defines distinct condition-based warranties with clear exclusion rules', () => {
    expect(WARRANTY_POLICIES.brandNew.durationDays).toBe(365);
    expect(WARRANTY_POLICIES.openBox.durationDays).toBe(90);
    expect(WARRANTY_POLICIES.ukUsed.durationDays).toBe(30);
    expect(WARRANTY_POLICIES.ukUsed.returnSwapWindowDays).toBe(7);

    expect(WARRANTY_POLICIES.exclusions.length).toBeGreaterThanOrEqual(4);
    expect(WARRANTY_POLICIES.exclusions.some((e) => e.toLowerCase().includes('water') || e.toLowerCase().includes('liquid'))).toBe(true);
    expect(WARRANTY_POLICIES.exclusions.some((e) => e.toLowerCase().includes('physical') || e.toLowerCase().includes('drop'))).toBe(true);
  });

  it('defines delivery zones for Ondo, South-West, and Interstate corridors', () => {
    expect(DELIVERY_ZONES.length).toBeGreaterThanOrEqual(3);
    const ondoZone = DELIVERY_ZONES.find((z) => z.name.toLowerCase().includes('local') || z.states.includes('Ondo'));
    expect(ondoZone).toBeDefined();
    expect(ondoZone?.turnaround).toContain('Same-day');
  });

  it('defines exactly 4 steps for how to order', () => {
    expect(HOW_TO_ORDER_STEPS.length).toBe(4);
    expect(HOW_TO_ORDER_STEPS[0].step).toBe(1);
    expect(HOW_TO_ORDER_STEPS[1].step).toBe(2);
    expect(HOW_TO_ORDER_STEPS[2].step).toBe(3);
    expect(HOW_TO_ORDER_STEPS[3].step).toBe(4);
  });

  it('has comprehensive FAQ items with non-empty questions and answers', () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(8);
    for (const item of FAQ_ITEMS) {
      expect(item.id).toBeTruthy();
      expect(item.question.trim().length).toBeGreaterThan(5);
      expect(item.answer.trim().length).toBeGreaterThan(10);
      expect(item.category).toBeTruthy();
    }
  });

  it('validates trust & policy page metadata exports', async () => {
    const { metadata: aboutMeta } = await import('@/app/(public)/about/page');
    const { metadata: contactMeta } = await import('@/app/(public)/contact/page');
    const { metadata: faqMeta } = await import('@/app/(public)/faq/page');
    const { metadata: howToOrderMeta } = await import('@/app/(public)/how-to-order/page');
    const { metadata: deliveryMeta } = await import('@/app/(public)/delivery/page');
    const { metadata: warrantyMeta } = await import('@/app/(public)/warranty/page');
    const { metadata: privacyMeta } = await import('@/app/(public)/privacy/page');
    const { metadata: termsMeta } = await import('@/app/(public)/terms/page');
    const { metadata: verifyMeta } = await import('@/app/(public)/verify-accounts/page');

    expect(aboutMeta.title).toContain('About Us');
    expect(contactMeta.title).toContain('Contact Us');
    expect(faqMeta.title).toContain('Frequently Asked Questions');
    expect(howToOrderMeta.title).toContain('How to Order');
    expect(deliveryMeta.title).toContain('Delivery');
    expect(warrantyMeta.title).toContain('Warranty');
    expect(privacyMeta.title).toContain('Privacy Policy');
    expect(termsMeta.title).toContain('Terms of Service');
    expect(verifyMeta.title).toContain('Verify Our Official Accounts');
  });
});

