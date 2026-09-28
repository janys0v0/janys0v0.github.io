"use client";

// "Ask the frog": a chat panel laid out like Claude/Codex (transcript + sources), answering from scripted Q&As.
import { useEffect, useRef, useState } from "react";
import { answer, faq, type Faq } from "@/content/faq";

type Msg = { from: "you" | "frog"; text: string; sources?: Faq["sources"] };
const SUGGESTED = [0, 3, 4, 2].map((i) => faq[i].q);
const FALLBACK = "I'm a scripted frog, so I only know what's on this site. Try one of the suggestions, or leave a note at the seabed and Janys will reply.";

export function AskFrog() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "frog", text: "Ribbit! Ask me about Janys's work, skills, or what she's looking for." }]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const list = useRef<HTMLDivElement>(null), field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const on = () => setOpen(true);
    if (new URLSearchParams(location.search).has("ask")) setOpen(true); // test switch: open on load
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("ask-frog", on); window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("ask-frog", on); window.removeEventListener("keydown", esc); };
  }, []);
  useEffect(() => { if (open) field.current?.focus(); }, [open]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }); }, [msgs, typing]);

  const ask = (q: string) => {
    q = q.trim(); if (!q || typing) return;
    setMsgs((m) => [...m, { from: "you", text: q }]); setInput(""); setTyping(true);
    const hit = answer(q);
    window.setTimeout(() => { setTyping(false); setMsgs((m) => [...m, hit ? { from: "frog", text: hit.a, sources: hit.sources } : { from: "frog", text: FALLBACK, sources: [{ label: "Let's Chat", href: "/#chat" }] }]); }, 550);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}
        className="fixed bottom-7 right-4 z-30 rounded-full border-[1.5px] border-tech/70 bg-[#050818]/90 px-4 py-2.5 font-mono text-[13px] text-tech shadow-[0_0_16px_rgba(41,211,255,0.35)] sm:right-8 sm:bottom-8">
        ☁ ask the frog
      </button>
      {open && (
        <div role="dialog" aria-modal="false" aria-label="Ask the frog"
          className="fixed z-40 flex flex-col overflow-hidden rounded-3xl border border-tech/50 bg-[#070c22] backdrop-blur-md shadow-[0_0_40px_rgba(41,211,255,0.25)] inset-x-2 bottom-2 top-[18svh] sm:inset-auto sm:bottom-8 sm:right-8 sm:h-[560px] sm:w-[420px]">
          <header className="flex items-center justify-between border-b border-[#1e2a55] px-5 py-3">
            <p className="font-mono text-[13px] tracking-[0.15em] text-tech">☁ ASK THE FROG</p>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full px-2 text-[20px] leading-none text-muted hover:text-white">×</button>
          </header>
          <div ref={list} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "you" ? "flex justify-end" : ""}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug ${m.from === "you" ? "bg-tech/15 text-text" : "border border-frog/40 bg-frog/[0.06]"}`}>
                  {m.from === "frog" && <span className="mb-1 block font-mono text-[10px] tracking-[0.2em] text-frog">🐸 FROG</span>}
                  {m.text}
                  {!!m.sources?.length && (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
                      <span className="font-mono text-[10px] tracking-[0.15em] text-muted">SOURCES</span>
                      {m.sources.map((s) => (
                        <a key={s.href} href={s.href} onClick={() => setOpen(false)} {...(s.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                          className="rounded-full border border-[#3d7bff] px-2 py-0.5 font-mono text-[11px] text-[#9dc0ff] hover:text-white">{s.label}</a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && <p className="font-mono text-[13px] text-frog">🐸 pondering…</p>}
          </div>
          {msgs.length < 3 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {SUGGESTED.map((q) => <button key={q} onClick={() => ask(q)} className="rounded-full border border-terrace/60 px-2.5 py-1 text-[12px] text-[#e4dcff] hover:border-terrace">{q}</button>)}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t border-[#1e2a55] p-3">
            <label className="sr-only" htmlFor="ask-input">Your question</label>
            <input id="ask-input" ref={field} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about work, skills, contact…"
              className="flex-1 rounded-xl border border-[#2a3566] bg-[#030612] px-3 py-2 text-[14px] placeholder:text-[#8c93b8] focus:border-tech focus:outline-none" />
            <button type="submit" className="rounded-xl bg-tech px-4 font-bold text-ink">↑</button>
          </form>
        </div>
      )}
    </>
  );
}
