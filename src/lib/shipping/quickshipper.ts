/**
 * Quickshipper — delivery API integration (delivery automation).
 *
 * Docs: https://app.theneo.io/quickshipper/delivery-en/quickshipper-delivery-api
 *   Create order:  POST {base}/v1/Order
 *     body: OrderPlaceRequestModel { pickUp, dropOff, deliveryProvider,
 *            parcels, cashOnDelivery, cartAmount, cartWeight, comment, ... }
 *     -> OrderPlaceResponseModel { orderId, orderStatus, trackingUrl, deliveryFee }
 *   Fees:          GET  {base}/v1/Order/fees   (From/To + lat/long aware)
 *   Auth:          "ApiKey" credential.
 *
 * pickUp/dropOff carry latitude/longitude — supplied by Google Places on
 * checkout — so the courier gets precise coordinates, not just a text address.
 *
 * Runs in mock mode (returns a placeholder tracking code) when
 * QUICKSHIPPER_API_KEY is not set, so fulfilment still works in development.
 */

export type ShipmentRequest = {
  reference: string;
  recipientName: string;
  phone: string;
  city: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  note?: string | null;
  declaredValue: number; // GEL
  weightGrams: number;
};

export type ShipmentResult = {
  shipmentId: string;
  trackingCode: string; // tracking URL (real) or placeholder code (mock)
  sandbox: boolean;
};

function apiBase(): string {
  return (
    process.env.QUICKSHIPPER_API_BASE?.replace(/\/$/, "") ||
    "https://delivery-test.quickshipper.ge"
  );
}

function hasCreds(): boolean {
  return Boolean(process.env.QUICKSHIPPER_API_KEY);
}

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function mockTracking(reference: string): ShipmentResult {
  const code = `QS-${reference}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return { shipmentId: `sandbox-${reference}`, trackingCode: code, sandbox: true };
}

export async function createShipment(
  req: ShipmentRequest,
): Promise<ShipmentResult> {
  if (!hasCreds()) return mockTracking(req.reference);

  const providerId = num(process.env.QUICKSHIPPER_PROVIDER_ID);
  const deliverySpeedId = num(process.env.QUICKSHIPPER_DELIVERY_SPEED_ID);
  const parcelDimensionId = num(process.env.QUICKSHIPPER_PARCEL_DIMENSION_ID);

  const body = {
    pickUp: {
      name: process.env.QUICKSHIPPER_SENDER_NAME || "ASERTI STORE",
      phonePrefix: process.env.QUICKSHIPPER_SENDER_PHONE_PREFIX || "+995",
      phone: process.env.QUICKSHIPPER_SENDER_PHONE || "",
      country: process.env.QUICKSHIPPER_SENDER_COUNTRY || "Georgia",
      city: process.env.QUICKSHIPPER_SENDER_CITY || "Tbilisi",
      address: process.env.QUICKSHIPPER_SENDER_ADDRESS || "",
      latitude: num(process.env.QUICKSHIPPER_SENDER_LAT),
      longitude: num(process.env.QUICKSHIPPER_SENDER_LNG),
      addressComment: "",
    },
    dropOff: {
      name: req.recipientName,
      phonePrefix: "+995",
      phone: req.phone.replace(/^\+995/, ""),
      country: "Georgia",
      city: req.city,
      address: req.address,
      latitude: req.latitude ?? undefined,
      longitude: req.longitude ?? undefined,
      addressComment: req.note || "",
    },
    deliveryProvider: {
      ...(providerId !== undefined ? { providerId } : {}),
      ...(deliverySpeedId !== undefined ? { deliverySpeedId } : {}),
      ...(parcelDimensionId !== undefined ? { parcelDimensionId } : {}),
      parcelsQuantity: 1,
    },
    parcels: [{ fields: [] }],
    generalFields: [],
    carDelivery: false,
    comment: `ASERTI order ${req.reference}`,
    // Prepaid order (paid online) — no cash to collect on delivery.
    cashOnDelivery: null,
    cartAmount: Number(req.declaredValue.toFixed(2)),
    cartWeight: Math.round(req.weightGrams),
  };

  try {
    const res = await fetch(`${apiBase()}/v1/Order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Auth credential. Header name is configurable in case the account
        // expects a different one; defaults to "ApiKey".
        [process.env.QUICKSHIPPER_AUTH_HEADER || "ApiKey"]:
          process.env.QUICKSHIPPER_API_KEY as string,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Quickshipper failed: ${res.status} ${await res.text()}`);
      // Don't block fulfilment on a shipping hiccup — fall back to a code the
      // operator can reconcile manually.
      return mockTracking(req.reference);
    }

    const data = (await res.json()) as {
      orderId?: number | string;
      trackingUrl?: string;
      orderStatus?: string;
    };
    const shipmentId = String(data.orderId ?? `qs-${req.reference}`);
    const trackingCode = data.trackingUrl || shipmentId;
    return { shipmentId, trackingCode, sandbox: false };
  } catch (err) {
    console.error("Quickshipper error:", err);
    return mockTracking(req.reference);
  }
}

/**
 * Optional: fetch a live delivery fee for a destination (lat/long aware).
 * Returns null when unavailable (no creds / error) so the caller can fall back
 * to the flat shipping rule.
 */
export async function getDeliveryFee(params: {
  toCity: string;
  toStreet: string;
  toLatitude?: number | null;
  toLongitude?: number | null;
  cartAmount: number;
  cartWeightGrams: number;
}): Promise<number | null> {
  if (!hasCreds()) return null;

  const q = new URLSearchParams();
  q.set("FromCityName", process.env.QUICKSHIPPER_SENDER_CITY || "Tbilisi");
  q.set("FromStreetName", process.env.QUICKSHIPPER_SENDER_ADDRESS || "");
  const fromLat = num(process.env.QUICKSHIPPER_SENDER_LAT);
  const fromLng = num(process.env.QUICKSHIPPER_SENDER_LNG);
  if (fromLat !== undefined) q.set("FromLatitude", String(fromLat));
  if (fromLng !== undefined) q.set("FromLongitude", String(fromLng));
  q.set("ToCityName", params.toCity);
  q.set("ToStreetName", params.toStreet);
  if (params.toLatitude != null) q.set("ToLatitude", String(params.toLatitude));
  if (params.toLongitude != null) q.set("ToLongitude", String(params.toLongitude));
  q.set("CartAmount", String(params.cartAmount));
  q.set("CartWeight", String(params.cartWeightGrams));

  try {
    const res = await fetch(`${apiBase()}/v1/Order/fees?${q.toString()}`, {
      headers: {
        [process.env.QUICKSHIPPER_AUTH_HEADER || "ApiKey"]:
          process.env.QUICKSHIPPER_API_KEY as string,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { deliveryFee?: number };
    return typeof data.deliveryFee === "number" ? data.deliveryFee : null;
  } catch {
    return null;
  }
}
