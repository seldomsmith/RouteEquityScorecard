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
      <body className={`${inter.variable} font-sans h-full bg-slate-50 flex`}>
        <div className="w-64 border-r border-slate-200 h-full bg-white hidden md:block">
            {/* Sidebar Placeholder */}
            <div className="p-6">
                <h1 className="text-xl font-black tracking-tighter text-slate-900">REI OS</h1>
            </div>
        </div>
        <main className="flex-1 relative h-full">
          {children}
        </main>
      </body>
    </html>
  );
}
