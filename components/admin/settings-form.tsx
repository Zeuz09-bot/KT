'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  PhoneCall,
  Store,
  Clock,
  MapPin,
  Bell,
  MessageSquare,
  ShieldAlert,
  Power,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { saveSettingsAction } from '@/modules/content/actions';
import { NigerianPhoneSchema } from '@/lib/contracts/content';

interface SettingsFormProps {
  initialSettings: Record<string, unknown>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [whatsappNumber, setWhatsappNumber] = useState<string>(
    typeof initialSettings['whatsapp_number'] === 'string'
      ? initialSettings['whatsapp_number']
      : '+2348070822409',
  );
  const [businessName, setBusinessName] = useState<string>(
    typeof initialSettings['business_name'] === 'string'
      ? initialSettings['business_name']
      : 'Keraunous Tech Store',
  );
  const [businessHours, setBusinessHours] = useState<string>(
    typeof initialSettings['business_hours'] === 'string'
      ? initialSettings['business_hours']
      : '24/7',
  );
  const [address, setAddress] = useState<string>(
    typeof initialSettings['address'] === 'string'
      ? initialSettings['address']
      : 'Akure, Ondo State, Nigeria',
  );
  const [deliveryInfo, setDeliveryInfo] = useState<string>(
    typeof initialSettings['delivery_info'] === 'string'
      ? initialSettings['delivery_info']
      : 'Nationwide delivery available. Pickup available in Akure, Ondo State.',
  );
  const [announcement, setAnnouncement] = useState<string>(
    typeof initialSettings['announcement'] === 'string'
      ? initialSettings['announcement']
      : '',
  );
  const [whatsappChannelUrl, setWhatsappChannelUrl] = useState<string>(
    typeof initialSettings['whatsapp_channel_url'] === 'string'
      ? initialSettings['whatsapp_channel_url']
      : '',
  );
  const [officialAccountName, setOfficialAccountName] = useState<string>(
    typeof initialSettings['official_account_name'] === 'string'
      ? initialSettings['official_account_name']
      : 'Keraunous Tech Store',
  );
  const [holdHours, setHoldHours] = useState<number>(
    typeof initialSettings['hold_hours'] === 'number'
      ? initialSettings['hold_hours']
      : 24,
  );
  const [ordersEnabled, setOrdersEnabled] = useState<boolean>(
    typeof initialSettings['orders_enabled'] === 'boolean'
      ? initialSettings['orders_enabled']
      : true,
  );
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(
    typeof initialSettings['maintenance_mode'] === 'boolean'
      ? initialSettings['maintenance_mode']
      : false,
  );

  const initialSocials = (initialSettings['socials'] as Record<string, string>) ?? {};
  const [socialInstagram, setSocialInstagram] = useState(initialSocials['instagram'] ?? '');
  const [socialTwitter, setSocialTwitter] = useState(initialSocials['twitter'] ?? '');
  const [socialTiktok, setSocialTiktok] = useState(initialSocials['tiktok'] ?? '');

  const [messageTemplate, setMessageTemplate] = useState<string>(
    typeof initialSettings['order_message_template'] === 'string'
      ? initialSettings['order_message_template']
      : '',
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!businessName.trim()) errors.business_name = 'Business name is required';
    if (!businessHours.trim()) errors.business_hours = 'Business hours are required';
    if (!address.trim()) errors.address = 'Store address is required';
    if (!deliveryInfo.trim()) errors.delivery_info = 'Delivery info is required';
    if (!officialAccountName.trim()) {
      errors.official_account_name = 'Official account name is required';
    }

    const phoneCheck = NigerianPhoneSchema.safeParse(whatsappNumber.trim());
    if (!phoneCheck.success) {
      errors.whatsapp_number =
        'Must be a valid Nigerian phone number in +234 format (e.g. +2348070822409)';
    }

    if (holdHours < 1 || holdHours > 168) {
      errors.hold_hours = 'Hold hours must be between 1 and 168 (max 7 days)';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: 'Validation Error',
        message: 'Please resolve form errors before saving.',
        variant: 'error',
      });
      return;
    }

    startTransition(async () => {
      const payload = {
        whatsapp_number: whatsappNumber.trim(),
        business_name: businessName.trim(),
        business_hours: businessHours.trim(),
        address: address.trim(),
        delivery_info: deliveryInfo.trim(),
        announcement: announcement.trim() || null,
        whatsapp_channel_url: whatsappChannelUrl.trim() || null,
        socials: {
          ...(socialInstagram ? { instagram: socialInstagram.trim() } : {}),
          ...(socialTwitter ? { twitter: socialTwitter.trim() } : {}),
          ...(socialTiktok ? { tiktok: socialTiktok.trim() } : {}),
        },
        official_account_name: officialAccountName.trim(),
        hold_hours: Number(holdHours) || 24,
        orders_enabled: ordersEnabled,
        maintenance_mode: maintenanceMode,
        order_message_template: messageTemplate.trim() || null,
      };

      const res = await saveSettingsAction(payload);
      if (res.ok) {
        toast({
          title: 'Settings Saved',
          message: 'Site configuration updated successfully.',
          variant: 'success',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error Saving Settings',
          message: res.error.message,
          variant: 'error',
        });
      }
    });
  };

  // Preview WhatsApp Message computation
  const sampleMessage = messageTemplate
    ? messageTemplate
        .replace('{public_id}', 'KRN-261008-AB123')
        .replace('{customer_name}', 'Adekunle Gold')
        .replace('{items}', '• iPhone 15 Pro Max (256GB, Natural Titanium) × 1 - ₦1,450,000')
        .replace('{total}', '₦1,450,000')
        .replace('{fulfilment}', 'Doorstep Delivery (Akure, Ondo State)')
    : `Hello Keraunous Tech Store,\nI want to confirm my order:\nOrder ID: KRN-261008-AB123\nCustomer: Adekunle Gold\nItems:\n• iPhone 15 Pro Max (256GB, Natural Titanium) × 1 - ₦1,450,000\nTotal: ₦1,450,000\nFulfilment: Doorstep Delivery (Akure, Ondo State)`;

  return (
    <form onSubmit={handleSave} className="max-w-4xl space-y-8">
      {/* 1. Critical System Flags & WhatsApp Number */}
      <div className="bg-white p-6 rounded-xl border border-border-default shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-border-default">
          <ShieldAlert className="w-5 h-5 text-accent-orange" />
          <h2 className="text-base font-semibold text-text-primary">
            Storefront WhatsApp &amp; Kill Switches
          </h2>
        </div>

        {/* WhatsApp Number (High Security) */}
        <div>
          <label htmlFor="settings-whatsapp-number" className="block text-xs font-semibold text-text-secondary mb-1">
            Store Official WhatsApp Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              id="settings-whatsapp-number"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="pl-8 font-mono"
              placeholder="+2348070822409"
              required
            />
            <PhoneCall className="w-4 h-4 text-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
          {fieldErrors.whatsapp_number ? (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.whatsapp_number}</p>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 mt-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                All customer orders are forwarded to this WhatsApp number. Changing this is
                permanently logged in the audit trail.
              </span>
            </div>
          )}
        </div>

        {/* System Flags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Orders Enabled */}
          <div className="p-4 rounded-lg border border-border-default bg-neutral-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Power className={`w-3.5 h-3.5 ${ordersEnabled ? 'text-green-600' : 'text-red-600'}`} />
                Accepting Orders
              </span>
              <span className="text-[11px] text-text-muted block">
                Allow customers to send structured WhatsApp orders
              </span>
            </div>
            <input
              type="checkbox"
              checked={ordersEnabled}
              onChange={(e) => setOrdersEnabled(e.target.checked)}
              className="w-5 h-5 text-brand-blue rounded border-neutral-300 focus:ring-brand-blue cursor-pointer"
            />
          </div>

          {/* Maintenance Mode */}
          <div className="p-4 rounded-lg border border-border-default bg-neutral-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <ShieldAlert className={`w-3.5 h-3.5 ${maintenanceMode ? 'text-amber-600' : 'text-neutral-400'}`} />
                Maintenance Mode
              </span>
              <span className="text-[11px] text-text-muted block">
                Display maintenance notice to customers
              </span>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-5 h-5 text-brand-blue rounded border-neutral-300 focus:ring-brand-blue cursor-pointer"
            />
          </div>
        </div>

        {/* Hold Hours */}
        <div className="pt-2">
          <label htmlFor="settings-hold-hours" className="block text-xs font-semibold text-text-secondary mb-1">
            Order Hold Duration (Hours)
          </label>
          <div className="relative max-w-xs">
            <Input
              id="settings-hold-hours"
              type="number"
              min={1}
              max={168}
              value={holdHours}
              onChange={(e) => setHoldHours(Number(e.target.value))}
            />
            <Clock className="w-4 h-4 text-text-muted absolute right-3 top-2.5 pointer-events-none" />
          </div>
          {fieldErrors.hold_hours ? (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.hold_hours}</p>
          ) : (
            <p className="text-[11px] text-text-muted mt-1">
              Time an order remains on hold before automated cancellation if unpaid (Default: 24h).
            </p>
          )}
        </div>
      </div>

      {/* 2. Store Business Information */}
      <div className="bg-white p-6 rounded-xl border border-border-default shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-border-default">
          <Store className="w-5 h-5 text-brand-blue" />
          <h2 className="text-base font-semibold text-text-primary">
            Store &amp; Business Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="settings-business-name" className="block text-xs font-semibold text-text-secondary mb-1">
              Business Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="settings-business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
            {fieldErrors.business_name && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.business_name}</p>
            )}
          </div>

          <div>
            <label htmlFor="settings-business-hours" className="block text-xs font-semibold text-text-secondary mb-1">
              Business Operating Hours <span className="text-red-500">*</span>
            </label>
            <Input
              id="settings-business-hours"
              value={businessHours}
              onChange={(e) => setBusinessHours(e.target.value)}
              placeholder="e.g. 24/7 or Mon - Sat 8:00 AM - 8:00 PM"
              required
            />
            {fieldErrors.business_hours && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.business_hours}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="settings-official-account-name" className="block text-xs font-semibold text-text-secondary mb-1">
            Official Account Name (Payment Safety Notice) <span className="text-red-500">*</span>
          </label>
          <Input
            id="settings-official-account-name"
            value={officialAccountName}
            onChange={(e) => setOfficialAccountName(e.target.value)}
            placeholder="Keraunous Tech Store"
            required
          />
          <p className="text-[11px] text-text-muted mt-1">
            Displayed on verification &amp; order screens: &ldquo;We only receive payment into accounts named [Name]&rdquo;.
          </p>
        </div>

        <div>
          <label htmlFor="settings-address" className="block text-xs font-semibold text-text-secondary mb-1">
            Store Physical Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              id="settings-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="pl-8"
              required
            />
            <MapPin className="w-4 h-4 text-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div>
          <label htmlFor="settings-delivery-info" className="block text-xs font-semibold text-text-secondary mb-1">
            Delivery &amp; Pickup Policy Note <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Textarea
              id="settings-delivery-info"
              value={deliveryInfo}
              onChange={(e) => setDeliveryInfo(e.target.value)}
              rows={2}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="settings-announcement" className="block text-xs font-semibold text-text-secondary mb-1">
            Storewide Announcement Bar (Optional)
          </label>
          <div className="relative">
            <Input
              id="settings-announcement"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="pl-8"
              placeholder="e.g. Special Discount for Akure Residents this weekend!"
            />
            <Bell className="w-4 h-4 text-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. Socials & Channel */}
      <div className="bg-white p-6 rounded-xl border border-border-default shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-text-primary pb-3 border-b border-border-default">
          Social Links &amp; WhatsApp Channel
        </h2>

        <div>
          <label htmlFor="settings-whatsapp-channel-url" className="block text-xs font-semibold text-text-secondary mb-1">
            WhatsApp Channel URL
          </label>
          <Input
            id="settings-whatsapp-channel-url"
            value={whatsappChannelUrl}
            onChange={(e) => setWhatsappChannelUrl(e.target.value)}
            placeholder="https://whatsapp.com/channel/..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="settings-social-instagram" className="block text-xs font-semibold text-text-secondary mb-1">
              Instagram
            </label>
            <Input
              id="settings-social-instagram"
              value={socialInstagram}
              onChange={(e) => setSocialInstagram(e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div>
            <label htmlFor="settings-social-twitter" className="block text-xs font-semibold text-text-secondary mb-1">
              Twitter / X
            </label>
            <Input
              id="settings-social-twitter"
              value={socialTwitter}
              onChange={(e) => setSocialTwitter(e.target.value)}
              placeholder="https://x.com/..."
            />
          </div>
          <div>
            <label htmlFor="settings-social-tiktok" className="block text-xs font-semibold text-text-secondary mb-1">
              TikTok
            </label>
            <Input
              id="settings-social-tiktok"
              value={socialTiktok}
              onChange={(e) => setSocialTiktok(e.target.value)}
              placeholder="https://tiktok.com/@..."
            />
          </div>
        </div>
      </div>

      {/* 4. WhatsApp Message Template & Live Preview */}
      <div className="bg-white p-6 rounded-xl border border-border-default shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border-default">
          <MessageSquare className="w-5 h-5 text-green-600" />
          <h2 className="text-base font-semibold text-text-primary">
            WhatsApp Order Message Template
          </h2>
        </div>

        <div>
          <label htmlFor="settings-message-template" className="block text-xs font-semibold text-text-secondary mb-1">
            Custom Message Format (Optional)
          </label>
          <Textarea
            id="settings-message-template"
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            placeholder="Leave blank to use default system template"
            rows={5}
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-text-muted mt-1.5">
            Supported tags: <code className="bg-neutral-100 px-1 py-0.5 rounded">&#123;public_id&#125;</code>,{' '}
            <code className="bg-neutral-100 px-1 py-0.5 rounded">&#123;customer_name&#125;</code>,{' '}
            <code className="bg-neutral-100 px-1 py-0.5 rounded">&#123;items&#125;</code>,{' '}
            <code className="bg-neutral-100 px-1 py-0.5 rounded">&#123;total&#125;</code>,{' '}
            <code className="bg-neutral-100 px-1 py-0.5 rounded">&#123;fulfilment&#125;</code>.
          </p>
        </div>

        {/* Live Message Preview Card */}
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
            <FileText className="w-3.5 h-3.5" />
            Live Customer WhatsApp Message Preview
          </div>
          <pre className="text-xs whitespace-pre-wrap font-sans text-neutral-800 bg-white p-3 rounded border border-emerald-200">
            {sampleMessage}
          </pre>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="px-8 py-3 gap-2"
        disabled={isPending}
      >
        <Save className="w-4 h-4" />
        {isPending ? 'Saving Settings...' : 'Save All Settings'}
      </Button>
    </form>
  );
}
