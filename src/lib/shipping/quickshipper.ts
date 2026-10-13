import { integrationStatus } from "../integrationConfig";
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
 * Requires explicit live activation; errors never fabricate tracking.
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
  trackingCode: string; // provider tracking URL or provider order id
  sandbox: boolean;
};

function apiBase(): string {
  return (
    process.env.QUICKSHIPPER_API_BASE?.replace(/\/$/, "") ||
    "https://delivery-test.quickshipper.ge"
  );
}

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function createShipment(
  req: ShipmentRequest,
): Promise<ShipmentResult> {
  const status = integrationStatus();
  if (status.shipping !== "live" || !status.quickshipper || !status.pickup) throw new Error("Courier configuration incomplete");

  const providerId = num(process.env.QUICKSHIPPER_PROVIDER_ID);
  const deliverySpeedId = num(process.env.QUICKSHIPPER_DELIVERY_SPEED_ID);
  const parcelDimensionId = num(process.env.QUICKSHIPPER_PARCEL_DIMENSION_ID);

  const body = {
    pickUpInfo: {
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
    dropOffInfo: {
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
    provider: {
      ...(providerId !== undefined ? { providerId } : {}),
      ...(deliverySpeedId !== undefined ? { deliverySpeedId } : {}),
      ...(parcelDimensionId !== undefined ? { parcelDimensionId } : {}),
      parcelsQuantity: 1,
    },
    parcels: [{ fields: [] }],
    generalFields: [],
    carDelivery: false,
    integrationOrderId: req.reference,
    comment: `ASERTI order ${req.reference}`,
    // Prepaid order (paid online) — no cash to collect on delivery.
    cashOnDelivery: null,
    cartAmount: Number(req.declaredValue.toFixed(2)),
    cartWeight: req.weightGrams / 1000,
  };

  try {
    const auth = await shippingAuth();
    const res = await fetch(`${apiBase()}/v1/Order`, {
      signal: AbortSignal.timeout(15000),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Auth credential. Header name is configurable in case the account
        // expects a different one; defaults to "ApiKey".
        ...auth,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Courier request failed (${res.status}); reconcile before retry`);
    }

    const data = (await res.json()) as {
      success?: boolean;
      orderId?: number | string;
      trackingUrl?: string;
      orderStatus?: string;
    };
    if (data.success !== true || !data.orderId) throw new Error("Courier did not confirm shipment; reconcile before retry");
    const shipmentId = String(data.orderId);
    const trackingCode = data.trackingUrl || shipmentId;
    return { shipmentId, trackingCode, sandbox: false };
  } catch (err) {
    throw new Error("Courier result uncertain; check Quickshipper before retrying");
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
  if (integrationStatus().shipping !== "live" || !integrationStatus().quickshipper) return null;

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
  q.set("CartWeight", String(params.cartWeightGrams / 1000));

  try {
    const auth = await shippingAuth();
    const res = await fetch(`${apiBase()}/v1/Order/fees?${q.toString()}`, {
      signal: AbortSignal.timeout(15000),
      headers: {
        ...auth,
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

async function shippingAuth(): Promise<Record<string, string>> {
  if (process.env.QUICKSHIPPER_CLIENT_ID && process.env.QUICKSHIPPER_CLIENT_SECRET) {
    const response = await fetch(process.env.QUICKSHIPPER_TOKEN_URL || "https://auth.quickshipper.app/connect/token", {
      method: "POST", signal: AbortSignal.timeout(10000), cache: "no-store",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.QUICKSHIPPER_CLIENT_ID, client_secret: process.env.QUICKSHIPPER_CLIENT_SECRET, scope: "DeliveryApi" }),
    });
    if (!response.ok) throw new Error("Courier authentication failed");
    const data = await response.json();
    if (!data.access_token) throw new Error("Courier token missing");
    return { Authorization: `Bearer ${data.access_token}` };
  }
  return { [process.env.QUICKSHIPPER_AUTH_HEADER || "ApiKey"]: process.env.QUICKSHIPPER_API_KEY! };
}
