"use client";

// Night (default) ↔ dusk. Stored per visitor; the 3D pond rebuilds its sky when the theme changes.
import { useEffect, useState } from "react";

type Theme = "night" | "dusk";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("night");
  useEffect(() => {
    let saved: Theme = "night";
    try { if (localStorage.getItem("theme") === "dusk") saved = "dusk"; } catch {}
    setTheme(saved);
  }, []);
  const flip = () => {
    const next: Theme = theme === "night" ? "dusk" : "night";
    setTheme(next);
    if (next === "dusk") document.documentElement.dataset.theme = "dusk"; else delete document.documentElement.dataset.theme;
    try { localStorage.setItem("theme", next); } catch {}
    window.dispatchEvent(new Event("themechange"));
  };
  return (
    <button onClick={flip} aria-label={`Switch to ${theme === "night" ? "dusk" : "night"} theme`} title={theme === "night" ? "Dusk" : "Night"}
      className="rounded-full border border-[#39406e] px-2.5 py-1.5 text-[14px] leading-none text-muted hover:text-white">
      {theme === "night" ? "☾" : "☀"}
    </button>
  );
}

/** Runs before paint so the saved theme is applied without a flash. */
export const themeScript = `try{var q=new URLSearchParams(location.search).get("theme");if(q)localStorage.setItem("theme",q);if(localStorage.getItem("theme")==="dusk")document.documentElement.dataset.theme="dusk"}catch(e){}`;
