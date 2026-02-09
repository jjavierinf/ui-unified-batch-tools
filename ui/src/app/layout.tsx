import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { DarkModeInit } from "@/components/DarkModeInit";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SQL Pipeline Editor",
  description: "SQL file browser and editor for Airflow pipelines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistMono.variable} font-mono h-full antialiased`}>
        <DarkModeInit />
        {children}
      </body>
    </html>
  );
}
