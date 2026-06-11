import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Luma — Online Star Map",
  description:
    "A planetarium in your browser. Real-time sky map of stars, planets, and deep-sky objects, powered by the Stellarium Web Engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="m-0 h-full bg-[#05070d] text-white">{children}</body>
    </html>
  );
}
