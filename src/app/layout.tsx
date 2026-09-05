import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://aserti-store.vercel.app",
  ),
  title: { default: "ASERTI — Order in Chaos", template: "%s · ASERTI" },
  description:
    "ASERTI — conceptual jewelry in pure silver. Order in Chaos. 101. The contrast of mirror-polished metal and raw stone. Tbilisi, 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
