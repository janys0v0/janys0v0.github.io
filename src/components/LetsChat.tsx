"use client";

// Seabed: Let's Chat. A contact request "in a bottle". Sends through Formspree when NEXT_PUBLIC_FORMSPREE_ID is set;
// without it, the form opens the visitor's email app with the note pre-filled, so it always works.
import { useState } from "react";
import { profile } from "@/content/profile";

const REASONS = ["Hiring", "Collaboration", "Just saying hi"] as const;
const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID;
type Status = "idle" | "sending" | "sent" | "error";

export function LetsChat({ standalone = false }: { standalone?: boolean }) {
  const [reason, setReason] = useState<(typeof REASONS)[number]>("Hiring");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim(), email = String(f.get("email") ?? "").trim(), message = String(f.get("message") ?? "").trim();
    const errs: Record<string, string> = {};
    if (!name) errs.name = "Please add your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please add a valid email.";
    if (message.length < 10) errs.message = "A few more words, please (10+ characters).";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (f.get("_gotcha")) return; // honeypot: bots fill hidden fields
    f.set("reason", reason);
    if (!FORMSPREE_ID) {
      const body = `${message}\n\n— ${name} (${email})${f.get("org") ? `, ${f.get("org")}` : ""}`;
      window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(`[janys.ponder] ${reason}`)}&body=${encodeURIComponent(body)}`;
      setStatus("sent"); window.dispatchEvent(new Event("note-sent"));
      return;
    }
    setStatus("sending");
    try {
      const r = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, { method: "POST", body: f, headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error(String(r.status));
      setStatus("sent"); window.dispatchEvent(new Event("note-sent")); e.currentTarget?.reset?.();
    } catch { setStatus("error"); }
  }

  const field = "w-full rounded-xl border border-[#2a3566] bg-[#030612]/80 px-3.5 py-2.5 text-[14px] text-text placeholder:text-[#8c93b8] focus:border-tech focus:outline-none";
  const err = (k: string) => errors[k] && <span id={`${k}-err`} className="mt-1 block text-[12px] text-[#ff9ab8]">{errors[k]}</span>;

  return (
    <section id="lets-chat" data-chat aria-labelledby="chat-title"
      className={standalone ? "rounded-3xl border border-tech/50 bg-[linear-gradient(160deg,#0a1230f0,#04081af0)] p-6 sm:p-8"
        : "chat-panel fixed z-20 overflow-y-auto rounded-3xl border border-tech/50 bg-[linear-gradient(160deg,#0a1230f2,#04081af2)] p-5 shadow-[0_0_40px_rgba(41,211,255,0.22)] sm:p-7 inset-x-3 bottom-3 max-h-[70svh] sm:inset-x-auto sm:right-[max(5vw,2rem)] sm:top-1/2 sm:bottom-auto sm:w-[460px] sm:-translate-y-1/2 sm:max-h-[86svh]"}>
      <p className="font-mono text-[12px] tracking-[0.3em] text-tech">SEABED · YOU MADE IT</p>
      <h2 id="chat-title" className="glow-frog mt-2 text-[40px] sm:text-[46px] font-bold leading-none">Let&apos;s Chat</h2>
      <p className="mt-2 text-[14px] text-muted">Hiring, building something, or just curious how people think? Send a message in a bottle.</p>

      {status === "sent" ? (
        <div role="status" className="mt-6 rounded-2xl border border-frog/60 bg-frog/10 p-5">
          <p className="text-[18px] font-bold text-frog">Your bottle is on its way ↑</p>
          <p className="mt-1 text-[14px] text-muted">{FORMSPREE_ID ? "Thanks! I'll get back to you soon." : "Your email app should open with the note ready to send."}</p>
          <button onClick={() => setStatus("idle")} className="mt-3 font-mono text-[13px] text-tech underline">send another</button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-5 space-y-2.5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <label className="block"><span className="sr-only">Name</span>
              <input name="name" autoComplete="name" placeholder="Name" className={field} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} />{err("name")}</label>
            <label className="block"><span className="sr-only">Email</span>
              <input name="email" type="email" autoComplete="email" placeholder="Email" className={field} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-err" : undefined} />{err("email")}</label>
          </div>
          <label className="block"><span className="sr-only">Organization (optional)</span>
            <input name="org" autoComplete="organization" placeholder="Organization (optional)" className={field} /></label>
          <fieldset className="flex flex-wrap gap-2"><legend className="sr-only">Reason</legend>
            {REASONS.map((r) => (
              <button type="button" key={r} onClick={() => setReason(r)} aria-pressed={reason === r}
                className={`rounded-full border px-3 py-1.5 font-mono text-[12px] ${reason === r ? "border-lotus text-lotus shadow-[0_0_10px_rgba(255,106,213,0.4)]" : "border-[#2a3566] text-muted"}`}>{r}</button>
            ))}
          </fieldset>
          <label className="block"><span className="sr-only">Message</span>
            <textarea name="message" rows={3} placeholder="Your message…" className={field} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-err" : undefined} />{err("message")}</label>
          <input name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <button type="submit" disabled={status === "sending"}
            className="w-full rounded-xl bg-frog py-3 font-bold text-ink shadow-[0_0_22px_rgba(57,255,136,0.55)] disabled:opacity-60">
            {status === "sending" ? "Sending…" : "Send the bottle ↑"}
          </button>
          {status === "error" && <p role="alert" className="text-[13px] text-[#ff9ab8]">That didn&apos;t go through. Please try again, or email me directly.</p>}
        </form>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2.5 font-mono text-[13px]">
        <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="rounded-xl border border-[#3d7bff] py-2.5 text-center text-[#9dc0ff]">in Connect on LinkedIn</a>
        <a href={`mailto:${profile.email}`} className="rounded-xl border border-[#3d7bff] py-2.5 text-center text-[#9dc0ff]">✉ Email me</a>
      </div>
    </section>
  );
}
