import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";

export const metadata: Metadata = {
  title: "CargoTrust | Decentralized Supply Chain Identity & Traceability Platform",
  description:
    "Decentralized Supply Chain Identity, Cryptographic Quality Verification, and Payment-Linked Atomic Settlements built on Arc Network with USDC.",
  keywords: [
    "Supply Chain",
    "Traceability",
    "USDC",
    "Arc Network",
    "Verifiable Credentials",
    "Digital Twin",
    "Stablecoins",
    "W3C DID",
    "Organic Certified"
  ],
  openGraph: {
    title: "CargoTrust Traceability & Commerce Platform",
    description: "Securing High-End Global Supply Chains with Arc and USDC.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/favicon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#0f172a"
      }
    ]
  },
  manifest: "/site.webmanifest",
  other: {
    "msapplication-TileColor": "#0f172a",
    "msapplication-config": "/browserconfig.xml"
  }
};

export const viewport = {
  themeColor: "#0f172a",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
