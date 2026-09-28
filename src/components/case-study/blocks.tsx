// Reusable case-study building blocks (server components, plain HTML: fast and readable).
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteNav } from "@/components/HeroOverlay";

export function CaseLayout({ kicker, title, role, meta, result, back, children }: {
  kicker: string; title: string; role: string; meta: string; result: string; back: string; children: ReactNode;
}) {
  return (
    <main className="min-h-svh bg-[radial-gradient(ellipse_at_top,#101a3d,#04050d_60%)]">
      <SiteNav />
      <article className="mx-auto max-w-3xl px-5 pb-24 pt-24 sm:px-6 sm:pt-28">
        <Link href={back} className="font-mono text-[13px] text-tech hover:underline">← Back to the pond</Link>
        <p className="mt-6 font-mono text-[12px] tracking-[0.3em] text-lotus uppercase">{kicker}</p>
        <h1 className="mt-2 text-[34px] sm:text-[48px] font-bold leading-[1.05]">{title}</h1>
        <p className="mt-3 text-[16px] text-muted">{role}</p>
        <p className="mt-1 font-mono text-[13px] text-muted">{meta}</p>
        <p className="mt-6 rounded-2xl border border-frog/50 bg-frog/10 p-4 text-[17px] leading-snug"><span className="font-mono text-[12px] tracking-[0.2em] text-frog">RESULT · </span>{result}</p>
        <div className="mt-10 space-y-14">{children}</div>
        <Link href={back} className="mt-16 inline-block rounded-full border border-frog/60 px-5 py-2.5 font-mono text-[14px] text-frog">← Back to the pond</Link>
      </article>
    </main>
  );
}

export function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`s-${n}`}>
      <p className="font-mono text-[12px] tracking-[0.25em] text-tech">{n}</p>
      <h2 id={`s-${n}`} className="mt-1 text-[24px] sm:text-[28px] font-bold">{title}</h2>
      <div className="mt-4 space-y-4 text-[16px] leading-relaxed text-[#d6dcf5]">{children}</div>
    </section>
  );
}

export function StatRow({ stats }: { stats: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(([v, l]) => (
        <div key={l} className="rounded-2xl border border-[#2c6bff66] bg-panel p-4">
          <dt className="sr-only">{l}</dt>
          <dd className="text-[26px] font-bold text-frog">{v}</dd>
          <dd className="text-[13px] leading-snug text-muted">{l}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Quote({ children, who }: { children: ReactNode; who: string }) {
  return (
    <figure className="rounded-2xl border-l-4 border-lotus bg-panel p-5">
      <blockquote className="text-[18px] italic leading-snug">“{children}”</blockquote>
      <figcaption className="mt-2 font-mono text-[13px] text-muted">{who}</figcaption>
    </figure>
  );
}

export function ProblemFix({ items }: { items: { problem: string; fix: string }[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {items.map((it, i) => (
        <li key={i} className="rounded-2xl border border-[#2c6bff66] bg-panel p-4">
          <p className="font-mono text-[11px] tracking-[0.2em] text-[#8fb6ff]">PROBLEM {i + 1}</p>
          <p className="mt-1 text-[15px] italic">“{it.problem}”</p>
          <p className="mt-3 font-mono text-[11px] tracking-[0.2em] text-frog">FIX</p>
          <p className="mt-1 text-[15px]">{it.fix}</p>
        </li>
      ))}
    </ol>
  );
}

export function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((t) => <li key={t} className="rounded-full border border-[#3d7bff] px-3 py-1 font-mono text-[13px] text-[#9dc0ff]">{t}</li>)}
    </ul>
  );
}

export function Figure({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure>
      <img src={src} alt={alt} loading="lazy" className="w-full rounded-2xl border border-[#2a3160]" />
      <figcaption className="mt-2 font-mono text-[13px] text-muted">{caption}</figcaption>
    </figure>
  );
}
