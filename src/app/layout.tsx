import type { Metadata, Viewport } from "next";
import { Outfit, Caveat } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ILUMO — See the Ability",
  description:
    "ILUMO is an AI-powered inclusive learning platform that adapts educational content to your needs with audio, visual, speech and cognitive support.",
};

export const viewport: Viewport = {
  themeColor: "#fbfaff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${caveat.variable} antialiased`}>
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand-deep focus:px-5 focus:py-3 focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
