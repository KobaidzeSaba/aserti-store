import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOrderFailed, markOrderPaid } from "@/lib/orders";

/**
 * Completes a simulated (sandbox) payment.
 *
 * SECURITY: only orders that used the in-app mock gateway
 * (paymentProvider === "sandbox") can be completed here. Orders paid through a
 * real provider (Flitt / BOG) are rejected, so this endpoint can never mark a
 * real-money order paid.
 */
export async function POST(req: NextRequest) {
  let body: { ref?: string; outcome?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ref, outcome } = body;
  if (!ref) return NextResponse.json({ error: "Missing ref" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { reference: ref } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.paymentProvider !== "sandbox") {
    return NextResponse.json({ error: "Not a sandbox order" }, { status: 403 });
  }

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
