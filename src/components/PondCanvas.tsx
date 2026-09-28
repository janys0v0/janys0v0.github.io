"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { terraces } from "@/content/skills";
import { motion, setLineResolution } from "@/scene/materials";
import { ANCHORS, buildPond, TERR_X, type Tier } from "@/scene/pond";

type Cam = { fov: number; pos: [number, number, number]; look: [number, number, number] };
// Labels are plain HTML placed over the canvas; the scene re-projects their 3D anchors every frame.
type Label = { id: string; text: string; pos: [number, number, number]; kind: "terrace" | "cloud" };
const LABELS: Label[] = [
  ...TERR_X.map((x, i) => ({ id: terraces[i].id, text: terraces[i].label, pos: [x, 2.4, -0.5] as [number, number, number], kind: "terrace" as const })),
  { id: "cloud", text: "ask the frog", pos: ANCHORS.cloud, kind: "cloud" },
];
const labelEls = new Map<string, HTMLElement>();
const tmp = new THREE.Vector3();

function SceneLabels({ mobile }: { mobile: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {LABELS.filter((l) => !(mobile && l.kind === "cloud")).map((l) => (
        <span key={l.id} ref={(el) => { if (el) labelEls.set(l.id, el); else labelEls.delete(l.id); }}
          className={l.kind === "terrace"
            ? "absolute left-0 top-0 whitespace-nowrap rounded-full border border-tech/40 bg-[#060818]/80 px-3 py-1 font-mono text-[12px] sm:text-[14px] tracking-[0.16em] text-[#f1eeff] uppercase"
            : "absolute left-0 top-0 whitespace-nowrap font-mono text-[14px] tracking-[0.12em] text-tech"}
          style={{ transform: "translate(-9999px,0)" }}>
          {l.text}
        </span>
      ))}
    </div>
  );
}

const CAMERAS: Record<"desktop" | "mobile", Cam> = {
  desktop: { fov: 36, pos: [-2.5, 6.2, 34], look: [-2.5, 5.4, 0] },
  mobile: { fov: 52, pos: [-10.2, 5.8, 20.5], look: [-10.2, 3.1, -12] },
};

function useReducedMotion() {
  const [reduced, set] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (new URLSearchParams(location.search).has("motion")) return; // debug: force motion on for testing
    set(mq.matches); const on = () => set(mq.matches); mq.addEventListener("change", on); return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function World({ tier }: { tier: Tier }) {
  const { gl, size, camera } = useThree();
  const reduced = useReducedMotion();
  const look = useRef({ x: 0, y: 0 });
  const clock = useRef(0);

  // Rebuild only when the tier changes (phone ↔ desktop), not on every resize.
  const pond = useMemo(() => buildPond(tier, { w: size.width * gl.getPixelRatio(), h: size.height * gl.getPixelRatio() }), [tier]);

  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(pond.scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), pond.bloom.strength, pond.bloom.radius, pond.bloom.threshold));
    c.addPass(new OutputPass());
    return c;
  }, [pond, gl, camera]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera, c = tier.mobile ? CAMERAS.mobile : CAMERAS.desktop;
    cam.fov = c.fov; cam.near = 0.1; cam.far = 600; cam.position.set(...c.pos); cam.lookAt(...c.look); cam.layers.enable(1); cam.updateProjectionMatrix();
  }, [camera, tier]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio()); composer.setSize(size.width, size.height);
    const bloom = composer.passes[1] as UnrealBloomPass;
    if (tier.low) bloom.resolution.set(size.width / 2, size.height / 2);
    setLineResolution(size.width, size.height);
  }, [composer, gl, size, tier.low]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => { look.current = { x: (e.clientX / innerWidth) * 2 - 1, y: -((e.clientY / innerHeight) * 2 - 1) }; };
    window.addEventListener("pointermove", onMove);
    if (new URLSearchParams(location.search).has("debug")) Object.assign(window, { __pond: { gl, scene: pond.scene, camera, composer, frog: pond.frog } });
    return () => window.removeEventListener("pointermove", onMove);
  }, [gl, pond, camera, composer]);

  useFrame((_, delta) => {
    const amp = reduced ? 0 : 1;
    if (!reduced) clock.current += Math.min(delta, 0.1);
    motion.uTime.value = clock.current; motion.uAmp.value = amp;
    pond.update(clock.current, delta, look.current, amp);
    composer.render(delta);
    for (const l of LABELS) {
      const el = labelEls.get(l.id); if (!el) continue;
      tmp.set(...l.pos).project(camera);
      const x = ((tmp.x + 1) / 2) * size.width, y = ((1 - tmp.y) / 2) * size.height;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    }
  }, 1);

  return null;
}

function webglOk() {
  try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
}

/** The 3D pond behind the homepage text. Renders nothing when WebGL2 is unavailable (the text still works). */
export default function PondCanvas() {
  const [tier, setTier] = useState<Tier | null>(null);
  useEffect(() => {
    if (!webglOk()) return;
    const decide = () => {
      const mobile = innerWidth <= 600 || innerWidth / innerHeight < 0.8;
      const low = mobile || new URLSearchParams(location.search).get("q") === "low";
      const theme = document.documentElement.dataset.theme === "dusk" ? "dusk" : "night";
      setTier((t) => (t && t.mobile === mobile && t.low === low && t.theme === theme ? t : { mobile, low, theme }));
    };
    decide(); window.addEventListener("resize", decide); return () => window.removeEventListener("resize", decide);
  }, []);
  if (!tier) return null;
  return (
    <>
      <Canvas className="!absolute inset-0" dpr={[1, 1.5]} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }} camera={{ fov: 36, position: [-2.5, 6.2, 34] }} aria-hidden>
        <World key={`${tier.mobile}-${tier.low}-${tier.theme}`} tier={tier} />
      </Canvas>
      <SceneLabels mobile={tier.mobile} />
    </>
  );
}
