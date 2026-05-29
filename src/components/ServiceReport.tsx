import React, { useEffect, useRef } from 'react';
import { PHONE_DISPLAY, PHONE_HREF, EMAIL, EMAIL_HREF } from '@/lib/contact';

// Faithful render of the real Suncoast Pool Pros service-report email,
// scoped to .sr-root so styles don't leak into the rest of the page.
export const ServiceReport = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  // On touch devices, scroll the report ~2x faster than the finger moves —
  // so a short swipe inside the phone covers more of the report.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let lastY = 0;
    const SPEED = 2;

    const onTouchStart = (e: TouchEvent) => {
      lastY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const delta = lastY - y;
      lastY = y;
      const canScroll = el.scrollHeight > el.clientHeight;
      if (!canScroll) return;
      el.scrollTop += delta * SPEED;
      // Prevent the page from also scrolling while interacting with the report.
      e.preventDefault();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return (
    <div className="sr-root" ref={rootRef}>
      <style>{`
        .sr-root {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #fafafa;
          color: #0f0f0e;
          -webkit-font-smoothing: antialiased;
          height: 100%;
          overflow-y: auto;
          color-scheme: light;
        }
        .sr-root *, .sr-root *::before, .sr-root *::after { box-sizing: border-box; }
        .sr-root::-webkit-scrollbar { display: none; }
        .sr-root { -ms-overflow-style: none; scrollbar-width: none; }

        .sr-page {
          padding: 18px 10px 20px;
        }
        .sr-card {
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
          background: #fff;
        }

        /* ---- Header ---- */
        .sr-header {
          background: #111114;
          padding: 26px 18px 22px;
          text-align: center;
        }
        .sr-header__company {
          margin: 0;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.2px;
        }
        .sr-header__kicker {
          margin: 5px 0 0;
          color: #737373;
          font-size: 8.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.6px;
        }
        .sr-header__datebadge {
          display: inline-block;
          margin-top: 14px;
          background: #000;
          border: 1px solid #2a2a29;
          border-radius: 14px;
          padding: 5px 12px;
          color: #fff;
          font-size: 9.5px;
          font-weight: 500;
        }

        /* ---- Customer hero ---- */
        .sr-hero {
          padding: 26px 22px 14px;
          background: #fff;
          text-align: center;
        }
        .sr-hero__name {
          margin: 0;
          color: #0f0f0e;
          font-size: 16px;
          font-weight: 800;
          line-height: 1.2;
        }
        .sr-hero__address {
          margin: 5px 0 0;
          color: #6b6b6b;
          font-size: 11px;
          line-height: 1.4;
        }
        .sr-hero__pills {
          display: inline-flex;
          gap: 6px;
          margin-top: 12px;
        }
        .sr-pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.2px;
          line-height: 1.4;
        }
        .sr-pill--neutral {
          border: 1px solid #e7e5e4;
          color: #78716c;
          background: #fff;
        }
        .sr-pill--link {
          border: 1px solid #3B82F6;
          color: #3B82F6;
          background: #fff;
          font-family: inherit;
          text-decoration: none;
        }

        /* ---- Section headings ---- */
        .sr-section { padding: 22px 24px 8px; }
        .sr-section h2 {
          margin: 0;
          color: #0f0f0e;
          font-size: 12px;
          font-weight: 800;
        }

        /* ---- Tables (chemistry, chemicals added) ---- */
        .sr-table-wrap { padding: 0 14px; }
        .sr-table {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #e7e5e4;
        }
        .sr-trow {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          background: #fdfdfc;
          border-bottom: 1px solid #f0efed;
        }
        .sr-trow:last-child { border-bottom: none; }
        .sr-tlabel {
          color: #57534e;
          font-size: 11px;
          font-weight: 500;
        }
        .sr-tvalue {
          color: #0f0f0e;
          font-size: 12px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          text-align: right;
        }
        .sr-tunit {
          color: #a3a3a3;
          font-size: 9.5px;
          font-weight: 500;
          min-width: 26px;
          text-align: left;
        }

        /* ---- Tasks pills ---- */
        .sr-tasks {
          padding: 0 14px;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .sr-task {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #fdfdfc;
          border: 1px solid #f0efed;
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 10.5px;
          font-weight: 500;
          color: #44403c;
        }
        .sr-task__check {
          color: #10B981;
          font-weight: 700;
        }

        /* ---- Photos ---- */
        .sr-photo-wrap { padding: 0 14px; }
        .sr-photo {
          width: 100%;
          border-radius: 12px;
          display: block;
        }

        .sr-body-bottom { padding: 18px 0 4px; }

        /* ---- Footer ---- */
        .sr-footer {
          background: #111114;
          padding: 30px 22px 26px;
          text-align: center;
        }
        .sr-footer__company {
          margin: 0;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .sr-footer__contact {
          margin: 12px 0 0;
          color: #a3a3a3;
          font-size: 10.5px;
          line-height: 1.65;
        }
        .sr-footer__contact a {
          color: #a3a3a3;
          text-decoration: none;
        }
        .sr-footer__dot { color: #404040; margin: 0 4px; }
        .sr-footer__address {
          margin: 3px 0 0;
        }
        .sr-footer__address a {
          color: #60A5FA;
          font-size: 10.5px;
          text-decoration: none;
        }
        .sr-footer__reply {
          display: inline-block;
          margin-top: 20px;
          background: #000;
          border: 1px solid #2a2a29;
          border-radius: 10px;
          padding: 10px 18px;
          color: #a3a3a3;
          font-size: 10px;
          line-height: 1.3;
        }
        .sr-footer__reply a {
          color: #60A5FA;
          font-weight: 600;
          text-decoration: none;
          margin-left: 5px;
          white-space: nowrap;
        }
        .sr-footer__prefs {
          display: block;
          margin-top: 18px;
          color: #78716c;
          font-size: 9.5px;
          text-decoration: underline;
          font-weight: 500;
        }
        .sr-footer__divider {
          margin: 18px auto 14px;
          width: 100%;
          height: 1px;
          background: #262626;
        }
        .sr-footer__powered {
          color: #525252;
          font-size: 9px;
          letter-spacing: 0.5px;
        }
      `}</style>

      <div className="sr-page">
        <div className="sr-card">
          {/* Header */}
          <header className="sr-header">
            <p className="sr-header__company">SUNCOAST POOL PROS</p>
            <p className="sr-header__kicker">Service Report</p>
            <div className="sr-header__datebadge">Tuesday, May 26, 2026 · 9:42 AM</div>
          </header>

          {/* Customer hero */}
          <section className="sr-hero">
            <p className="sr-hero__name">Your Name Here</p>
            <p className="sr-hero__address">
              123 Example Lane, <span style={{ whiteSpace: 'nowrap' }}>St. Petersburg, FL, 33701</span>
            </p>
            <div className="sr-hero__pills">
              <span className="sr-pill sr-pill--neutral">Serviced by Alex</span>
              <a className="sr-pill sr-pill--link" href="#">GPS Verify ↗</a>
            </div>
          </section>

          {/* Water Chemistry */}
          <div className="sr-section"><h2>Water Chemistry</h2></div>
          <div className="sr-table-wrap">
            <div className="sr-table">
              <div className="sr-trow"><span className="sr-tlabel">Free Chlorine</span><span className="sr-tvalue">3.5</span><span className="sr-tunit">ppm</span></div>
              <div className="sr-trow"><span className="sr-tlabel">Total Chlorine</span><span className="sr-tvalue">3.7</span><span className="sr-tunit">ppm</span></div>
              <div className="sr-trow"><span className="sr-tlabel">pH</span><span className="sr-tvalue">7.4</span><span className="sr-tunit"></span></div>
              <div className="sr-trow"><span className="sr-tlabel">Total Alkalinity</span><span className="sr-tvalue">98</span><span className="sr-tunit">ppm</span></div>
              <div className="sr-trow"><span className="sr-tlabel">Water Temp</span><span className="sr-tvalue">84</span><span className="sr-tunit">°F</span></div>
              <div className="sr-trow"><span className="sr-tlabel">Filter Pressure</span><span className="sr-tvalue">14</span><span className="sr-tunit">PSI</span></div>
              <div className="sr-trow"><span className="sr-tlabel">Water Level</span><span className="sr-tvalue">Normal</span><span className="sr-tunit"></span></div>
            </div>
          </div>

          {/* Chemicals Added */}
          <div className="sr-section"><h2>Chemicals Added</h2></div>
          <div className="sr-table-wrap">
            <div className="sr-table">
              <div className="sr-trow"><span className="sr-tlabel">Muriatic Acid (gal)</span><span className="sr-tvalue">0.25</span><span className="sr-tunit"></span></div>
            </div>
          </div>

          {/* Tasks Completed */}
          <div className="sr-section"><h2>Tasks Completed</h2></div>
          <div className="sr-tasks">
            <span className="sr-task"><span className="sr-task__check">✓</span>Skimmed debris</span>
            <span className="sr-task"><span className="sr-task__check">✓</span>Emptied skimmer basket(s)</span>
            <span className="sr-task"><span className="sr-task__check">✓</span>Emptied pump basket</span>
            <span className="sr-task"><span className="sr-task__check">✓</span>Filter inspected</span>
            <span className="sr-task"><span className="sr-task__check">✓</span>Equipment inspected</span>
            <span className="sr-task"><span className="sr-task__check">✓</span>Water level checked</span>
          </div>

          {/* Photos */}
          <div className="sr-section"><h2>Photos</h2></div>
          <div className="sr-photo-wrap">
            <img
              className="sr-photo"
              src="/hero-bg-1280.webp"
              alt="Service photo"
            />
          </div>

          <div className="sr-body-bottom" />

          {/* Footer */}
          <footer className="sr-footer">
            <p className="sr-footer__company">SUNCOAST POOL PROS</p>
            <p className="sr-footer__contact">
              <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
            </p>
            <p className="sr-footer__contact" style={{ marginTop: 2 }}>
              <a href={EMAIL_HREF}>{EMAIL}</a>
            </p>
            <div className="sr-footer__reply">
              Questions about this report?
              <a href={EMAIL_HREF}>Reply to this email</a>
            </div>

            <a className="sr-footer__prefs" href="#">Manage email preferences</a>

            <div className="sr-footer__divider" />
            <span className="sr-footer__powered">Powered by PoolLogic</span>
          </footer>
        </div>
      </div>
    </div>
  );
};
