import type { Metadata } from "next";
import { Spline_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const splineSans = Spline_Sans({
  variable: "--font-spline-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tiny Tools",
  description: "A collection of small, useful tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${splineSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
