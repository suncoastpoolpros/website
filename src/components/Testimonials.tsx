import React from 'react';
import { m } from 'motion/react';
import { Star } from 'lucide-react';
import { Container } from '@/components/Container';

const testimonials = [
  {
    name: "Sarah Jenkins",
    location: "Snell Isle",
    text: "Finally, a pool company that actually shows up when they say they will. The photo reports are a game changer for my peace of mind.",
    rating: 5
  },
  {
    name: "Mike Ross",
    location: "Old Northeast",
    text: "I was paying a fortune in chemicals with my last guy. Suncoast's flat rate saved me about $40/month and the pool looks better than ever.",
    rating: 5
  },
  {
    name: "Elena Rodriguez",
    location: "Shore Acres",
    text: "They fixed a green pool situation in 48 hours that I had been fighting for weeks. Highly recommend their team.",
    rating: 5
  }
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-brand-orange/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <Container className="relative z-10">
        <div className="text-center mb-16">
          <h2 className="section-heading text-white mb-4">
            St. Pete Loves <span className="text-brand-orange">Suncoast</span>
          </h2>
          <p className="section-subtext max-w-2xl mx-auto">
            Don't just take our word for it. Here's what your neighbors are saying.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-8 rounded-3xl relative"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">"{t.text}"</p>
              <div>
                <p className="text-white font-bold">{t.name}</p>
                <p className="text-brand-orange text-sm">{t.location}</p>
              </div>
            </m.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
