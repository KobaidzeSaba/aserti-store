// ─────────────────────────────────────────────────────────────────────────────
// Fina .xlsx IO layer — kept separate from fina.ts on purpose.
//
// This is the ONLY place that knows about Excel. Fina is Excel-export-only today
// (confirmed), so sync is file-driven: staff export the workbook (sheets
// საწყობი / გალერეა / მოლი, headers კოდი / დასახელება / საზომი ერთეული / ნაშთი /
// ერთეულის ფასი), upload it here. If Fina ever gains an API, only this file is
// replaced — resolveFinaRows/diffFina in fina.ts stay untouched.
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from "xlsx";
import type { FinaRawRow } from "./fina";

/** The Fina header names, mapped to our normalized field names. */
const HEADERS = {
  code: "კოდი",
  name: "დასახელება",
  unit: "საზომი ერთეული",
  quantity: "ნაშთი",
  unitPrice: "ერთეულის ფასი",
} as const;

/** Sheets we treat as stock locations. Others are ignored with a note. */
export const KNOWN_LOCATIONS = ["საწყობი", "გალერეა", "მოლი"];

export interface ParseResult {
  rows: FinaRawRow[];
  warnings: string[];
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.,-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Parse a Fina workbook buffer into normalized rows, one per (sheet, line). */
export function parseFinaWorkbook(buf: Buffer | ArrayBuffer, filename = "fina.xlsx"): ParseResult {
  const wb = XLSX.read(buf, { type: "buffer" });
  const rows: FinaRawRow[] = [];
  const warnings: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const location = sheetName.trim();
    if (!KNOWN_LOCATIONS.includes(location)) {
      warnings.push(`Sheet "${sheetName}" is not a known location; skipped.`);
      continue;
    }
    const ws = wb.Sheets[sheetName];
    const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    records.forEach((rec, i) => {
      const code = String(rec[HEADERS.code] ?? "").trim();
      const name = String(rec[HEADERS.name] ?? "").trim();
      if (!code && !name) return; // blank row
      rows.push({
        code,
        name,
        unit: String(rec[HEADERS.unit] ?? "").trim(),
        quantity: num(rec[HEADERS.quantity]),
        unitPrice: num(rec[HEADERS.unitPrice]),
        location,
        sourceRow: `${filename}#${sheetName}:${i + 2}`, // +2: header row + 1-index
      });
    });
  }
  return { rows, warnings };
}
