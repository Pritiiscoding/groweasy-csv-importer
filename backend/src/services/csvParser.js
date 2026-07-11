import { parse } from "csv-parse/sync";

/**
 * Parses a raw CSV buffer/string into a list of plain row objects keyed by
 * whatever headers the file actually contains. We never assume fixed column
 * names here - that mapping intelligence lives entirely in the AI layer.
 *
 * @param {Buffer|string} raw
 * @returns {{ headers: string[], rows: Record<string, string>[] }}
 */
export function parseCsvBuffer(raw) {
  const text = Buffer.isBuffer(raw) ? raw.toString("utf-8") : raw;

  if (!text || !text.trim()) {
    const err = new Error("The uploaded file is empty.");
    err.status = 400;
    throw err;
  }

  let records;
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });
  } catch (e) {
    const err = new Error(`Could not parse CSV: ${e.message}`);
    err.status = 400;
    throw err;
  }

  if (!records.length) {
    const err = new Error("No rows found in the CSV.");
    err.status = 400;
    throw err;
  }

  const headers = Object.keys(records[0]);

  return { headers, rows: records };
}
