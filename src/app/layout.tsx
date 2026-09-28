import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "@/app/globals.css";
import { profile } from "@/content/profile";
import { AskFrog } from "@/components/AskFrog";
import { themeScript } from "@/components/ThemeToggle";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

const description = `${profile.tagline.lead} ${profile.tagline.think} & ${profile.tagline.build}. ${profile.role}.`;
export const metadata: Metadata = {
  metadataBase: new URL("https://janys0v0.github.io"),
  title: `${profile.fullName} · ${profile.handle}`,
  description,
  openGraph: { title: `${profile.fullName} · ${profile.handle}`, description, url: "/", siteName: profile.handle, images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "A neon frog by a moonlit pond: janys.ponder" }], type: "website" },
  twitter: { card: "summary_large_image", title: profile.fullName, description, images: ["/og.jpg"] },
  icons: { icon: "/frog.png" },
};
export const viewport = { themeColor: "#04050d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${grotesk.variable} ${jetbrains.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <a href="/overview" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-frog focus:px-4 focus:py-2 focus:text-ink">Skip to all content (text version)</a>
        {children}
        <AskFrog />
      </body>
    </html>
  );
}
