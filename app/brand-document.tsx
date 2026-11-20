import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { siteUrl, shouldIndex } from "@/components/brand/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "90pizza",
  robots: { index: shouldIndex, follow: shouldIndex },
  icons: {
    icon: "/images/brand/icon.png",
    apple: "/images/brand/apple-touch-icon.png",
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = { themeColor: "#E01010" };

export default function BrandDocument({ lang, children }: { lang: "ka" | "en"; children: ReactNode }) {
  return <html lang={lang}><body>{children}</body></html>;
}
