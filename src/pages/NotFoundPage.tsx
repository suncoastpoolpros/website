import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Phone, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { PHONE_HREF, PHONE_DISPLAY } from '@/lib/contact';
import { usePageMeta } from '@/lib/usePageMeta';

/**
 * 404 — page not found.
 *
 * Catches any URL that doesn't match a known route. Keeps the brand chrome
 * (navbar + footer) so the visitor doesn't feel dumped into a generic void,
 * and offers two ways forward: home, or a phone call (high-intent recovery
 * for someone who probably mistyped a city page or hit a stale link).
 */
export const NotFoundPage = () => {
  usePageMeta({
    title: 'Page Not Found — Suncoast Pool Pros',
    description:
      "The page you're looking for doesn't exist. Head back home or call Suncoast Pool Pros for help.",
  });

  // Also emit a noindex robots tag so 404s never get indexed even if a crawler
  // hits the URL. The status code is set by Cloudflare Pages' _routes config.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'robots');
    meta.setAttribute('content', 'noindex,nofollow');
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#1669AE] selection:text-white flex flex-col">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-24">
          <Container className="max-w-2xl text-center">
            {/* Number */}
            <p className="font-display font-black text-brand-blue-light/30 text-[8rem] sm:text-[10rem] leading-none tracking-tight select-none">
              404
            </p>

            <h1 className="font-display font-bold text-white text-3xl sm:text-4xl tracking-tight mt-2 mb-4">
              This page doesn't exist.
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-md mx-auto mb-10">
              The link may be stale or mistyped. Try heading back home, or give us
              a call — a real person picks up.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/" className="btn btn-blue inline-flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                Back to home
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={PHONE_HREF}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/15 bg-white/[0.04] text-white/90 hover:text-white hover:bg-white/[0.08] hover:border-white/25 transition-colors font-semibold text-[15px]"
              >
                <Phone className="w-4 h-4 text-brand-blue-light" />
                {PHONE_DISPLAY}
              </a>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    </div>
  );
};
