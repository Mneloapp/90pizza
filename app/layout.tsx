import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "90pizza | პიცა სწორი კუთხით",
  description:
    "30×30 სმ ოთხკუთხედი პიცა, 9 თანაბარი ნაჭერი. იპოვე შენი გემო 90pizza-ს მენიუში.",
  keywords: ["90pizza", "square pizza", "pizza delivery", "30x30 pizza"],
  icons: {
    icon: "/images/90pizza-logo.png",
    apple: "/images/90pizza-logo.png",
  },
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
    <html lang="ka">
      <body>{children}</body>
    </html>
  );
}
