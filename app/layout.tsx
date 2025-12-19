import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Activity, BarChart2, Clock, Home, Trophy, Calendar } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Swim Analytics",
  description: "Track and analyze swimming performance",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  maximumScale: 1,
};

import { SwimProvider } from "@/lib/context";
import { MainLayout } from "@/components/MainLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SwimProvider>
          <MainLayout>{children}</MainLayout>
        </SwimProvider>
      </body>
    </html>
  );
}
