import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "90pizza | Pizza at the right angle",
  description:
    "90pizza is a delivery-first square pizza brand built around a 30x30 cm pizza cut into 9 equal slices.",
  keywords: ["90pizza", "square pizza", "pizza delivery", "30x30 pizza"],
};

export const viewport: Viewport = {
  themeColor: "#E01010",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
