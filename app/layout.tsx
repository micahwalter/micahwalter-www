import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Micah Walter",
  description: "Personal website of Micah Walter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
