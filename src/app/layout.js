import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "VlogSpotter — Discover Places to Vlog Near You",
  description:
    "AI-powered travel vlogging companion. Get nearby place suggestions with vlog ideas, scripts, hooks, and filming tips.",
  openGraph: {
    title: "VlogSpotter — Discover Places to Vlog Near You",
    description: "AI-powered vlogging companion for content creators.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
