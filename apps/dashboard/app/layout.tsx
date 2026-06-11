import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AAA Feedback — Ayesha Ali Academy",
    template: "%s | AAA Feedback",
  },
  description:
    "Feedback Management System for Ayesha Ali Academy. Review, analyze, and act on student and parent feedback.",
  robots: { index: false, follow: false }, // Private admin tool
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
