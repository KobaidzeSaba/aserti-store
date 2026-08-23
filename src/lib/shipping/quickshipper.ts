/**
 * Quickshipper — shipping / courier integration.
 *
 * Creates a shipment for a paid order and returns a tracking code.
 * Runs in sandbox mode (returns a mock tracking code) when credentials
 * are not configured, so order fulfilment works end-to-end in development.
 *
 * Verify the exact endpoint paths and payload shape against your
 * Quickshipper account documentation before going live.
 */

export type ShipmentRequest = {
  reference: string;
  recipientName: string;
  phone: string;
  city: string;
  address: string;
  note?: string | null;
  // Total declared value (GEL) and weight (grams) of the parcel.
  declaredValue: number;
  weightGrams: number;
};

export type ShipmentResult = {
  shipmentId: string;
  trackingCode: string;
  sandbox: boolean;
};

function apiBase(): string {
  return (
    process.env.QUICKSHIPPER_API_BASE?.replace(/\/$/, "") ||
    "https://api.quickshipper.ge"
  );
}

function hasCreds(): boolean {
  return Boolean(process.env.QUICKSHIPPER_API_KEY);
}

function mockTracking(reference: string): ShipmentResult {
  const code = `QS-${reference}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return { shipmentId: `sandbox-${reference}`, trackingCode: code, sandbox: true };
}

export async function createShipment(
  req: ShipmentRequest,
): Promise<ShipmentResult> {
  const live = (process.env.PAYMENTS_MODE || "sandbox").toLowerCase() === "live";
  if (!live || !hasCreds()) {
    return mockTracking(req.reference);
  }

  const body = {
    api_key: process.env.QUICKSHIPPER_API_KEY,
    secret: process.env.QUICKSHIPPER_SECRET,
    external_id: req.reference,
    sender: {
      name: process.env.QUICKSHIPPER_SENDER_NAME || "ASERTI STORE",
      phone: process.env.QUICKSHIPPER_SENDER_PHONE || "",
      city: process.env.QUICKSHIPPER_SENDER_CITY || "Tbilisi",
      address: process.env.QUICKSHIPPER_SENDER_ADDRESS || "",
    },
    recipient: {
      name: req.recipientName,
      phone: req.phone,
      city: req.city,
      address: req.address,
    },
    parcel: {
      declared_value: Number(req.declaredValue.toFixed(2)),
      weight_grams: Math.round(req.weightGrams),
    },
    comment: req.note || "",
  };

  try {
    const res = await fetch(`${apiBase()}/v1/shipments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Quickshipper failed: ${res.status} ${await res.text()}`);
      // Don't block fulfilment on a shipping API hiccup — fall back to a code
      // the operator can reconcile manually.
      return mockTracking(req.reference);
    }

    const data = (await res.json()) as {
      id?: string;
      shipment_id?: string;
      tracking_code?: string;
      tracking?: string;
    };
    const shipmentId = data.id || data.shipment_id || `qs-${req.reference}`;
    const trackingCode = data.tracking_code || data.tracking || shipmentId;
    return { shipmentId, trackingCode, sandbox: false };
  } catch (err) {
    console.error("Quickshipper error:", err);
    return mockTracking(req.reference);
  }
}
