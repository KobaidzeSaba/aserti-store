import { redirect } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { isAuthenticated } from "@/lib/auth";
import FinaImport from "@/components/pim/FinaImport";

export const dynamic = "force-dynamic";

export default function FinaImportPage({ params }: { params: { locale: Locale } }) {
  if (!isAuthenticated()) redirect(`/${params.locale}/admin/login`);

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <div className="flex items-center gap-4">
        <h1 className="heading-serif text-3xl text-silver">Fina import</h1>
        <Link
          href={`/${params.locale}/admin/pim`}
          className="text-xs uppercase tracking-luxe text-silver-muted hover:text-champagne"
        >
          ← PIM dashboard
        </Link>
      </div>
      <p className="mt-3 max-w-2xl text-sm text-silver-muted">
        Upload the Fina workbook (sheets საწყობი / გალერეა / მოლი). Codes are resolved
        <em> within the declared scheme only</em> — an external barcode is never treated as a
        global key. Preview the diff first; nothing is written until you commit. Unmatched rows are
        sent to review, never guessed into a product.
      </p>
      <div className="mt-8">
        <FinaImport />
      </div>
    </div>
  );
}
