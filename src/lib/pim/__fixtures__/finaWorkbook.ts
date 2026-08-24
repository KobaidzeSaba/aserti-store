// Build a Fina-shaped .xlsx workbook buffer in memory, so tests exercise the
// real parseFinaWorkbook path (headers in Georgian, one sheet per location).
import * as XLSX from "xlsx";

export interface FinaFixtureRow {
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export function buildFinaWorkbook(sheets: Record<string, FinaFixtureRow[]>): Buffer {
  const wb = XLSX.utils.book_new();
  for (const [location, rows] of Object.entries(sheets)) {
    const aoa = [
      ["კოდი", "დასახელება", "საზომი ერთეული", "ნაშთი", "ერთეულის ფასი"],
      ...rows.map((r) => [r.code, r.name, r.unit, r.quantity, r.unitPrice]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, location);
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
