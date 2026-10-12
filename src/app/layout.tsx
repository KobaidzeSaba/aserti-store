import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://aserti-store.vercel.app",
  ),
  title: { default: "ASERTI — Order in Chaos", template: "%s · ASERTI" },
  description:
    "ASERTI is an independent design project based in Tbilisi, exploring form, material and contrast through objects. Order in Chaos · 101.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
