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
import { buildPond, type Pond, type Tier } from "@/scene/pond";
import { CARD_X, SEABED_Y, STOPS, SURF, type P3 } from "@/scene/stops";
import { anchorEls, ANCHORS, DepthGauge, SceneOverlay } from "./SceneOverlay";

type Cam = { fov: number; pos: P3; look: P3 };
const LAND: Record<"desktop" | "mobile", Cam> = {
  desktop: { fov: 36, pos: [-2.5, 6.2, 34], look: [-2.5, 5.4, 0] },
  mobile: { fov: 52, pos: [-10.2, 5.8, 20.5], look: [-10.2, 3.1, -12] },
};
const CUE: Record<string, string> = { hub: "SCROLL TO HOP →", ai: "KEEP HOPPING →", product: "KEEP HOPPING →", data: "TO THE PIER →", ledge: "SCROLL TO DIVE ↓", acme: "TO THE SEABED ↓", chat: "" };
const cueFor = (i: number) => CUE[STOPS[i].id] ?? "SCROLL TO SWIM ↓";

/** Motion is always on (the OS "reduce motion" setting is ignored on purpose); ?still freezes it for testing. */
function useReducedMotion() {
  const [reduced, set] = useState(false);
  useEffect(() => { set(new URLSearchParams(location.search).has("still")); }, []);
  return reduced;
}

const tmp = new THREE.Vector3();

// ── click-to-explore: what is under the pointer? ──────────────────────────────
/** Page UI that keeps its own clicks; everything else is "the pond". */
const UI = "a,button,input,textarea,select,label,form,article,nav,[role=dialog],[data-ui],[data-hero] h1,[data-hero] p";
type Hit = { kind: "frog" } | { kind: "terrace"; stop: number } | { kind: "ground"; p: THREE.Vector3 } | { kind: "water"; p: THREE.Vector3 };
const ray = new THREE.Raycaster(); ray.layers.enableAll();
const ndc = new THREE.Vector2(), onPlane = new THREE.Vector3(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const PIER = { x0: 10.6, x1: 17.6, y: 0.64 }; // planks, top surface
function hitTest(cx: number, cy: number, camera: THREE.Camera, pond: Pond): Hit | null {
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  if (ray.intersectObject(pond.frog.root, true).length) return { kind: "frog" };
  if (camera.position.y < SURF + 2) return null; // underwater: only the frog is clickable
  const ti = pond.terraces.findIndex((g) => ray.intersectObject(g, true).length > 0);
  if (ti >= 0) return { kind: "terrace", stop: ti + 1 };
  const at = (y: number) => { plane.constant = -y; return ray.ray.intersectPlane(plane, onPlane) ? onPlane.clone() : null; };
  const pier = at(PIER.y);
  if (pier && pier.x > PIER.x0 && pier.x < PIER.x1 && pier.z > -1.6 && pier.z < 0.8) return { kind: "ground", p: pier.set(pier.x, PIER.y, -0.3) };
  const g = at(0);
  if (g && g.x > -40 && g.x < 9.3 && g.z > -3.3 && g.z < 2.5) return { kind: "ground", p: g.set(g.x, 0, THREE.MathUtils.clamp(g.z, -1.8, 1.6)) };
  const w = at(SURF);
  if (w && Math.abs(w.x) < 90 && w.z < 30 && w.z > -40) return { kind: "water", p: w };
  return null;
}
/** A short-lived DOM effect at the click point: a ring for the ground, a word for the frog and the water. */
function ping(x: number, y: number, text?: string) {
  const el = document.createElement("div");
  el.className = text ? "pond-word" : "pond-ring"; if (text) el.textContent = text;
  el.style.left = `${x}px`; el.style.top = `${y}px`; el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el); el.addEventListener("animationend", () => el.remove());
}
const RIBBITS = ["ribbit!", "hi there!", "boing!", "ribbit ribbit", "✨", "hop hop!"];
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

  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(pond.scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), pond.bloom.strength, pond.bloom.radius, pond.bloom.threshold));
    const crisp = new RenderPass(pond.overlay, camera); crisp.clear = false; c.addPass(crisp); // no-glow layer on top
    c.addPass(new OutputPass());
    return c;
  }, [pond, gl, camera]);

  useEffect(() => {
    if (!new URLSearchParams(location.search).has("banner")) return;
    document.documentElement.dataset.banner = "true";
    // put the frog (x = -11.8) about two-thirds of the way across the frame
    banner.current = { x: -14.1 }; // between the sign (-16.8) and the frog (-11.8)
    // extra lotus on the background water, left half of the banner (u = fraction across the image)
    const cx = -14.1, place = (u: number, z: number) => cx + (u / 1.48 - 0.5) * 3.848 * (19 - z);
    for (const [u, z, sc] of [[0.1, -8, 1.1], [0.3, -9, 0.9], [0.44, -6, 0.8], [0.2, -15, 1.2], [0.38, -17, 1.0], [0.08, -25, 1.3], [0.28, -27, 1.1], [0.16, -36, 1.4], [0.42, -34, 1.2]])
      pond.addLotus(place(u, z), z, sc, false, 0.85);
    const bloom = composer.passes[1] as UnrealBloomPass; bloom.strength = 0.5; bloom.threshold = 0.5; // softer glow
  }, [camera, pond, size, composer]);

  useEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.fov = land.fov; c.near = 0.1; c.far = 600; c.layers.enable(1); c.updateProjectionMatrix();
  }, [camera, land]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio()); composer.setSize(size.width, size.height);
    if (tier.low) (composer.passes[1] as UnrealBloomPass).resolution.set(size.width / 2, size.height / 2);
    setLineResolution(size.width, size.height);
  }, [composer, gl, size, tier.low]);

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
    const lenis = reduced ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, gestureOrientation: "both" }) // trackpad sideways swipes travel too;
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

  // click to explore: terraces and the ground call the frog over, the frog jumps, the water splashes
  useEffect(() => {
    const free = (e: MouseEvent) => !(e.target as Element | null)?.closest?.(UI) && !getSelection()?.toString();
    const go = (stop: number) => { journey.goToStop(stop); scrollToVH(STOPS[stop].at); };
    const onClick = (e: MouseEvent) => {
      if (drag.moved) { drag.moved = false; return; } // the end of a drag is not a click
      if (!free(e)) return;
      const h = hitTest(e.clientX, e.clientY, camera, pond); if (!h) return;
      if (h.kind === "frog") { journey.poke(); ping(e.clientX, e.clientY - 24, journey.underwater ? "blub!" : RIBBITS[Math.floor(Math.random() * RIBBITS.length)]); }
      else if (h.kind === "terrace") go(h.stop);
      else if (h.kind === "ground") { journey.hopTo(h.p); ping(e.clientX, e.clientY); }
      else { pond.underwater.splash(h.p.x, h.p.z); ping(e.clientX, e.clientY - 16, "splash!"); }
    };
    // drag to travel: sideways on land (the path runs left → right), up/down in the water; a flick keeps gliding.
    // Phones: vertical swipes stay native; sideways swipes on land also move along the path.
    const root = document.documentElement;
    const drag = { on: false, moved: false, id: -1, x: 0, y: 0, vx: 0, vy: 0, t: 0, touch: false };
    const lenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;
    const scrollBy = (d: number, glide = 0) => {
      const l = lenis(), y = Math.max(0, (l ? l.targetScroll : window.scrollY) + d);
      if (l) l.scrollTo(y, glide ? { duration: glide } : { immediate: true }); else window.scrollTo({ top: y, behavior: glide ? "smooth" : "auto" });
    };
    const onLand = () => camera.position.y > SURF + 2;
    // screen motion → scroll distance: pulling the scene left (or up) moves forward along the path
    const along = (dx: number, dy: number) => onLand() ? (Math.abs(dx) > Math.abs(dy) ? -dx * 1.6 : -dy) : -dy * 1.4;
    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0) || !free(e)) return;
      Object.assign(drag, { on: true, moved: false, id: e.pointerId, x: e.clientX, y: e.clientY, vx: 0, vy: 0, t: e.timeStamp, touch: e.pointerType !== "mouse" });
    };
    const onDrag = (e: PointerEvent) => {
      if (!drag.on || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y, dt = Math.max(1, e.timeStamp - drag.t);
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      // touch: only take over sideways swipes on land; the browser already scrolls vertical ones
      if (drag.touch && (!onLand() || Math.abs(dx) < Math.abs(dy))) { drag.on = false; return; }
      drag.moved = true; root.classList.add("pond-dragging");
      scrollBy(along(dx, dy));
      drag.vx = dx / dt; drag.vy = dy / dt; drag.x = e.clientX; drag.y = e.clientY; drag.t = e.timeStamp;
    };
    const onUp = (e: PointerEvent) => {
      if (!drag.on || e.pointerId !== drag.id) return;
      drag.on = false; root.classList.remove("pond-dragging");
      if (drag.moved && e.timeStamp - drag.t < 80) { const fling = THREE.MathUtils.clamp(along(drag.vx, drag.vy) * 150, -0.8 * innerHeight, 0.8 * innerHeight); if (Math.abs(fling) > 30) scrollBy(fling, 0.9); }
      if (drag.touch) drag.moved = false; // touch has no trailing click to swallow when nothing was tapped
    };
    let last = 0;
    const onHover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || drag.on || e.timeStamp - last < 50) return; last = e.timeStamp;
      const bg = free(e), h = bg ? hitTest(e.clientX, e.clientY, camera, pond) : null;
      root.classList.toggle("pond-hover", !!h && h.kind !== "water");
      root.classList.toggle("pond-grab", bg && !(h && h.kind !== "water"));
    };
    const onTerrace = (e: Event) => go((e as CustomEvent<number>).detail);
    // arrow keys on land: → / ← hop to the next / previous stop (↑ ↓ keep scrolling as usual)
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== "ArrowRight" && e.key !== "ArrowLeft") || e.altKey || e.metaKey || e.ctrlKey || !onLand()) return;
      if ((e.target as Element | null)?.closest?.("input,textarea,select,[contenteditable]")) return;
      e.preventDefault(); go(THREE.MathUtils.clamp(journey.reached + (e.key === "ArrowRight" ? 1 : -1), 0, STOPS.length - 1));
    };
    const on: [string, EventListener][] = [["click", onClick as EventListener], ["pointerdown", onDown as EventListener], ["pointermove", onDrag as EventListener],
      ["pointermove", onHover as EventListener], ["pointerup", onUp as EventListener], ["pointercancel", onUp as EventListener], ["pond-go", onTerrace], ["keydown", onKey as EventListener]];
    for (const [n, f] of on) window.addEventListener(n, f);
    root.classList.add("pond-drag"); // CSS: touch-action + no text selection on the scene while dragging
    return () => {
      for (const [n, f] of on) window.removeEventListener(n, f);
      root.classList.remove("pond-hover", "pond-grab", "pond-dragging", "pond-drag");
    };
  }, [camera, pond, journey]);

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
    if (banner.current) { // ?banner: LinkedIn background. Camera faces the frog and sign head-on;
      // a lens shift (view offset) moves them into the right third without turning them sideways.
      const c = camera as THREE.PerspectiveCamera, W = size.width, H = size.height, k = 2 * 0.74;
      c.position.set(banner.current.x, 4.3, 19); c.lookAt(banner.current.x, 2.6, 0);
      c.aspect = (W * k) / H; c.setViewOffset(W * k, H, 0, 0, W, H);
    }

    const activeExp = arrived ? STOPS[journey.reached].exp ?? null : null;
    pond.update(clock.current, delta, look.current, amp, activeExp, camera.position.y);
    composer.render(delta);

    // anchored HTML
    for (const a of ANCHORS) {
      const el = anchorEls.get(a.id); if (!el) continue;
      const w = a.show.when;
      let on = w === "always" ? true : w === "seen" ? journey.seen >= a.show.stop : w === "current" ? journey.reached === a.show.stop && !journey.roaming : arrived && journey.reached === a.show.stop;
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
