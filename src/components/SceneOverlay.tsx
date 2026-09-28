"use client";

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
  { id: "cloud", pos: [0.2, 10.4, -3], show: { when: "always" }, mobile: false, zone: "land" },
  ...experience.flatMap((e, i): Anchor[] => {
    const y = EXP_DEPTHS[i], stop = stopIndex(e.id);
    return [
      { id: `card-${e.id}`, pos: [CARD_X, y + 0.8, 0], show: { when: "at", stop }, pinOnMobile: true },
      { id: `prob-${e.id}`, pos: [ANIMAL_X, y + 3.6, 0], show: { when: "at", stop } },
      { id: `res-${e.id}`, pos: [FROG_X, y + 4.9, 0], show: { when: "at", stop } },
    ];
  }),
];

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
      {!mobile && (
        <button ref={reg("cloud")} style={offscreen} data-on="true" onClick={() => window.dispatchEvent(new Event("ask-frog"))}
          className={`${base} pointer-events-auto whitespace-nowrap rounded-full px-3 py-2 font-mono text-[14px] tracking-[0.12em] text-tech hover:text-white`}>
          ask the frog
        </button>
      )}
      {experience.map((e) => (
        <div key={e.id}>
          <article ref={reg(`card-${e.id}`)} data-on="false" style={mobile ? undefined : offscreen} aria-label={`${e.org}, ${e.role}`}
            className={`${mobile ? "fixed inset-x-3 bottom-[76px] max-h-[40svh] overflow-y-auto" : `${base} w-[430px]`} pointer-events-auto rounded-2xl border border-[#2c6bff88] bg-[linear-gradient(160deg,#0b1a36f2,#050b1cf2)] p-5 sm:p-6 shadow-[0_0_30px_rgba(41,120,255,0.25)] transition-opacity duration-500 data-[on=false]:pointer-events-none data-[on=false]:opacity-0`}>
            <p className="font-mono text-[12px] tracking-[0.14em] text-tech uppercase">{e.dates} · {e.location}</p>
            <h3 className="mt-1.5 text-[20px] sm:text-[24px] font-bold leading-tight">{e.org}</h3>
            <p className="text-[14px] text-muted">{e.role}</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[14px] leading-snug text-[#d6dcf5]">
              {e.bullets.slice(0, mobile ? 3 : 2).map((b) => <li key={b}>{b}</li>)}
            </ul>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {e.tags.map((t) => <li key={t} className="rounded-full border border-[#3d7bff] px-2.5 py-0.5 font-mono text-[11px] sm:text-[12px] text-[#9dc0ff]">{t}</li>)}
            </ul>
            {e.link && (
              <a href={e.link.href} {...(e.link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                className="mt-3 inline-block font-mono text-[13px] sm:text-[14px] text-frog hover:underline">
                {e.link.label} {e.link.href.startsWith("http") ? "↗" : "→"}
              </a>
            )}
          </article>
          <p ref={reg(`prob-${e.id}`)} data-on="false" style={offscreen}
            className={`${base} w-[180px] sm:w-[260px] -translate-y-full rounded-2xl border-[1.6px] border-[#4d8dff] bg-[#06081a]/90 px-3.5 py-2.5 text-[12px] sm:text-[14px] leading-snug shadow-[0_0_16px_rgba(77,141,255,0.45)]`}>
            <span className="mb-1 block font-mono text-[10px] tracking-[0.2em] text-[#8fb6ff]">THE CLIENT</span>
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
  const go = (id: string) => window.scrollTo({ top: STOPS[stopIndex(id)].at * window.innerHeight, behavior: "smooth" });
  return (
    <nav ref={reg("gauge")} data-on="false" aria-label="Experience by year"
      className="fixed right-2 sm:right-6 top-1/2 z-10 -translate-y-1/2 transition-opacity duration-500 data-[on=false]:pointer-events-none data-[on=false]:opacity-0">
      <div className="absolute bottom-0 right-[9px] top-0 w-[2px] bg-[linear-gradient(#29d3ff,#8b5cff_70%,#29d3ff00)] shadow-[0_0_10px_#29d3ff]" />
      <ol className="relative flex flex-col gap-4 sm:gap-6">
        {experience.map((e) => (
          <li key={e.id}>
            <button ref={reg(`g-${e.id}`)} onClick={() => go(e.id)} data-on="false"
              className="group flex items-center justify-end gap-2 font-mono text-[11px] sm:text-[12px] text-muted data-[on=true]:text-white" aria-label={`${e.org}, ${e.dates}`}>
              {!mobile && <span className="hidden group-hover:inline group-data-[on=true]:inline">{e.org.split(" ")[0]} ·</span>}
              {!mobile && <span>{e.dates.match(/\d{4}/)?.[0]}</span>}
              <i className="block h-[10px] w-[10px] rounded-full border-[1.5px] border-[#6f78a8] bg-ink group-data-[on=true]:border-frog group-data-[on=true]:bg-frog group-data-[on=true]:shadow-[0_0_10px_#39ff88]" />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
