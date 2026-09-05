import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOrderFailed, markOrderPaid } from "@/lib/orders";
import { getGateway, type PaymentProvider } from "@/lib/payments";

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

  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Missing ref" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { reference: ref } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Already finalised — acknowledge idempotently.
  if (order.status === "paid" || order.status === "shipped") {
    return NextResponse.json({ ok: true, status: order.status });
  }

  try {
    if (!order.paymentId) throw new Error("Order has no provider payment id");
    const gateway = getGateway(provider as PaymentProvider);
    const status = await gateway.getStatus(order.paymentId, order.reference);

    if (status === "paid") {
      await markOrderPaid(ref, order.paymentId);
    } else if (status === "failed") {
      await markOrderFailed(ref);
    }
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error(`[${provider}] callback error:`, err);
    // Return 200 so the bank does not hammer retries; we can reconcile later.
    return NextResponse.json({ ok: false });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string } },
) {
  return handle(req, params);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } },
) {
  return handle(req, params);
}
