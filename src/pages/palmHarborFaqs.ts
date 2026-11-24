// FAQ source-of-truth for the Palm Harbor page: the accordion renders it and
// the page's FAQPage JSON-LD is built from it, so the structured data always
// matches the visible text.
//
// Five answers are Clearwater's, word for word (clearwaterFaqs.ts), and follow
// the same rules: one-off work is quoted and approved separately; Always Blue
// needs us to be the only ones adding chemicals and excludes leaks and failing
// equipment; techs alternate, so "who shows up" promises a familiar face and a
// documented visit, never one permanent person.
export const palmHarborFaqs = [
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
    q: 'Do you cover both sides of US-19, including East Lake?',
    a: 'Both, every week. On the Gulf side we cover Ozona, Crystal Beach and downtown Palm Harbor. On the lake side we cover Lansbrook, Ridgemoor, Highland Lakes, Tarpon Woods and East Lake. If your street isn’t listed, ask anyway.',
  },
  {
    q: 'My pool has a spa and a heater. Do you look after those too?',
    a: 'Yes. We test the spa water and check the heater along with the rest of your equipment at every visit. If something needs a repair, you get a straight answer and a quote before any work starts.',
  },
  {
    q: 'We’re away part of the year. Will the pool still be looked after?',
    a: 'Yes. Service continues on the same day every week, and you get a photo report after each visit so you can see the pool from anywhere. We flag anything that needs attention before it becomes a problem.',
  },
  {
    q: 'My pool is screened in under oaks and pines. Do you handle the debris?',
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
