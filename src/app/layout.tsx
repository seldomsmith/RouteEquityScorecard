import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Route Equity Scorecard OS",
  description: "Premium Transit Equity Command Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className={`${inter.variable} font-sans h-full bg-slate-50`}>
        <main className="h-full">
          {children}
        </main>
      </body>
    </html>
  );
}
