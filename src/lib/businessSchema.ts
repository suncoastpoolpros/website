// Homepage-only JSON-LD that complements the canonical business entity.
//
// The authoritative LocalBusiness node lives in index.html (static, so it's in
// the prerendered HTML of EVERY page and crawlable without JS — strictly better
// than a client-injected copy). It carries full NAP, geo, areaServed, hours, the
// Google Business Profile / Yelp sameAs links, and makesOffer. DO NOT redefine
// that entity here — that would create two LocalBusiness nodes sharing one @id.
//
// Instead these builders add the things only the homepage should declare and
// reference the business by its stable @id. Keep BUSINESS_ID in sync with the
// "@id" in index.html.

const SITE_ORIGIN = 'https://suncoastpoolpros.com';
export const BUSINESS_ID = `${SITE_ORIGIN}/#business`;

// Cities we actively market to (mirrors src/lib/cities.ts). Kept as plain
// strings so this module doesn't pull the cities' route metadata.
const AREAS_SERVED = [
  'St. Petersburg',
  'Snell Isle',
  'Gulfport',
  'St. Pete Beach',
  'Treasure Island',
  'Seminole',
  'Largo',
  'Belleair Beach',
  'Clearwater',
  'Safety Harbor',
  'Dunedin',
  'Palm Harbor',
  'Davis Island',
  'South Tampa',
];

/** The site-wide WebSite node, declared once on the homepage. */
export const webSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_ORIGIN}/#website`,
  url: `${SITE_ORIGIN}/`,
  name: 'Suncoast Pool Pros',
  publisher: { '@id': BUSINESS_ID },
});

/**
 * The primary Service node (weekly pool cleaning) tied back to the business by
 * @id. Adds a priced Service entity Google can attach to the local result — the
 * static index.html entity lists services under makesOffer but without a price.
 */
export const poolServiceSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Weekly Pool Cleaning & Maintenance',
  provider: { '@id': BUSINESS_ID },
  areaServed: AREAS_SERVED.map((name) => ({ '@type': 'City', name })),
  description:
    'Flat-rate weekly pool cleaning and chemical balancing in St. Petersburg and the Tampa Bay area — all standard chemicals included, the same technician every week, and a photo report after every visit.',
  offers: {
    '@type': 'Offer',
    priceCurrency: 'USD',
    price: '150',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '150',
      priceCurrency: 'USD',
      unitText: 'MONTH',
    },
    availability: 'https://schema.org/InStock',
  },
});
