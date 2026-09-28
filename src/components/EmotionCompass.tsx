"use client";

// A playable version of the Emotion Compass: tap where a feeling sits on the circle.
// Left → right = pleasantness; bottom → top = energy (the classic two-axis model of emotion).
import { useRef, useState } from "react";

const EMOJI = [
  { x: -0.62, y: 0.62, e: "😫", label: "distressed" }, { x: 0.62, y: 0.62, e: "😁", label: "excited" },
  { x: -0.62, y: -0.62, e: "😔", label: "sad" }, { x: 0.62, y: -0.62, e: "🙂", label: "calm" }, { x: 0, y: 0, e: "😐", label: "neutral" },
];

function describe(x: number, y: number) {
  const r = Math.hypot(x, y);
  if (r < 0.2) return "neutral";
  const v = x > 0.15 ? "pleasant" : x < -0.15 ? "unpleasant" : "mixed";
  const a = y > 0.15 ? "high-energy" : y < -0.15 ? "low-energy" : "steady";
  const intensity = r > 0.7 ? "strongly " : r > 0.4 ? "" : "slightly ";
  return `${intensity}${v}, ${a}`;
}

export function EmotionCompass() {
  const ref = useRef<HTMLDivElement>(null);
  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);
  const [log, setLog] = useState<{ x: number; y: number }[]>([]);
  const place = (cx: number, cy: number) => {
    const r = ref.current!.getBoundingClientRect();
    let x = ((cx - r.left) / r.width) * 2 - 1, y = -(((cy - r.top) / r.height) * 2 - 1);
    const d = Math.hypot(x, y); if (d > 1) { x /= d; y /= d; }
    setPt({ x, y }); setLog((l) => [...l.slice(-5), { x, y }]);
  };
  const key = (e: React.KeyboardEvent) => {
    const p = pt ?? { x: 0, y: 0 }, s = 0.1;
    const m: Record<string, [number, number]> = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] };
    if (!m[e.key]) return; e.preventDefault();
    let x = p.x + m[e.key][0], y = p.y + m[e.key][1]; const d = Math.hypot(x, y); if (d > 1) { x /= d; y /= d; }
    setPt({ x, y });
  };
  // glow colour follows the point: pleasant → green, unpleasant → pink, energy → brightness
  const hue = pt ? 330 + ((pt.x + 1) / 2) * 150 : 200, light = pt ? 55 + pt.y * 12 : 55;
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[320px_1fr]">
      <div ref={ref} role="slider" tabIndex={0} aria-label="Emotion compass: use the arrow keys or tap to place a feeling"
        aria-valuetext={pt ? describe(pt.x, pt.y) : "no feeling placed yet"}
        onPointerDown={(e) => place(e.clientX, e.clientY)} onKeyDown={key}
        className="relative mx-auto aspect-square w-[280px] cursor-crosshair touch-none select-none rounded-full border-2 sm:w-[320px]"
        style={{ borderColor: `hsl(${hue} 90% ${light}%)`, boxShadow: `0 0 36px hsl(${hue} 90% ${light}% / 0.45), inset 0 0 40px hsl(${hue} 90% ${light}% / 0.15)`, background: "radial-gradient(circle,#0b1233,#04050d 70%)" }}>
        <div className="absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2 bg-white/15" />
        <div className="absolute top-1/2 left-3 right-3 h-px -translate-y-1/2 bg-white/15" />
        <span className="absolute left-1/2 top-1 -translate-x-1/2 font-mono text-[10px] text-muted">energy ↑</span>
        <span className="absolute right-2 top-1/2 -translate-y-[140%] font-mono text-[10px] text-muted">pleasant →</span>
        {EMOJI.map((m) => (
          <span key={m.label} aria-hidden className="absolute -translate-x-1/2 -translate-y-1/2 text-[26px] opacity-80"
            style={{ left: `${50 + m.x * 50}%`, top: `${50 - m.y * 50}%` }}>{m.e}</span>
        ))}
        {log.slice(0, -1).map((p, i) => (
          <i key={i} className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" style={{ left: `${50 + p.x * 50}%`, top: `${50 - p.y * 50}%` }} />
        ))}
        {pt && <i className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" style={{ left: `${50 + pt.x * 50}%`, top: `${50 - pt.y * 50}%`, background: `hsl(${hue} 90% ${light}%)`, boxShadow: `0 0 16px hsl(${hue} 90% ${light}%)` }} />}
      </div>
      <div aria-live="polite">
        <p className="font-mono text-[12px] tracking-[0.2em] text-tech">YOUR READING</p>
        <p className="mt-1 text-[22px] font-bold">{pt ? describe(pt.x, pt.y) : "Tap the circle"}</p>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          In the study, participants listened to music and placed how it made them feel, over and over. A trail of
          points like yours, collected moment by moment, shows how flexibly emotions shift.
        </p>
        {log.length > 1 && <p className="mt-2 font-mono text-[13px] text-muted">{log.length} readings · last move {Math.hypot(log[log.length - 1].x - log[log.length - 2].x, log[log.length - 1].y - log[log.length - 2].y).toFixed(2)} apart</p>}
      </div>
    </div>
  );
}
