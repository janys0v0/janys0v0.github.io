import { HeroOverlay, SiteNav } from "@/components/HeroOverlay";
import { HomeScene } from "@/components/HomeScene";
import { LetsChat } from "@/components/LetsChat";
import Link from "next/link";
import { JOURNEY_VH } from "@/scene/stops";

// Homepage: the 3D pond stays fixed while the page scrolls; scroll position moves the frog along its Ɔ path:
// hop across the skill terraces → dive → swim past each experience → the seabed (Let's Chat).
export default function Home() {
  return (
    <main className="relative bg-[linear-gradient(#050818,#141c44_62%,#5a6aa8)] [html[data-theme=dusk]_&]:bg-[linear-gradient(#1a0f3a,#5a2a78_62%,#ff8fc8)]" style={{ height: `${(JOURNEY_VH + 1) * 100}svh` }}>
      <div className="fixed inset-0 h-svh">
        <HomeScene />
      </div>
      <SiteNav />
      {/* first screen: the intro. It scrolls away as the frog starts hopping. */}
      <section data-hero className="relative h-svh">
        <HeroOverlay />
      </section>
      <LetsChat />
      <div className="no3d-only relative z-10 px-6 pb-16 sm:px-16">
        <Link href="/overview" className="font-mono text-frog">See my experience and skills →</Link>
      </div>
      <p id="scroll-cue" aria-hidden data-on="true"
        className="fixed bottom-7 left-4 z-10 whitespace-nowrap rounded-full border border-frog/60 bg-ink/70 px-4 py-2.5 font-mono text-[12px] tracking-[0.12em] sm:left-1/2 sm:-translate-x-1/2 sm:px-5 sm:text-[14px] sm:tracking-[0.25em] text-frog transition-opacity duration-500 data-[on=false]:opacity-0">
        SCROLL TO HOP →
      </p>
    </main>
  );
}
