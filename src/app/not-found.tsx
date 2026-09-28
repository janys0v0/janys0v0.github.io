import Link from "next/link";
import { SiteNav } from "@/components/HeroOverlay";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-[radial-gradient(ellipse_at_top,#101a3d,#04050d_60%)] px-6 text-center">
      <SiteNav />
      <div>
        <p className="text-[64px]" aria-hidden>🐸💨</p>
        <h1 className="mt-4 text-[32px] font-bold">This frog hopped too far.</h1>
        <p className="mt-2 text-muted">The page you’re looking for isn’t in this pond.</p>
        <Link href="/" className="mt-6 inline-block rounded-full border border-frog/60 px-5 py-2.5 font-mono text-[14px] text-frog">← Hop back home</Link>
      </div>
    </main>
  );
}
