import type { Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Fathom from "@/components/Fathom";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/seo";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Micah Walter",
    template: "%s | Micah Walter",
  },
  description: "Investigations in AI, Cloud, and Creativity",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Micah Walter",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Micah Walter" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Micah Walter",
    description: "Investigations in AI, Cloud, and Creativity",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ebGaramond.variable} antialiased`} suppressHydrationWarning>
        <Fathom />
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
