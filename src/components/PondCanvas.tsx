"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { terraces } from "@/content/skills";
import { Journey } from "@/scene/journey";
import { motion, setLineResolution } from "@/scene/materials";
import { ANCHORS, buildPond, TERR_X, type Tier } from "@/scene/pond";
import { STOPS, type P3 } from "@/scene/stops";

type Cam = { fov: number; pos: P3; look: P3 };
const CAMERAS: Record<"desktop" | "mobile", Cam> = {
  desktop: { fov: 36, pos: [-2.5, 6.2, 34], look: [-2.5, 5.4, 0] },
  mobile: { fov: 52, pos: [-10.2, 5.8, 20.5], look: [-10.2, 3.1, -12] },
};

// ── labels: plain HTML over the canvas; the scene re-projects their 3D anchors every frame ──
type Label =
  | { id: string; kind: "terrace" | "cloud"; text: string; pos: P3 }
  | { id: string; kind: "chips"; words: string[]; pos: P3; stop: number };
const LABELS: Label[] = [
  ...TERR_X.map((x, i): Label => ({ id: terraces[i].id, kind: "terrace", text: terraces[i].label, pos: [x, -0.3, 1.9] })),
  // keyword chips pop up above each terrace once the frog has landed on it (stop index = terrace index + 1)
  ...TERR_X.map((x, i): Label => ({ id: `${terraces[i].id}-chips`, kind: "chips", words: terraces[i].keywords, pos: [x, 7.4, -0.5], stop: i + 1 })),
  { id: "cloud", kind: "cloud", text: "ask the frog", pos: ANCHORS.cloud },
];
const CUES = ["SCROLL TO HOP →", "KEEP HOPPING →", "KEEP HOPPING →", "TO THE PIER →", "SCROLL TO DIVE ↓"];
const labelEls = new Map<string, HTMLElement>();
const tmp = new THREE.Vector3();

function SceneLabels({ mobile }: { mobile: boolean }) {
  const ref = (id: string) => (el: HTMLElement | null) => { if (el) labelEls.set(id, el); else labelEls.delete(id); };
  const hidden = { transform: "translate(-9999px,0)" };
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {LABELS.filter((l) => !(mobile && l.kind === "cloud")).map((l) =>
        l.kind === "chips" ? (
          <div key={l.id} ref={ref(l.id)} data-on="false" style={hidden}
            className="group absolute left-0 top-0 flex w-[250px] sm:w-[300px] flex-wrap justify-center gap-1.5">
            {l.words.map((w, j) => (
              <span key={w} style={{ transitionDelay: `${j * 45}ms` }}
                className="scale-75 opacity-0 transition duration-300 ease-out group-data-[on=true]:scale-100 group-data-[on=true]:opacity-100 rounded-full border border-terrace/70 bg-[#0a0820]/80 px-2.5 py-1 font-mono text-[12px] sm:text-[13px] text-[#e4dcff] shadow-[0_0_10px_rgba(139,92,255,0.45)]">
                {w}
              </span>
            ))}
          </div>
        ) : (
          <span key={l.id} ref={ref(l.id)} style={hidden}
            className={l.kind === "terrace"
              ? "absolute left-0 top-0 whitespace-nowrap rounded-full border border-tech/40 bg-[#060818]/80 px-3 py-1 font-mono text-[12px] sm:text-[14px] tracking-[0.16em] text-[#f1eeff] uppercase"
              : "absolute left-0 top-0 whitespace-nowrap font-mono text-[14px] tracking-[0.12em] text-tech"}>
            {l.text}
          </span>
        ),
      )}
    </div>
  );
}

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
  const camX = useRef<number | null>(null);
  const cue = useRef(-1);
  const cam = tier.mobile ? CAMERAS.mobile : CAMERAS.desktop;

  // Rebuild only when the tier changes (phone ↔ desktop), not on every resize.
  const pond = useMemo(() => buildPond(tier, { w: size.width * gl.getPixelRatio(), h: size.height * gl.getPixelRatio() }), [tier]);
  const journey = useMemo(() => new Journey(pond.frog), [pond]);

  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(pond.scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), pond.bloom.strength, pond.bloom.radius, pond.bloom.threshold));
    c.addPass(new OutputPass());
    return c;
  }, [pond, gl, camera]);

  useEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.fov = cam.fov; c.near = 0.1; c.far = 600; c.layers.enable(1); c.updateProjectionMatrix();
  }, [camera, cam]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio()); composer.setSize(size.width, size.height);
    const bloom = composer.passes[1] as UnrealBloomPass;
    if (tier.low) bloom.resolution.set(size.width / 2, size.height / 2);
    setLineResolution(size.width, size.height);
  }, [composer, gl, size, tier.low]);

  // Keep the thought cloud just right of the name, whatever the window's shape.
  useEffect(() => {
    if (tier.mobile) return;
    const name = document.querySelector("[data-hero-name]");
    if (!name) return;
    const c = camera as THREE.PerspectiveCamera, depth = cam.pos[2] - ANCHORS.cloud[2];
    const halfW = depth * Math.tan(THREE.MathUtils.degToRad(c.fov / 2)) * (size.width / size.height);
    const ndc = (name.getBoundingClientRect().right / size.width) * 2 - 1;
    pond.cloudBase.x = Math.max(ANCHORS.cloud[0], cam.pos[0] + ndc * halfW + 3.4); // 3.4 ≈ half the cloud's width
  }, [pond, camera, cam, size, tier.mobile]);

  // Scroll → which stop the frog should be at. Native scrolling is untouched.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true }); // iOS address-bar resizes must not move the frog
    const read = () => journey.setScroll(window.scrollY / window.innerHeight);
    const start = new URLSearchParams(location.search).get("scroll"); // debug: open at a scroll position (viewport heights)
    if (start) window.scrollTo(0, Number(start) * window.innerHeight);
    const st = ScrollTrigger.create({ start: 0, end: "max", onUpdate: read });
    read();
    return () => st.kill();
  }, [journey]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => { look.current = { x: (e.clientX / innerWidth) * 2 - 1, y: -((e.clientY / innerHeight) * 2 - 1) }; };
    window.addEventListener("pointermove", onMove);
    if (new URLSearchParams(location.search).has("debug")) Object.assign(window, { __pond: { gl, scene: pond.scene, camera, composer, frog: pond.frog, journey } });
    return () => window.removeEventListener("pointermove", onMove);
  }, [gl, pond, camera, composer, journey]);

  useFrame((_, delta) => {
    const amp = reduced ? 0 : 1;
    if (!reduced) clock.current += Math.min(delta, 0.1);
    motion.uTime.value = clock.current; motion.uAmp.value = amp;

    journey.update(delta, amp);
    const p = journey.pos;
    const { halo, pool, light } = pond.frogFx;
    halo.position.set(p.x, p.y + 1.9, p.z - 1.1); pool.position.set(p.x, p.y + 0.03, p.z + 0.1); light.position.set(p.x, p.y + 1.5, p.z + 2.2);
    pond.update(clock.current, delta, look.current, amp);

    // follow camera: pans with the frog along x, eased so hops feel weighty rather than jerky
    const want = p.x + (cam.pos[0] - STOPS[0].pos[0]);
    camX.current = camX.current === null || amp === 0 ? want : camX.current + (want - camX.current) * (1 - Math.exp(-delta * 2.6));
    const dx = camX.current - cam.pos[0];
    camera.position.set(cam.pos[0] + dx, cam.pos[1], cam.pos[2]);
    camera.lookAt(cam.look[0] + dx, cam.look[1], cam.look[2]);

    composer.render(delta);

    for (const l of LABELS) {
      const el = labelEls.get(l.id); if (!el) continue;
      if (l.kind === "cloud") tmp.copy(pond.cloud.position); else tmp.set(...l.pos);
      tmp.project(camera);
      const x = ((tmp.x + 1) / 2) * size.width, y = ((1 - tmp.y) / 2) * size.height;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      if (l.kind === "chips") el.dataset.on = String(journey.seen >= l.stop);
    }
    // the fixed scroll prompt changes with the stop the frog is on
    if (cue.current !== journey.reached) {
      cue.current = journey.reached;
      const el = document.getElementById("scroll-cue");
      if (el) el.textContent = CUES[Math.min(journey.reached, CUES.length - 1)];
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
