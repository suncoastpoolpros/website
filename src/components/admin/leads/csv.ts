/**
 * CSV → rows for the lead finder. RFC 4180: quoted fields may hold commas,
 * line breaks and doubled quotes. Headers are normalised (trimmed, lower case,
 * spaces and dashes to underscores, BOM dropped) so "Sale Date" from one export
 * and "sale_date" from another land on the same key. Blank lines are skipped.
 */
export type CsvRow = Record<string, string>;

const normaliseHeader = (h: string): string =>
  h.replace(/^﻿/, '').trim().toLowerCase().replace(/[\s-]+/g, '_');

export const parseCSV = (text: string): CsvRow[] => {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      record.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || record.length) {
    record.push(field);
    records.push(record);
  }

  const nonBlank = records.filter((r) => r.some((v) => v.trim() !== ''));
  if (!nonBlank.length) return [];
  const headers = nonBlank[0].map(normaliseHeader);
  return nonBlank.slice(1).map((r) => {
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      if (h) row[h] = (r[idx] ?? '').trim();
    });
    return row;
  });
};

/** Rows → CSV text, quoting any field that needs it. */
export const toCSV = (headers: string[], rows: Array<Record<string, unknown>>): string => {
  const cell = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => cell(r[h])).join(','))].join('\r\n');
};
