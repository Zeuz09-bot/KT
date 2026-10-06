/**
 * /dev/ui — Component Showcase & Visual Regression Target
 *
 * Renders every component in the Keraunous design system across all states.
 * Disabled in production via notFound().
 */
'use client';

import * as React from 'react';
import { notFound } from 'next/navigation';
import {
  Button,
  Badge,
  Chip,
  Input,
  Textarea,
  PhoneInput,
  PriceTag,
  StockBadge,
  QuantityStepper,
  ProductCardSkeleton,
  ToastProvider,
  useToast,
  Modal,
  ModalTrigger,
  ModalContent,
  BottomSheet,
  BottomSheetContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Countdown,
  Breadcrumbs,
  Pagination,
  EmptyState,
  Timeline,
  SectionHeader,
  TrustItem,
  BrandTile,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { ProductCard } from '@/components/storefront/product-card';
import { StatusPill } from '@/components/admin/status-pill';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { ImageUploader, UploadedImage } from '@/components/admin/image-uploader';
import { DataTable, Column } from '@/components/admin/data-table';
import { PublicLayout } from '@/components/layout/public-layout';
import { ShieldCheck, Truck, Clock, RefreshCw, ShoppingBag, Eye } from 'lucide-react';

interface AdminDemoProduct {
  id: string;
  title: string;
  brand: string;
  price: number;
  status: 'new' | 'confirmed' | 'delivered';
}

function DevUiShowcase() {
  const { toast } = useToast();
  const [chipSelected, setChipSelected] = React.useState('256gb');
  const [stepperVal, setStepperVal] = React.useState(1);
  const [bottomSheetOpen, setBottomSheetOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('specs');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [images, setImages] = React.useState<UploadedImage[]>([
    {
      id: 'demo-1',
      url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=60',
      name: 'iphone-15-pro-blue.jpg',
      isPrimary: true,
    },
  ]);

  const targetDate = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d;
  }, []);

  const adminColumns: Column<AdminDemoProduct>[] = [
    { key: 'title', header: 'Product' },
    { key: 'brand', header: 'Brand' },
    {
      key: 'price',
      header: 'Price',
      render: (r: AdminDemoProduct) => <PriceTag currentNgn={r.price} size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: AdminDemoProduct) => <StatusPill status={r.status} size="sm" />,
    },
  ];

  const adminData: AdminDemoProduct[] = [
    { id: '1', title: 'iPhone 15 Pro Max', brand: 'Apple', price: 1450000, status: 'confirmed' },
    { id: '2', title: 'Galaxy S24 Ultra', brand: 'Samsung', price: 1320000, status: 'new' },
    { id: '3', title: 'Pixel 8 Pro', brand: 'Google', price: 820000, status: 'delivered' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6">
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
          Keraunous Design System Showcase
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Component kitchen sink testing tokens, variants, states, accessibility, and responsive rendering at 360px and 1280px.
        </p>
      </div>

      {/* 1. Buttons */}
      <section className="space-y-4" aria-labelledby="sec-buttons">
        <SectionHeader
          id="sec-buttons"
          title="1. Buttons"
          subtitle="Variants: primary, secondary, ghost, whatsapp, icon. States: normal, loading, disabled."
        />
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="whatsapp">Order on WhatsApp</Button>
          <Button variant="primary" isLoading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button variant="icon" size="icon" aria-label="View Details"><Eye className="h-4 w-4" /></Button>
        </div>
      </section>

      {/* 2. Badges & Status Pills */}
      <section className="space-y-4" aria-labelledby="sec-badges">
        <SectionHeader
          id="sec-badges"
          title="2. Badges & Status Pills"
          subtitle="Product status chips and order lifecycle tracking indicators."
        />
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="new">New Arrival</Badge>
          <Badge variant="bestseller">Best Seller</Badge>
          <Badge variant="discount">-15% OFF</Badge>
          <Badge variant="lowstock">Only 2 Left</Badge>
          <Badge variant="soldout">Sold Out</Badge>
          <Badge variant="generic">Official Warranty</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <StatusPill status="new" />
          <StatusPill status="confirmed" />
          <StatusPill status="paid" />
          <StatusPill status="processing" />
          <StatusPill status="shipped" />
          <StatusPill status="delivered" />
          <StatusPill status="cancelled" />
        </div>
      </section>

      {/* 3. Chips */}
      <section className="space-y-4" aria-labelledby="sec-chips">
        <SectionHeader
          id="sec-chips"
          title="3. Chips (Variant Picker)"
          subtitle="Storage, colour, and condition toggle selectors."
        />
        <div className="flex flex-wrap gap-2">
          <Chip
            selected={chipSelected === '128gb'}
            onClick={() => setChipSelected('128gb')}
          >
            128 GB
          </Chip>
          <Chip
            selected={chipSelected === '256gb'}
            onClick={() => setChipSelected('256gb')}
          >
            256 GB
          </Chip>
          <Chip
            selected={chipSelected === '512gb'}
            onClick={() => setChipSelected('512gb')}
          >
            512 GB
          </Chip>
          <Chip disabled>1 TB (Sold Out)</Chip>
        </div>
      </section>

      {/* 4. Form Controls */}
      <section className="space-y-4" aria-labelledby="sec-forms">
        <SectionHeader
          id="sec-forms"
          title="4. Form Inputs"
          subtitle="Accessible input controls with Nigerian phone handling, helpers, and error states."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            id="sample-name"
            label="Full Name"
            placeholder="e.g. Tunde Balogun"
            helperText="Enter your recipient name for delivery."
          />
          <PhoneInput
            id="sample-phone"
            label="Phone Number (WhatsApp Active)"
            helperText="Accepts 080... or +234... formats."
          />
          <Input
            id="sample-error"
            label="Delivery Street Address"
            defaultValue="Invalid street"
            error="Please provide a valid street address."
          />
          <div>
            <label className="text-sm font-medium text-neutral-800 mb-1.5 block">
              Fulfilment Method
            </label>
            <Select defaultValue="delivery">
              <SelectTrigger>
                <SelectValue placeholder="Select delivery or pickup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">Interstate Delivery (Waybill)</SelectItem>
                <SelectItem value="pickup">Store Pickup (Ondo State)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Textarea
              id="sample-notes"
              label="Order Notes / Delivery Landmarks"
              placeholder="e.g. Near Central Bank roundabout, call before arriving..."
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* 5. Pricing, Stock & Quantities */}
      <section className="space-y-4" aria-labelledby="sec-pricing">
        <SectionHeader
          id="sec-pricing"
          title="5. Pricing, Stock & Quantities"
          subtitle="Strict integer Naira display, privacy-safe stock indicators, and steppers."
        />
        <div className="flex flex-wrap items-center gap-8 p-6 rounded-card-md border border-neutral-200 bg-neutral-0">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Standard Price</p>
            <PriceTag currentNgn={485000} size="lg" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Discounted Price</p>
            <PriceTag currentNgn={420000} oldNgn={500000} size="lg" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Stock Badges</p>
            <div className="flex gap-2">
              <StockBadge quantity={12} />
              <StockBadge quantity={3} />
              <StockBadge quantity={0} />
            </div>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Quantity Stepper</p>
            <QuantityStepper
              value={stepperVal}
              onChange={setStepperVal}
              min={1}
              max={5}
            />
          </div>
        </div>
      </section>

      {/* 6. Product Card Preview */}
      <section className="space-y-4" aria-labelledby="sec-product-card">
        <SectionHeader
          id="sec-product-card"
          title="6. Product Card"
          subtitle="Showcase card adhering to Blueprint §2 (No cart, no reviews, no fake ratings)."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <ProductCard
            slug="iphone-15-pro-max"
            name="iPhone 15 Pro Max"
            imageUrl="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80"
            imageAlt="iPhone 15 Pro Max in Natural Titanium"
            priceNgn={1450000}
            oldPriceNgn={1550000}
            stock={4}
            badge="bestseller"
          />
          <ProductCard
            slug="galaxy-s24-ultra"
            name="Samsung Galaxy S24 Ultra"
            imageUrl="https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80"
            imageAlt="Samsung Galaxy S24 Ultra in Titanium Gray"
            priceNgn={1320000}
            stock={8}
            badge="new"
          />
          <ProductCardSkeleton />
        </div>
      </section>

      {/* 7. Interactive Overlays & Modals */}
      <section className="space-y-4" aria-labelledby="sec-overlays">
        <SectionHeader
          id="sec-overlays"
          title="7. Overlays & Dialogs"
          subtitle="Modals, mobile bottom sheets, toast notifications, and confirm dialogs."
        />
        <div className="flex flex-wrap gap-4">
          <Modal>
            <ModalTrigger asChild>
              <Button variant="secondary">Open Standard Modal</Button>
            </ModalTrigger>
            <ModalContent
              title="Order Information"
              description="Review device specs and WhatsApp checkout guidelines."
            >
              <div className="py-4 text-sm text-neutral-600 space-y-2">
                <p>
                  Orders submitted through Keraunous are saved securely in our system before opening WhatsApp.
                </p>
                <p>
                  Our team confirms stock availability immediately and sends official bank transfer credentials.
                </p>
              </div>
            </ModalContent>
          </Modal>

          <Button
            variant="secondary"
            onClick={() => setBottomSheetOpen(true)}
          >
            Open Bottom Sheet (Mobile)
          </Button>
          <BottomSheet open={bottomSheetOpen} onOpenChange={setBottomSheetOpen}>
            <BottomSheetContent
              title="Choose Device Variant"
              description="Select storage capacity and colour"
            >
              <div className="py-4 space-y-4">
                <p className="text-sm text-neutral-600">Available storage:</p>
                <div className="flex gap-2">
                  <Chip selected>128 GB</Chip>
                  <Chip>256 GB</Chip>
                  <Chip>512 GB</Chip>
                </div>
              </div>
            </BottomSheetContent>
          </BottomSheet>

          <Button
            variant="ghost"
            onClick={() =>
              toast({
                title: 'Order Saved',
                description: 'Order #KRN-261006-A1B2C recorded successfully.',
                variant: 'success',
              })
            }
          >
            Trigger Success Toast
          </Button>

          <Button
            variant="ghost"
            className="text-state-error hover:bg-red-50"
            onClick={() => setConfirmOpen(true)}
          >
            Trigger Confirm Dialog
          </Button>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Delete Variant?"
            description="Are you sure you want to remove this storage variant from the catalogue?"
            variant="danger"
            confirmLabel="Delete Variant"
            onConfirm={() => {
              toast({
                title: 'Deleted',
                description: 'Variant removed successfully.',
                variant: 'error',
              });
            }}
          />
        </div>
      </section>

      {/* 8. Tabs & Accordion */}
      <section className="space-y-4" aria-labelledby="sec-tabs">
        <SectionHeader
          id="sec-tabs"
          title="8. Tabs & Accordion"
          subtitle="Accessible disclosure and tab primitives for specifications and FAQs."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-card-md border border-neutral-200 bg-neutral-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="specs">Specifications</TabsTrigger>
                <TabsTrigger value="warranty">Warranty</TabsTrigger>
                <TabsTrigger value="delivery">Delivery</TabsTrigger>
              </TabsList>
              <TabsContent value="specs" className="text-sm text-neutral-600 space-y-2">
                <p>Battery Health: 100%</p>
                <p>Processor: Apple A17 Pro (3 nm)</p>
                <p>Display: 6.7-inch Super Retina XDR OLED 120Hz</p>
              </TabsContent>
              <TabsContent value="warranty" className="text-sm text-neutral-600">
                All UK-used devices come with our 30-day comprehensive replacement warranty.
              </TabsContent>
              <TabsContent value="delivery" className="text-sm text-neutral-600">
                Next-day interstate delivery to Lagos, Ibadan, Abuja, Ekiti, and Ondo State.
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-6 rounded-card-md border border-neutral-200 bg-neutral-0">
            <Accordion type="single" collapsible defaultValue="faq-1">
              <AccordionItem value="faq-1">
                <AccordionTrigger>How do I pay for my order?</AccordionTrigger>
                <AccordionContent>
                  Payment is made via direct bank transfer to our verified business account (OPay). We confirm in-app credit before releasing items.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2">
                <AccordionTrigger>Can I pick up in person?</AccordionTrigger>
                <AccordionContent>
                  Yes! We offer direct store pickup in Ondo State. You can inspect the phone before making payment.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* 9. Order Timeline & Countdown */}
      <section className="space-y-4" aria-labelledby="sec-timeline">
        <SectionHeader
          id="sec-timeline"
          title="9. Order Timeline & Real Countdown"
          subtitle="Public order tracking timeline and verified flash sale countdown timer."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-card-md border border-neutral-200 bg-neutral-0">
            <h3 className="text-sm font-semibold text-neutral-800 mb-4">Order Progress</h3>
            <Timeline
              steps={[
                {
                  label: 'Order Placed',
                  description: 'Saved on website, WhatsApp message prepared',
                  timestamp: '10:14 AM',
                  status: 'done',
                },
                {
                  label: 'Confirmed by Seller',
                  description: 'Stock verified in store inventory',
                  timestamp: '10:22 AM',
                  status: 'done',
                },
                {
                  label: 'Payment Confirmed',
                  description: 'Bank transfer confirmed in OPay app',
                  timestamp: '10:35 AM',
                  status: 'current',
                },
                {
                  label: 'Dispatched for Delivery',
                  description: 'Waybill handed to courier',
                  status: 'upcoming',
                },
              ]}
            />
          </div>

          <div className="p-6 rounded-card-md border border-neutral-200 bg-neutral-0 flex flex-col justify-center items-center text-center">
            <p className="text-xs uppercase font-bold tracking-wider text-brand-blue mb-2">
              Scheduled Weekend Flash Sale
            </p>
            <p className="text-xs text-neutral-500 mb-4">
              Real scheduled sale only — no fake countdowns
            </p>
            <Countdown endsAt={targetDate} />
          </div>
        </div>
      </section>

      {/* 10. Navigation, Breadcrumbs & Pagination */}
      <section className="space-y-4" aria-labelledby="sec-nav">
        <SectionHeader
          id="sec-nav"
          title="10. Breadcrumbs & Pagination"
          subtitle="Accessible hierarchy indicators and page controls."
        />
        <div className="space-y-6 p-6 rounded-card-md border border-neutral-200 bg-neutral-0">
          <Breadcrumbs
            crumbs={[
              { label: 'Home', href: '/' },
              { label: 'Phones', href: '/phones' },
              { label: 'Apple iPhone', href: '/phones/apple' },
              { label: 'iPhone 15 Pro Max' },
            ]}
          />
          <div className="pt-4 border-t border-neutral-100 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={5}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </section>

      {/* 11. Trust & Brand Badges */}
      <section className="space-y-4" aria-labelledby="sec-trust">
        <SectionHeader
          id="sec-trust"
          title="11. Trust Items & Brand Tiles"
          subtitle="Store assurance points and manufacturer brands."
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <TrustItem
            icon={<ShieldCheck className="h-5 w-5" />}
            label="100% Genuine"
            sublabel="Verified IMEI & hardware"
          />
          <TrustItem
            icon={<Truck className="h-5 w-5" />}
            label="Fast Waybill"
            sublabel="Interstate insured transit"
          />
          <TrustItem
            icon={<Clock className="h-5 w-5" />}
            label="24/7 Service"
            sublabel="Prompt WhatsApp responses"
          />
          <TrustItem
            icon={<RefreshCw className="h-5 w-5" />}
            label="30-Day Warranty"
            sublabel="Repair or replacement"
          />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2">
          <BrandTile name="Apple" logoUrl="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=100&auto=format&fit=crop&q=80" href="/brand/apple" />
          <BrandTile name="Samsung" logoUrl="https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100&auto=format&fit=crop&q=80" href="/brand/samsung" />
          <BrandTile name="Google" logoUrl="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100&auto=format&fit=crop&q=80" href="/brand/google" />
          <BrandTile name="Xiaomi" logoUrl="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100&auto=format&fit=crop&q=80" href="/brand/xiaomi" />
          <BrandTile name="OnePlus" logoUrl="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100&auto=format&fit=crop&q=80" href="/brand/oneplus" />
          <BrandTile name="Infinix" logoUrl="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100&auto=format&fit=crop&q=80" href="/brand/infinix" />
        </div>
      </section>

      {/* 12. Admin Data Table & Image Uploader */}
      <section className="space-y-4" aria-labelledby="sec-admin">
        <SectionHeader
          id="sec-admin"
          title="12. Admin Data Table & Image Uploader"
          subtitle="Back-office catalogue management components."
        />
        <div className="space-y-6">
          <DataTable<AdminDemoProduct>
            columns={adminColumns}
            data={adminData}
            keyExtractor={(r) => r.id}
          />

          <div className="p-6 rounded-card-md border border-neutral-200 bg-neutral-0">
            <h4 className="text-sm font-semibold text-neutral-800 mb-3">Product Image Management</h4>
            <ImageUploader images={images} onChange={setImages} maxFiles={4} />
          </div>
        </div>
      </section>

      {/* 13. Empty State */}
      <section className="space-y-4" aria-labelledby="sec-empty">
        <SectionHeader
          id="sec-empty"
          title="13. Empty State"
          subtitle="Clean placeholder when no products or orders are found."
        />
        <div className="rounded-card-md border border-neutral-200 bg-neutral-0 p-8">
          <EmptyState
            icon={<ShoppingBag className="h-6 w-6" />}
            title="No orders found yet"
            message="When you place orders on WhatsApp, you can track their status here with your Order ID and phone number."
            action={
              <Button variant="primary" onClick={() => {}}>
                Browse Gadgets
              </Button>
            }
          />
        </div>
      </section>
    </div>
  );
}

export default function DevUiPage() {
  // In production, return 404
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <PublicLayout showAnnouncement announcementText="Component Showcase Target (/dev/ui) — Testing all design tokens and layouts">
      <ToastProvider>
        <DevUiShowcase />
      </ToastProvider>
    </PublicLayout>
  );
}
