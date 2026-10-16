import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { isAuthenticated } from "@/lib/auth";
import { logout, markShipped, retryJob } from "./actions";

import { integrationStatus } from "@/lib/integrationConfig";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  paid: "text-emerald-400",
  shipped: "text-emerald-300",
  pending: "text-champagne",
  failed: "text-red-400",
  cancelled: "text-silver-muted",
};

export default async function AdminPage({
  params,
}: {
  params: { locale: Locale };
}) {
  if (!isAuthenticated()) redirect(`/${params.locale}/admin/login`);

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 200,
  });

  const integrations = integrationStatus();
  const jobs = await prisma.integrationJob.findMany({ where: { status: { not: "succeeded" } }, orderBy: { createdAt: "asc" }, take: 100 });
  const paidCount = orders.filter(
    (o) => !o.isTest && (o.status === "paid" || o.status === "shipped"),
  ).length;
  const revenue = orders
    .filter((o) => !o.isTest && (o.status === "paid" || o.status === "shipped"))
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="heading-serif text-3xl text-silver">
            ASERTI · Orders
          </h1>
          <form action={logout}>
            <input type="hidden" name="locale" value={params.locale} />
            <button
              type="submit"
              className="text-xs uppercase tracking-luxe text-silver-muted hover:text-champagne"
            >
              Sign out
            </button>
          </form>
        </div>
        <div className="flex gap-8 text-sm">
          <div>
            <div className="text-xs uppercase tracking-luxe text-silver-muted">
              Orders
            </div>
            <div className="text-xl text-silver">{orders.length}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-luxe text-silver-muted">
              Paid
            </div>
            <div className="text-xl text-silver">{paidCount}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-luxe text-silver-muted">
              Revenue
            </div>
            <div className="text-xl text-champagne">
              {formatPrice(revenue, "en")}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 border p-5">
        <h2 className="text-xl">Integrations</h2>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(integrations).map(([key, value]) => <div key={key}><dt className="inline font-medium">{key}: </dt><dd className="inline">{typeof value === "boolean" ? value ? "Configured (not verified)" : "Not configured" : value}</dd></div>)}</dl>
        <p className="mt-3 text-sm">Sandbox payments never create shipments or send customer emails. Configuration does not confirm account activation.</p>
      </section>
      {jobs.length > 0 && <section className="mt-8 border p-5">
        <h2 className="text-xl">Integration work requiring attention</h2>
        {jobs.map(job => <form key={job.id} action={retryJob} className="mt-4 border-t pt-4">
          <p>{job.reference} · {job.kind} · {job.status} · attempts: {job.attempts}</p>
          <p className="text-sm">{job.lastError}</p>
          <input type="hidden" name="locale" value={params.locale}/><input type="hidden" name="jobId" value={job.id}/>
          {["processing", "review"].includes(job.status) && <label className="my-2 block text-sm"><input type="checkbox" name="reconciled" required/> I checked the provider and confirmed this operation did not already succeed.</label>}
          <button className="mt-2 border px-3 py-2" type="submit">Retry integration</button>
        </form>)}
      </section>}
      <div className="mt-8 overflow-x-auto rounded-sm border border-silver-muted/15">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-silver-muted/15 text-xs uppercase tracking-luxe text-silver-muted">
            <tr>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Pay</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tracking</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-silver-muted/10">
            {orders.map((o) => (
              <tr key={o.id} className="text-silver">
                <td className="px-4 py-3 font-medium">{o.reference}{o.isTest && <span className="ml-2">TEST</span>}</td>
                <td className="px-4 py-3 text-silver-muted">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div>{o.customerName}</div>
                  <div className="text-xs text-silver-muted">
                    {o.city} · {o.phone}
                  </div>
                </td>
                <td className="px-4 py-3 text-silver-muted">
                  {o.items
                    .map((i) => `${i.nameSnapshot}×${i.quantity}`)
                    .join(", ")}
                </td>
                <td className="px-4 py-3">{formatPrice(o.total, "en")}</td>
                <td className="px-4 py-3 uppercase text-silver-muted">
                  {o.paymentProvider || "—"}
                </td>
                <td
                  className={`px-4 py-3 uppercase ${STATUS_STYLES[o.status] || ""}`}
                >
                  {o.status}
                </td>
                <td className="px-4 py-3 text-silver-muted">
                  {o.trackingCode || "—"}
                </td>
                <td className="px-4 py-3">
                  {!o.isTest && o.status === "paid" && o.shipmentId && o.paymentProvider !== "sandbox" ? (
                    <form action={markShipped}>
                      <input
                        type="hidden"
                        name="locale"
                        value={params.locale}
                      />
                      <input
                        type="hidden"
                        name="reference"
                        value={o.reference}
                      />
                      <button
                        type="submit"
                        className="whitespace-nowrap rounded-none border border-silver-muted/50 px-3 py-1.5 text-xs uppercase tracking-luxe text-silver transition-colors hover:border-champagne hover:text-champagne"
                      >
                        Mark shipped
                      </button>
                    </form>
                  ) : o.status === "shipped" ? (
                    <span className="text-xs text-silver-muted">shipped ✓</span>
                  ) : (
                    <span className="text-silver-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-silver-muted"
                >
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
