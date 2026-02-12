import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { DarkModeInit } from "@/components/DarkModeInit";
import { ToastContainer } from "@/components/ToastContainer";
import { QuickOpen } from "@/components/QuickOpen";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { SupportButton } from "@/components/SupportButton";
import { AuthGuard } from "@/components/AuthGuard";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unified Batch Tools",
  description: "Centralized platform for managing SQL pipelines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${geistMono.variable} font-mono h-full antialiased`}>
        <DarkModeInit />
        <AuthGuard>
          {children}
        </AuthGuard>
        <ToastContainer />
        <QuickOpen />
        <KeyboardShortcuts />
        <SupportButton />
      </body>
    </html>
  );
}
