import type { Metadata } from "next";
import { Spline_Sans, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

const splineSans = Spline_Sans({
  variable: "--font-spline-sans",
  subsets: ["latin"],
});

const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
});

const siteUrl = "https://tools.brianagude.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tiny Tools",
    template: "%s · Tiny Tools",
  },
  description: "A growing collection of small, useful tools.",
  keywords: ["tools", "productivity", "to-do", "tasks"],
  authors: [{ name: "Briana Gude", url: "https://www.brianagude.com" }],
  creator: "Briana Gude",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Tiny Tools",
    title: "Tiny Tools",
    description: "A growing collection of small, useful tools.",
    images: [{ url: "/web-app-manifest-512x512.png", width: 512, height: 512, alt: "Tiny Tools" }],
  },
  twitter: {
    card: "summary",
    title: "Tiny Tools",
    description: "A growing collection of small, useful tools.",
    images: ["/web-app-manifest-512x512.png"],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${splineSans.variable} ${splineMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
