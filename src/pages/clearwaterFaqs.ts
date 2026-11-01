// FAQ source-of-truth for the Clearwater page: the accordion renders it and the
// page's FAQPage JSON-LD is built from it, so the structured data always
// matches the visible text. Its own tiny module so the page chunk can include
// it for JSON-LD without pulling in the rest of the below-the-fold tree.
//
// Answers follow the FAQ, the Service Agreement and the homepage guarantees:
// one-off work is quoted and approved separately; Always Blue needs us to be
// the only ones adding chemicals and excludes leaks and failing equipment;
// techs alternate, so the "who shows up" answer promises a familiar face and a
// documented visit, never one permanent person.
export const clearwaterFaqs = [
  {
    q: 'How does the flat monthly rate work?',
    a: "Your price is set once when we quote your pool, and then it holds. It doesn't climb in July, and standard chemicals never show up as line items. Only one-off work like repairs, parts and green-pool recoveries is billed separately, and you approve each one first.",
  },
  {
    q: "Can you take over from the pool company I'm using now?",
    a: "Yes. We schedule your first visit, usually within a week, and pick up right where the old company left off. If the water needs rescuing first, we'll tell you exactly what it needs before we start.",
  },
  {
    q: 'Who actually shows up each week?',
    a: "A familiar face. Every tech is vetted and background-checked, and routes stay consistent, so your tech learns your pool. Every visit is documented, so even a fill-in tech isn't starting from zero.",
  },
  {
    q: 'Do you cover both Clearwater Beach and the mainland?',
    a: "Both, every week. On the island we cover Clearwater Beach, Sand Key and Island Estates. On the mainland we cover Countryside, Morningside, Del Oro, Skycrest, Harbor Oaks, Sunset Point and Feather Sound. If your street isn't listed, ask anyway.",
  },
  {
    q: 'My pool is a salt system right on the beach. Is that a problem?',
    a: "Not at all. It's a big part of what we do on Sand Key and Clearwater Beach. We check your salt cell every visit and keep stabilizer and chlorine dialed in for the sun, all on one flat rate.",
  },
  {
    q: 'I rent my place out. Can you keep it guest-ready?',
    a: "Yes. You get a dependable weekly day and a photo report after every visit, and we flag anything that needs attention before a guest notices. You don't have to be in town.",
  },
  {
    q: 'My mainland pool is screened in under big oaks. Do you handle the debris?',
    a: "Every week. We skim, empty baskets, brush and keep the filter from clogging, and we'll tell you if a screen tear or drainage issue is letting extra debris in.",
  },
  {
    q: 'What is the Always Blue Guarantee?',
    a: 'Clear, balanced water all week, not just on visit day. If it drifts under our regular care, the return trip is free. It depends on us being the only ones adding chemicals, and it covers normal weekly care, not leaks or equipment failures.',
  },
  {
    q: "I've let the pool go. Will you still take it?",
    a: 'Yes, no lectures. The recovery gets its own up-front quote, then regular weekly service and the flat rate keep it clear.',
  },
];
