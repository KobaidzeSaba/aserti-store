import { redirect } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { isAuthenticated } from "@/lib/auth";
import { buildQueue, exportChannel, PUBLISH_CHANNELS } from "@/lib/pim/repository";
import type { ReviewItem } from "@/lib/pim/reviewQueue";
import type { ExportReport } from "@/lib/pim/channels/types";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  unmatched_fina_row: "Unmatched Fina row",
  unbound_image: "Unbound image",
  missing_barcode: "Needs barcode",
  missing_category_mapping: "No category mapping",
  no_image: "No image",
  price_conflict: "Price conflict",
};

function gel(n: number): string {
  return `${n.toFixed(0)} ₾`;
}

export default async function PimDashboard({ params }: { params: { locale: Locale } }) {
  if (!isAuthenticated()) redirect(`/${params.locale}/admin/login`);

  let queue: ReviewItem[] = [];
  let reports: Array<{ channel: string; report: ExportReport }> = [];
  let loadError: string | null = null;

  try {
    queue = await buildQueue();
    reports = await Promise.all(
      PUBLISH_CHANNELS.map(async (channel) => ({ channel, report: (await exportChannel(channel)).report })),
    );
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  const blockedRevenue = queue.reduce((s, q) => s + q.blockedRevenue, 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="heading-serif text-3xl text-silver">Product Master · PIM</h1>
          <Link
            href={`/${params.locale}/admin/pim/fina`}
            className="text-xs uppercase tracking-luxe text-champagne hover:underline"
          >
            Fina import →
          </Link>
        </div>
        <div className="flex gap-8 text-sm">
          <Stat label="Review items" value={String(queue.length)} />
          <Stat label="Blocked revenue" value={gel(blockedRevenue)} />
        </div>
      </div>

      {loadError && (
        <p className="mt-8 rounded border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          Could not load PIM data: {loadError}. Run <code>npm run db:push</code> and seed the PIM tables.
        </p>
      )}

      {/* ── Channel export preflight ─────────────────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-luxe text-silver-muted">Channel exports (preflight)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reports.map(({ channel, report }) => (
            <div key={channel} className="rounded border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-silver">{channel}</span>
                <a
                  href={`/api/pim/export/${channel}`}
                  className="text-xs uppercase tracking-luxe text-champagne hover:underline"
                >
                  Download
                </a>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <span className="text-emerald-400">{report.exported.length} ok</span>
                <span className="text-red-300">{report.skipped.length} skipped</span>
              </div>
              {report.skipped.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-silver-muted">
                  {report.skipped.slice(0, 4).map((s) => (
                    <li key={s.productId}>
                      <span className="text-silver">{s.productId}</span>:{" "}
                      {s.issues.find((i) => i.severity === "error")?.message ?? "skipped"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Review queue ─────────────────────────────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-luxe text-silver-muted">
          Review queue — sorted by blocked revenue
        </h2>
        {queue.length === 0 && !loadError ? (
          <p className="mt-4 text-sm text-silver-muted">Nothing to resolve. 🎉</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-luxe text-silver-muted">
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Item</th>
                  <th className="py-2 pr-4">Detail</th>
                  <th className="py-2 pr-4 text-right">Blocked</th>
                </tr>
              </thead>
              <tbody>
                {queue.slice(0, 100).map((q, idx) => (
                  <tr key={`${q.kind}-${q.ref}-${idx}`} className="border-t border-white/5">
                    <td className="py-2 pr-4 text-silver-muted">{KIND_LABEL[q.kind] ?? q.kind}</td>
                    <td className="py-2 pr-4 text-silver">{q.title}</td>
                    <td className="py-2 pr-4 text-silver-muted">{q.detail}</td>
                    <td className="py-2 pr-4 text-right text-champagne">{q.blockedRevenue ? gel(q.blockedRevenue) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-luxe text-silver-muted">{label}</div>
      <div className="text-xl text-silver">{value}</div>
    </div>
  );
}
