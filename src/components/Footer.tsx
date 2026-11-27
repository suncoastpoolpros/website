import React from 'react';
import { SmartLink as Link } from '@/components/SmartLink';
import { Facebook, Phone, Mail, MapPin } from 'lucide-react';
import { cities } from '@/lib/cities';
import { pagedServices } from '@/lib/services';
import {
  BUSINESS_NAME,
  PHONE_DISPLAY,
  PHONE_HREF,
  EMAIL,
  EMAIL_HREF,
  ADDRESS_LINE,
  ADDRESS_CITY_STATE_ZIP,
  HOURS_SHORT,
  GOOGLE_PROFILE_URL,
  YELP_URL,
} from '@/lib/contact';

/*
 * The site-wide footer. Near-black (#0a0d13), no orange: the one accent is
 * the button gold on the two "View all" links.
 *
 * Columns: brand · Services · Service Areas · Company · Contact with Hours
 * under it. From 1024px five columns; 640–1023 three (brand full width, then
 * Services / Areas / Company, then Hours and Contact); under 640 two (brand,
 * Services / Areas, Company / Hours, Contact). Contact and Hours sit in one
 * wrapper that is `display: contents` below 1024, so each becomes its own
 * grid item there and stacks in one column on desktop.
 *
 * The footer is the CRAWLABLE internal link to every service and city page:
 * the header menus are client-only, so a page that appears solely in a
 * dropdown ships orphaned. Services come from lib/services and cities from
 * lib/cities, so a new page appears here the moment it gets a `to`.
 */

// Every city with a page, plus St. Petersburg as a label (the homepage is its page).
const footerCities = cities.filter((c) => c.to || c.slug === 'st-petersburg');

const companyLinks = [
  { label: 'How It Works', to: '/how-it-works/' },
  { label: 'FAQ', to: '/faq/' },
  { label: 'Tools', to: '/tools/' },
  { label: 'Pool Care', to: '/pool-care/' },
  { label: 'Careers', to: '/careers/' },
  { label: 'Contact', to: '/contact/' },
];

const legalLinks = [
  { label: 'Service Agreement', to: '/service-agreement/' },
  { label: 'Privacy Policy', to: '/privacy-policy/' },
];

// Google and Yelp marks from Simple Icons (CC0), as 24×24 paths. The Yelp
// mark's tiny ® is dropped: at 16px it's a speck.
const brandIcon = (d: string) =>
  function BrandIcon({ className }: { className?: string }) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
        <path d={d} />
      </svg>
    );
  };
const GoogleIcon = brandIcon('M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z');
const YelpIcon = brandIcon('m7.6885 15.1415-3.6715.8483c-.3769.0871-.755.183-1.1452.155-.2611-.0188-.5122-.0414-.7606-.213a1.179 1.179 0 0 1-.331-.3594c-.3486-.5519-.3656-1.3661-.3697-2.0004a6.2874 6.2874 0 0 1 .3314-2.0642 1.857 1.857 0 0 1 .1073-.2474 2.3426 2.3426 0 0 1 .1255-.2165 2.4572 2.4572 0 0 1 .1563-.1975 1.1736 1.1736 0 0 1 .399-.2831 1.082 1.082 0 0 1 .4592-.0837c.2355.0016.5139.052.91.1734.0555.0191.1237.0382.1856.0572.3277.1013.7048.2404 1.1499.3987.6863.2404 1.3663.487 2.0463.7397l1.2117.4423c.2217.0807.4363.18.6412.297.174.0984.3273.2298.4512.387a1.217 1.217 0 0 1 .192.4309 1.2205 1.2205 0 0 1-.872 1.4522c-.0468.0151-.0852.0239-.1085.0293l-1.105.2553-.0031-.001zM18.8208 7.565a1.8506 1.8506 0 0 0-.2042-.1754 2.4082 2.4082 0 0 0-.2077-.1394 2.3607 2.3607 0 0 0-.2269-.109 1.1705 1.1705 0 0 0-.482-.0796 1.0862 1.0862 0 0 0-.4498.1263c-.2107.1048-.4388.2732-.742.5551-.042.0417-.0947.0886-.142.133-.2502.2351-.5286.5252-.8599.863a114.6363 114.6363 0 0 0-1.5166 1.5629l-.8962.9293a4.1897 4.1897 0 0 0-.4466.5483 1.541 1.541 0 0 0-.2364.5459 1.2199 1.2199 0 0 0 .0107.4518l.0046.02a1.218 1.218 0 0 0 1.4184.923 1.162 1.162 0 0 0 .1105-.0213l4.7781-1.104c.3766-.087.7587-.1667 1.097-.3631.2269-.1316.4428-.262.5909-.5252a1.1793 1.1793 0 0 0 .1405-.4683c.0733-.6512-.2668-1.3908-.5403-1.963a6.2792 6.2792 0 0 0-1.2001-1.7103zM8.9703.0754a8.6724 8.6724 0 0 0-.83.1564c-.2754.066-.548.1383-.8146.2236-.868.2844-2.0884.8063-2.295 1.8065-.1165.5655.1595 1.1439.3737 1.66.2595.6254.614 1.1889.9373 1.7777.8543 1.5545 1.7245 3.0993 2.5922 4.6457.259.4617.5416 1.0464 1.043 1.2856a1.058 1.058 0 0 0 .1013.0383c.2248.0851.4699.1016.7041.0471a4.3015 4.3015 0 0 0 .0418-.0097 1.2136 1.2136 0 0 0 .5658-.3397 1.1033 1.1033 0 0 0 .079-.0822c.3463-.435.3454-1.0833.3764-1.6134.1042-1.771.2139-3.5423.3009-5.3142.0332-.6712.1055-1.3333.0655-2.0096-.0328-.5579-.0368-1.1984-.3891-1.6563-.6218-.8073-1.9476-.741-2.8523-.6158zm2.084 15.9505a1.1053 1.1053 0 0 0-1.2306-.4145 1.1398 1.1398 0 0 0-.1526.0633 1.4806 1.4806 0 0 0-.2171.1354c-.1992.1475-.3668.3392-.5196.5315-.0386.049-.074.1143-.12.1562l-.7686 1.0573a113.9168 113.9168 0 0 0-1.2913 1.789c-.278.3895-.5184.7184-.7083 1.0094-.036.0547-.0734.116-.1075.1647-.2277.3522-.3566.6092-.4228.8381a1.0945 1.0945 0 0 0-.046.4721c.0211.1655.0768.3246.1635.467.046.0715.0957.1406.1487.207a2.334 2.334 0 0 0 .1754.1825 1.843 1.843 0 0 0 .2108.1732c.5304.369 1.1112.6342 1.722.8391a6.0958 6.0958 0 0 0 1.5716.3004c.091.0046.1821.0025.2728-.006a2.3878 2.3878 0 0 0 .2506-.0351 2.3862 2.3862 0 0 0 .2447-.071 1.1927 1.1927 0 0 0 .4175-.2658c.1127-.113.1994-.249.2541-.3989.0889-.2214.1473-.5026.1857-.92.0034-.0593.0118-.1305.0177-.1958.0304-.3463.0443-.7531.0666-1.2315.0375-.7357.067-1.4681.0903-2.2026 0 0 .0495-1.3053.0494-1.306.0113-.3008.002-.6342-.0814-.9336a1.396 1.396 0 0 0-.1756-.4054zm8.6754 2.0439c-.1605-.176-.3878-.3514-.7462-.5682-.0518-.0288-.1124-.0674-.1684-.1009-.2985-.1795-.658-.3684-1.078-.5965a120.7615 120.7615 0 0 0-1.9427-1.042l-1.1515-.6107c-.0597-.0175-.1203-.0607-.1766-.0878-.2212-.1058-.4558-.2045-.6992-.2498a1.4915 1.4915 0 0 0-.2545-.0265 1.1527 1.1527 0 0 0-.1648.01 1.1077 1.1077 0 0 0-.9227.9133 1.4186 1.4186 0 0 0 .0159.439c.0563.3065.1932.6096.3346.875l.615 1.1526c.3422.65.6884 1.2963 1.0435 1.9406.229.4202.4196.7799.5982 1.078.0338.056.0721.1163.1011.1682.2173.3584.392.584.569.7458.1146.1107.252.195.4026.247.1583.0525.326.071.4919.0546a2.368 2.368 0 0 0 .251-.0435c.0817-.022.1622-.048.241-.0784a1.863 1.863 0 0 0 .2475-.1143 6.1018 6.1018 0 0 0 1.2818-.9597c.4596-.4522.8659-.9454 1.182-1.51.044-.08.0819-.163.1138-.2483a2.49 2.49 0 0 0 .0773-.2411c.0186-.083.033-.1669.0429-.2513a1.188 1.188 0 0 0-.0565-.491 1.0933 1.0933 0 0 0-.248-.4041z');

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/suncoastpoolpros', Icon: Facebook },
  { label: 'Suncoast Pool Pros on Google', href: GOOGLE_PROFILE_URL, Icon: GoogleIcon },
  { label: 'Suncoast Pool Pros on Yelp', href: YELP_URL, Icon: YelpIcon },
];

const colHeading = 'mb-4 text-[13.5px] font-semibold text-white';
const list = 'flex flex-col gap-2.5 text-[14px] leading-[1.5] text-white/60';
const linkClass = 'transition-colors hover:text-white';
const viewAll = 'mt-1 font-medium text-[#f7b500] transition-colors hover:text-[#ffc01f]';
// Shares the page gutter (.page-container); px-5 is the phone gutter.
const container = 'page-container mx-auto w-full px-5';

export const Footer = () => {
  return (
    <footer className="relative z-20 bg-[#0a0d13]">
      <div className={container}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 pb-10 pt-14 sm:grid-cols-[1.2fr_1fr_1fr] lg:grid-cols-[1.4fr_1.15fr_0.95fr_0.8fr_1.5fr] lg:gap-x-8 lg:pb-14 lg:pt-[72px]">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            {/* The header's lockup in white: wave mark + stacked wordmark, so
                it fits the brand column at every width. The two lines' sizes
                and tracking scale together, so "POOL PROS" spans "SUNCOAST". */}
            <div className="flex items-center gap-2" aria-label={BUSINESS_NAME} role="img">
              <img src="/icon-mark.svg" alt="" aria-hidden="true" width={37} height={24} className="h-[30px] w-auto shrink-0" loading="lazy" />
              <span aria-hidden="true" className="flex flex-col font-brand font-bold uppercase text-white">
                <span className="text-[16px] leading-none tracking-[0.02em]">Suncoast</span>
                <span className="mt-[3.25px] text-[9.6px] leading-none tracking-[0.405em]">Pool Pros</span>
              </span>
            </div>
            <p className="mt-5 max-w-[18rem] text-[14px] leading-[1.5] text-white/60">
              Pool service and cleaning in St.&nbsp;Petersburg, FL. Weekly visits, every standard chemical included, one flat
              monthly rate.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/[0.12] text-white/[0.72] transition-colors hover:border-white/[0.28] hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <nav aria-label="Services">
            <h3 className={colHeading}>Services</h3>
            <ul className={list}>
              {pagedServices.map((s) => (
                <li key={s.slug}>
                  <Link to={s.to as string} className={linkClass}>
                    {s.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/services/" className={viewAll}>
                  View all services
                </Link>
              </li>
            </ul>
          </nav>

          {/* Service Areas */}
          <nav aria-label="Service areas">
            <h3 className={colHeading}>Service Areas</h3>
            <ul className={list}>
              {footerCities.map((city) => (
                <li key={city.slug}>
                  {city.to ? (
                    <Link to={city.to} className={linkClass}>
                      {city.name}
                    </Link>
                  ) : (
                    <span>{city.name}</span>
                  )}
                </li>
              ))}
              <li>
                <a href="/#service-areas" className={viewAll}>
                  View all areas
                </a>
              </li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company">
            <h3 className={colHeading}>Company</h3>
            <ul className={list}>
              {companyLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact, with Hours under it on desktop; below 1024 each is its
              own grid item, and Contact moves to the end. */}
          <div className="contents lg:flex lg:flex-col lg:gap-8">
            <div className="col-span-2 max-lg:order-last lg:col-span-1">
              <h3 className={colHeading}>Contact</h3>
              <ul className={`${list} gap-3`}>
                <li>
                  <a href={PHONE_HREF} className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-white">
                    <Phone aria-hidden="true" className="h-4 w-4 shrink-0 text-white/45" />
                    {PHONE_DISPLAY}
                  </a>
                </li>
                <li>
                  <a href={EMAIL_HREF} className={`inline-flex items-center gap-2.5 ${linkClass}`}>
                    <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-white/45" />
                    <span className="whitespace-nowrap">{EMAIL}</span>
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin aria-hidden="true" className="mt-[3px] h-4 w-4 shrink-0 text-white/45" />
                  <span>
                    {ADDRESS_LINE}
                    <br />
                    {ADDRESS_CITY_STATE_ZIP}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className={colHeading}>Hours</h3>
              <ul className={list}>
                <li className="whitespace-nowrap">{HOURS_SHORT}</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar. Below 1024 it leaves room for the phone sticky bar. */}
      <div className="border-t border-white/[0.08]">
        <div className={container}>
          <div className="flex flex-col items-start gap-3 pb-[110px] pt-[22px] text-[13px] text-white/45 sm:flex-row sm:items-center sm:justify-between lg:pb-[22px]">
            <p className="order-2 sm:order-1">
              &copy; {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.
            </p>
            <ul className="order-1 flex flex-wrap items-center gap-x-5 gap-y-2 sm:order-2">
              {legalLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

/**
 * Cache-bust (see the same note in Glass.tsx) AND a real displayName.
 *
 * `public/_headers` marks `/assets/*` immutable for a year BY PATH. When a
 * newly-hashed chunk is requested during a deploy's propagation window,
 * Cloudflare Pages answers with its SPA-fallback index.html (200, text/html) —
 * and that HTML gets cached under the .js URL for a year. Chrome then rejects it
 * on MIME grounds, the lazy route never resolves, and the page goes blank.
 * Changing this file's content hash moves the app onto a fresh URL.
 *
 * This has now happened twice (Glass, then Footer), so it is a recurring deploy
 * race rather than a fluke. The durable fixes are tracked separately: stop the
 * fallback returning 200-HTML for asset paths, and fix the React #418 that makes
 * a missing chunk blank the page instead of leaving the prerendered HTML up.
 *
 * Do NOT load the site in a browser immediately after a deploy — that request
 * pattern is what lands in the propagation window and poisons the entry.
 */
Footer.displayName = 'Footer';
