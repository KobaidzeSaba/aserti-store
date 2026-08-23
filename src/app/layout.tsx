import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASERTI STORE — Sterling Silver Jewelry",
  description:
    "ASERTI — handcrafted 925 sterling silver rings, earrings and crosses. Secure payments via TBC Bank & Bank of Georgia, delivery across Georgia by Quickshipper.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
