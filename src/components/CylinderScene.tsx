"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState, useMemo } from "react";
import { useGesture } from "@use-gesture/react";
import * as THREE from "three";

// ── Scene constants ──────────────────────────────────────────────────────────
const RADIUS           = 5;
const HEIGHT           = 9;
const WALL_SEGS        = 256;   // smoothness of cylinder wall
const DRAG_SENSITIVITY = 0.005; // rad per drag pixel
const MOMENTUM_SCALE   = 0.018;
const DAMPING          = 0.91;
const MAX_VELOCITY     = 0.14;

// ── Texture / layout constants ───────────────────────────────────────────────
const TEX_W     = 4096;
const TEX_H     = 1024;
const N_PANELS  = 5;
const PW        = TEX_W / N_PANELS;   // canvas pixels per panel
const PAD       = 72;                  // horizontal padding inside each panel
const CY        = TEX_H / 2;          // vertical canvas center

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Wraps text and returns the y after the last line. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxW: number, lineH: number
): number {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line !== "") {
      ctx.fillText(line.trimEnd(), x, y);
      line = word + " ";
      y += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trimEnd(), x, y);
  return y + lineH;
}

/** Draws a subtle glassmorphism card behind a panel section. */
function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fillStyle = "rgba(15,23,42,0.55)";
  ctx.fill();
  ctx.strokeStyle = "rgba(59,130,246,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** Draws a colour-coded bullet row. Returns next y. */
function bullet(
  ctx: CanvasRenderingContext2D,
  label: string, value: string,
  lx: number, y: number, labelColor: string
): number {
  ctx.font = `bold 28px "Courier New", monospace`;
  ctx.fillStyle = labelColor;
  ctx.fillText(label, lx, y);
  const lw = ctx.measureText(label + " ").width;
  ctx.font = `28px "Courier New", monospace`;
  ctx.fillStyle = "#d1d5db";
  ctx.fillText(value, lx + lw, y);
  return y + 50;
}

// ── Canvas drawing ────────────────────────────────────────────────────────────

function buildCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width  = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;

  // ── background ──────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, TEX_H);
  bgGrad.addColorStop(0, "#0d1117");
  bgGrad.addColorStop(1, "#0a0f1a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // subtle top/bottom fade bands
  const topFade = ctx.createLinearGradient(0, 0, 0, 120);
  topFade.addColorStop(0, "rgba(0,0,0,0.6)");
  topFade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, TEX_W, 120);
  const botFade = ctx.createLinearGradient(0, TEX_H - 120, 0, TEX_H);
  botFade.addColorStop(0, "rgba(0,0,0,0)");
  botFade.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = botFade;
  ctx.fillRect(0, TEX_H - 120, TEX_W, 120);

  // ── panel dividers ──────────────────────────────────────────────────────
  for (let i = 1; i < N_PANELS; i++) {
    const x = i * PW;
    const dg = ctx.createLinearGradient(x, 0, x, TEX_H);
    dg.addColorStop(0,   "rgba(59,130,246,0)");
    dg.addColorStop(0.15,"rgba(59,130,246,0.35)");
    dg.addColorStop(0.5, "rgba(99,160,255,0.55)");
    dg.addColorStop(0.85,"rgba(59,130,246,0.35)");
    dg.addColorStop(1,   "rgba(59,130,246,0)");
    ctx.strokeStyle = dg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TEX_H);
    ctx.stroke();
  }

  // ────────────────────────────────────────────────────────────────────────
  // PANEL 0 — Intro  (canvas x: 0 → PW)
  // ────────────────────────────────────────────────────────────────────────
  {
    const bx = 0 * PW;
    const lx = bx + PAD;
    let y = CY - 280;

    drawCard(ctx, bx + 24, y - 30, PW - 48, 590);

    // "Hi"
    ctx.font = "bold 86px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Hi", lx, y);
    // "drag me →"
    ctx.font = "italic 32px Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.fillText("drag me →", lx + 130, y - 12);
    y += 100;

    // "I'm Janys"
    ctx.font = "bold 72px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    const im = "I\u2019m ";
    ctx.fillText(im, lx, y);
    const imW = ctx.measureText(im).width;
    ctx.fillStyle = "#eab308";
    ctx.fillText("Janys", lx + imW, y);
    y += 44;
    ctx.font = "40px Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText("(Jiayang) Li", lx, y);
    y += 70;

    // schools
    ctx.font = "30px \"Courier New\", monospace";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText("MS Data Science @", lx, y);
    y += 38;
    ctx.font = "bold 30px \"Courier New\", monospace";
    ctx.fillStyle = "#f97316";
    ctx.fillText("Harvard", lx + 24, y);
    y += 46;
    ctx.font = "30px \"Courier New\", monospace";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText("Stats & CogSci @", lx, y);
    y += 38;
    ctx.font = "bold 30px \"Courier New\", monospace";
    ctx.fillStyle = "#7EC8F3";
    ctx.fillText("UCLA", lx + 24, y);
    y += 58;

    // description
    const descLines = [
      { text: "- Inspecting questions with ", hl: "Data Science", hc: "#f472b6" },
      { text: "- Building solutions with ",   hl: "AI",           hc: "#f472b6" },
      { text: "- Understanding behavior with ",hl:"Psychology",   hc: "#f472b6" },
    ];
    ctx.font = "italic 26px Arial, sans-serif";
    for (const { text, hl, hc } of descLines) {
      ctx.fillStyle = "#6b7280";
      ctx.fillText(text, lx, y);
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = hc;
      ctx.fillText(hl, lx + tw, y);
      y += 38;
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // PANEL 1 — Built with  (canvas x: PW → 2PW)
  // ────────────────────────────────────────────────────────────────────────
  {
    const bx = 1 * PW;
    const lx = bx + PAD;
    let y = CY - 265;

    drawCard(ctx, bx + 24, y - 30, PW - 48, 570);

    ctx.font = "bold 62px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Built with...", lx, y);
    y += 86;

    const stack = [
      { label: "Cursor",      color: "#f97316" },
      { label: "Tailwind CSS", color: "#38bdf8" },
      { label: "GSAP",        color: "#ef4444" },
      { label: "Next.js",     color: "#ffffff" },
      { label: "React",       color: "#61dafb" },
      { label: "TypeScript",  color: "#6285d0" },
    ];

    ctx.font = "34px \"Courier New\", monospace";
    for (const { label, color } of stack) {
      ctx.fillStyle = color;
      ctx.fillText(`● ${label}`, lx, y);
      y += 52;
    }

    y += 16;
    ctx.font = "italic 22px Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillText("© 2025 Janys Li", lx, y);
  }

  // ────────────────────────────────────────────────────────────────────────
  // PANEL 2 — Contact  (canvas x: 2PW → 3PW)
  // ────────────────────────────────────────────────────────────────────────
  {
    const bx = 2 * PW;
    const lx = bx + PAD;
    let y = CY - 220;

    drawCard(ctx, bx + 24, y - 30, PW - 48, 470);

    ctx.font = "bold 62px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("❓ Find me", lx, y);
    y += 86;

    y = bullet(ctx, "Email:", "janysli@g.harvard.edu", lx, y, "#eab308");
    y += 10;
    y = bullet(ctx, "Location:", "Boston, MA", lx, y, "#22d3ee");
    y += 10;
    y = bullet(ctx, "Otherwise:", "🏂 mountains or 🧗 walls", lx, y, "#34d399");
  }

  // ────────────────────────────────────────────────────────────────────────
  // PANEL 3 — Skills  (canvas x: 3PW → 4PW)
  // ────────────────────────────────────────────────────────────────────────
  {
    const bx = 3 * PW;
    const lx = bx + PAD;
    let y = CY - 240;

    drawCard(ctx, bx + 24, y - 30, PW - 48, 510);

    ctx.font = "bold 62px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("🔧 Skillset", lx, y);
    y += 82;

    const skills = [
      { label: "Programming:", values: "Python  R  SQL  C++  React", color: "#f472b6" },
      { label: "Data & Viz:", values: "Excel  Databricks  Tableau", color: "#c084fc" },
      { label: "ML / AI:", values: "PyTorch  TensorFlow", color: "#4ade80" },
      { label: "UX:", values: "Figma  A/B Testing", color: "#60a5fa" },
    ];

    for (const { label, values, color } of skills) {
      ctx.font = `bold 28px "Courier New", monospace`;
      ctx.fillStyle = color;
      ctx.fillText(label, lx, y);
      y += 36;
      ctx.font = `26px "Courier New", monospace`;
      ctx.fillStyle = "#9ca3af";
      ctx.fillText("  " + values, lx, y);
      y += 52;
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // PANEL 4 — Profile photos  (canvas x: 4PW → TEX_W)
  // ────────────────────────────────────────────────────────────────────────
  {
    const bx = 4 * PW;
    const lx = bx + PAD;
    const y0 = CY - 200;

    drawCard(ctx, bx + 24, y0 - 30, PW - 48, 450);

    ctx.font = "bold 52px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Photos", lx, y0);

    // placeholder boxes — images filled in async via loadImages()
    const imgY = y0 + 40;
    const imgSize = 256;
    for (let col = 0; col < 2; col++) {
      const ix = lx + col * (imgSize + 24);
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(ix, imgY, imgSize, imgSize, 10);
      ctx.fill();
      ctx.strokeStyle = "#1e3a5f";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // captions
    ctx.font = "22px Arial, sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    ctx.fillText("My grad photo", lx + imgSize / 2,            imgY + imgSize + 28);
    ctx.fillText("a cute dog I drew", lx + imgSize + 24 + imgSize / 2, imgY + imgSize + 28);
    ctx.textAlign = "left";
  }

  return canvas;
}

/** Load local images and blit them into the already-created canvas, then mark texture dirty. */
function loadImages(
  canvas: HTMLCanvasElement,
  texture: THREE.CanvasTexture
) {
  const ctx = canvas.getContext("2d")!;
  const bx  = 4 * PW;
  const PAD2 = PAD;
  const lx   = bx + PAD2;
  const imgY = CY - 200 + 40;
  const imgSize = 256;

  const srcs = ["/grad_photo.PNG", "/dogpc.jpg"];
  srcs.forEach((src, col) => {
    const img = new Image();
    img.onload = () => {
      const ix = lx + col * (imgSize + 24);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(ix, imgY, imgSize, imgSize, 10);
      ctx.clip();
      ctx.drawImage(img, ix, imgY, imgSize, imgSize);
      ctx.restore();
      // Re-draw border on top of image
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(ix, imgY, imgSize, imgSize, 10);
      ctx.stroke();
      texture.needsUpdate = true;
    };
    img.src = src;
  });
}

// ── Custom cylinder geometry: UV u reversed so text is readable from inside ──
function makeInnerCylinderGeo() {
  const geo = new THREE.CylinderGeometry(RADIUS, RADIUS, HEIGHT, WALL_SEGS, 1, true);
  const uv  = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
  uv.needsUpdate = true;
  return geo;
}

// ── Inner R3F scene ───────────────────────────────────────────────────────────
interface SharedRefs {
  rotation: React.MutableRefObject<number>;
  velocity: React.MutableRefObject<number>;
  dragging: React.MutableRefObject<boolean>;
}

function CylinderWorld({ refs }: { refs: SharedRefs }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef   = useRef<THREE.MeshBasicMaterial>(null);
  const innerGeo = useMemo(makeInnerCylinderGeo, []);

  // Build canvas texture once on mount
  useEffect(() => {
    const canvas  = buildCanvas();
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS       = THREE.RepeatWrapping;
    texture.colorSpace  = THREE.SRGBColorSpace;
    // offset.x centres panel 0 (canvas u=0.1) at the front of the cylinder (u=0.5)
    texture.offset.set(-0.4, 0);

    if (matRef.current) {
      matRef.current.map           = texture;
      matRef.current.needsUpdate   = true;
    }

    loadImages(canvas, texture);
    return () => texture.dispose();
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    if (!refs.dragging.current) {
      refs.velocity.current *= DAMPING;
      refs.rotation.current += refs.velocity.current;
    }
    groupRef.current.rotation.y = refs.rotation.current;
  });

  return (
    <group ref={groupRef}>
      {/* ── Single smooth curved wall with content baked into texture ──── */}
      <mesh geometry={innerGeo}>
        <meshBasicMaterial ref={matRef} side={THREE.BackSide} toneMapped={false} />
      </mesh>

      {/* ── Top / bottom glow rings ─────────────────────────────────────── */}
      {([-HEIGHT / 2, HEIGHT / 2] as const).map((y, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, y, 0]}>
          <torusGeometry args={[RADIUS, 0.04, 8, 128]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* ── Floor disc (subtle depth cue) ───────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -HEIGHT / 2, 0]}>
        <circleGeometry args={[RADIUS, 128]} />
        <meshBasicMaterial color="#060a10" />
      </mesh>
    </group>
  );
}

// ── Canvas wrapper with gesture handling ──────────────────────────────────────
export default function CylinderScene() {
  const wrapperRef       = useRef<HTMLDivElement>(null);
  const rotationRef      = useRef(0);
  const velocityRef      = useRef(0);
  const draggingRef      = useRef(false);
  const startRotationRef = useRef(0);

  const refs: SharedRefs = {
    rotation: rotationRef,
    velocity: velocityRef,
    dragging: draggingRef,
  };

  useGesture(
    {
      onDragStart: () => {
        draggingRef.current      = true;
        velocityRef.current      = 0;
        startRotationRef.current = rotationRef.current;
      },
      onDrag: ({ movement: [mx] }) => {
        rotationRef.current = startRotationRef.current - mx * DRAG_SENSITIVITY;
      },
      onDragEnd: ({ velocity: [vx], direction: [dirX] }) => {
        draggingRef.current = false;
        const impulse = -vx * dirX * MOMENTUM_SCALE;
        velocityRef.current = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, impulse));
      },
    },
    { target: wrapperRef, filterTaps: true }
  );

  return (
    <div
      ref={wrapperRef}
      style={{ position: "absolute", inset: 0, touchAction: "none" }}
      className="cursor-grab active:cursor-grabbing"
    >
      <Canvas
        camera={{ position: [0, 0, 0.01], fov: 75, near: 0.01, far: 40 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
      >
        <CylinderWorld refs={refs} />
      </Canvas>
    </div>
  );
}
