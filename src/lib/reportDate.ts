import { useEffect, useState } from 'react';

/*
 * The sample service report's date: the most recent Thursday (today, on a
 * Thursday), so the email in the phone mock-up always looks like this week's.
 *
 * Hydration: the prerendered HTML can't know the visitor's date, and a
 * mismatched text node makes React re-render the page (CLAUDE.md #4). So the
 * first render on both sides uses the build day (__BUILD_DATE__, in UTC), and
 * an effect then moves it to the visitor's own most recent Thursday.
 */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Ymd = { y: number; m: number; d: number };

/** The most recent Thursday on or before a calendar day. */
const lastThursday = ({ y, m, d }: Ymd): Ymd => {
  const t = new Date(Date.UTC(y, m, d));
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() - 4 + 7) % 7));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
};

const fromBuild = (): Ymd => {
  const [y, m, d] = __BUILD_DATE__.split('-').map(Number);
  return { y, m: m - 1, d };
};

const today = (): Ymd => {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() };
};

const format = (t: Ymd) => {
  const weekday = DAYS[new Date(Date.UTC(t.y, t.m, t.d)).getUTCDay()];
  return {
    /** "Thursday, November 20, 2026" */
    long: `${weekday}, ${MONTHS[t.m]} ${t.d}, ${t.y}`,
    /** "Nov 20" */
    short: `${MONTHS[t.m].slice(0, 3)} ${t.d}`,
  };
};

export const useReportDate = () => {
  const [day, setDay] = useState<Ymd>(() => lastThursday(fromBuild()));
  useEffect(() => setDay(lastThursday(today())), []);
  return format(day);
};
