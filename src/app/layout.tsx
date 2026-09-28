import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "@/app/globals.css";
import { profile } from "@/content/profile";
import { AskFrog } from "@/components/AskFrog";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: `${profile.fullName} · ${profile.handle}`,
  description: `${profile.tagline.lead} ${profile.tagline.think} & ${profile.tagline.build}. ${profile.role}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${jetbrains.variable}`}>
      <body>{children}<AskFrog /></body>
    </html>
  );
}
