// FAQ source-of-truth for the Belleair Beach page. Kept in its own tiny module
// so the page chunk can include it for JSON-LD without pulling in the rest of
// the below-the-fold React tree.
//
// The first two are the rebuilt page's own; the five after them are kept word
// for word from the page before it.
// TODO(owner): confirm the "first two weeks free" offer and its terms. If it
// isn't approved, replace the first question with the 2-week money-back
// guarantee (ServiceAgreementPage, "Money-back guarantee").
export const belleairBeachFaqs = [
  {
    q: 'How do the two free weeks work?',
    a: 'Your first two weekly visits, chemicals included, cost nothing. If you are pleased with the pool and the reports, service continues month to month at your flat rate. If not, you owe nothing.',
  },
  {
    q: 'What does weekly service cost here?',
    a: "One flat monthly rate that depends on the pool's size, surface and equipment. Routine chemicals are inside it. We give you the exact figure the same day you ask.",
  },
  {
    q: 'Do you service waterfront and seasonal homes in Belleair Beach?',
    a: "Yes — it's much of what we do here. Whether you live in Belleair Beach year-round or your home sits empty for part of the season, your pool is maintained on a structured weekly schedule with a photo report after every visit, so it stays guest-ready and protected even when you're away.",
  },
  {
    q: 'Will I have the same pool technician each week?',
    a: 'Yes. You get one dedicated technician assigned to your property who learns your pool, your equipment, and how you like things handled. Consistency is the point — it means better care, fewer surprises, and a service person you actually know and trust on your property.',
  },
  {
    q: 'How do you handle the salt air and harsh coastal conditions?',
    a: 'Gulf-front pools face heavy sun, salt spray, and wind-blown debris that throw off water chemistry and wear on equipment faster than an inland pool. We counter it with consistent weekly balancing and close monitoring of your pump, filter, and salt cell, catching coastal wear early so small issues never become expensive ones.',
  },
  {
    q: 'What happens with my pool during storm season?',
    a: 'Routine weekly service includes clearing normal rain and debris and rebalancing your water. After a major storm — heavy debris, contamination, or a post-hurricane cleanup — we prioritize getting our Belleair Beach customers back to clear and safe as quickly as routes allow, and we quote any major recovery work before starting.',
  },
  {
    q: 'Is your service discreet and respectful of my privacy?',
    a: 'Always. Our technicians work quietly and professionally, respect your property and your time, and keep disruptions to none. For many of our waterfront homeowners, discretion is exactly why they choose us.',
  },
];
