/**
 * The lead finder's CSV export: rows → CSV text, quoting any field that needs
 * it (commas, quotes, line breaks), for the spreadsheet that goes to the CRM.
 */
export const toCSV = (headers: string[], rows: Array<Record<string, unknown>>): string => {
  const cell = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => cell(r[h])).join(','))].join('\r\n');
};
