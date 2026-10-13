import type { Metadata } from 'next';
import { PolicyLayout } from '@/components/storefront/policy-layout';
import { FAQ_ITEMS } from '@/lib/policies';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | Keraunous Tech Store',
  description:
    'Answers to common questions about ordering gadgets on WhatsApp, bank transfer verification, warranty terms, and Nigerian delivery times.',
};

export default function FaqPage() {
  return (
    <PolicyLayout
      title="Frequently Asked Questions"
      badge="Help & Guidance"
      subtitle="Find quick answers regarding our WhatsApp ordering workflow, delivery speeds across Nigeria, device testing, and warranty coverage."
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 text-sm font-semibold text-neutral-900">
          <HelpCircle className="h-4 w-4 text-brand-blue" />
          <span>Common Buyer Inquiries</span>
        </div>

        <Accordion type="multiple" className="w-full space-y-2">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="bg-neutral-50/70 border border-neutral-200/90 rounded-card-md px-4 py-1"
            >
              <AccordionTrigger className="text-left font-bold text-sm sm:text-base text-neutral-900 hover:text-brand-blue">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-neutral-700 leading-relaxed pt-1 pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </PolicyLayout>
  );
}
