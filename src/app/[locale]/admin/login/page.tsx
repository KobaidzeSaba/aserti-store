import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { isAuthenticated } from "@/lib/auth";
import { login } from "../actions";

export const dynamic = "force-dynamic";

export default function AdminLoginPage({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { error?: string };
}) {
  if (isAuthenticated()) redirect(`/${params.locale}/admin`);
  const hasError = searchParams.error === "1";

  return (
    <div className="mx-auto flex max-w-sm flex-col px-6 py-24">
      <h1 className="heading-serif text-center text-3xl text-silver">
        ASERTI · Admin
      </h1>
      <p className="mt-2 text-center text-sm text-silver-muted">
        Sign in to view orders.
      </p>

      <form action={login} className="mt-8 space-y-4">
        <input type="hidden" name="locale" value={params.locale} />
        <div>
          <label className="label">Username</label>
          <input name="username" className="field" autoComplete="username" defaultValue="admin" />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            name="password"
            type="password"
            className="field"
            autoComplete="current-password"
          />
        </div>

        {hasError && (
          <p className="rounded-sm border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            Invalid username or password.
          </p>
        )}

        <button type="submit" className="btn-gold w-full">
          Sign in
        </button>
      </form>
    </div>
  );
}
