"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { Journey } from "@/scene/journey";
import { motion, setLineResolution } from "@/scene/materials";
import { ANCHORS as SCENE_ANCHORS, buildPond, type Tier } from "@/scene/pond";
import { CARD_X, SEABED_Y, STOPS, SURF, type P3 } from "@/scene/stops";
import { anchorEls, ANCHORS, DepthGauge, SceneOverlay } from "./SceneOverlay";

type Cam = { fov: number; pos: P3; look: P3 };
const LAND: Record<"desktop" | "mobile", Cam> = {
  desktop: { fov: 36, pos: [-2.5, 6.2, 34], look: [-2.5, 5.4, 0] },
  mobile: { fov: 52, pos: [-10.2, 5.8, 20.5], look: [-10.2, 3.1, -12] },
};
const CUE: Record<string, string> = { hub: "SCROLL TO HOP →", ai: "KEEP HOPPING →", product: "KEEP HOPPING →", data: "TO THE PIER →", ledge: "SCROLL TO DIVE ↓", acme: "TO THE SEABED ↓", chat: "" };
const cueFor = (i: number) => CUE[STOPS[i].id] ?? "SCROLL TO SWIM ↓";

function useReducedMotion() {
  const [reduced, set] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (new URLSearchParams(location.search).has("motion")) return; // debug: force motion on for testing
    set(mq.matches); const on = () => set(mq.matches); mq.addEventListener("change", on); return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

const tmp = new THREE.Vector3();
const want = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
const wpos = new THREE.Vector3(), wlook = new THREE.Vector3();

/** Where the camera should be for a frog position: side view on land, closer and level underwater, lower on the seabed. */
function cameraTarget(p: THREE.Vector3, mobile: boolean) {
  const land = mobile ? LAND.mobile : LAND.desktop, dx = p.x - STOPS[0].pos[0];
  want.pos.set(land.pos[0] + dx, land.pos[1], land.pos[2]); want.look.set(land.look[0] + dx, land.look[1], land.look[2]);
  const w = THREE.MathUtils.smoothstep(SURF + 1 - p.y, 0, 4.5); // 0 on land → 1 underwater
  if (w > 0) {
    const onFloor = THREE.MathUtils.smoothstep(SEABED_Y + 7 - p.y, 0, 6); // 0 in the column → 1 on the seabed
    const cx = THREE.MathUtils.lerp(CARD_X, p.x + (mobile ? 0 : 5), onFloor);
    // on phones the chat sheet covers the lower half, so the seabed shot looks further down (frog sits higher on screen)
    const phoneSeabed = mobile ? onFloor * -5 : 0;
    wpos.set(cx, p.y + (mobile ? 1.6 : 1.2) + onFloor * 3 + phoneSeabed, mobile ? 31 : 25);
    wlook.set(cx, p.y + (mobile ? 0.6 : 0.8) + onFloor * 1.8 + phoneSeabed * 1.3, 0);
    want.pos.lerp(wpos, w); want.look.lerp(wlook, w);
  }
  return want;
}

function World({ tier, onStop }: { tier: Tier; onStop: (i: number, underwater: boolean) => void }) {
  const { gl, size, camera } = useThree();
  const reduced = useReducedMotion();
  const look = useRef({ x: 0, y: 0 });
  const clock = useRef(0);
  const cam = useRef<{ pos: THREE.Vector3; look: THREE.Vector3 } | null>(null);
  const lastStop = useRef(-1);
  const scrollVH = useRef(0);
  const banner = useRef<{ x: number } | null>(null);
  const land = tier.mobile ? LAND.mobile : LAND.desktop;

  const pond = useMemo(() => buildPond(tier, { w: size.width * gl.getPixelRatio(), h: size.height * gl.getPixelRatio() }), [tier]);
  const journey = useMemo(() => { const j = new Journey(pond.frog); j.onSplash = (x) => pond.underwater.splash(x); return j; }, [pond]);
  useEffect(() => { pond.cloud.visible = !tier.mobile; }, [pond, tier.mobile]); // phones use the floating button instead
  useEffect(() => {
    if (!new URLSearchParams(location.search).has("banner")) return;
    document.documentElement.dataset.banner = "true";
    // put the frog (x = -11.8) about two-thirds of the way across the frame
    const c = camera as THREE.PerspectiveCamera, halfW = 19 * Math.tan(THREE.MathUtils.degToRad(c.fov / 2)) * c.aspect;
    banner.current = { x: -11.8 - 0.64 * halfW };
    pond.cloud.visible = false;
  }, [camera, pond, size]);

  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(pond.scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), pond.bloom.strength, pond.bloom.radius, pond.bloom.threshold));
    c.addPass(new OutputPass());
    return c;
  }, [pond, gl, camera]);

  useEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.fov = land.fov; c.near = 0.1; c.far = 600; c.layers.enable(1); c.updateProjectionMatrix();
  }, [camera, land]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio()); composer.setSize(size.width, size.height);
    if (tier.low) (composer.passes[1] as UnrealBloomPass).resolution.set(size.width / 2, size.height / 2);
    setLineResolution(size.width, size.height);
  }, [composer, gl, size, tier.low]);

  // keep the thought cloud just right of the name, whatever the window's shape
  useEffect(() => {
    if (tier.mobile) return;
    const name = document.querySelector("[data-hero-name]");
    if (!name) return;
    const c = camera as THREE.PerspectiveCamera, depth = land.pos[2] - SCENE_ANCHORS.cloud[2];
    const halfW = depth * Math.tan(THREE.MathUtils.degToRad(c.fov / 2)) * (size.width / size.height);
    const ndc = (name.getBoundingClientRect().right / size.width) * 2 - 1;
    pond.cloudBase.x = Math.max(SCENE_ANCHORS.cloud[0], land.pos[0] + ndc * halfW + 3.4);
    const a = ANCHORS.find((x) => x.id === "cloud"); if (a) a.pos = [pond.cloudBase.x, SCENE_ANCHORS.cloud[1], SCENE_ANCHORS.cloud[2]];
  }, [pond, camera, land, size, tier.mobile]);

  // scroll → which stop the frog should be at (native scrolling is untouched); ?shot=N snaps for visual tests
  useEffect(() => {
    const shot = new URLSearchParams(location.search).get("shot");
    if (shot !== null) {
      document.documentElement.dataset.shot = "true";
      document.querySelectorAll<HTMLElement>("[data-hero]").forEach((h) => (h.style.display = "none"));
      journey.snapTo(Number(shot)); return;
    }
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true }); // iOS address-bar resizes must not move the frog
    // inertial smooth scrolling for wheels and trackpads (touch keeps the phone's native momentum)
    const lenis = reduced ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    const raf = (time: number) => lenis?.raf(time * 1000);
    if (lenis) { lenis.on("scroll", ScrollTrigger.update); gsap.ticker.add(raf); gsap.ticker.lagSmoothing(0); (window as unknown as { __lenis?: Lenis }).__lenis = lenis; }
    const read = () => { scrollVH.current = window.scrollY / window.innerHeight; journey.setScroll(scrollVH.current); };
    const st = ScrollTrigger.create({ start: 0, end: "max", onUpdate: read });
    // /#chat (the nav's "let's chat") swims straight to the seabed
    const toHash = () => { const i = STOPS.findIndex((s) => `#${s.id}` === location.hash); if (i > 0) scrollToVH(STOPS[i].at); };
    toHash(); window.addEventListener("hashchange", toHash);
    read();
    return () => { st.kill(); window.removeEventListener("hashchange", toHash); if (lenis) { gsap.ticker.remove(raf); lenis.destroy(); } };
  }, [journey, reduced]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => { look.current = { x: (e.clientX / innerWidth) * 2 - 1, y: -((e.clientY / innerHeight) * 2 - 1) }; };
    const onSent = () => pond.underwater.launchBottle();
    window.addEventListener("pointermove", onMove); window.addEventListener("note-sent", onSent);
    if (new URLSearchParams(location.search).has("debug")) Object.assign(window, { __pond: { gl, scene: pond.scene, camera, composer, frog: pond.frog, journey } });
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("note-sent", onSent); };
  }, [gl, pond, camera, composer, journey]);

  useFrame((_, delta) => {
    const amp = reduced ? 0 : 1;
    if (!reduced) clock.current += Math.min(delta, 0.1);
    motion.uTime.value = clock.current; motion.uAmp.value = amp;

    journey.update(delta, amp);
    const p = journey.pos, arrived = !journey.hopping;
    const { halo, pool, light } = pond.frogFx;
    halo.position.set(p.x, p.y + 1.9, p.z - 1.1); pool.position.set(p.x, p.y + 0.03, p.z + 0.1); light.position.set(p.x, p.y + 1.5, p.z + 2.2);
    pool.visible = !journey.underwater;

    // follow camera: eased toward the frame for the frog's current zone
    const t = cameraTarget(p, tier.mobile);
    // drift: between stops the camera already leans toward the next one, so every bit of scrolling moves the scene
    if (amp > 0 && !journey.hopping) {
      const i = journey.reached, cur = STOPS[i], next = STOPS[Math.min(i + 1, STOPS.length - 1)];
      const span = next.at - cur.at, f = span > 0 ? THREE.MathUtils.clamp((scrollVH.current + 0.2 - cur.at) / span, 0, 1) : 0;
      const dx = THREE.MathUtils.clamp(next.pos[0] - cur.pos[0], -6, 6) * 0.22 * f, dy = THREE.MathUtils.clamp(next.pos[1] - cur.pos[1], -8, 8) * 0.22 * f;
      t.pos.x += dx; t.look.x += dx; t.pos.y += dy; t.look.y += dy;
    }
    if (!cam.current || amp === 0) cam.current = { pos: t.pos.clone(), look: t.look.clone() };
    else { const k = 1 - Math.exp(-Math.min(delta, 0.05) * 3.2); cam.current.pos.lerp(t.pos, k); cam.current.look.lerp(t.look, k); }
    camera.position.copy(cam.current.pos); camera.lookAt(cam.current.look);
    if (banner.current) { // ?banner: LinkedIn background framing, frog and sign in the right third
      const b = banner.current; camera.position.set(b.x, 4.3, 19); camera.lookAt(b.x, 2.6, 0);
    }

    const activeExp = arrived ? STOPS[journey.reached].exp ?? null : null;
    pond.update(clock.current, delta, look.current, amp, activeExp, camera.position.y);
    composer.render(delta);

    // anchored HTML
    for (const a of ANCHORS) {
      const el = anchorEls.get(a.id); if (!el) continue;
      const w = a.show.when;
      let on = w === "always" ? true : w === "seen" ? journey.seen >= a.show.stop : w === "current" ? journey.reached === a.show.stop : arrived && journey.reached === a.show.stop;
      if (a.zone === "land" && camera.position.y < SURF + 2) on = false; // land labels belong above the water
      el.dataset.on = String(on);
      if (tier.mobile && a.pinOnMobile) continue;
      tmp.set(...a.pos).project(camera);
      let x = ((tmp.x + 1) / 2) * size.width; const y = ((1 - tmp.y) / 2) * size.height;
      const half = el.offsetWidth / 2; // keep bubbles and chips fully on screen (matters on phones)
      if (on && half > 0 && half * 2 < size.width - 16 && x > -half && x < size.width + half) x = THREE.MathUtils.clamp(x, half + 8, size.width - half - 8);
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    }
    const gauge = anchorEls.get("gauge"); if (gauge) gauge.dataset.on = String(STOPS[journey.reached].kind === "water" || (journey.underwater && STOPS[journey.reached].kind !== "seabed"));
    for (const s of STOPS) { const g = anchorEls.get(`g-${s.id}`); if (g) g.dataset.on = String(arrived && STOPS[journey.reached].id === s.id); }

    if (lastStop.current !== journey.reached) {
      lastStop.current = journey.reached;
      const cue = document.getElementById("scroll-cue");
      if (cue) { const text = cueFor(journey.reached); cue.textContent = text; cue.dataset.on = String(text !== ""); }
      onStop(journey.reached, journey.underwater);
    }
  }, 1);

  return null;
}

/** Scroll to a position in viewport heights, through Lenis when it is running. */
export function scrollToVH(vh: number) {
  const y = vh * window.innerHeight, l = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (l) l.scrollTo(y, { duration: 1.6 }); else window.scrollTo({ top: y, behavior: "smooth" });
}

function webglOk() {
  try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
}

/** The 3D pond behind the homepage. Renders nothing when WebGL2 is unavailable (the page's HTML still works). */
export default function PondCanvas() {
  const [tier, setTier] = useState<Tier | null>(null);
  useEffect(() => {
    if (!webglOk()) { document.documentElement.dataset.no3d = "true"; return; }
    const decide = () => {
      const mobile = innerWidth <= 600 || innerWidth / innerHeight < 0.8;
      const low = mobile || new URLSearchParams(location.search).get("q") === "low";
      const theme = document.documentElement.dataset.theme === "dusk" ? "dusk" : "night";
      setTier((t) => (t && t.mobile === mobile && t.low === low && t.theme === theme ? t : { mobile, low, theme }));
    };
    decide();
    window.addEventListener("resize", decide); window.addEventListener("themechange", decide);
    return () => { window.removeEventListener("resize", decide); window.removeEventListener("themechange", decide); };
  }, []);
  if (!tier) return null;
  const onStop = (i: number, underwater: boolean) => {
    document.documentElement.dataset.stop = STOPS[i].id;
    document.documentElement.dataset.zone = STOPS[i].kind === "seabed" ? "seabed" : underwater ? "water" : "land";
  };
  return (
    <>
      <Canvas className="!absolute inset-0" dpr={typeof location !== "undefined" && location.search.includes("banner") ? 2 : [1, 1.5]} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }} camera={{ fov: 36, position: [-2.5, 6.2, 34] }} aria-hidden>
        <World key={`${tier.mobile}-${tier.low}-${tier.theme}`} tier={tier} onStop={onStop} />
      </Canvas>
      <SceneOverlay mobile={tier.mobile} />
      <DepthGauge mobile={tier.mobile} />
    </>
  );
}
