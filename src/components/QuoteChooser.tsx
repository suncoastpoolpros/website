import React, { useEffect, useState } from 'react';
import { MessageSquare, Phone, Camera, MapPin, Send, ClipboardList, ArrowLeft, ChevronRight } from 'lucide-react';
import { sendContact } from '@/lib/contactSubmit';
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

export const QuoteChooser = () => {
  const isDesktop = useIsDesktop();
  // Default-open the most relevant option per device.
  const [choice, setChoice] = useState<Choice>(null);
  const [formSent, setFormSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Service type lives in React state so we can render conditional fields
  // tailored to what the buyer needs (e.g. green-pool severity, equipment
  // type for repair). The native <select> stays uncontrolled in the DOM —
  // we read its value via onChange and mirror it into state for rendering.
  const [service, setService] = useState<Service>('');

  // Clicking a card from the three-option view commits to that path.
  // The back button (rendered above the pinned card) is what clears it.
  const select = (c: Exclude<Choice, null>) => setChoice(c);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const data = new FormData(e.currentTarget);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    // Honeypot — humans can't see/fill the `website` field (display:none + aria-hidden).
    // If it has a value, this is almost certainly a bot scraping form fields by
    // name; pretend we sent it and bail. We never want bots to learn from errors.
    if (value('website')) {
      setFormSent(true);
      return;
    }
    try {
      await sendContact({
        name: value('name'),
        email: value('email'),
        phone: value('phone'),
        address: value('address'),
        service: value('service'),
        // Conditional fields — only one set will be populated depending on
        // the chosen service type. Empty strings are stripped backend-side.
        greenSeverity: value('greenSeverity'),
        greenSize: value('greenSize'),
        greenNotes: value('greenNotes'),
        repairEquipment: value('repairEquipment'),
        repairIssue: value('repairIssue'),
        commercialPropertyType: value('commercialPropertyType'),
        commercialPoolCount: value('commercialPoolCount'),
        commercialRole: value('commercialRole'),
        otherDetails: value('otherDetails'),
        source: 'quote-chooser',
        submittedAt: new Date().toISOString(),
      });
      setFormSent(true);
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
          We answer <span className="text-white font-medium">{HOURS_SHORT}</span> — a quick conversation to understand your pool.
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
          <div className="text-center py-4">
            <p className="text-white font-semibold mb-1">Got it — thanks.</p>
            <p className="text-gray-400 text-sm">We'll email your flat rate, same day.</p>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-3">
            {/* Honeypot — hidden from humans (display:none + aria-hidden + tabIndex)
                but bot field-fillers see it as a normal field and populate it.
                Submissions that include a value here are silently dropped above. */}
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
              className="w-full px-4 py-3 bg-[#0a1628]/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/50 transition"
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
                placeholder="Full name"
                className="w-full px-4 py-3 bg-[#0a1628]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/50 transition"
              />
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email"
                className="w-full px-4 py-3 bg-[#0a1628]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/50 transition"
              />
            </div>
            <input
              required
              name="address"
              placeholder="Home address"
              className="w-full px-4 py-3 bg-[#0a1628]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/50 transition"
            />
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Phone (optional)"
              className="w-full px-4 py-3 bg-[#0a1628]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/50 transition"
            />

            {/* ---- Conditional fields, keyed by service type ---- */}
            {service === 'green' && (
              <ConditionalBlock label="Tell us about the pool">
                <select
                  name="greenSeverity"
                  defaultValue=""
                  required
                  className={INPUT_CLS}
                >
                  <option value="" disabled>How green is it?</option>
                  <option value="tint">Slight tint — still mostly clear</option>
                  <option value="cloudy">Cloudy green</option>
                  <option value="opaque">Can't see the bottom</option>
                  <option value="debris">Algae &amp; debris — full neglect</option>
                </select>
                <select
                  name="greenSize"
                  defaultValue=""
                  required
                  className={INPUT_CLS}
                >
                  <option value="" disabled>Approximate pool size</option>
                  <option value="small">Small (under 10,000 gal)</option>
                  <option value="medium">Medium (10,000–20,000 gal)</option>
                  <option value="large">Large (20,000+ gal)</option>
                  <option value="unsure">Not sure</option>
                </select>
                <textarea
                  name="greenNotes"
                  rows={2}
                  placeholder="Anything else? (equipment running, last serviced, etc.)"
                  className={`${INPUT_CLS} resize-none`}
                />
              </ConditionalBlock>
            )}

            {service === 'repair' && (
              <ConditionalBlock label="What's the issue?">
                <select
                  name="repairEquipment"
                  defaultValue=""
                  required
                  className={INPUT_CLS}
                >
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
                  placeholder="Briefly describe the issue (sounds, leaks, error codes, etc.)"
                  className={`${INPUT_CLS} resize-none`}
                />
              </ConditionalBlock>
            )}

            {service === 'commercial' && (
              <ConditionalBlock label="About the property">
                <select
                  name="commercialPropertyType"
                  defaultValue=""
                  required
                  className={INPUT_CLS}
                >
                  <option value="" disabled>Property type</option>
                  <option value="hoa">HOA</option>
                  <option value="condo">Condo / Apartment</option>
                  <option value="hotel">Hotel / Resort</option>
                  <option value="club">Club / Gym</option>
                  <option value="other">Other commercial</option>
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    name="commercialPoolCount"
                    defaultValue=""
                    required
                    className={INPUT_CLS}
                  >
                    <option value="" disabled>How many pools?</option>
                    <option value="1">1</option>
                    <option value="2-3">2–3</option>
                    <option value="4+">4+</option>
                  </select>
                  <select
                    name="commercialRole"
                    defaultValue=""
                    required
                    className={INPUT_CLS}
                  >
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

            {service === 'other' && (
              <ConditionalBlock label="Tell us more">
                <textarea
                  name="otherDetails"
                  rows={4}
                  required
                  placeholder="What do you need? The more detail, the more accurate the quote."
                  className={`${INPUT_CLS} resize-none`}
                />
              </ConditionalBlock>
            )}

            {formError && (
              <p className="text-center text-red-300 text-xs">{formError}</p>
            )}
            <button
              type="submit"
              className="btn btn-blue w-full"
            >
              Send to Suncoast
            </button>
            <p className="text-center text-gray-500 text-xs">Same-day reply · No obligation</p>
          </form>
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
          onClick={() => setChoice(null)}
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
