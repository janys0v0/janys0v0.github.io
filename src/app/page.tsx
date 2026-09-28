import { HeroOverlay, SiteNav } from "@/components/HeroOverlay";
import { HomeScene } from "@/components/HomeScene";
import { JOURNEY_VH } from "@/scene/stops";

// Homepage: the 3D pond stays fixed while the page scrolls; scroll position moves the frog along its Ɔ path:
// hop across the skill terraces → dive → swim past each experience → the seabed (Let's Chat).
export default function Home() {
  return (
    <main className="relative bg-[linear-gradient(#050818,#141c44_62%,#5a6aa8)]" style={{ height: `${(JOURNEY_VH + 1) * 100}svh` }}>
      <div className="fixed inset-0 h-svh">
        <HomeScene />
      </div>
      <SiteNav />
      {/* first screen: the intro. It scrolls away as the frog starts hopping. */}
      <section data-hero className="relative h-svh">
        <HeroOverlay />
      </section>
      <p id="scroll-cue" aria-hidden data-on="true"
        className="fixed bottom-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-frog/60 bg-ink/70 px-5 py-2.5 font-mono text-[13px] sm:text-[14px] tracking-[0.25em] text-frog transition-opacity duration-500 data-[on=false]:opacity-0">
        SCROLL TO HOP →
      </p>
    </main>
  );
}
