"use client";

import { useState } from "react";

interface DiffLine {
  productId: string;
  location: string;
  kind: "new" | "changed" | "unchanged" | "disappeared";
  before?: { quantity: number; price: number };
  after?: { quantity: number; price: number };
}
interface UnmatchedLine {
  row: { code: string; name: string; location: string; quantity: number; unitPrice: number; sourceRow: string };
  reason: string;
  candidates: string[];
}
interface ImportResponse {
  scheme: string;
  committed: boolean;
  warnings: string[];
  counts: { new: number; changed: number; unchanged: number; disappeared: number };
  unmatchedCount: number;
  diff: DiffLine[];
  unmatched: UnmatchedLine[];
  error?: string;
}

const SCHEMES = ["fina_2026", "fina_2025", "ean13"];
const KIND_COLOR: Record<string, string> = {
  new: "text-emerald-400",
  changed: "text-champagne",
  unchanged: "text-silver-muted",
  disappeared: "text-red-300",
};

export default function FinaImport() {
  const [file, setFile] = useState<File | null>(null);
  const [scheme, setScheme] = useState(SCHEMES[0]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(commit: boolean) {
    if (!file) {
      setError("Choose a Fina .xlsx file first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("scheme", scheme);
      fd.set("commit", String(commit));
      const res = await fetch("/api/pim/fina/import", { method: "POST", body: fd });
      const json: ImportResponse = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Import failed.");
        setResult(null);
      } else {
        setResult(json);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded border border-white/10 p-4">
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-luxe text-silver-muted">Fina workbook (.xlsx)</div>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-silver"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-luxe text-silver-muted">Code scheme</div>
          <select
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
            className="rounded border border-white/20 bg-transparent px-2 py-1 text-silver"
          >
            {SCHEMES.map((s) => (
              <option key={s} value={s} className="bg-neutral-900">
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => send(false)}
          disabled={busy}
          className="rounded border border-white/20 px-4 py-2 text-xs uppercase tracking-luxe text-silver hover:border-champagne disabled:opacity-50"
        >
          {busy ? "Working…" : "Preview diff (no write)"}
        </button>
        {result && !result.committed && (
          <button
            onClick={() => send(true)}
            disabled={busy}
            className="rounded bg-champagne px-4 py-2 text-xs uppercase tracking-luxe text-black hover:opacity-90 disabled:opacity-50"
          >
            Commit
          </button>
        )}
      </div>

      {error && (
        <p className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>
      )}

      {result && (
        <div className="space-y-6">
          {result.committed && (
            <p className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              Committed. Price and stock updated from Fina.
            </p>
          )}
          <div className="flex gap-6 text-sm">
            <span className="text-emerald-400">{result.counts.new} new</span>
            <span className="text-champagne">{result.counts.changed} changed</span>
            <span className="text-silver-muted">{result.counts.unchanged} unchanged</span>
            <span className="text-red-300">{result.counts.disappeared} disappeared</span>
            <span className="text-red-300">{result.unmatchedCount} unmatched → review</span>
          </div>

          {result.warnings.length > 0 && (
            <ul className="text-xs text-silver-muted">
              {result.warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}

          {result.diff.filter((d) => d.kind !== "unchanged").length > 0 && (
            <div className="overflow-x-auto">
              <h3 className="mb-2 text-xs uppercase tracking-luxe text-silver-muted">Changes</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-luxe text-silver-muted">
                    <th className="py-1 pr-4">Kind</th>
                    <th className="py-1 pr-4">Product</th>
                    <th className="py-1 pr-4">Location</th>
                    <th className="py-1 pr-4">Before</th>
                    <th className="py-1 pr-4">After</th>
                  </tr>
                </thead>
                <tbody>
                  {result.diff
                    .filter((d) => d.kind !== "unchanged")
                    .map((d, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className={`py-1 pr-4 ${KIND_COLOR[d.kind]}`}>{d.kind}</td>
                        <td className="py-1 pr-4 text-silver">{d.productId}</td>
                        <td className="py-1 pr-4 text-silver-muted">{d.location}</td>
                        <td className="py-1 pr-4 text-silver-muted">
                          {d.before ? `${d.before.quantity} @ ${d.before.price}₾` : "—"}
                        </td>
                        <td className="py-1 pr-4 text-silver">
                          {d.after ? `${d.after.quantity} @ ${d.after.price}₾` : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {result.unmatched.length > 0 && (
            <div className="overflow-x-auto">
              <h3 className="mb-2 text-xs uppercase tracking-luxe text-red-300">
                Unmatched — not guessed, sent to review
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-luxe text-silver-muted">
                    <th className="py-1 pr-4">Code</th>
                    <th className="py-1 pr-4">Name</th>
                    <th className="py-1 pr-4">Reason</th>
                    <th className="py-1 pr-4">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {result.unmatched.map((u, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-1 pr-4 text-silver">{u.row.code}</td>
                      <td className="py-1 pr-4 text-silver">{u.row.name}</td>
                      <td className="py-1 pr-4 text-red-300">
                        {u.reason}
                        {u.candidates.length ? ` (${u.candidates.join(", ")})` : ""}
                      </td>
                      <td className="py-1 pr-4 text-silver-muted">{u.row.sourceRow}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
