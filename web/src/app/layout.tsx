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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#030408] text-[#f1f5f9]">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
