import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { parseFinaWorkbook } from "@/lib/pim/fina-xlsx";
import { isKnownScheme } from "@/lib/pim/schemes";
import { importFina } from "@/lib/pim/repository";

export const dynamic = "force-dynamic";

// Upload a Fina .xlsx and get back a diff + unmatched rows. Nothing is written
// unless `commit=true` is sent — this is the "show me before it commits" step.
// Admin-gated.
export async function POST(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const scheme = String(form.get("scheme") ?? "");
  const commit = String(form.get("commit") ?? "") === "true";

  if (!(file instanceof File)) return NextResponse.json({ error: "no file uploaded" }, { status: 400 });
  if (!isKnownScheme(scheme)) {
    return NextResponse.json(
      { error: `Unknown scheme "${scheme}". Declare a known scheme — the importer will not guess.` },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const parsed = parseFinaWorkbook(buf, file.name);
  const result = await importFina(parsed.rows, scheme, { commit });

  return NextResponse.json({
    scheme,
    committed: result.committed,
    warnings: parsed.warnings,
    counts: result.diff.counts,
    unmatchedCount: result.unmatched.length,
    diff: result.diff.lines.slice(0, 500),
    unmatched: result.unmatched.slice(0, 500),
  });
}
