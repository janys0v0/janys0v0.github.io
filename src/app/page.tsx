import Link from "next/link";
import { HeroOverlay, SiteNav } from "@/components/HeroOverlay";
import { HomeScene } from "@/components/HomeScene";
import { JOURNEY_VH } from "@/scene/stops";

// Homepage: the 3D pond stays fixed while the page scrolls; scroll position moves the frog along its path.
export default function Home() {
  return (
    <main className="relative bg-[linear-gradient(#050818,#141c44_62%,#5a6aa8)]" style={{ height: `${(JOURNEY_VH + 1) * 100}svh` }}>
      <div className="fixed inset-0 h-svh">
        <HomeScene />
      </div>
      <SiteNav />
      {/* first screen: the intro. It scrolls away as the frog starts hopping. */}
      <section className="relative h-svh">
        <HeroOverlay />
      </section>
      <p id="scroll-cue" aria-hidden className="fixed bottom-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-frog/60 bg-ink/70 px-5 py-2.5 font-mono text-[13px] sm:text-[14px] tracking-[0.25em] text-frog">
        SCROLL TO HOP →
      </p>
      {/* end of the land path (the dive and experiences arrive in Phase 3) */}
      <section className="absolute inset-x-0 bottom-0 flex h-svh items-end justify-center pb-24">
        <Link href="/overview" className="relative z-10 whitespace-nowrap rounded-full border border-tech/60 bg-ink/70 px-5 py-2.5 font-mono text-[13px] sm:text-[14px] tracking-[0.25em] text-tech">
          SEE EXPERIENCE →
        </Link>
      </section>
    </main>
  );
}
