import React, { useState } from 'react';
import { m } from 'motion/react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { FieldShell, fieldClass, textareaClass } from '@/components/FormField';
import { sendContact } from '@/lib/contactSubmit';
import { usePageMeta } from '@/lib/usePageMeta';
import {
  PHONE_DISPLAY,
  PHONE_HREF,
  EMAIL,
  EMAIL_HREF,
  ADDRESS_LINE,
  ADDRESS_CITY_STATE_ZIP,
  HOURS_DISPLAY,
} from '@/lib/contact';

const ContactPageInner = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMeta(
    'Contact Suncoast Pool Pros — Pool Service in St. Petersburg, FL',
    'Reach Suncoast Pool Pros — call, text, or message us for a flat-rate weekly pool service quote in St. Petersburg, Clearwater, and Tampa Bay.',
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    try {
      await sendContact({
        name: value('name'),
        email: value('email'),
        phone: value('phone'),
        message: value('message'),
        source: 'contact-page',
        submittedAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        `We couldn't send your message. Please try again, or call us at ${PHONE_DISPLAY}.`
      );
      console.error('Contact form submit failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="fixed inset-0 bg-mesh opacity-60 pointer-events-none" />

      {/* Spread ambient glows — distinct from the top-clustered hero glow on
          other pages, same brand palette. */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 right-[-8%] w-[560px] h-[560px] rounded-full bg-brand-orange/10 blur-[130px] animate-float" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[680px] h-[680px] rounded-full bg-brand-blue/15 blur-[150px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm px-3.5 py-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-medium tracking-wide text-xs">
              Get in touch
            </span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Contact us
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
            Questions, quotes, or scheduling — reach out and we'll get back to you the same
            day. Serving St. Petersburg and the Tampa Bay area, Monday through Saturday.
          </p>
        </section>

        {/* Two-column: contact info (left) + form (right) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* LEFT — contact details */}
            <div className="space-y-4">
              <a
                href={PHONE_HREF}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]"
              >
                <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-brand-orange" />
                </span>
                <span className="min-w-0">
                  <span className="block text-white font-semibold">Call or text</span>
                  <span className="block text-gray-400 group-hover:text-white transition-colors">
                    {PHONE_DISPLAY}
                  </span>
                </span>
              </a>

              <a
                href={EMAIL_HREF}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]"
              >
                <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-brand-orange" />
                </span>
                <span className="min-w-0">
                  <span className="block text-white font-semibold">Email</span>
                  <span className="block text-gray-400 group-hover:text-white transition-colors break-all">
                    {EMAIL}
                  </span>
                </span>
              </a>

              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-brand-orange" />
                </span>
                <span className="min-w-0">
                  <span className="block text-white font-semibold">Address</span>
                  <span className="block text-gray-400">
                    {ADDRESS_LINE}<br />
                    {ADDRESS_CITY_STATE_ZIP}
                  </span>
                </span>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-brand-orange" />
                </span>
                <span className="min-w-0">
                  <span className="block text-white font-semibold">Hours</span>
                  <span className="block text-gray-400">
                    {HOURS_DISPLAY}<br />
                    Sunday: Closed
                  </span>
                </span>
              </div>

              <p className="text-gray-500 text-sm leading-relaxed px-1 pt-1">
                Serving all of Pinellas County &amp; West Tampa — St. Petersburg, Clearwater,
                Largo, Seminole, Gulfport &amp; the surrounding Tampa Bay area.
              </p>
            </div>

            {/* RIGHT — message form */}
            {submitted ? (
              <m.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-panel p-10 sm:p-12 text-center rounded-3xl"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Message sent!</h2>
                <p className="text-gray-300 text-lg">
                  Thanks for reaching out to Suncoast Pool Pros. We'll get back to you the same
                  day during business hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-8 text-brand-blue-light hover:text-white font-medium transition-colors"
                >
                  Send another message
                </button>
              </m.div>
            ) : (
              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-6 sm:p-10 rounded-3xl relative"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-blue/20 rounded-full blur-3xl pointer-events-none" />

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
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
                    <FieldShell id="email" label="Email">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        autoComplete="email"
                        className={fieldClass}
                        placeholder=" "
                      />
                    </FieldShell>
                  </div>

                  <FieldShell id="message" label="How can we help?" multiline>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      className={textareaClass}
                      placeholder=" "
                    />
                  </FieldShell>

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
                      <span className="animate-pulse">Sending…</span>
                    ) : (
                      <>
                        Send Message{' '}
                        <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-2 text-center text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4" />
                    We respond promptly. No spam. No obligation.
                  </p>
                </form>
              </m.div>
            )}
          </div>
        </div>

        <Footer />
      </div>

      <StickyMobileCta />
    </div>
  );
};

export const ContactPage = () => <ContactPageInner />;
