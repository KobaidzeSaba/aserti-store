import { NextRequest, NextResponse } from "next/server";
import { isSandboxMode } from "@/lib/payments";
import { markOrderFailed, markOrderPaid } from "@/lib/orders";

/**
 * Completes a simulated (sandbox) payment. Only available when not in live mode.
 */
export async function POST(req: NextRequest) {
  if (!isSandboxMode()) {
    return NextResponse.json({ error: "Sandbox disabled" }, { status: 403 });
  }

  let body: { ref?: string; outcome?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ref, outcome } = body;
  if (!ref) return NextResponse.json({ error: "Missing ref" }, { status: 400 });

  try {
    if (outcome === "success") {
      await markOrderPaid(ref, `sandbox-${ref}`);
    } else {
      await markOrderFailed(ref);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Sandbox complete error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
