import Link from "next/link";
import { HeroOverlay, SiteNav } from "@/components/HeroOverlay";
import { HomeScene } from "@/components/HomeScene";

// Homepage: the 3D pond (loaded after the text) with the HTML text layer on top.
export default function Home() {
  return (
    <main className="relative h-svh overflow-hidden bg-[linear-gradient(#050818,#141c44_62%,#5a6aa8)]">
      <HomeScene />
      <SiteNav />
      <HeroOverlay />
      <Link href="/overview" className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-frog/60 bg-ink/70 px-5 py-2.5 font-mono text-[13px] sm:text-[14px] tracking-[0.25em] text-frog">
        SEE EVERYTHING →
      </Link>
    </main>
  );
}
