import React from 'react';
import { MessageSquare, Phone } from 'lucide-react';
import { QuoteChooser } from '@/components/QuoteChooser';
import { Container } from '@/components/Container';
import { PHONE_DISPLAY, PHONE_HREF, SMS_QUOTE_HREF } from '@/lib/contact';

/**
 * Mid-page CTA — two concrete, human ways to reach us:
 * (1) text a photo + location for an immediate quote, (2) call.
 * Framed like a real local owner, not a generic marketing box.
 */
export const CtaBand = () => {
  return (
    <section className="relative overflow-hidden bg-[#07111c] py-16 md:py-24">
      <Container className="text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="section-heading text-white leading-tight mb-3">
            Two ways to get your flat-rate quote.
          </h2>
          <p className="section-subtext max-w-xl mx-auto mb-9">
            Text us two quick photos — one of your pool, one of your equipment pad — plus your address. Or just give us a call. Either way you'll hear back from a real person — <span className="text-white/90">same day, every time.</span>
          </p>

          {/* Desktop — simple two-button band */}
          <div className="hidden sm:flex items-stretch justify-center gap-3.5 max-w-xl mx-auto">
            <a
              href={SMS_QUOTE_HREF}
              className="btn btn-orange group flex-1"
            >
              <MessageSquare className="w-[18px] h-[18px]" />
              Text Photos for a Quote
            </a>
            <a
              href={PHONE_HREF}
              className="btn btn-glass group flex-1"
            >
              <Phone className="w-[18px] h-[18px] text-brand-orange-light" />
              Call {PHONE_DISPLAY}
            </a>
          </div>

          {/* Mobile — interactive expanding quote chooser. The chooser is
              light-themed (white quote sheet), so on this dark band it sits
              in a white card — the site's navy-band + white-card signature. */}
          <div className="sm:hidden rounded-3xl bg-white p-4 text-left shadow-xl shadow-black/40">
            <QuoteChooser />
          </div>

          <p className="text-gray-500 text-xs mt-5">
            Open Mon–Sat, 8 AM – 6 PM · Serving St. Pete, Clearwater, Largo &amp; Palm Harbor
          </p>
        </div>
      </Container>
    </section>
  );
};
