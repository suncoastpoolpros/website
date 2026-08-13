import React from 'react';
import { MessageSquare, Phone, ChevronRight } from 'lucide-react';
import { Container } from '@/components/Container';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { PHONE_DISPLAY, PHONE_HREF, SMS_QUOTE_HREF } from '@/lib/contact';

/**
 * Mid-page CTA — two concrete, human ways to reach us:
 * (1) text a photo + location for an immediate quote, (2) call.
 * Framed like a real local owner, not a generic marketing box.
 */
export const CtaBand = () => {
  const { open, warm } = useQuoteSheet();
  return (
    <section className="relative overflow-hidden bg-[#07111c] py-16 md:py-24">
      <Container className="text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="section-heading text-white leading-tight mb-3">
            Get a fast, free pool cleaning quote.
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

          {/* Mobile — the same two actions as desktop, as page-native tappable
              rows in the dark-card DNA of the FeatureGrid above (NOT the white
              quote-sheet chooser dropped inline — that read as the popup pasted
              into the page). The form path stays available via a quiet link
              that opens the real quote sheet. */}
          <div className="sm:hidden flex flex-col gap-3 text-left">
            <a
              href={SMS_QUOTE_HREF}
              className="rounded-2xl border border-brand-orange/25 bg-brand-orange/[0.07] p-4 flex items-center gap-3.5"
            >
              <span className="w-11 h-11 shrink-0 rounded-xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-brand-orange-light" strokeWidth={1.9} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-white font-semibold text-[15px] leading-tight">Text a few photos</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-[2px] rounded-full bg-brand-orange/10 text-brand-orange-light border border-brand-orange/30">
                    Fastest
                  </span>
                </span>
                <span className="block text-gray-400 text-[13px] mt-1 leading-snug">
                  Opens Messages pre-filled — we reply same day.
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
            </a>

            <a
              href={PHONE_HREF}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 flex items-center gap-3.5"
            >
              <span className="w-11 h-11 shrink-0 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-200" strokeWidth={1.9} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-white font-semibold text-[15px] leading-tight">
                  Call {PHONE_DISPLAY}
                </span>
                <span className="block text-gray-400 text-[13px] mt-1 leading-snug">
                  A real person answers — same day.
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
            </a>

            <button
              type="button"
              onPointerDown={warm}
              onClick={() => open()}
              className="self-center mt-1 text-[13px] text-gray-400 underline decoration-white/25 underline-offset-4 active:text-white transition-colors"
            >
              Prefer a form? Send us your details
            </button>
          </div>

          <p className="text-gray-500 text-xs mt-5">
            Open Mon–Sat, 8 AM – 6 PM · Serving St. Pete, Clearwater, Largo &amp; Palm Harbor
          </p>
        </div>
      </Container>
    </section>
  );
};
