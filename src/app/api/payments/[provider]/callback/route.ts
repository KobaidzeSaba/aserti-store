import { verifyCallback } from "@/lib/payments/callbackSignature";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOrderFailed, markOrderPaid } from "@/lib/orders";
import { getStoredGateway } from "@/lib/payments";

/**
 * Server-to-server payment callback from TBC / BOG.
 * The bank notifies us that a payment reached a final state; we re-query the
 * provider for the authoritative status (never trust the callback body alone)
 * and update the order + create the shipment.
 */
async function handle(
  req: NextRequest,
  params: { provider: string },
): Promise<NextResponse> {
  const provider = params.provider;
  if (provider !== "flitt" && provider !== "bog") {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const raw = await req.text();
  if (raw.length > 65536 || !verifyCallback(provider, raw, req.headers.get("content-type") || "", req.headers.get("callback-signature"))) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Missing ref" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { reference: ref } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.paymentProvider !== provider) return NextResponse.json({ error: "Provider mismatch" }, { status: 409 });

  // Already finalised — acknowledge idempotently.
  if (order.status === "paid" || order.status === "shipped") {
    try { await markOrderPaid(ref, order.paymentId || undefined); } catch { return NextResponse.json({ ok: false }, { status: 503 }); }
    return NextResponse.json({ ok: true, status: order.status });
  }

  try {
    if (!order.paymentId) throw new Error("Order has no provider payment id");
    const gateway = getStoredGateway(provider);
    const status = await gateway.getStatus(order.paymentId, order.reference, { amount: order.total, currency: order.currency });

    if (status === "paid") {
      await markOrderPaid(ref, order.paymentId);
    } else if (status === "failed") {
      await markOrderFailed(ref);
    }
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error(`[${provider}] callback error:`, err);
    // Ask the provider to retry transient failures.
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string } },
) {
  return handle(req, params);
}
