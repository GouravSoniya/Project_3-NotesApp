import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

import Script from 'next/script'



const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notes App",
  description: "Your personal AI-powered notes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${cormorant.variable} ${dmSans.variable} min-h-full font-[family-name:var(--font-dm-sans)]`}>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        {children}
      </body>
    </html>
  )
}