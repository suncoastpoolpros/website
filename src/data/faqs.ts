export type FaqCategory =
  | 'Pricing & Billing'
  | 'Our Service'
  | 'Equipment & Repairs'
  | 'Service Areas'
  | 'Getting Started';

export type Faq = {
  question: string;
  answer: string;
  category: FaqCategory;
  /** Optional related tool or guide link rendered below the answer text. */
  relatedTool?: { label: string; href: string };
  /** When true, render a "Get a Free Quote" button (opens the global quote sheet) below the answer. */
  quoteCta?: boolean;
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  'Pricing & Billing',
  'Our Service',
  'Equipment & Repairs',
  'Service Areas',
  'Getting Started',
];

export const faqs: Faq[] = [
  // ── Pricing & Billing ───────────────────────────────────────────
  {
    category: 'Pricing & Billing',
    question: 'How much does pool cleaning cost in St. Petersburg, FL?',
    answer:
      "An average pool runs approximately $150 per month for weekly service, though your exact price varies based on trees, pool size, and many other factors — like your pool's surface, equipment, and how much debris it deals with. That's a true flat rate — it covers brushing, skimming, vacuuming, emptying baskets, testing and balancing your water, and all the standard chemicals, with no per-visit chemical surcharges. The only things billed separately are major equipment repairs, replacement parts, and major storm recovery — and we always quote those before doing any work. Want an exact number? Text us a couple of photos of your pool and equipment pad and we'll send a flat-rate quote the same day.",
    relatedTool: { label: "Estimate your pool's volume", href: '/tools/pool-volume-calculator' },
  },
  {
    category: 'Pricing & Billing',
    question: 'Is everything really one flat monthly price?',
    answer:
      "Yes. Your weekly cleaning and all standard chemicals are bundled into one flat monthly rate — no surprise chemical fees when chlorine demand spikes in summer, and no contracts. A lot of \"cheap\" pool services quote a low base rate and then bill chemicals on top, so your real cost swings month to month. We don't do that. The flat rate covers the full weekly visit and the chemicals needed to keep your water balanced. The only separate charges are major repairs, replacement parts, and major storm cleanups, which we quote and get your approval on first. That way you can budget for pool care like any other monthly bill, with no guessing and no end-of-month surprises.",
  },
  {
    category: 'Pricing & Billing',
    question: 'Do you require a long-term contract?',
    answer:
      "No. Service is month-to-month — there's no long-term contract to sign and no cancellation penalty. We'd rather earn your business every single week than lock you in. If you ever need to pause service (say you're traveling for the season) or stop altogether, just give us a heads up and we'll take care of it. We've found that when a company has to trap customers with contracts, it usually says something about the service. We keep you because the water stays blue and the communication stays clear.",
  },
  {
    category: 'Pricing & Billing',
    question: 'What payment methods do you accept?',
    answer:
      "We accept bank transfers (ACH) and all major credit cards. ACH bank transfers are free. Credit card payments include a small processing fee to cover what the card networks charge us — so if you'd like to avoid any fee, ACH is the way to go. Billing is monthly and predictable since you're on a flat rate, and we'll always send a clear breakdown for anything billed outside your regular plan, like a repair or storm cleanup.",
  },

  {
    category: 'Pricing & Billing',
    question: 'Can I pause service while I travel?',
    answer:
      "Yes. Since service is month-to-month with no contract, you can pause if you're going to be away for an extended stretch — just give us a heads up. We do want to be upfront about one thing: when we pick service back up, if your pool needs more than a standard clean to get it back to swim-ready, there may be a small startup fee — or, if it's drifted further than that, a green-to-clean recovery — depending on the condition we find it in. Keep in mind that in Florida's climate a pool left completely unserviced through the summer can turn green fast, so for shorter trips most customers keep their weekly visits running rather than risk coming home to a recovery project. If you do pause, we'll only bill for the service you actually receive, and we'll get you back on the schedule as soon as you're ready. Just reach out with your dates and we'll sort out the right plan.",
  },

  // ── Our Service ─────────────────────────────────────────────────
  {
    category: 'Our Service',
    question: 'What is the Always Blue Guarantee?',
    answer:
      "The Always Blue Guarantee is our promise that as long as you're on a weekly plan, your water stays clear and balanced — not just on the day we visit, but all week long. If your pool ever drifts out of balance under our regular care, we come back and make it right at no extra charge. To stand behind that, we keep exclusive control over your water chemistry — meaning we ask that you don't add your own chemicals between visits, since that's the most common way a balanced pool gets thrown off. A few things sit outside the guarantee because they're beyond normal weekly care: extreme chemical loss from a leak or a fill-hose left running, and imbalances caused by failing customer equipment until it's repaired. Everything within normal weekly service is covered, period.",
  },
  {
    category: 'Our Service',
    question: 'What makes Suncoast Pool Pros different?',
    answer:
      "Three things: consistency, accountability, and clear communication. You get a consistent technician who knows your pool — not a different face every week from a rotating crew. Every visit is GPS-verified, so you have proof we were actually there and on time. And after every clean you get a written service report documenting what was done and the state of your water, often with photos. On top of that, it's all backed by our Always Blue Guarantee. Most pool-service complaints come down to skipped visits, mystery billing, and water that slowly drifts green — we built the whole service around eliminating exactly those problems, for one flat monthly rate.",
  },
  {
    category: 'Our Service',
    question: "What's included in a weekly pool cleaning?",
    answer:
      "Every weekly visit is a full-service clean. We brush the walls, steps, and waterline, skim the surface, vacuum the floor, and empty the skimmer and pump baskets. Then we test your water and balance the chemistry — chlorine, pH, alkalinity, stabilizer, and more — adding the chemicals your pool needs that week (all included in your flat rate). We also do a quick equipment check on the pump, filter, and any salt system so small issues get caught before they become expensive ones. Afterward you get a written report covering what we did and your water readings. You don't need to be home — as long as we have safe access to the pool and equipment, we handle everything and leave the report behind.",
  },
  {
    category: 'Our Service',
    question: 'How often should a pool be cleaned in Florida?',
    answer:
      "In Florida's warm, humid climate, weekly cleaning is the standard for a reason. Heat, sunlight, frequent rain, and pollen create ideal conditions for algae, and water chemistry drifts fast — a pool can go from clear to green in just a few days if it's neglected during summer. Weekly service keeps chlorine and pH in the safe range, prevents algae from ever taking hold, and keeps your equipment from working overtime. During storm season, an extra visit after heavy rain or a big debris dump can be worth it to rebalance the water and clear out what blew in. For most homeowners here, weekly professional service is the difference between a pool that's always swim-ready and one that's a constant battle.",
  },
  {
    category: 'Our Service',
    question: 'How does stabilizer (CYA) affect my chlorine?',
    answer:
      "Cyanuric acid — CYA, or stabilizer — is sunscreen for your chlorine. Florida sun burns off unprotected chlorine fast, so a little CYA is essential to make it last. But it's a balancing act: the more CYA in your water, the more chlorine you need to get the same sanitizing power, because high stabilizer effectively \"locks up\" your chlorine. That's why a pool can read normal chlorine on a cheap test strip and still turn green — the chlorine is there but isn't active. The fix isn't just dumping in more chlorine; it's keeping CYA in the right range relative to your chlorine, and the only real way to bring CYA down is to dilute with fresh water. Because CYA creeps up over time — most stabilized chlorine tablets add a little every week — we track the ratio on every visit and adjust before it becomes a problem. It's one of the most common reasons a DIY or budget-serviced pool slowly goes green.",
    relatedTool: { label: "Calculate your pool's gallons (needed for accurate dosing)", href: '/tools/pool-volume-calculator' },
  },
  {
    category: 'Our Service',
    question: 'Do you clean saltwater pools?',
    answer:
      "Yes — we service both saltwater and traditional chlorine pools. A saltwater pool is really a chlorine pool that makes its own chlorine from salt using a generator, so it still needs regular testing and balancing. For salt systems we clean the salt cell to remove calcium buildup, check your salinity level, and balance the rest of your chemistry so the water stays clear and gentle on skin and eyes. Salt cells that aren't cleaned regularly lose efficiency and eventually fail early, so that maintenance is part of every visit on a salt pool. Whether you're on salt or chlorine, you're on the same flat-rate weekly plan.",
  },
  {
    category: 'Our Service',
    question: 'Is a pool cleaning service worth it, or should I do it myself?',
    answer:
      "DIY can work if you enjoy it and stay disciplined, but in Florida the math often favors hiring a pro. Doing it yourself means buying and storing chemicals, testing accurately every week, and catching equipment problems early — and a single algae bloom or a balance mistake that damages a heater can cost more than months of service. With a flat-rate plan you get a trained technician, all standard chemicals, equipment monitoring, and a written record every week, with no chemicals to haul or store and no guesswork. Most of our customers come to us either because they're tired of the weekly chore or because a DIY pool turned green and they want it to stay blue for good. Regular professional care also protects your equipment and surfaces, which is where the real long-term savings are.",
  },
  {
    category: 'Our Service',
    question: 'How long does it take to clear a green pool?',
    answer:
      "It depends on how green it is. A pool that's just starting to turn — light cloudy green — can often be back to swimmable in a few days. A deep, dark-green pool you can't see the bottom of can take one to two weeks, because it has to be balanced, shocked, filtered, and vacuumed in stages, with the filter cleaned along the way. Pools don't turn green overnight and they don't recover overnight either; pushing it too fast usually wastes chemicals. We handle green-pool recovery as a separate service from regular weekly care, since the chemicals and labor vary so much case to case. Once it's clear, we'll get you onto a weekly plan so it stays that way — recovery is only worth it if the pool doesn't slide right back.",
  },
  {
    category: 'Our Service',
    question: 'Do you offer one-time cleanings, or only weekly service?',
    answer:
      "We focus on flat-rate weekly maintenance plans rather than one-off cleanings. Weekly service is what actually keeps a pool consistently clear and protects your equipment in Florida's climate — a single cleaning looks great for a few days and then drifts right back, so we'd rather set you up for results that last. The one exception is green-pool recovery: if your pool needs to be brought back from green or heavy neglect, we'll quote that as a separate recovery project and then transition you onto weekly service once it's clear. If you're after just a single clean, give us a call and we'll point you in the right direction.",
  },
  {
    category: 'Our Service',
    question: 'Will I have the same technician each week?',
    answer:
      "Yes, that's the whole idea. We build the service around consistent technicians instead of rotating crews, so the person caring for your pool actually knows it — its quirks, its equipment, and what \"normal\" looks like for your water. That consistency is how problems get caught early, and it's why your service reports stay accurate week to week. Every visit is GPS-verified and documented, so even on the rare occasion someone covers a route, you still get the same standard and the same written record.",
  },
  {
    category: 'Our Service',
    question: 'Do I need to be home for service?',
    answer:
      "No. As long as we have safe, reliable access to your pool and equipment — an unlocked gate, a gate code, or a lockbox — you never need to be home. Most of our customers are at work or out when we service their pool. After each visit we leave behind a written report covering what was done and your water readings, so you always know exactly what happened even if you weren't there. If access ever changes, just let us know so we don't miss a visit.",
  },

  {
    category: 'Our Service',
    question: "Why is my pool green even though I keep adding chlorine?",
    answer:
      "Almost always, it's your stabilizer (cyanuric acid) sitting too high — not too little chlorine. As CYA builds up it 'locks up' your chlorine, so even a normal reading on a test strip isn't actually active enough to kill algae, and the pool goes green in water that looks chemically fine. Tablet chlorine quietly raises CYA a little every week, so it creeps up over a season until your chlorine can't keep up. Adding more chlorine is a temporary patch; the real fix is getting the stabilizer-to-chlorine ratio back in line, which usually means diluting with fresh water and then holding the right balance. It's one of the most common ways a DIY or budget pool slowly goes green — the kind of slow drift nobody notices until the water does. We keep an eye on that ratio every week so it never gets that far.",
    relatedTool: { label: 'Read our guide to clearing a green pool', href: '/pool-care/green-pool' },
  },
  {
    category: 'Our Service',
    question: 'Why is my pool water cloudy?',
    answer:
      "Cloudy water is almost always a circulation or chemistry problem, not actual dirt. Usually it comes down to one of a few things: a dirty or undersized filter, water that isn't moving well (a clogged basket, a valve turned the wrong way, or not enough pump hours), or chemistry that's slipped — high pH, high calcium hardness, or chlorine that's fallen behind. It can also be the first hint of an algae bloom getting going. The catch is that the right fix depends on which one it is, so reaching for clarifier usually just hides it for a day. When we take a pool on, we test and balance it, check the filter and circulation, and actually track down what's clouding it instead of masking it.",
    relatedTool: { label: 'Read our guide to cloudy pool water', href: '/pool-care/cloudy-pool-water' },
  },
  {
    category: 'Our Service',
    question: 'Why does my pool smell like chlorine?',
    answer:
      "Here's the part that surprises people: a strong chlorine smell usually means your pool has too little active chlorine, not too much. That smell comes from chloramines, which form when chlorine binds up with sweat, sunscreen, and the other stuff swimmers bring in. Chloramines are basically spent chlorine — it's done sanitizing — and they're what sting your eyes and catch in the back of your throat. A pool with enough free chlorine actually has almost no smell at all. To clear it, you break the chloramines apart (usually with a shock) and then hold free chlorine where it belongs so they don't build back up. Staying ahead of that week to week is the whole point of steady balancing.",
    relatedTool: { label: 'Read our guide on the pool-chlorine smell', href: '/pool-care/pool-smells-like-chlorine' },
  },
  {
    category: 'Our Service',
    question: 'Is it safe to swim right after my pool is serviced?',
    answer:
      "For routine weekly service, yes — once the chemicals we added have circulated for a bit (generally around 20–30 minutes with the pump running), the pool is ready to swim. The main exception is after a heavy shock or a green-pool treatment, where chlorine is deliberately raised well above normal; then you'll want to wait until free chlorine drifts back into the normal range, which can take anywhere from a few hours to overnight depending on the dose. If we ever do anything that needs more time than usual, we'll say so in your service report. When in doubt, a quick test of free chlorine and pH is the surest way to know it's swim-ready.",
  },
  {
    category: 'Our Service',
    question: 'How often should I drain my pool in Florida?',
    answer:
      "Less often than most people think, and almost never all the way. A typical Florida pool only needs a partial drain-and-refill every couple of years, and it's driven by chemistry rather than the calendar. Over time dissolved solids — and especially stabilizer (cyanuric acid) — build up to where no amount of chemicals will balance the water, and the only real fix is to swap some of it for fresh. We track those levels on every visit and tell you when a partial drain (or reverse-osmosis filtration, which wastes far less water) genuinely makes sense. Fully draining a pool here can be risky — Florida's high water table can actually push an empty pool out of the ground — so it's not something to do without a reason.",
    relatedTool: { label: 'How stabilizer buildup forces a drain', href: '/pool-care/cyanuric-acid' },
  },

  // ── Equipment & Repairs ─────────────────────────────────────────
  {
    category: 'Equipment & Repairs',
    question: 'Do you handle repairs, or just cleaning?',
    answer:
      "Both. Beyond weekly cleaning, we diagnose equipment problems and handle repairs and new installations to keep your whole system running. Because our technicians check your equipment on every visit, we tend to catch issues — a struggling pump, a clogged filter, a failing salt cell — before they leave you with a green pool or a much bigger bill. When we spot something, we flag it in your service report and give you a clear, upfront quote before doing any repair work. Repairs and parts are billed separately from your flat-rate weekly cleaning, never bundled in as a surprise.",
  },
  {
    category: 'Equipment & Repairs',
    question: 'What pool equipment can you repair or install?',
    answer:
      "We work on the core systems that keep a pool circulating and clean: pumps, filters, heaters, and salt-chlorine generators, along with the related plumbing and valves. Whether it's a pump that's lost prime, a filter that needs servicing or replacement, a heater that won't fire, or a salt cell at the end of its life, we can diagnose it and walk you through the fix. If a repair comes up during a weekly visit, we'll note it in your report and quote it before doing anything, so you're always in control of the cost.",
  },
  {
    category: 'Equipment & Repairs',
    question: 'How often should a pool filter be cleaned or backwashed?',
    answer:
      "It depends on the filter type and how hard your pool is working, but a good rule of thumb is to clean or backwash when the filter's pressure gauge climbs about 8–10 psi above its clean baseline. For many Florida pools that lands somewhere in the every-few-months range, and more often during heavy use or after storms drag in extra debris. A dirty filter quietly chokes your circulation, which makes the water harder to keep clear and forces your pump to work harder. Since we check your equipment on every weekly visit, we keep an eye on filter pressure and take care of this as part of keeping your water balanced.",
  },
  {
    category: 'Equipment & Repairs',
    question: 'Can you fix my pool light?',
    answer:
      "Yes. A dark pool light is usually one of a few things — a burned-out bulb, a tripped GFCI, corroded contacts, or water that's made its way into the fixture — and we can diagnose which it is and handle the repair or replacement. Pool lights run on electricity around water, so this isn't a great DIY job; we make sure the fixture is sealed and safe, not just lit. If we notice a light out during a weekly visit, we'll flag it in your report and quote the fix before doing any work, just like our other repairs.",
  },
  {
    category: 'Equipment & Repairs',
    question: 'How do you detect pool leaks?',
    answer:
      "We start by reading the clues in your water. Tracking chemistry markers like stabilizer and calcium hardness alongside how much water the pool is actually losing tells us whether you're dealing with normal Florida evaporation or a genuine leak. If the numbers and the water-loss pattern point to a leak, we'll explain what we're seeing and walk you through the next steps to pin down and address it. Catching a leak early matters — beyond wasted water, a persistent leak can undermine equipment and the area around the pool.",
  },

  {
    category: 'Equipment & Repairs',
    question: 'Are variable-speed pumps worth it?',
    answer:
      "For most Florida pools, yes — and not by a little. The pump is often the second-hungriest energy user in a home after the air conditioner, and an old single-speed pump runs at full blast the entire time it's on. A variable-speed pump runs slow and quiet most of the day and only ramps up when it needs to, which typically slashes pump energy use and pays back its cost within a few years on the power bill alone. They're also dramatically quieter and easier on the rest of your equipment. Efficiency rules have made single-speed pumps in most sizes hard to even buy new, so when an old pump dies, a variable-speed replacement is usually the obvious call. If yours is getting up there, we'll flag it and walk you through the numbers before anything gets replaced.",
    relatedTool: { label: 'Read our guide to variable-speed pumps', href: '/pool-care/variable-speed-pumps' },
  },
  {
    category: 'Equipment & Repairs',
    question: 'How long does a salt cell last?',
    answer:
      "Most salt cells last about 3 to 7 years, and where you land comes down mostly to maintenance. The cell makes chlorine by running current through salt water, and over time calcium scales up on its plates — if that scale isn't cleaned off, the cell loses output and fails early. Letting your chemistry run out of balance (especially high pH or hardness) wears it out faster too. On salt pools we check the cell and clean off scale as part of regular service, which is the best way to get full life out of an expensive part. When a cell does finally reach the end, we'll give you a heads up before it leaves you short on chlorine.",
    relatedTool: { label: 'Saltwater vs. chlorine, explained', href: '/pool-care/salt-water-vs-chlorine' },
  },
  {
    category: 'Equipment & Repairs',
    question: 'How long does pool equipment last?',
    answer:
      "As a rough guide: pumps tend to last around 8–12 years, filters 10+ years (with cartridges or grids replaced along the way), heaters about 7–12 years, and salt cells 3–7 years. Florida's heat, humidity, and salt air tend to push those toward the shorter end, and equipment that's run out of balance or never inspected gives out sooner. The upside is that most equipment warns you before it quits — new noises, weaker flow, longer heat-up times. Because we look over your equipment pad on every weekly visit, we usually spot those signs early, so you can plan a replacement on your terms instead of scrambling when something fails mid-summer.",
  },

  // ── Service Areas ───────────────────────────────────────────────
  {
    category: 'Service Areas',
    question: 'What areas does Suncoast Pool Pros service?',
    answer:
      "We cover all of Pinellas County plus West Tampa. That includes St. Petersburg, Gulfport, St. Pete Beach, Treasure Island, Seminole, Largo, Belleair Beach, Clearwater, Safety Harbor, Dunedin, and Palm Harbor, along with the South Tampa and Davis Island area across the bay. Because our routes are concentrated around St. Petersburg and the Gulf-side beach communities, we can keep visits reliable and on-schedule rather than stretching crews thin across the whole metro. If you're anywhere in or near Pinellas County, there's a strong chance we already service your street.",
  },
  {
    category: 'Service Areas',
    question: "What if I don't see my city listed?",
    answer:
      "Give us a call at (727) 295-3621 — if you're in or near Pinellas County or the West Tampa side, there's a good chance we already have a technician on your street, even if your specific neighborhood isn't named above. We'll confirm coverage for your exact address and let you know the soonest we can start. Our service area does grow as routes fill in, so it's always worth a quick call to check.",
  },
  {
    category: 'Service Areas',
    question: 'Do you service commercial, HOA, or community pools?',
    answer:
      "Absolutely. Alongside residential pools, we maintain community, HOA, apartment, and hotel pools. Commercial pools come with extra responsibilities — local health-code standards, required chemical logs, and tighter consistency expectations — and we handle all of it, including the documentation you need on file. If you manage a property or community with one or more pools, reach out and we'll put together service that keeps you compliant and keeps residents and guests happy.",
  },

  {
    category: 'Service Areas',
    question: 'Do you service spas and hot tubs?',
    answer:
      "Yes. Spas and attached spa-pool combos are common around Tampa Bay, and we keep them clean and balanced as part of your service. Spas run hotter and have a much smaller water volume than a pool, so their chemistry can swing quickly — that means careful, consistent testing matters even more. Whether you've got a spa built into your pool or a standalone hot tub, mention it when you reach out and we'll factor it into your flat-rate quote.",
  },

  {
    category: 'Service Areas',
    question: 'Do you specialize in beach and barrier-island pools?',
    answer:
      "Yes — the Gulf beach communities are a big part of our routes, and a beachfront pool has needs an inland route just isn't set up for. Salt air corrodes equipment far faster, blowing sand ends up in the water and the baskets, and relentless sun burns off chlorine quickly, so we run a slightly heavier equipment-check and chemistry routine on them. We service St. Pete Beach, Treasure Island, Belleair Beach, and the surrounding barrier islands, plus the bayfront and waterfront neighborhoods nearby. If your pool sits near the Gulf, we know the particular way it wears.",
    relatedTool: { label: 'See our St. Pete Beach pool service', href: '/st-pete-beach-fl' },
  },

  // ── Getting Started ─────────────────────────────────────────────
  {
    category: 'Getting Started',
    question: 'How do I get a quote?',
    answer:
      "There are three easy ways, and all of them get a same-day reply during business hours. The fastest is to text us a couple of photos — one of your pool and one of your equipment pad — along with your address, and we'll send back a flat-rate quote, often without needing to visit. You can also call us at (727) 295-3621 to talk it through with a real person, or fill out the short quote form on our site and we'll reach out. No pressure, no obligation, and no drawn-out sales process — just a clear flat-rate number so you know exactly what weekly service will cost.",
    quoteCta: true,
  },
  {
    category: 'Getting Started',
    question: 'How quickly can you start service?',
    answer:
      "In most cases, quickly. Once we've confirmed your flat-rate quote, we'll get you onto a weekly route as soon as our schedule allows in your area — and since our routes are concentrated around Pinellas and the beaches, that's often within days rather than weeks. The best way to get an exact start date is to call (727) 295-3621 or text us your address; we'll check the route nearest you and tell you the soonest we can begin. If your pool needs green-pool recovery first, we'll handle that, then roll you straight onto weekly service.",
  },
  {
    category: 'Getting Started',
    question: 'What happens to my pool service after a storm or hurricane?',
    answer:
      "Florida storms are a fact of life, and they hit pools hard — debris, runoff, and power outages can throw your water badly out of balance fast. Routine weekly service includes clearing normal rain and debris and rebalancing your chemistry. Major storm recovery — think a pool full of branches, heavy contamination, or post-hurricane cleanup — is quoted separately because the labor and chemicals involved vary so much. After a big storm we prioritize getting our customers' pools rebalanced and safe as quickly as routes allow. The worst thing you can do is let a storm-hit pool sit, so reach out and we'll get it back on track.",
  },
  {
    category: 'Getting Started',
    question: 'What do you need from me to start service?',
    answer:
      "Very little. Once your flat-rate quote is confirmed, all we really need is reliable access to your pool and equipment — an unlocked gate on your service day, a gate code, or a lockbox works perfectly — plus a quick note on anything we should know, like a pet in the yard, a salt system, or a spa. We'll set up billing (ACH or card) and slot you into the weekly route nearest you. From there you don't need to do anything or be home; we handle the visits and leave a written report each time. If access or anything else changes down the road, just let us know.",
  },
  {
    category: 'Getting Started',
    question: 'What are your hours?',
    answer:
      "We answer Monday through Saturday, 8:00 AM to 6:00 PM, and we're closed Sundays. Texts and quote-form submissions sent during business hours get a same-day reply. If you reach out after hours or on a Sunday, we'll get back to you first thing the next business day. For anything urgent — like a pool that's turned green before an event, or possible equipment failure — calling during business hours is the fastest way to reach us.",
  },
  {
    category: 'Getting Started',
    question: 'How do I switch from my current pool service?',
    answer:
      "It's about the easiest switch you'll make. Just reach out — call or text (727) 295-3621, or send the quote form — and once your flat-rate quote is set, we handle the transition so there's no gap where the pool slips. There's nothing awkward to coordinate; you let your old company know you're done, and we pick up on your new weekly day. If the pool drifted a little during the handoff, we'll bring it back to balanced and clear and keep it there. Most people switch because they're tired of skipped visits, creeping bills, or never seeing the same tech twice — the exact things this service is built to fix.",
    quoteCta: true,
  },
];
