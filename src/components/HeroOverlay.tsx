import Link from "next/link";
import { profile } from "@/content/profile";

// The homepage text layer. It sits above the 3D scene, and is real HTML so it loads first and stays readable.
export function HeroOverlay() {
  const { tagline, links, email } = profile;
  return (
    <section className="relative z-10 px-6 pt-28 sm:px-16 sm:pt-32 max-w-[760px]">
      <p className="font-mono text-[13px] tracking-[0.3em] text-tech">HI, I&apos;M</p>
      <h1 className="mt-3 text-[46px] sm:text-[72px] font-bold leading-[1.04] tracking-tight">
        Janys <span className="glow-frog">(Jiayang)</span> Li
      </h1>
      <p className="mt-4 text-[19px] sm:text-[24px] leading-snug">
        {tagline.lead} <span className="glow-lotus">{tagline.think}</span> &amp;{" "}
        <span className="glow-tech">{tagline.build}</span>
      </p>
      <p className="mt-4 font-mono text-[13px] sm:text-[15px] tracking-[0.06em] uppercase text-[#e2e6ff]">{profile.role}</p>
      <div className="mt-5 flex flex-wrap gap-2 font-mono text-[13px] sm:text-[14px]">
        <a className="rounded-lg border border-[#39406e] bg-[#070a1a]/80 px-3 py-2" href={links.linkedin} target="_blank" rel="noreferrer">in LinkedIn</a>
        <a className="rounded-lg border border-[#39406e] bg-[#070a1a]/80 px-3 py-2" href={links.github} target="_blank" rel="noreferrer">⌥ GitHub</a>
        <a className="rounded-lg border border-[#39406e] bg-[#070a1a]/80 px-3 py-2" href={`mailto:${email}`}>✉ {email}</a>
      </div>
    </section>
  );
}

export function SiteNav() {
  return (
    <nav className="absolute inset-x-0 top-0 z-20 flex h-16 items-center justify-between px-5 sm:px-10 font-mono">
      <Link href="/" className="glow-frog text-[17px] font-semibold">{profile.handle}</Link>
      <div className="flex items-center gap-6 text-[14px] text-muted">
        <Link href="/overview" className="hidden sm:inline">overview</Link>
        <a href={`mailto:${profile.email}`} className="rounded-full border-[1.5px] border-frog px-4 py-1.5 text-frog">let&apos;s chat</a>
      </div>
    </nav>
  );
}
