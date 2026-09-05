"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatPrice, shippingFor } from "@/lib/money";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { useCart } from "./CartProvider";

type Provider = "flitt" | "bog";

export function CheckoutForm({
  locale,
  dict,
  mock,
}: {
  locale: Locale;
  dict: Dictionary;
  /** Whether each provider will use the in-app sandbox mock (no real creds). */
  mock: Record<Provider, boolean>;
}) {
  const { items, subtotal, clear, ready } = useCart();
  const [provider, setProvider] = useState<Provider>("flitt");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    note: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const shipping = useMemo(() => shippingFor(subtotal), [subtotal]);
  const total = subtotal + shipping;

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate(): string | null {
    if (!form.customerName.trim()) return dict.checkout.required;
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return dict.checkout.invalidEmail;
    if (!form.phone.trim() || !form.city.trim() || !form.address.trim())
      return dict.checkout.required;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          provider,
          customer: {
            ...form,
            latitude: coords?.lat ?? null,
            longitude: coords?.lng ?? null,
          },
          items: items.map((i) => ({
            slug: i.slug,
            size: i.size ?? null,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || dict.common.error);
      clear();
      window.location.href = data.redirectUrl as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.common.error);
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <p className="py-20 text-center text-silver-muted">{dict.common.loading}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-silver-muted">{dict.cart.empty}</p>
        <Link href={`/${locale}/shop`} className="btn-outline mt-8">
          {dict.cart.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-3">
      <div className="space-y-10 lg:col-span-2">
        {/* Contact */}
        <section>
          <h2 className="heading-serif text-xl text-silver">
            {dict.checkout.contact}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">{dict.checkout.fullName}</label>
              <input
                className="field"
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="label">{dict.checkout.email}</label>
              <input
                className="field"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">{dict.checkout.phone}</label>
              <input
                className="field"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>
        </section>

        {/* Shipping */}
        <section>
          <h2 className="heading-serif text-xl text-silver">
            {dict.checkout.shipping}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{dict.checkout.city}</label>
              <input
                className="field"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                autoComplete="address-level2"
              />
            </div>
            <div>
              <label className="label">{dict.checkout.address}</label>
              <AddressAutocomplete
                className="field"
                value={form.address}
                onChange={(v) => {
                  update("address", v);
                  setCoords(null); // manual edit invalidates the geocode
                }}
                onSelect={(s) => {
                  setForm((f) => ({
                    ...f,
                    address: s.address,
                    city: s.city || f.city,
                  }));
                  if (s.latitude != null && s.longitude != null) {
                    setCoords({ lat: s.latitude, lng: s.longitude });
                  }
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{dict.checkout.note}</label>
              <textarea
                className="field min-h-20"
                value={form.note}
                onChange={(e) => update("note", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Payment */}
        <section>
          <h2 className="heading-serif text-xl text-silver">
            {dict.checkout.payment}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(
              [
                { key: "flitt", label: dict.checkout.payFlitt },
                { key: "bog", label: dict.checkout.payBog },
              ] as { key: Provider; label: string }[]
            ).map((p) => (
              <label
                key={p.key}
                className={
                  "flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-4 transition-colors " +
                  (provider === p.key
                    ? "border-champagne bg-champagne/10"
                    : "border-silver-muted/25 hover:border-champagne/60")
                }
              >
                <input
                  type="radio"
                  name="provider"
                  checked={provider === p.key}
                  onChange={() => setProvider(p.key)}
                  className="accent-champagne"
                />
                <span className="text-sm text-silver">{p.label}</span>
              </label>
            ))}
          </div>
          {mock[provider] && (
            <p className="mt-4 rounded-sm border border-champagne/30 bg-champagne/5 px-4 py-3 text-xs text-champagne">
              {dict.checkout.sandboxNote}
            </p>
          )}
        </section>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-sm border border-silver-muted/15 bg-ink-soft p-6">
        <h2 className="heading-serif text-xl text-silver">
          {dict.checkout.orderSummary}
        </h2>
        <ul className="mt-5 space-y-3 text-sm">
          {items.map((i) => (
            <li key={`${i.slug}-${i.size ?? ""}`} className="flex justify-between gap-3">
              <span className="text-silver-muted">
                {i.name}
                {i.size ? ` · ${i.size}` : ""} × {i.quantity}
              </span>
              <span className="whitespace-nowrap text-silver">
                {formatPrice(i.price * i.quantity, locale)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-3 border-t border-silver-muted/10 pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-silver-muted">{dict.checkout.subtotal}</dt>
            <dd className="text-silver">{formatPrice(subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-silver-muted">{dict.checkout.shippingCost}</dt>
            <dd className="text-silver">
              {shipping === 0
                ? dict.checkout.freeShipping
                : formatPrice(shipping, locale)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-silver-muted/10 pt-3 text-base">
            <dt className="text-silver">{dict.checkout.total}</dt>
            <dd className="text-champagne">{formatPrice(total, locale)}</dd>
          </div>
        </dl>

        {error && (
          <p className="mt-4 rounded-sm border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-gold mt-6 w-full">
          {submitting
            ? dict.checkout.processing
            : `${dict.checkout.placeOrder} · ${formatPrice(total, locale)}`}
        </button>
      </aside>
    </form>
  );
}
