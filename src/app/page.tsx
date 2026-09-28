import Link from "next/link";
import { HeroOverlay, SiteNav } from "@/components/HeroOverlay";

// Phase 0 homepage: the text layer on the night sky. Phase 1 mounts the 3D pond scene behind it.
export default function Home() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[linear-gradient(#050818,#141c44_62%,#5a6aa8)]">
      <SiteNav />
      <HeroOverlay />
      <Link href="/overview" className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border border-frog/60 bg-ink/70 px-5 py-2.5 font-mono text-[14px] tracking-[0.25em] text-frog">
        SEE EVERYTHING →
      </Link>
    </main>
  );
}
