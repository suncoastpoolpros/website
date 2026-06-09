import React, { useState, useEffect } from 'react';
import { m, useScroll, useTransform } from 'motion/react';
import { UserPlus, Send, CheckCircle, Phone, ShieldCheck, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FieldShell, fieldClass, selectClass, textareaClass } from '@/components/FormField';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { sendSignup } from '@/lib/signupWebhook';
import { trackEvent } from '@/lib/analytics';
import { usePageMeta } from '@/lib/usePageMeta';

const US_STATES = [
  { code: 'AL' }, { code: 'AK' }, { code: 'AZ' }, { code: 'AR' }, { code: 'CA' },
  { code: 'CO' }, { code: 'CT' }, { code: 'DE' }, { code: 'DC' }, { code: 'FL' },
  { code: 'GA' }, { code: 'HI' }, { code: 'ID' }, { code: 'IL' }, { code: 'IN' },
  { code: 'IA' }, { code: 'KS' }, { code: 'KY' }, { code: 'LA' }, { code: 'ME' },
  { code: 'MD' }, { code: 'MA' }, { code: 'MI' }, { code: 'MN' }, { code: 'MS' },
  { code: 'MO' }, { code: 'MT' }, { code: 'NE' }, { code: 'NV' }, { code: 'NH' },
  { code: 'NJ' }, { code: 'NM' }, { code: 'NY' }, { code: 'NC' }, { code: 'ND' },
  { code: 'OH' }, { code: 'OK' }, { code: 'OR' }, { code: 'PA' }, { code: 'RI' },
  { code: 'SC' }, { code: 'SD' }, { code: 'TN' }, { code: 'TX' }, { code: 'UT' },
  { code: 'VT' }, { code: 'VA' }, { code: 'WA' }, { code: 'WV' }, { code: 'WI' },
  { code: 'WY' },
];

const SignupPageInner = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');

  // Parallax: the blue glow lags behind the page as you scroll down (desktop
  // only). The scroll transform runs every frame, so on mobile — where it caused
  // scroll jank — we disable it and render the glow static. Starts disabled to
  // match SSR/first paint, enables after mount on >=md.
  const [parallaxOn, setParallaxOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setParallaxOn(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const { scrollY } = useScroll();
  const glowYTransform = useTransform(scrollY, [0, 1000], [0, 400]);
  const glowY = parallaxOn ? glowYTransform : 0;

  // Today's date (YYYY-MM-DD) — prevents selecting a start date in the past.
  const today = new Date().toISOString().split('T')[0];

  usePageMeta({
    title: 'Start Weekly Pool Service in the Tampa Bay Area',
    description:
      "Tell us about your pool and we'll quote your flat weekly rate, usually within the same business day. No contracts, no obligation.",
    canonicalPath: '/signup/',
    // Transactional onboarding page — keep it out of search (thin, post-quote),
    // but crawlable + prerendered so the noindex is actually read and direct
    // visits (email/ad links) still paint fast.
    noindex: true,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const value = (key: string) => String(data.get(key) ?? '').trim();

    setFirstName(value('name').split(' ')[0] ?? '');

    try {
      await sendSignup({
        name: value('name'),
        email: value('email'),
        phone: value('phone'),
        address: value('address'),
        city: value('city'),
        state: value('state'),
        zip: value('zip'),
        poolType: value('poolType'),
        spa: value('spa'),
        heater: value('heater'),
        pets: value('pets'),
        startDate: value('startDate'),
        notes: value('notes'),
        agreeRequirements: data.get('agreeRequirements') === 'on',
        agreeService: data.get('agreeService') === 'on',
        agreePrivacy: data.get('agreePrivacy') === 'on',
        source: 'signup-page',
        submittedAt: new Date().toISOString(),
      });
      setSubmitted(true);
      trackEvent('generate_lead', { source: 'signup-page' });
    } catch (err) {
      setError(
        `We couldn't submit your signup. Please try again, or call us at ${PHONE_DISPLAY}.`
      );
      console.error('Signup webhook failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />

      {/* Signup-only shadow overlay: darkens the edges & corners for depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 35%, transparent 35%, rgba(2, 6, 14, 0.55) 100%), linear-gradient(to bottom, rgba(2, 6, 14, 0.45) 0%, transparent 25%, transparent 70%, rgba(2, 6, 14, 0.7) 100%)',
        }}
      />

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10 text-center">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative"
          >
            <span className="inline-flex items-center gap-2 mb-6 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-[10px]">
              <UserPlus className="w-3.5 h-3.5 text-brand-blue-light" />
              <span className="text-gray-300 font-semibold tracking-[0.18em] uppercase text-[11px]">
                New Customer Onboarding
              </span>
            </span>

            <h1 className="font-display font-bold tracking-tight text-white text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-5">
              Welcome to{' '}
              <span className="block sm:inline">
                Suncoast Pool Pros
              </span>
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed max-w-lg mx-auto">
              Now that your quote's approved, this is the final step. Take a minute to
              confirm a few details about your pool and property — accurate info helps us
              set up your account and get your first service on the schedule.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-blue-light" />
                No long-term contracts
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-blue-light" />
                Flat-rate pricing
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-blue-light" />
                Locally owned
              </span>
            </div>
          </m.div>
        </section>

        {/* Form / Success */}
        <section className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {/* Parallax blue glow — drifts slower than the page on scroll */}
          <m.div
            aria-hidden="true"
            style={{ y: glowY }}
            className="absolute -top-10 right-0 z-0 w-72 h-72 bg-brand-blue/25 rounded-full blur-[90px] pointer-events-none"
          />
          {submitted ? (
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="glass-panel p-10 sm:p-14 text-center rounded-3xl"
            >
              <m.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
                className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-7 border border-green-500/30"
              >
                <CheckCircle className="w-10 h-10 text-green-500" />
              </m.div>

              <p className="text-brand-blue-light font-semibold tracking-[0.18em] uppercase text-xs mb-3">
                Signup Complete
              </p>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl mb-4">
                {firstName ? `Thank you, ${firstName}!` : 'Thank you!'}
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed max-w-md mx-auto mb-6">
                We truly appreciate you taking the time to share these details. The more we
                know about your pool, the better we can tailor our service to keep it
                crystal clear — exactly the way you want it.
              </p>

              <div className="text-left max-w-md mx-auto mb-9 space-y-3">
                <p className="text-white font-semibold text-sm uppercase tracking-wide">
                  What happens next
                </p>
                {[
                  'One of our pool experts will review your information.',
                  "We'll reach out to confirm the details and answer any questions.",
                  'Then we get your first service scheduled — welcome aboard!',
                ].map((step) => (
                  <div key={step} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 text-brand-blue-light mt-0.5" />
                    <span className="text-gray-300">{step}</span>
                  </div>
                ))}
              </div>

              <a href={PHONE_HREF} className="btn btn-glass">
                <Phone className="w-[18px] h-[18px]" />
                Questions? Call {PHONE_DISPLAY}
              </a>
            </m.div>
          ) : (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 sm:p-10 rounded-3xl relative"
            >
              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                {/* Contact */}
                <fieldset className="space-y-6">
                  <legend className="text-white font-display font-bold text-lg mb-2">
                    Your Contact Info
                  </legend>

                  <FieldShell id="name" label="Full Name">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      autoComplete="name"
                      className={fieldClass}
                      placeholder=" "
                    />
                  </FieldShell>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FieldShell id="email" label="Email">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        autoComplete="email"
                        className={fieldClass}
                        placeholder=" "
                      />
                    </FieldShell>
                    <FieldShell id="phone" label="Phone">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        autoComplete="tel"
                        className={fieldClass}
                        placeholder=" "
                      />
                    </FieldShell>
                  </div>
                </fieldset>

                {/* Service Address */}
                <fieldset className="space-y-6">
                  <legend className="text-white font-display font-bold text-lg mb-2">
                    Service Address
                  </legend>

                  <FieldShell id="address" label="Street Address">
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required
                      autoComplete="street-address"
                      className={fieldClass}
                      placeholder=" "
                    />
                  </FieldShell>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <FieldShell id="city" label="City" className="col-span-2">
                      <input
                        type="text"
                        id="city"
                        name="city"
                        required
                        autoComplete="address-level2"
                        className={fieldClass}
                        placeholder=" "
                      />
                    </FieldShell>
                    <FieldShell id="state" label="State" floated>
                      <select
                        id="state"
                        name="state"
                        required
                        defaultValue="FL"
                        autoComplete="address-level1"
                        className={selectClass}
                      >
                        {US_STATES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.code}
                          </option>
                        ))}
                      </select>
                    </FieldShell>
                    <FieldShell id="zip" label="Zip Code">
                      <input
                        type="text"
                        id="zip"
                        name="zip"
                        required
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={5}
                        autoComplete="postal-code"
                        className={fieldClass}
                        placeholder=" "
                      />
                    </FieldShell>
                  </div>
                </fieldset>

                {/* Service requirements — surfaced in plain English so customers
                    can't miss the operational expectations buried in the agreement. */}
                <fieldset className="space-y-4">
                  <legend className="text-white font-display font-bold text-lg mb-2">
                    Service Requirements
                  </legend>
                  <p className="text-sm text-gray-400 -mt-1 mb-3">
                    To service your pool reliably, the following are required:
                  </p>
                  <ul className="space-y-2.5 mb-2">
                    {[
                      'Customers consult Suncoast Pool Pros before adding chemicals or salt',
                      'A working garden hose remains accessible during service visits',
                      'Pool equipment is operational for proper service and water balance',
                      'Worn filter media — cartridges, DE grids, or sand — is replaced as needed and billed separately from the flat rate',
                      'Clear, safe access to the pool and equipment area is provided',
                      'Pets are secured during service visits',
                      'Repairs, scheduling, or other service concerns are communicated promptly',
                    ].map((req) => (
                      <li key={req} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue-light" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                  <label
                    htmlFor="agreeRequirements"
                    className="flex items-start gap-3 cursor-pointer text-gray-300 mt-5"
                  >
                    <input
                      type="checkbox"
                      id="agreeRequirements"
                      name="agreeRequirements"
                      required
                      className="mt-1 h-5 w-5 shrink-0 rounded border-white/20 bg-[#0a1628]/50 text-brand-blue accent-brand-blue focus:ring-1 focus:ring-brand-blue/50"
                    />
                    <span className="text-sm leading-relaxed">
                      I have read and agree to the service requirements listed above (also
                      included in the Service Agreement).
                    </span>
                  </label>
                </fieldset>

                {/* Pool Details */}
                <fieldset className="space-y-6">
                  <legend className="text-white font-display font-bold text-lg mb-2">
                    About Your Pool
                  </legend>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FieldShell id="poolType" label="Pool Type" floated>
                      <select
                        id="poolType"
                        name="poolType"
                        required
                        defaultValue=""
                        className={selectClass}
                      >
                        <option value="" disabled></option>
                        <option value="saltwater">Saltwater</option>
                        <option value="chlorine">Chlorine</option>
                        <option value="bromine">Bromine</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </FieldShell>
                    <FieldShell id="pets" label="Are there pets on the property?" floated>
                      <select
                        id="pets"
                        name="pets"
                        required
                        defaultValue=""
                        className={selectClass}
                      >
                        <option value="" disabled></option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </FieldShell>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FieldShell id="spa" label="Spa Attached?" floated>
                      <select
                        id="spa"
                        name="spa"
                        required
                        defaultValue=""
                        className={selectClass}
                      >
                        <option value="" disabled></option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="not-sure">Not Sure</option>
                      </select>
                    </FieldShell>
                    <FieldShell id="heater" label="Heater Present?" floated>
                      <select
                        id="heater"
                        name="heater"
                        required
                        defaultValue=""
                        className={selectClass}
                      >
                        <option value="" disabled></option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="not-sure">Not Sure</option>
                      </select>
                    </FieldShell>
                  </div>

                  <FieldShell id="notes" label="Additional notes (optional)" multiline>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={4}
                      className={textareaClass}
                      placeholder=" "
                    />
                  </FieldShell>
                </fieldset>

                {/* Scheduling */}
                <fieldset className="space-y-3">
                  <legend className="text-white font-display font-bold text-lg mb-2">
                    When would you like to start?
                  </legend>
                  <FieldShell id="startDate" label="Earliest preferred start date" floated>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      required
                      min={today}
                      className={fieldClass}
                    />
                  </FieldShell>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This isn't a guarantee we can begin on this exact date — it simply
                    helps us schedule your first visit as close as possible to your
                    requested date.
                  </p>
                </fieldset>

                {/* Agreements */}
                <fieldset className="space-y-4">
                  <label
                    htmlFor="agreeService"
                    className="flex items-start gap-3 cursor-pointer text-gray-300"
                  >
                    <input
                      type="checkbox"
                      id="agreeService"
                      name="agreeService"
                      required
                      className="mt-1 h-5 w-5 shrink-0 rounded border-white/20 bg-[#0a1628]/50 text-brand-blue accent-brand-blue focus:ring-1 focus:ring-brand-blue/50"
                    />
                    <span className="text-sm leading-relaxed">
                      I have read and agree to the{' '}
                      <a
                        href="/service-agreement"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue-light hover:text-white font-semibold underline underline-offset-2"
                      >
                        Service Agreement
                      </a>
                      .
                    </span>
                  </label>

                  <label
                    htmlFor="agreePrivacy"
                    className="flex items-start gap-3 cursor-pointer text-gray-300"
                  >
                    <input
                      type="checkbox"
                      id="agreePrivacy"
                      name="agreePrivacy"
                      required
                      className="mt-1 h-5 w-5 shrink-0 rounded border-white/20 bg-[#0a1628]/50 text-brand-blue accent-brand-blue focus:ring-1 focus:ring-brand-blue/50"
                    />
                    <span className="text-sm leading-relaxed">
                      I have read and agree to the{' '}
                      <a
                        href="/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue-light hover:text-white font-semibold underline underline-offset-2"
                      >
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>
                </fieldset>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-gradient-to-r from-brand-blue to-brand-blue-dark hover:from-brand-blue-light hover:to-brand-blue text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-blue/20 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <span className="animate-pulse">Submitting…</span>
                  ) : (
                    <>
                      Complete Sign Up{' '}
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="flex items-center justify-center gap-2 text-center text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4" />
                  Your information is kept private and used only to set up your service.
                </p>
              </form>
            </m.div>
          )}
        </section>

        <Footer />
      </div>
    </div>
  );
};

export const SignupPage = () => <SignupPageInner />;
