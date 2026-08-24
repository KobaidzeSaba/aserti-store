import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { exportChannel } from "@/lib/pim/repository";
import { serializeReport } from "@/lib/pim/export";

export const dynamic = "force-dynamic";

// Generate a channel export file on demand. Validation runs first (inside
// exportChannel); only rows that passed are serialized. Admin-gated.
export async function GET(_req: NextRequest, { params }: { params: { channel: string } }) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { report } = await exportChannel(params.channel);
    const file = serializeReport(params.channel, report);
    const body = typeof file.body === "string" ? file.body : new Uint8Array(file.body);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "X-PIM-Exported": String(report.exported.length),
        "X-PIM-Skipped": String(report.skipped.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
