import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardCheck } from 'lucide-react';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { pagedServices, services } from '@/lib/services';

/**
 * Services dropdown for the desktop header.
 *
 * Same panel treatment as ServiceAreasMenu (light gradient card, heavy shadow)
 * so the two menus read as a pair, but narrower — there is no map to sit beside.
 *
 * It lists only services that HAVE a page (`pagedServices`). The rest live on
 * the hub; linking them here would put fake destinations in the nav. As each
 * service page ships and gets a `to` in lib/services, it appears here on its
 * own with no change to this file.
 *
 * "How it works" lives in the right rail rather than the top-level nav: it is
 * the page that handles billing and chemical-cost objections, so it earns a
 * place — just not one of the five header slots.
 */
export const ServicesMenu = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const remaining = services.length - pagedServices.length;

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  return (
    <div className="w-[620px] bg-gradient-to-r from-[#e4e9f0] to-white border border-black/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
      <div className="grid grid-cols-[1fr_15rem]">
        {/* LEFT — the services with their own pages */}
        <div className="p-7 pr-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-brand-blue font-bold mb-2">
            What We Do
          </p>
          <h3 className="font-display font-bold text-[#0a1628] text-2xl leading-tight mb-1">
            Pool service, done in&nbsp;house.
          </h3>
          <p className="text-xs text-gray-600 mb-5">
            One crew for the weekly visit and the jobs nobody wants.
          </p>

          <div className="flex flex-col gap-1">
            {pagedServices.map((s) => (
              <Link
                key={s.slug}
                to={s.to as string}
                className="group flex items-start gap-3 rounded-xl px-3 py-2.5 -mx-1 hover:bg-brand-blue/[0.07] transition-colors"
              >
                <span className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-brand-blue" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-[#0a1628] text-sm leading-snug">
                    {s.title}
                  </span>
                  <span className="block text-gray-600 text-xs leading-snug line-clamp-2">
                    {s.blurb}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <Link
            to="/services/"
            className="group inline-flex items-center gap-1.5 mt-4 text-brand-blue font-semibold text-sm hover:text-brand-blue-dark transition-colors"
          >
            All services
            {remaining > 0 && (
              <span className="text-gray-500 font-normal">
                — plus {remaining} more
              </span>
            )}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* RIGHT — the offer, then the two things people look for next */}
        <div className="p-5 border-l border-black/10 bg-white/60 flex flex-col gap-4">
          <div className="rounded-xl bg-white border border-brand-blue/20 p-4 shadow-sm">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-[#0a1628] text-2xl leading-none">
                ~$150
              </span>
              <span className="text-gray-600 font-semibold text-sm">/mo</span>
            </div>
            <p className="text-[#0a1628] font-semibold text-xs mt-1.5 leading-snug">
              Flat rate, chemicals included
            </p>
            <p className="text-gray-500 text-[11px] mt-1 leading-snug">
              No contract. Cancel any time.
            </p>
          </div>

          <Link
            to="/how-it-works/"
            className="group flex items-start gap-2.5 text-left"
          >
            <ClipboardCheck className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
            <span>
              <span className="block font-semibold text-[#0a1628] text-sm leading-snug">
                How it works
              </span>
              <span className="block text-gray-600 text-xs leading-snug">
                Billing, chemicals, getting started
              </span>
            </span>
          </Link>

          <a
            href="#quote"
            onClick={handleQuoteClick}
            className="btn btn-orange w-full mt-auto text-sm py-2.5"
          >
            Get a Free Quote
          </a>
        </div>
      </div>
    </div>
  );
};
