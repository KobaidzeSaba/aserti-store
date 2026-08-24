// ─────────────────────────────────────────────────────────────────────────────
// Export orchestrator — defence against Failure #7 ("never silently drop a row").
//
// For each product: validate first. If any `error` issue, the row is SKIPPED and
// the reason recorded. Otherwise it is built and included. Every product ends up
// in exactly one of `exported` / `skipped`, with its issues attached, so the
// report answers "what passed, what was skipped, and exactly why".
//
// MissingCategoryMappingError thrown from build() is caught and turned into a
// skip-with-reason rather than crashing the whole run — loud, but not fatal to
// the other rows.
// ─────────────────────────────────────────────────────────────────────────────

import { getAdapter } from "./channels";
import type {
  ChannelContext,
  ExportInput,
  ExportReport,
  RowOutcome,
  ValidationIssue,
} from "./channels/types";

export function runExport(
  channel: string,
  inputs: ExportInput[],
  ctx: ChannelContext,
): ExportReport {
  const adapter = getAdapter(channel);
  const exported: RowOutcome[] = [];
  const skipped: RowOutcome[] = [];
  const allIssues: ValidationIssue[] = [];

  for (const input of inputs) {
    const issues = adapter.validate(input, ctx);
    allIssues.push(...issues);
    const hasError = issues.some((i) => i.severity === "error");

    if (hasError) {
      skipped.push({ productId: input.product.productId, status: "skipped", issues });
      continue;
    }

    try {
      const payload = adapter.build(input, ctx);
      exported.push({ productId: input.product.productId, status: "exported", issues, payload });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const issue: ValidationIssue = {
        productId: input.product.productId,
        field: "build",
        severity: "error",
        message,
      };
      allIssues.push(issue);
      skipped.push({ productId: input.product.productId, status: "skipped", issues: [...issues, issue] });
    }
  }

  return {
    channel,
    generatedAt: new Date().toISOString(),
    exported,
    skipped,
    issues: allIssues,
  };
}

/** Produce the channel file from a report's exported rows. */
export function serializeReport(channel: string, report: ExportReport) {
  const adapter = getAdapter(channel);
  return adapter.serialize(report.exported.map((r) => r.payload));
}

// ── Preflight diff (Failure #5's cousin — "show me what changed since last export") ──

export interface PreflightDiff {
  added: string[]; // productIds newly exportable
  removed: string[]; // productIds that were exported before but now skip
  changed: string[]; // productIds whose payload differs from last time
  unchanged: string[];
}

/**
 * Compare a fresh report against the previous export's payload snapshot
 * (keyed by productId). Pure and inspectable — no side effects.
 */
export function preflightDiff(
  report: ExportReport,
  previous: Record<string, unknown>,
): PreflightDiff {
  const currentIds = new Set(report.exported.map((r) => r.productId));
  const prevIds = new Set(Object.keys(previous));

  const added: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];
  for (const r of report.exported) {
    if (!prevIds.has(r.productId)) added.push(r.productId);
    else if (JSON.stringify(previous[r.productId]) !== JSON.stringify(r.payload)) changed.push(r.productId);
    else unchanged.push(r.productId);
  }
  const removed = [...prevIds].filter((id) => !currentIds.has(id));
  return { added, removed, changed, unchanged };
}
