import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { MessageSquare, Phone, ChevronDown, Camera, MapPin, Send, ClipboardList } from 'lucide-react';
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
export const QuoteChooser = () => {
  const isDesktop = useIsDesktop();
  // Default-open the most relevant option per device.
  const [choice, setChoice] = useState<Choice>(null);
  const [formSent, setFormSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggle = (c: Choice) => setChoice((prev) => (prev === c ? null : c));

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const data = new FormData(e.currentTarget);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    try {
      await sendContact({
        name: value('name'),
        phone: value('phone'),
        address: value('address'),
        service: value('service'),
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
  const TextCard = (
    <Card
      active={choice === 'text'}
      onToggle={() => toggle('text')}
      accent="orange"
      icon={<MessageSquare className="w-5 h-5 text-white" />}
      iconWrap="bg-brand-orange"
      title="Text us photos"
      subtitle="Fastest — get a quote without a call"
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
      onToggle={() => toggle('call')}
      accent="neutral"
      icon={<Phone className="w-5 h-5 text-brand-blue-light" />}
      iconWrap="bg-white/10 border border-white/15"
      title="Call us"
      subtitle="Talk to a real person, not a call center"
    >
      <div className="px-5 pb-5 pt-1">
        <p className="text-sm text-gray-300 leading-relaxed mb-5">
          We answer <span className="text-white font-medium">{HOURS_SHORT}</span>.
          Tell us your address and a bit about your pool, and we'll give you a flat-rate quote on the spot.
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
      onToggle={() => toggle('form')}
      accent="blue"
      icon={<ClipboardList className="w-5 h-5 text-white" />}
      iconWrap="bg-brand-blue"
      title="Fill out a quick form"
      subtitle="We'll reach out with your flat-rate quote"
    >
      <div className="px-5 pb-5 pt-1">
        {formSent ? (
          <div className="text-center py-4">
            <p className="text-white font-semibold mb-1">Thanks — we got it!</p>
            <p className="text-gray-400 text-sm">We'll text or call you with your flat rate, same day.</p>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                name="name"
                placeholder="Full name"
                className="w-full px-4 py-3 bg-[#0a1628]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/50 transition"
              />
              <input
                required
                name="phone"
                type="tel"
                placeholder="Phone"
                className="w-full px-4 py-3 bg-[#0a1628]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/50 transition"
              />
            </div>
            <input
              required
              name="address"
              placeholder="Home address"
              className="w-full px-4 py-3 bg-[#0a1628]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/50 transition"
            />
            <select
              name="service"
              defaultValue=""
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
            {formError && (
              <p className="text-center text-red-300 text-xs">{formError}</p>
            )}
            <button
              type="submit"
              className="btn btn-blue w-full"
            >
              Request My Quote
            </button>
            <p className="text-center text-gray-500 text-xs">No spam · No obligation · Same-day reply</p>
          </form>
        )}
      </div>
    </Card>
  );

  // Device-aware order
  const cards = isDesktop
    ? [{ k: 'form', el: FormCard }, { k: 'call', el: CallCard }, { k: 'text', el: TextCard }]
    : [{ k: 'text', el: TextCard }, { k: 'call', el: CallCard }, { k: 'form', el: FormCard }];

  return (
    <div className="flex flex-col gap-3 w-full text-left">
      {cards.map(({ k, el }) => (
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

const Card = ({ active, onToggle, accent, icon, iconWrap, title, subtitle, children }: CardProps) => (
  <div className={`rounded-2xl border ${accentBorder[accent]} ${accentBg[accent]} overflow-hidden`}>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={active}
      className="w-full flex items-center gap-3 px-5 py-4 text-left"
    >
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconWrap}`}>
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-white font-semibold text-[15px] leading-tight">{title}</span>
        <span className="block text-gray-400 text-xs mt-0.5">{subtitle}</span>
      </span>
      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${active ? 'rotate-180' : ''}`} />
    </button>

    <AnimatePresence initial={false}>
      {active && (
        <m.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  </div>
);
