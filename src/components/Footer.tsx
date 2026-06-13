import React from 'react';
import { SmartLink as Link } from '@/components/SmartLink';
import { Instagram, Facebook, Twitter, Phone, Mail, MapPin } from 'lucide-react';
import { Container } from '@/components/Container';
import { cities } from '@/lib/cities';
import {
  BUSINESS_NAME,
  PHONE_DISPLAY,
  PHONE_HREF,
  EMAIL,
  EMAIL_HREF,
  ADDRESS_LINE,
  ADDRESS_CITY_STATE_ZIP,
  HOURS_SHORT,
} from '@/lib/contact';

// Top cities for the footer column; full list lives in the Service Areas menu.
const footerCities = cities.slice(0, 7);

// `route: true` → client-side <Link>; otherwise an in-page/home anchor.
const exploreLinks = [
  { label: 'How It Works', href: '/how-it-works/', route: true },
  { label: 'FAQ', href: '/faq/', route: true },
  { label: 'Tools', href: '/tools/', route: true },
  { label: 'Pool Care', href: '/pool-care/', route: true },
  { label: 'Careers', href: '/careers/', route: true },
  { label: 'Contact', href: '/contact/', route: true },
];

const legalLinks = [
  { label: 'Service Agreement', to: '/service-agreement/' },
  { label: 'Privacy Policy', to: '/privacy-policy/' },
];

const socialLinks = [
  { label: 'Instagram', href: '#', Icon: Instagram },
  { label: 'Facebook', href: 'https://www.facebook.com/suncoastpoolpros', Icon: Facebook },
  { label: 'Twitter', href: '#', Icon: Twitter },
];

const colHeading = 'text-white font-semibold mb-4 uppercase tracking-wider text-xs';
const linkClass =
  'text-gray-400 hover:text-white transition-colors text-sm';

export const Footer = () => {
  return (
    <footer className="relative z-20 bg-[#02050a] border-t border-white/10">
      <Container>
        <div className="py-14 grid grid-cols-1 gap-y-10 sm:grid-cols-2 sm:gap-x-8 md:grid-cols-4 md:gap-x-10 lg:grid-cols-[1.9fr_0.9fr_1fr_1.5fr_0.9fr] lg:gap-8">
          {/* Brand + blurb */}
          <div className="sm:col-span-2 md:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <img
                src="/icon-mark.svg"
                alt=""
                aria-hidden="true"
                width={50}
                height={32}
                className="h-8 w-auto shrink-0"
                loading="lazy"
              />
              <span className="font-display font-bold text-lg tracking-wide text-white uppercase leading-none">
                {BUSINESS_NAME}
              </span>
            </div>
            <p className="text-gray-400 max-w-xs text-sm leading-relaxed">
              St. Petersburg's expert pool cleaning company. Weekly service, full chemical
              balancing, and the Always Blue Guarantee — for one flat rate.
            </p>

            <div className="flex gap-3 mt-6">
              {socialLinks.map(({ label, href, Icon }) => {
                const external = href.startsWith('http');
                return (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
                    className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-gray-400 hover:text-white hover:border-white/25 hover:bg-white/[0.06] transition-colors"
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Explore */}
          <nav aria-label="Footer">
            <h4 className={colHeading}>Explore</h4>
            <ul className="space-y-2.5">
              {exploreLinks.map(({ label, href, route }) => (
                <li key={label}>
                  {route ? (
                    <Link to={href} className={linkClass}>
                      {label}
                    </Link>
                  ) : (
                    <a href={href} className={linkClass}>
                      {label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Service Areas */}
          <nav aria-label="Service areas">
            <h4 className={colHeading}>Service Areas</h4>
            <ul className="space-y-2.5">
              {footerCities.map((city) => (
                <li key={city.slug}>
                  {city.to ? (
                    <Link to={city.to} className={linkClass}>
                      {city.name}
                    </Link>
                  ) : (
                    // No dedicated page yet — plain label, not a link.
                    <span className="text-gray-400 text-sm">{city.name}</span>
                  )}
                </li>
              ))}
              <li>
                <a
                  href="/#service-areas"
                  className="inline-flex items-center gap-1 text-brand-orange hover:text-brand-orange-dark transition-colors text-sm font-semibold"
                >
                  View all areas
                </a>
              </li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h4 className={colHeading}>Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href={PHONE_HREF} className={`group inline-flex items-center gap-2.5 ${linkClass}`}>
                  <Phone className="w-4 h-4 text-brand-orange shrink-0" />
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a href={EMAIL_HREF} className={`group inline-flex items-start gap-2.5 min-w-0 ${linkClass}`}>
                  <Mail className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                  <span className="min-w-0 break-all">{EMAIL}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                <span>
                  {ADDRESS_LINE}
                  <br />
                  {ADDRESS_CITY_STATE_ZIP}
                </span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className={colHeading}>Hours</h4>
            <ul className="space-y-2.5 text-gray-400 text-sm">
              <li className="whitespace-nowrap">{HOURS_SHORT}</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>
      </Container>

      {/* Bottom bar — full-width divider, padded content */}
      <div className="border-t border-white/10">
        <Container>
          <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs order-2 sm:order-1">
              &copy; {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 order-1 sm:order-2">
              {legalLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-gray-500 hover:text-white transition-colors text-xs">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </div>
    </footer>
  );
};
