import type { Metadata } from "next";
import { SiteNav } from "@/components/HeroOverlay";
import { experience } from "@/content/experience";
import { profile } from "@/content/profile";
import { languages, terraces } from "@/content/skills";

export const metadata: Metadata = {
  title: `Overview · ${profile.fullName}`,
  description: "Everything on one plain page: experience, skills and contact.",
};

// The flat, fast, accessible version of the whole site. Also the fallback when 3D can't run.
export default function Overview() {
  return (
    <main className="relative min-h-svh bg-ink">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-28">
        <header>
          <p className="font-mono text-[13px] tracking-[0.3em] text-tech">OVERVIEW</p>
          <h1 className="mt-3 text-[40px] font-bold leading-tight">{profile.fullName}</h1>
          <p className="mt-3 text-[18px] text-muted">{profile.bio}</p>
          <p className="mt-2 font-mono text-[14px] text-muted">{profile.status}</p>
        </header>

        <section aria-labelledby="skills" className="mt-14">
          <h2 id="skills" className="text-[26px] font-bold">Skills</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            {terraces.map((t) => (
              <div key={t.id}>
                <h3 className="font-mono text-[14px] tracking-[0.16em] text-[#c9b8ff] uppercase">{t.label}</h3>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {t.keywords.map((k) => (
                    <li key={k} className="rounded-full border border-terrace/60 px-2.5 py-1 font-mono text-[13px]">{k}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-[14px] text-muted">Languages: {languages.join(", ")}</p>
        </section>

        <section aria-labelledby="experience" className="mt-14">
          <h2 id="experience" className="text-[26px] font-bold">Experience</h2>
          <ol className="mt-5 space-y-6">
            {experience.map((e) => (
              <li key={e.id} className="rounded-2xl border border-[#2c6bff66] bg-panel p-6">
                <p className="font-mono text-[13px] tracking-[0.14em] text-tech uppercase">{e.dates} · {e.location}</p>
                <h3 className="mt-2 text-[22px] font-bold">{e.org}</h3>
                <p className="text-muted">{e.role}</p>
                <p className="mt-3 text-[16px]">{e.summary}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <p className="rounded-xl border border-[#4d8dff99] px-3 py-2 text-[14px]"><span className="block font-mono text-[10px] tracking-[0.2em] text-[#8fb6ff]">THE ASK</span>{e.problem}</p>
                  <p className="rounded-xl border border-frog/60 px-3 py-2 text-[14px]"><span className="block font-mono text-[10px] tracking-[0.2em] text-frog">THE ANSWER</span>{e.result}</p>
                </div>
                {e.link && (
                  <a href={e.link.href} className="mt-4 inline-block font-mono text-[14px] text-frog" {...(e.link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                    {e.link.label} →
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="contact" className="mt-14">
          <h2 id="contact" className="text-[26px] font-bold">Let&apos;s chat</h2>
          <div className="mt-4 flex flex-wrap gap-3 font-mono text-[14px]">
            <a className="rounded-xl border border-[#3d7bff] px-4 py-2.5 text-[#9dc0ff]" href={profile.links.linkedin} target="_blank" rel="noreferrer">in Connect on LinkedIn</a>
            <a className="rounded-xl border border-[#3d7bff] px-4 py-2.5 text-[#9dc0ff]" href={`mailto:${profile.email}`}>✉ Email me</a>
          </div>
        </section>
      </div>
    </main>
  );
}
