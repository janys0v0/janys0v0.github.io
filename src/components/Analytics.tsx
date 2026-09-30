"use client";

// Google Analytics 4, opt-in only: nothing loads and no cookies are set until the visitor clicks "Accept".
// Turned on by the NEXT_PUBLIC_GA_ID build variable (repository variable GA_ID); without it this renders nothing.
import Script from "next/script";
import { useEffect, useState } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const KEY = "ga-consent";
type Choice = "granted" | "denied" | null;

const read = (): Choice => { try { const v = localStorage.getItem(KEY); return v === "granted" || v === "denied" ? v : null; } catch { return null; } };
const save = (v: Exclude<Choice, null>) => { try { localStorage.setItem(KEY, v); } catch { /* private mode: ask again next visit */ } };

export function Analytics() {
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setChoice(read()); setReady(true);
    const reopen = () => setChoice(null); // "cookie settings" links fire this to ask again
    window.addEventListener("cookie-settings", reopen);
    return () => window.removeEventListener("cookie-settings", reopen);
  }, []);
  if (!GA_ID || !ready) return null;

  const decide = (v: Exclude<Choice, null>) => {
    const wasOn = read() === "granted";
    save(v); setChoice(v);
    if (v === "denied") document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => n.startsWith("_ga"))
      .forEach((n) => { document.cookie = `${n}=; max-age=0; path=/; domain=${location.hostname}`; document.cookie = `${n}=; max-age=0; path=/`; });
    if (v === "denied" && wasOn) location.reload(); // unload the already-running tag
  };

  return (
    <>
      {choice === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
      {choice === null && (
        <div role="dialog" aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:left-5 sm:bottom-6 sm:w-[340px] rounded-2xl border border-tech/50 bg-[#070c22]/95 p-4 font-mono text-[12px] leading-relaxed text-muted shadow-[0_0_30px_rgba(41,211,255,0.2)] backdrop-blur-md">
          <p>
            <span className="text-tech">🍪 a tiny cookie?</span> I use Google Analytics to count visits and see which parts of the pond people enjoy. No ads, nothing sold.
          </p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => decide("granted")} className="rounded-full bg-frog px-3.5 py-1.5 font-semibold text-ink hover:brightness-110">Accept</button>
            <button onClick={() => decide("denied")} className="rounded-full border border-[#39406e] px-3.5 py-1.5 hover:text-white">Decline</button>
          </div>
        </div>
      )}
    </>
  );
}

/** Lets a visitor change their answer later. Hidden when analytics is off. */
export function CookieSettingsLink() {
  if (!GA_ID) return null;
  return (
    <button onClick={() => window.dispatchEvent(new Event("cookie-settings"))} className="font-mono text-[12px] text-muted underline hover:text-white">
      Cookie settings
    </button>
  );
}
