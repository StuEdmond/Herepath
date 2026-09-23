/**
 * A small CSV reader and writer, used by the bulk route importer's "route details" spreadsheet. Handles quoted fields (so a comma or a
 * newline can appear inside one), doubled quotes for a literal quote, and either line ending. Not a general CSV library — no other part
 * of the site needs one, so this stays deliberately small.
 */

/** One row of a parsed CSV, keyed by its lower-cased, trimmed header. */
export type CsvRow = Record<string, string>;

/** Parses the whole file at once, since a route-details sheet is at most a few hundred rows. */
export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  // A file saved from Excel or Sheets often starts with a byte-order mark.
  const input = text.replace(/^﻿/, "");
  const table: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    table.push(row);
    row = [];
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') inQuotes = true;
    else if (char === ",") endField();
    else if (char === "\r") continue;
    else if (char === "\n") endRow();
    else field += char;
  }
  // The last row has no trailing newline.
  if (field !== "" || row.length > 0) endRow();

  const nonEmpty = table.filter((cells) => !(cells.length === 1 && cells[0] === ""));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = nonEmpty[0].map((h) => h.trim().toLowerCase());
  const rows = nonEmpty.slice(1).map((cells) => {
    const row: CsvRow = {};
    headers.forEach((header, i) => {
      if (header) row[header] = (cells[i] ?? "").trim();
    });
    return row;
  });
  return { headers, rows };
}

/** Quotes a field only when it needs it, so a plain spreadsheet stays easy to read if opened as text. */
function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers, ...rows].map((cells) => cells.map((cell) => csvField(String(cell))).join(","));
  // A BOM helps Excel open a UTF-8 file correctly.
  return "﻿" + lines.join("\r\n") + "\r\n";
}
