import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Phone, Camera, MapPin, Send, ClipboardList, ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { sendContact } from '@/lib/contactSubmit';
import { useTurnstile } from '@/lib/turnstile';
import { clearDraft, readDraft, writeDraft } from '@/lib/quoteDraft';
import { PHONE_DISPLAY, PHONE_HREF, SMS_HREF, SMS_QUOTE_HREF, HOURS_SHORT } from '@/lib/contact';

const TEXT_STEPS = [
  { icon: Camera, text: 'Snap a photo of your pool' },
  { icon: Camera, text: 'Snap a photo of your equipment pad' },
  { icon: MapPin, text: 'Include your home address' },
];

type Choice = 'text' | 'call' | 'form' | null;

// Tailwind sm breakpoint = 640px
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isDesktop;
};

/**
 * Quote chooser used in the QuoteSheet (bottom sheet on mobile, modal on desktop).
 * Three paths — Text, Call, Form — ordered by device:
 *   mobile  → Text first (lowest friction on a phone)
 *   desktop → Form first (texting is awkward on a computer)
 */
// Service types — kept in one place so the <select>, conditional blocks, and
// submission payload stay aligned. Adding a service here is the only change
// needed to add another path through the form.
type Service = '' | 'weekly' | 'green' | 'repair' | 'commercial' | 'other';

// Shared input style — keeps every form field visually consistent. Used by
// the standard fields and every conditional block below.
const INPUT_CLS =
  'w-full px-4 py-3 bg-[#0a1628]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/50 transition';

/**
 * Wrapper around a conditional block of form fields. Renders a small
 * section label, then the fields flat in the form flow — no inset
 * container — so conditional fields read as part of the same form,
 * not a separate sub-form.
 */
const ConditionalBlock = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-3 pt-1">
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-blue-light">
      {label}
    </p>
    {children}
  </div>
);

export const QuoteChooser = ({ onSubmitted }: { onSubmitted?: () => void } = {}) => {
  const isDesktop = useIsDesktop();
  // Default-open the most relevant option per device. Starts at `null` to match
  // the server-rendered HTML; the post-mount draft restore (below) can override
  // it. NEVER call readDraft() during initial render — localStorage doesn't
  // exist in the prerender step, so the initial-state values would differ
  // between SSR and client and React would throw a hydration mismatch (#418).
  const [choice, setChoice] = useState<Choice>(null);
  const [formSent, setFormSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const turnstile = useTurnstile();
  // Service type lives in React state so step 2 can render the right fields
  // for what the buyer needs (e.g. green-pool severity, equipment type for
  // repair). Mirrored via onChange from the native <select> on step 1.
  const [service, setService] = useState<Service>('');
  // Two-step form: step 1 = contact + service type, step 2 = pool/service
  // specifics. Splitting reduces the visual weight of the form and lets us
  // ask for the deeper info we actually need to quote accurately.
  const [formStep, setFormStep] = useState<1 | 2>(1);
  // Step 1 values are stashed when the user clicks "Next" so the inputs can
  // safely unmount when step 2 renders. We re-hydrate them at submit time.
  const [step1Data, setStep1Data] = useState<Record<string, string>>({});
  // Step 2 values mirror to state on change so they survive a re-render or
  // tab close. We use uncontrolled inputs with defaultValue elsewhere for
  // simplicity; this ref-mirror is purely for persistence.
  const step2DraftRef = useRef<Record<string, string>>({});
  // Banner flag — set true post-mount if a draft was hydrated. We hide the
  // banner the moment the user touches a field so it doesn't nag.
  const [showRestoredBanner, setShowRestoredBanner] = useState<boolean>(false);
  // Bumped on draft hydration so any uncontrolled inputs that read draftVal()
  // for their defaultValue re-render with the restored values.
  const [draftHydrationKey, setDraftHydrationKey] = useState(0);

  // Post-hydration draft restore. Runs once on mount, AFTER React has matched
  // the server HTML to the client tree. Safe to touch localStorage here.
  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;
    step2DraftRef.current = draft.step2 ?? {};
    setStep1Data(draft.step1 ?? {});
    setService((draft.service as Service) ?? '');
    setFormStep(draft.step ?? 1);
    setChoice('form');
    setShowRestoredBanner(true);
    setDraftHydrationKey((k) => k + 1);
  }, []);

  // Clicking a card from the three-option view commits to that path.
  // The back button (rendered above the pinned card) is what clears it.
  const select = (c: Exclude<Choice, null>) => setChoice(c);

  // Reset the form back to step 1 when the user backs out of the form card,
  // so re-entering doesn't drop them mid-flow with stale state. Also clears
  // any persisted draft — backing out means "start over."
  const resetForm = () => {
    setFormStep(1);
    setStep1Data({});
    setService('');
    setFormError(null);
    step2DraftRef.current = {};
    setShowRestoredBanner(false);
    clearDraft();
  };

  // Persist whatever's currently in the step 1 form to the draft. Called from
  // an onChange listener on the form element itself, so any field edit triggers
  // a write. Reads via FormData so we don't need to control each input.
  const persistStep1FromForm = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const get = (k: string) => String(data.get(k) ?? '');
    const step1 = {
      name: get('name'),
      email: get('email'),
      phone: get('phone'),
      address: get('address'),
      service: get('service'),
    };
    writeDraft({
      step: 1,
      service: step1.service,
      step1,
      step2: step2DraftRef.current,
    });
    // Touching a field means the buyer is engaging — hide the restored banner.
    setShowRestoredBanner(false);
  };

  // Same for step 2. The set of named fields changes per service type, so we
  // grab everything FormData hands us (skipping the honeypot).
  const persistStep2FromForm = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const next: Record<string, string> = {};
    data.forEach((v, k) => {
      if (k === 'website') return;
      next[k] = String(v);
    });
    step2DraftRef.current = next;
    writeDraft({
      step: 2,
      service,
      step1: step1Data,
      step2: next,
    });
    setShowRestoredBanner(false);
  };

  // Helper for step 2 inputs — returns the persisted value for a field, or
  // empty string if there's no draft entry for it. Use as defaultValue so
  // inputs remain uncontrolled (forms still read via FormData).
  const draftVal = (key: string): string => step2DraftRef.current[key] ?? '';

  const handleStep1Next = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const data = new FormData(e.currentTarget);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    // Honeypot — humans can't see/fill the `website` field. Bots that fill
    // every named input will trip it. We silently "succeed" so they don't
    // learn from errors.
    if (value('website')) {
      setFormSent(true);
      return;
    }
    const step1 = {
      name: value('name'),
      email: value('email'),
      phone: value('phone'),
      address: value('address'),
      service: value('service'),
    };
    setStep1Data(step1);
    setFormStep(2);
    // Move the draft to step 2 so a refresh between here and submit drops the
    // buyer onto the right step.
    writeDraft({
      step: 2,
      service: step1.service,
      step1,
      step2: step2DraftRef.current,
    });
    setShowRestoredBanner(false);
  };

  const handleStep2Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const data = new FormData(e.currentTarget);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    // Fresh Turnstile token per submit. '' when widget isn't configured —
    // server accepts that during the development window before the secret
    // is set in Cloudflare.
    const turnstileToken = await turnstile.execute().catch(() => '');
    try {
      await sendContact({
        turnstileToken,
        ...step1Data,
        // Step 2 fields. Most are service-specific — empty strings are
        // stripped backend-side, so unused fields are harmless.
        // Weekly cleaning specifics
        poolSize: value('poolSize'),
        poolType: value('poolType'),
        heaterType: value('heaterType'),
        screenEnclosure: value('screenEnclosure'),
        debrisLoad: value('debrisLoad'),
        // Green pool recovery
        greenSeverity: value('greenSeverity'),
        greenSize: value('greenSize'),
        greenNotes: value('greenNotes'),
        // Repair
        repairEquipment: value('repairEquipment'),
        repairIssue: value('repairIssue'),
        // Commercial
        commercialPropertyType: value('commercialPropertyType'),
        commercialPoolCount: value('commercialPoolCount'),
        commercialRole: value('commercialRole'),
        // Other
        otherDetails: value('otherDetails'),
        source: 'quote-chooser',
        submittedAt: new Date().toISOString(),
      });
      // Successful submit — drop the saved draft so the next quote request
      // starts fresh (including for other people on a shared computer).
      clearDraft();
      step2DraftRef.current = {};
      setFormSent(true);
      onSubmitted?.();
    } catch (err) {
      setFormError(`Something went wrong. Please call or text ${PHONE_DISPLAY}.`);
      console.error('Quote chooser submit failed:', err);
    }
  };

  // ---- Card definitions ----
  // When a choice is committed, the chosen card is "pinned" (no chevron, no
  // toggle) since the back button replaces that interaction.
  const pinned = choice !== null;
  const TextCard = (
    <Card
      active={choice === 'text'}
      onToggle={() => select('text')}
      pinned={pinned}
      accent="orange"
      icon={<MessageSquare className="w-[22px] h-[22px] text-white" />}
      iconWrap="bg-gradient-to-br from-brand-orange to-brand-orange-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_-2px_rgba(255,114,15,0.4)]"
      title="Text a few photos"
      subtitle="The fastest way to a quote."
      badge="Fastest"
    >
      <div className="px-5 pb-5 pt-1">
        {/* Steps: stacked on mobile, 3-across on desktop */}
        <ol className="mb-5 flex flex-col sm:flex-row gap-3 sm:gap-2.5">
          {TEXT_STEPS.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 sm:flex-col sm:items-start sm:flex-1 sm:gap-2 sm:rounded-xl sm:bg-white/[0.03] sm:border sm:border-white/[0.06] sm:p-3.5"
            >
              <span className="w-6 h-6 rounded-full bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center shrink-0 text-brand-orange text-xs font-bold">
                {i + 1}
              </span>
              <span className="flex items-start gap-2 text-sm text-gray-300 leading-snug">
                <step.icon className="w-4 h-4 text-brand-orange/70 mt-0.5 shrink-0 sm:hidden" />
                {step.text}
              </span>
            </li>
          ))}
        </ol>

        {/* Action: real SMS deep-link on mobile, "text us at" number on desktop */}
        {isDesktop ? (
          <div className="rounded-xl bg-white/[0.04] border border-white/10 px-5 py-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Text the photos to</p>
            <a
              href={SMS_HREF}
              className="text-white font-display font-bold text-2xl tracking-tight hover:text-brand-orange-light transition-colors"
            >
              {PHONE_DISPLAY}
            </a>
            <p className="text-gray-500 text-xs mt-2">We reply same day, Mon–Sat</p>
          </div>
        ) : (
          <>
            <a
              href={SMS_QUOTE_HREF}
              className="btn btn-orange w-full"
            >
              <Send className="w-[18px] h-[18px]" />
              Open Messages (pre-filled)
            </a>
            <p className="text-center text-gray-500 text-xs mt-3">
              Texts to {PHONE_DISPLAY} · We reply same day
            </p>
          </>
        )}
      </div>
    </Card>
  );

  const CallCard = (
    <Card
      active={choice === 'call'}
      onToggle={() => select('call')}
      pinned={pinned}
      accent="neutral"
      icon={<Phone className="w-[22px] h-[22px] text-brand-blue-light" />}
      iconWrap="bg-gradient-to-br from-white/[0.12] to-white/[0.04] border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
      title="Give us a call"
      subtitle="A real person answers — same day."
    >
      <div className="px-5 pb-5 pt-1">
        <p className="text-sm text-gray-300 leading-relaxed mb-5">
          We answer <span className="text-white font-semibold">{HOURS_SHORT}</span> — a quick conversation to understand your pool.
        </p>
        <a
          href={PHONE_HREF}
          className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-white text-[#07111c] rounded-xl font-semibold text-[15px] hover:bg-gray-100 transition-colors"
        >
          <Phone className="w-[18px] h-[18px]" />
          Call {PHONE_DISPLAY}
        </a>
      </div>
    </Card>
  );

  const FormCard = (
    <Card
      active={choice === 'form'}
      onToggle={() => select('form')}
      pinned={pinned}
      accent="blue"
      icon={<ClipboardList className="w-[22px] h-[22px] text-white" />}
      iconWrap="bg-gradient-to-br from-brand-blue to-brand-blue-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_-2px_rgba(22,105,174,0.4)]"
      title="Send us your details"
      subtitle="We'll come back with a flat rate."
    >
      <div className="px-5 pb-5 pt-1">
        {formSent ? (
          <div className="flex flex-col items-center text-center py-6">
            <span className="w-14 h-14 rounded-full bg-green-500/15 border border-green-400/30 flex items-center justify-center mb-4 shadow-[0_0_0_6px_rgba(34,197,94,0.06)]">
              <Check className="w-7 h-7 text-green-400" strokeWidth={2.5} />
            </span>
            <p className="text-white font-display font-bold text-lg leading-tight mb-1.5">
              We've got your details.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
              Thank you — we've received your information and will be in touch
              soon with your flat-rate quote.
            </p>
            <p className="text-gray-500 text-xs mt-3">
              Same-day reply · Mon–Sat
            </p>
          </div>
        ) : (
          <>
            {/* Turnstile widget — invisible, mounted at the outer level so it
                survives the step-1 → step-2 form swap and the token request
                on submit always has a live widget to call. */}
            <div
              ref={turnstile.containerRef}
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
            />

            {/* Restore banner — shown when we hydrated state from a saved
                draft. Hides itself the moment the buyer touches a field, so
                it never lingers as nag UI. The "Start over" link clears the
                draft + resets everything for someone who isn't the original
                drafter (e.g. shared device).

                `pointer-events-none` on the wrapper + `pointer-events-auto`
                on the button keeps the banner purely informational —
                belt-and-suspenders so an unexpected layout quirk (sibling
                margin collapse, transform context, etc.) can never make the
                banner intercept clicks on the fields/submit button below. */}
            {showRestoredBanner && (
              <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-brand-blue/25 bg-brand-blue/[0.06] px-3 py-2.5 pointer-events-none">
                <p className="text-[12px] text-gray-200 leading-snug">
                  <span className="text-white font-semibold">Picking up where you left off.</span>
                  <span className="block text-gray-400 mt-0.5">Your info is still here from before.</span>
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="pointer-events-auto text-[12px] text-brand-blue-light hover:text-white underline underline-offset-2 decoration-brand-blue-light/40 hover:decoration-white/60 transition-colors shrink-0"
                >
                  Start over
                </button>
              </div>
            )}

            {/* Step indicator — quietly tells the buyer they're not stuck in a
                surprise multi-page form. Two steps, total. */}
            <div className="flex items-center justify-between mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              <span>Step {formStep} of 2</span>
              <span className="flex gap-1.5" aria-hidden="true">
                <span className={`h-1 w-8 rounded-full ${formStep >= 1 ? 'bg-brand-blue-light' : 'bg-white/10'}`} />
                <span className={`h-1 w-8 rounded-full ${formStep >= 2 ? 'bg-brand-blue-light' : 'bg-white/10'}`} />
              </span>
            </div>

            {formStep === 1 && (
              <form
                // Re-key after draft hydration so each input's defaultValue
                // is re-read from the now-populated step1Data.
                key={`step1-${draftHydrationKey}`}
                onSubmit={handleStep1Next}
                // Bubble onChange catches any field edit inside the form,
                // then we serialize the whole form via FormData. No need to
                // wire change handlers per input.
                onChange={(e) => persistStep1FromForm(e.currentTarget)}
                className="space-y-3"
              >
                {/* Honeypot — hidden from humans (display:none + aria-hidden + tabIndex)
                    but bot field-fillers see it as a normal field and populate it.
                    Submissions that include a value here are silently dropped. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
                />
                <select
                  name="service"
                  value={service}
                  onChange={(e) => setService(e.target.value as Service)}
                  required
                  className={INPUT_CLS}
                >
                  <option value="" disabled>What do you need?</option>
                  <option value="weekly">Weekly Pool Cleaning</option>
                  <option value="green">Green Pool Recovery</option>
                  <option value="repair">Equipment Repair / Installation</option>
                  <option value="commercial">Commercial / HOA Pool</option>
                  <option value="other">Something else</option>
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    required
                    name="name"
                    defaultValue={step1Data.name ?? ''}
                    placeholder="Full name"
                    className={INPUT_CLS}
                  />
                  <input
                    required
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={step1Data.email ?? ''}
                    placeholder="Email"
                    className={INPUT_CLS}
                  />
                </div>
                <input
                  required
                  name="address"
                  defaultValue={step1Data.address ?? ''}
                  placeholder="Home address"
                  className={INPUT_CLS}
                />
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  defaultValue={step1Data.phone ?? ''}
                  placeholder="Phone (optional)"
                  className={INPUT_CLS}
                />

                <button type="submit" className="btn btn-blue w-full">
                  Next: Pool details
                  <ChevronRight className="w-[18px] h-[18px]" />
                </button>
                <p className="text-center text-gray-500 text-xs">
                  Step 2 is a few quick questions about your pool — takes under a minute.
                </p>
              </form>
            )}

            {formStep === 2 && (
              <form
                // Re-key after draft hydration so each input's defaultValue
                // is re-read from the now-populated step2DraftRef. Without
                // this, inputs that rendered before the draft hydrated would
                // hold their initial empty defaultValue.
                key={`step2-${draftHydrationKey}`}
                onSubmit={handleStep2Submit}
                onChange={(e) => persistStep2FromForm(e.currentTarget)}
                className="space-y-3"
              >
                {/* ---- Weekly Pool Cleaning — pricing essentials ---- */}
                {service === 'weekly' && (
                  <ConditionalBlock label="About your pool">
                    <select name="poolSize" defaultValue={draftVal('poolSize')} required className={INPUT_CLS}>
                      <option value="" disabled>Approximate pool size</option>
                      <option value="small">Small (under 10,000 gal)</option>
                      <option value="medium">Medium (10,000–20,000 gal)</option>
                      <option value="large">Large (20,000+ gal)</option>
                      <option value="unsure">Not sure</option>
                    </select>
                    <select name="poolType" defaultValue={draftVal('poolType')} required className={INPUT_CLS}>
                      <option value="" disabled>Saltwater or chlorine?</option>
                      <option value="salt">Saltwater</option>
                      <option value="chlorine">Traditional chlorine</option>
                      <option value="unsure">Not sure</option>
                    </select>
                    <select name="heaterType" defaultValue={draftVal('heaterType')} required className={INPUT_CLS}>
                      <option value="" disabled>Heater type</option>
                      <option value="none">No heater</option>
                      <option value="gas">Gas heater</option>
                      <option value="electric">Electric / heat pump</option>
                      <option value="solar">Solar</option>
                      <option value="unsure">Not sure</option>
                    </select>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select name="screenEnclosure" defaultValue={draftVal('screenEnclosure')} required className={INPUT_CLS}>
                        <option value="" disabled>Screen enclosure?</option>
                        <option value="yes">Yes — screened</option>
                        <option value="no">No — open</option>
                      </select>
                      <select name="debrisLoad" defaultValue={draftVal('debrisLoad')} required className={INPUT_CLS}>
                        <option value="" disabled>Trees / debris</option>
                        <option value="low">Little to none</option>
                        <option value="medium">Some trees nearby</option>
                        <option value="high">Lots — heavy debris</option>
                      </select>
                    </div>
                  </ConditionalBlock>
                )}

                {/* ---- Green Pool Recovery ---- */}
                {service === 'green' && (
                  <ConditionalBlock label="Tell us about the pool">
                    <select name="greenSeverity" defaultValue={draftVal('greenSeverity')} required className={INPUT_CLS}>
                      <option value="" disabled>How green is it?</option>
                      <option value="tint">Slight tint — still mostly clear</option>
                      <option value="cloudy">Cloudy green</option>
                      <option value="opaque">Can't see the bottom</option>
                      <option value="debris">Algae &amp; debris — full neglect</option>
                    </select>
                    <select name="greenSize" defaultValue={draftVal('greenSize')} required className={INPUT_CLS}>
                      <option value="" disabled>Approximate pool size</option>
                      <option value="small">Small (under 10,000 gal)</option>
                      <option value="medium">Medium (10,000–20,000 gal)</option>
                      <option value="large">Large (20,000+ gal)</option>
                      <option value="unsure">Not sure</option>
                    </select>
                    <textarea
                      name="greenNotes"
                      rows={2}
                      defaultValue={draftVal('greenNotes')}
                      placeholder="Anything else? (equipment running, last serviced, etc.)"
                      className={`${INPUT_CLS} resize-none`}
                    />
                  </ConditionalBlock>
                )}

                {/* ---- Repair / Installation ---- */}
                {service === 'repair' && (
                  <ConditionalBlock label="What's the issue?">
                    <select name="repairEquipment" defaultValue={draftVal('repairEquipment')} required className={INPUT_CLS}>
                      <option value="" disabled>What needs attention?</option>
                      <option value="pump">Pump</option>
                      <option value="filter">Filter</option>
                      <option value="salt-cell">Salt cell</option>
                      <option value="heater">Heater</option>
                      <option value="lights">Lights</option>
                      <option value="automation">Automation / controls</option>
                      <option value="multiple">Multiple items</option>
                      <option value="unsure">Not sure — please help diagnose</option>
                    </select>
                    <textarea
                      name="repairIssue"
                      rows={3}
                      required
                      defaultValue={draftVal('repairIssue')}
                      placeholder="Briefly describe the issue (sounds, leaks, error codes, etc.)"
                      className={`${INPUT_CLS} resize-none`}
                    />
                  </ConditionalBlock>
                )}

                {/* ---- Commercial / HOA ---- */}
                {service === 'commercial' && (
                  <ConditionalBlock label="About the property">
                    <select name="commercialPropertyType" defaultValue={draftVal('commercialPropertyType')} required className={INPUT_CLS}>
                      <option value="" disabled>Property type</option>
                      <option value="hoa">HOA</option>
                      <option value="condo">Condo / Apartment</option>
                      <option value="hotel">Hotel / Resort</option>
                      <option value="club">Club / Gym</option>
                      <option value="other">Other commercial</option>
                    </select>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select name="commercialPoolCount" defaultValue={draftVal('commercialPoolCount')} required className={INPUT_CLS}>
                        <option value="" disabled>How many pools?</option>
                        <option value="1">1</option>
                        <option value="2-3">2–3</option>
                        <option value="4+">4+</option>
                      </select>
                      <select name="commercialRole" defaultValue={draftVal('commercialRole')} required className={INPUT_CLS}>
                        <option value="" disabled>Your role</option>
                        <option value="owner">Owner</option>
                        <option value="property-manager">Property manager</option>
                        <option value="board">Board member</option>
                        <option value="maintenance">Maintenance lead</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </ConditionalBlock>
                )}

                {/* ---- Something else — free text ---- */}
                {service === 'other' && (
                  <ConditionalBlock label="Tell us more">
                    <textarea
                      name="otherDetails"
                      rows={4}
                      required
                      defaultValue={draftVal('otherDetails')}
                      placeholder="What do you need? The more detail, the more accurate the quote."
                      className={`${INPUT_CLS} resize-none`}
                    />
                  </ConditionalBlock>
                )}

                {formError && (
                  <p className="text-center text-red-300 text-xs">{formError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg bg-white/[0.06] border border-white/10 text-gray-200 hover:text-white hover:bg-white/10 transition-colors text-sm font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button type="submit" className="btn btn-blue flex-1">
                    Send to Suncoast
                  </button>
                </div>
                <p className="text-center text-gray-500 text-xs">Same-day reply · No obligation</p>
              </form>
            )}
          </>
        )}
      </div>
    </Card>
  );

  // Device-aware order
  const cards = isDesktop
    ? [{ k: 'form', el: FormCard }, { k: 'call', el: CallCard }, { k: 'text', el: TextCard }]
    : [{ k: 'text', el: TextCard }, { k: 'call', el: CallCard }, { k: 'form', el: FormCard }];

  // When a choice is locked in, hide the other two and offer a back button so
  // the buyer can return to the three-option view. Reduces decision noise at
  // the moment of conversion.
  const visibleCards = choice ? cards.filter((c) => c.k === choice) : cards;

  return (
    <div className="flex flex-col gap-3.5 w-full text-left">
      {choice && (
        <button
          type="button"
          onClick={() => {
            setChoice(null);
            resetForm();
          }}
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-[13px] -mt-1 mb-1 self-start transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All options
        </button>
      )}
      {visibleCards.map(({ k, el }) => (
        <React.Fragment key={k}>{el}</React.Fragment>
      ))}
    </div>
  );
};

/* ---- Shared expandable card ---- */
type CardProps = {
  active: boolean;
  onToggle: () => void;
  accent: 'orange' | 'blue' | 'neutral';
  icon: React.ReactNode;
  iconWrap: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** When true, the card is the only visible option (others hidden). The
   *  collapse chevron is removed and the header becomes static — the back
   *  button above replaces the toggle interaction. */
  pinned?: boolean;
  /** Optional small label aligned to the title (e.g. "Fastest"). */
  badge?: string;
};

const accentBorder = {
  orange: 'border-brand-orange/30',
  blue: 'border-brand-blue/30',
  neutral: 'border-white/15',
};
const accentBg = {
  orange: 'bg-gradient-to-b from-brand-orange/[0.10] to-white/[0.02]',
  blue: 'bg-gradient-to-b from-brand-blue/[0.10] to-white/[0.02]',
  neutral: 'bg-white/[0.04]',
};

const accentBadge = {
  orange: 'bg-brand-orange/15 text-brand-orange-light border border-brand-orange/30',
  blue: 'bg-brand-blue/15 text-brand-blue-light border border-brand-blue/30',
  neutral: 'bg-white/10 text-gray-300 border border-white/15',
};

const Card = ({
  active,
  onToggle,
  accent,
  icon,
  iconWrap,
  title,
  subtitle,
  children,
  pinned = false,
  badge,
}: CardProps) => {
  const HeaderInner = (
    <>
      <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconWrap}`}>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-white font-semibold text-[15px] leading-tight">{title}</span>
          {badge && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-[2px] rounded-full ${accentBadge[accent]}`}
            >
              {badge}
            </span>
          )}
        </span>
        <span className="block text-gray-400 text-[13px] mt-1 leading-snug">{subtitle}</span>
      </span>
      {!pinned && (
        <ChevronRight className="w-5 h-5 text-gray-500 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-300" />
      )}
    </>
  );

  return (
    <div
      className={`rounded-2xl border ${accentBorder[accent]} ${accentBg[accent]} overflow-hidden transition-transform ${
        !pinned ? 'hover:-translate-y-px hover:shadow-lg hover:shadow-black/20' : ''
      }`}
    >
      {pinned ? (
        <div className="w-full flex items-center gap-3.5 px-5 py-4">{HeaderInner}</div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="group w-full flex items-center gap-3.5 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
        >
          {HeaderInner}
        </button>
      )}

      {/* Body — rendered only in pinned mode. Going from three-button view to
          focus view is an instant swap (no accordion expand), and going back
          is an instant swap too. The cards behave as buttons, not accordions. */}
      {pinned && active && <div>{children}</div>}
    </div>
  );
};
