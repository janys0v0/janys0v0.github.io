"use client";

import { useEffect, useState } from "react";
// HTML that lives "in" the 3D world: labels, keyword chips, experience cards and speech bubbles.
// Each element is anchored to a 3D point; PondCanvas re-projects the anchors every frame and toggles data-on.
import { experience } from "@/content/experience";
import { terraces } from "@/content/skills";
import { ANIMAL_X, CARD_X, EXP_DEPTHS, FROG_X, stopIndex, STOPS, type P3 } from "@/scene/stops";

export type Anchor = {
  id: string;
  pos: P3;
  /** When is it visible? "always"; from a stop onward ("seen"); while the frog is on that stop, including the hop away ("current"); or only once it has landed there ("at"). */
  show: { when: "always" } | { when: "seen" | "at" | "current"; stop: number };
  /** On phones, cards leave the 3D anchor and sit in a bottom sheet instead. */
  pinOnMobile?: boolean;
  mobile?: boolean; // shown on phones (default true)
  zone?: "land"; // hidden once the camera is underwater
};

const TERRACE_X = [-8, -2, 4];
export const ANCHORS: Anchor[] = [
  ...terraces.map((t, i): Anchor => ({ id: `t-${t.id}`, pos: [TERRACE_X[i], -0.3, 1.9], show: { when: "always" }, zone: "land" })),
  ...terraces.map((t, i): Anchor => ({ id: `c-${t.id}`, pos: [TERRACE_X[i], 7.4, -0.5], show: { when: "current", stop: i + 1 }, zone: "land" })),
  ...experience.flatMap((e, i): Anchor[] => {
    const y = EXP_DEPTHS[i], stop = stopIndex(e.id);
    return [
      { id: `card-${e.id}`, pos: [CARD_X, y + 0.8, 0], show: { when: "at", stop }, pinOnMobile: true },
      { id: `prob-${e.id}`, pos: [ANIMAL_X, y + 3.6, 0], show: { when: "at", stop } },
      { id: `res-${e.id}`, pos: [FROG_X, y + 4.9, 0], show: { when: "at", stop } },
    ];
  }),
];

const ANIMAL_EMOJI = { octopus: "🐙", turtle: "🐢", flyingFish: "🐟", starfish: "⭐", crab: "🦀", jellyfish: "🪼" } as const;

/** A small framed "window" at the top of each card: title bar + photo(s), or the client animal until photos are added.
 *  Several photos crossfade slowly. */
function PhotoWindow({ e, mobile }: { e: (typeof experience)[number]; mobile: boolean }) {
  const photos = e.photos ?? [];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (photos.length < 2) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % photos.length), 4200);
    return () => window.clearInterval(t);
  }, [photos.length]);
  const frame = mobile ? "h-[110px]" : "aspect-[16/9]";
  const name = photos.length ? photos[i].src.split("/").pop() : `${e.id}.pond`;
  return (
    <figure className="-mx-1 mb-3 overflow-hidden rounded-xl border border-[#2c6bff99] bg-[#030612]">
      <div className="flex items-center gap-1.5 border-b border-[#1e2a55] px-2.5 py-1.5" aria-hidden>
        <i className="h-2 w-2 rounded-full bg-lotus/80" /><i className="h-2 w-2 rounded-full bg-[#f4ff61]/80" /><i className="h-2 w-2 rounded-full bg-frog/80" />
        <span className="ml-1.5 truncate font-mono text-[10px] text-muted">{name}</span>
        {photos.length > 1 && <span className="ml-auto font-mono text-[10px] text-muted">{i + 1}/{photos.length}</span>}
      </div>
      <div className={`relative ${frame}`}>
        {photos.length ? photos.map((p, k) => (
          <img key={p.src} src={p.src} alt={k === i ? p.alt : ""} aria-hidden={k !== i} loading="lazy"
            style={{ objectPosition: p.focus ?? "50% 50%" }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${k === i ? "opacity-100" : "opacity-0"}`} />
        )) : (
          <div role="img" aria-label={`${e.org} illustration`} className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_60%,#12306a,#050b1c_70%)]">
            <span className="text-[44px] sm:text-[56px] drop-shadow-[0_0_18px_rgba(41,211,255,0.6)]" aria-hidden>{ANIMAL_EMOJI[e.animal]}</span>
          </div>
        )}
        {e.badge && (
          <img src={e.badge.src} alt={e.badge.alt} className="absolute bottom-2 right-2 h-9 w-9 rounded-lg border border-white/20 bg-black/80 p-1 object-contain sm:h-10 sm:w-10" />
        )}
      </div>
    </figure>
  );
}

/** Elements registered by id; PondCanvas writes their transforms each frame. */
export const anchorEls = new Map<string, HTMLElement>();
const reg = (id: string) => (el: HTMLElement | null) => { if (el) anchorEls.set(id, el); else anchorEls.delete(id); };

const base = "absolute left-0 top-0 transition-opacity duration-500 data-[on=false]:opacity-0 data-[on=false]:pointer-events-none";
const offscreen = { transform: "translate(-9999px,0)" };

export function SceneOverlay({ mobile }: { mobile: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {terraces.map((t) => (
        <span key={t.id} ref={reg(`t-${t.id}`)} aria-hidden style={offscreen} data-on="true"
          className={`${base} whitespace-nowrap rounded-full border border-tech/40 bg-[#060818]/80 px-3 py-1 font-mono text-[12px] sm:text-[14px] tracking-[0.16em] text-[#f1eeff] uppercase`}>
          {t.label}
        </span>
      ))}
      {terraces.map((t) => (
        <div key={t.id} ref={reg(`c-${t.id}`)} data-on="false" style={offscreen}
          className="group absolute left-0 top-0 flex w-[250px] sm:w-[300px] flex-wrap justify-center gap-1.5" aria-label={`${t.label} skills`}>
          {t.keywords.map((w, j) => (
            <span key={w} style={{ transitionDelay: `${j * 45}ms` }}
              className="scale-75 opacity-0 transition duration-300 ease-out group-data-[on=true]:scale-100 group-data-[on=true]:opacity-100 rounded-full border border-terrace/70 bg-[#0a0820]/80 px-2.5 py-1 font-mono text-[12px] sm:text-[13px] text-[#e4dcff] shadow-[0_0_10px_rgba(139,92,255,0.45)]">
              {w}
            </span>
          ))}
        </div>
      ))}
      {experience.map((e) => (
        <div key={e.id}>
          <article ref={reg(`card-${e.id}`)} data-on="false" style={mobile ? undefined : offscreen} aria-label={`${e.org}, ${e.role}`}
            className={`${mobile ? "fixed inset-x-3 bottom-[76px] max-h-[46svh] overflow-y-auto" : `${base} w-[360px]`} pointer-events-auto rounded-2xl border border-[#2c6bff88] bg-[linear-gradient(160deg,#0b1a36f2,#050b1cf2)] p-4 sm:p-5 shadow-[0_0_30px_rgba(41,120,255,0.25)] transition-opacity duration-500 data-[on=false]:pointer-events-none data-[on=false]:opacity-0`}>
            <PhotoWindow e={e} mobile={mobile} />
            <p className="font-mono text-[12px] tracking-[0.14em] text-tech uppercase">{e.dates} · {e.location}</p>
            <h3 className="mt-1.5 text-[20px] sm:text-[24px] font-bold leading-tight">{e.org}</h3>
            <p className="text-[14px] text-muted">{e.role}</p>
            <p className="mt-3 text-[14px] sm:text-[15px] leading-snug text-[#d6dcf5]">{e.summary}</p>
            {e.link && (
              <a href={e.link.href} {...(e.link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                className="mt-3 inline-block font-mono text-[13px] sm:text-[14px] text-frog hover:underline">
                {e.link.label} {e.link.href.startsWith("http") ? "↗" : "→"}
              </a>
            )}
          </article>
          <p ref={reg(`prob-${e.id}`)} data-on="false" style={offscreen}
            className={`${base} w-[180px] sm:w-[260px] -translate-y-full rounded-2xl border-[1.6px] border-[#4d8dff] bg-[#06081a]/90 px-3.5 py-2.5 text-[12px] sm:text-[14px] leading-snug shadow-[0_0_16px_rgba(77,141,255,0.45)]`}>
            <span className="mb-1 block font-mono text-[10px] tracking-[0.2em] text-[#8fb6ff]">THE ASK</span>
            {e.problem}
          </p>
          <p ref={reg(`res-${e.id}`)} data-on="false" style={offscreen}
            className={`${base} w-[170px] sm:w-[250px] rounded-2xl border-[1.6px] border-frog bg-[#06081a]/90 px-3.5 py-2.5 text-[12px] sm:text-[14px] leading-snug shadow-[0_0_16px_rgba(57,255,136,0.45)]`}>
            <span className="mb-1 block font-mono text-[10px] tracking-[0.2em] text-frog">TA-DA!</span>
            {e.result}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Depth gauge: years down the right edge while underwater; click a year to swim there. */
export function DepthGauge({ mobile }: { mobile: boolean }) {
  const go = (id: string) => {
    const y = STOPS[stopIndex(id)].at * window.innerHeight, l = (window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }).__lenis;
    if (l) l.scrollTo(y, { duration: 1.6 }); else window.scrollTo({ top: y, behavior: "smooth" });
  };
  return (
    <nav ref={reg("gauge")} data-on="false" aria-label="Experience by year"
      className="fixed right-2 sm:right-6 top-1/2 z-10 -translate-y-1/2 transition-opacity duration-500 data-[on=false]:pointer-events-none data-[on=false]:opacity-0">
      <div className="absolute bottom-0 right-[9px] top-0 w-[2px] bg-[linear-gradient(#29d3ff,#8b5cff_70%,#29d3ff00)] shadow-[0_0_10px_#29d3ff]" />
      <ol className="relative flex flex-col gap-4 sm:gap-6">
        {experience.map((e) => (
          <li key={e.id}>
            <button ref={reg(`g-${e.id}`)} onClick={() => go(e.id)} data-on="false"
              className="group flex w-full items-center justify-end gap-2 font-mono text-[11px] sm:text-[12px] text-muted data-[on=true]:text-white" aria-label={`${e.org}, ${e.dates}`}>
              {!mobile && <span>{e.org.split(" ")[0]} ·</span>}
              {!mobile && <span>{e.dates.match(/\d{4}/)?.[0]}</span>}
              <i className="block h-[10px] w-[10px] rounded-full border-[1.5px] border-[#6f78a8] bg-ink group-data-[on=true]:border-frog group-data-[on=true]:bg-frog group-data-[on=true]:shadow-[0_0_10px_#39ff88]" />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
