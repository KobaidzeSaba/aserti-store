import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";

/** Preserve incoming links while moving the brand narrative to Studio. */
export default function AboutPage({ params }: { params: { locale: Locale } }) {
  redirect(`/${params.locale}/studio`);
}
