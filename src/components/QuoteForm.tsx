import React, { useState } from 'react';
import { m } from 'motion/react';
import { Send, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { Container } from '@/components/Container';
import { FieldShell, fieldClass, selectClass } from '@/components/FormField';
import { sendContact } from '@/lib/contactSubmit';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';

export const QuoteForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    try {
      await sendContact({
        name: value('name'),
        phone: value('phone'),
        zip: value('zip'),
        email: value('email'),
        service: value('service'),
        source: 'homepage-quote-form',
        submittedAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        `We couldn't submit your request. Please try again, or call us at ${PHONE_DISPLAY}.`
      );
      console.error('Quote form submit failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section id="quote" className="py-24 relative">
        <div className="max-w-3xl mx-auto px-4">
          <m.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel p-12 text-center rounded-[2.5rem]"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Quote Request Received!</h3>
            <p className="text-gray-300 text-lg">
              Thanks for contacting Suncoast Pool Pros. One of our experts will call you shortly to confirm your St. Petersburg address and provide your flat rate.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-8 text-brand-blue-light hover:text-white font-medium transition-colors"
            >
              Send another request
            </button>
          </m.div>
        </div>
      </section>
    );
  }

  return (
    <section id="quote" className="py-32 relative">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="section-heading text-white leading-tight mb-5">
              Request your flat-rate quote.
            </h2>
            <p className="section-subtext mb-6">
              Tell us a little about your pool and we'll get back to you the same day with a
              clear, no-pressure flat rate. No contracts, no obligation.
            </p>
            <p className="text-gray-400">
              Prefer to talk?{' '}
              <a
                href={PHONE_HREF}
                className="text-brand-blue-light hover:text-white font-semibold transition-colors"
              >
                Call or text {PHONE_DISPLAY}
              </a>
              .
            </p>
          </div>

          <m.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-panel p-6 sm:p-10 rounded-3xl relative"
          >
            {/* Glow Effect */}
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

              <FieldShell id="service" label="What do you need?" floated>
                <select
                  id="service"
                  name="service"
                  required
                  defaultValue=""
                  className={selectClass}
                >
                  <option value="" disabled></option>
                  <option value="weekly">Weekly Pool Cleaning</option>
                  <option value="green">Green Pool Recovery</option>
                  <option value="repair">Equipment Repair or Installation</option>
                  <option value="commercial">Commercial / HOA Pool</option>
                  <option value="other">Something else</option>
                </select>
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
                    Request My Quote{' '}
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
        </div>
      </Container>
    </section>
  );
};
