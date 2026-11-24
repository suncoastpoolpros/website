import { Link } from 'react-router-dom';
import { Footer } from '@/components/Footer';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingQuoteSheetProvider } from '@/components/landing/LandingQuoteSheet';
import { usePageMeta } from '@/lib/usePageMeta';

/**
 * 404: page not found.
 *
 * Two ways in, one page:
 *   - A cold visit to an unknown URL. scripts/prerender.mjs renders this page
 *     into dist/404.html, which Cloudflare Pages serves for any path with no
 *     prerendered file or _redirects rule, WITH a real 404 status. So the
 *     status and the noindex tag are both in the first byte, before any JS.
 *   - An in-app navigation to an unknown path (the catch-all route in App.tsx).
 *
 * Deliberately plain: the site header and footer, one line, a way home.
 */
export const NotFoundPage = () => {
  usePageMeta({
    title: 'Page Not Found | Suncoast Pool Pros',
    description: "The page you're looking for doesn't exist.",
    noindex: true,
  });

  return (
    <LandingQuoteSheetProvider>
      <div className="landing-canvas force-static-motion flex min-h-screen flex-col overflow-x-clip bg-white font-sans text-sc-navy antialiased">
        <LandingHeader quoteLabel="Get my free quote" strongPhone />
        <main className="flex flex-1 items-center justify-center px-5 py-24 lg:py-32">
          <div className="max-w-[34rem] text-center">
            <h1 className="text-balance text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#243a55] lg:text-[40px]">
              Page not found
            </h1>
            <p className="mt-4 text-[17px] leading-[1.6] text-[rgba(36,58,85,0.78)]">
              The page you're looking for doesn't exist or has moved.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-[#f7b500] px-[22px] text-base font-semibold text-[#1c2f47] shadow-[0_1px_2px_rgba(16,24,40,0.14)] transition-colors hover:bg-[#ffc01f]"
            >
              Go to the homepage
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    </LandingQuoteSheetProvider>
  );
};
