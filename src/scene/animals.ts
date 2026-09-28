// The six client animals, drawn like the frog (dark bodies, neon outlines), each with a gentle idle loop.
// `update(t, active, amp)`: active = the frog has arrived at this animal's region ("wake-up").
import * as THREE from "three";
import type { ClientAnimal } from "@/content/experience";
import { blob, curve, line, P3, ringPts } from "./materials";

export type Animal = { group: THREE.Group; update: (t: number, dt: number, active: boolean, amp: number) => void };

const sph = new THREE.SphereGeometry(1, 40, 28);
const COLORS: Record<ClientAnimal, string> = {
  octopus: "#4d8dff", turtle: "#22e0b5", flyingFish: "#ffd84a", starfish: "#ff8a3d", crab: "#ff4d6d", jellyfish: "#ff5fd2",
};
const EYE = "#ff6ad5";

function octopus(g: THREE.Group, c: string) {
  blob(g, sph, c, { pos: [0, 1.3, 0], scale: [1.05, 1.25, 0.95] });
  for (const sx of [-1, 1]) { line(g, ringPts(0.28, 40, 0, 0, 0).map(([x, , z]) => [sx * 0.4 + x, 1.45 + z, 0.98] as P3), "#e6f3ff", { width: 3, k: 2.2 }); line(g, ringPts(0.09, 20).map(([x, , z]) => [sx * 0.4 + x, 1.42 + z, 1] as P3), EYE, { width: 3, k: 2.4 }); }
  const arms: THREE.Group[] = [];
  for (let i = 0; i < 6; i++) {
    const x0 = -0.85 + i * 0.34, d = x0 * 1.6, cz = 0.2 + (i % 2) * 0.2, arm = new THREE.Group(); arm.position.set(x0, 0.4, cz); g.add(arm);
    const pts = [[0, 0, 0], [x0 * 0.3, -0.8, 0], [d - x0, -1.7, 0], [d - x0 + (i < 3 ? -0.4 : 0.4), -2.3, 0], [d - x0 + (i < 3 ? -0.15 : 0.15), -2.6, 0]].map((p) => new THREE.Vector3(...p));
    blob(arm, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.15, 10), c, { t: 0.045 }); arms.push(arm);
  }
  return (t: number, amp: number) => arms.forEach((a, i) => { a.rotation.z = amp * 0.16 * Math.sin(t * 1.6 - i * 0.7); });
}
function jellyfish(g: THREE.Group, c: string) {
  const bell = new THREE.Group(); g.add(bell);
  blob(bell, new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), c, { pos: [0, 0.5, 0], scale: [1.1, 0.85, 1.1], fill: 0.6 });
  blob(bell, sph, c, { pos: [0, 0.75, 0], scale: [0.35, 0.3, 0.35], k: 3 });
  const ten = new THREE.Group(); g.add(ten);
  for (let i = 0; i < 7; i++) { const x = -0.9 + i * 0.3; line(ten, Array.from({ length: 30 }, (_, j) => [x + Math.sin(j * 0.45 + i) * 0.12, 0.45 - j * 0.1, 0.3] as P3), c, { width: 2.2, k: 1.8, opacity: 0.9 }); }
  return (t: number, amp: number) => { const p = 1 + amp * 0.07 * Math.sin(t * 2.2); bell.scale.set(p, 2 - p, p); ten.rotation.z = amp * 0.06 * Math.sin(t * 1.1); ten.scale.y = 1 + amp * 0.05 * Math.sin(t * 2.2 - 0.8); };
}
function turtle(g: THREE.Group, c: string) {
  blob(g, sph, c, { scale: [1.35, 0.6, 1] });
  line(g, [[-0.9, 0.35, 0.75], [-0.3, 0.5, 0.85], [0.3, 0.5, 0.85], [0.9, 0.35, 0.75]], c, { width: 2.2, k: 1.6 });
  blob(g, sph, c, { pos: [1.6, 0.15, 0.2], scale: [0.42, 0.36, 0.36] });
  line(g, ringPts(0.07, 12).map(([x, , z]) => [1.78 + x, 0.25 + z, 0.55] as P3), EYE, { width: 3, k: 2.4 });
  const fl = [new THREE.Group(), new THREE.Group()]; fl[0].position.set(0.6, -0.4, 0.5); fl[1].position.set(-0.9, -0.4, 0.5); fl.forEach((f) => g.add(f));
  blob(fl[0], sph, c, { pos: [0, -0.15, 0], scale: [0.7, 0.14, 0.3], rot: [0, 0, -0.5] });
  blob(fl[1], sph, c, { pos: [0, -0.1, 0], scale: [0.45, 0.12, 0.25], rot: [0, 0, 0.5] });
  const babies: THREE.Group[] = [];
  for (const [dx, dy] of [[-2.2, -0.9], [-1.4, -1.35]]) { const h = new THREE.Group(); h.position.set(dx, dy, 0.3); h.scale.setScalar(0.3); g.add(h); babies.push(h);
    blob(h, sph, c, { scale: [1.35, 0.6, 1], t: 0.15 }); blob(h, sph, c, { pos: [1.6, 0.15, 0.2], scale: [0.42, 0.36, 0.36], t: 0.2 }); }
  return (t: number, amp: number) => { fl[0].rotation.z = amp * 0.35 * Math.sin(t * 1.8); fl[1].rotation.z = -amp * 0.3 * Math.sin(t * 1.8 + 0.6); babies.forEach((b, i) => { b.position.y = [-0.9, -1.35][i] + amp * 0.12 * Math.sin(t * 1.4 + i); }); };
}
function flyingFish(g: THREE.Group, c: string) {
  blob(g, sph, c, { scale: [1.3, 0.42, 0.42], rot: [0, 0, 0.15] });
  line(g, ringPts(0.08, 12).map(([x, , z]) => [0.95 + x, 0.2 + z, 0.4] as P3), EYE, { width: 3, k: 2.4 });
  const wing = new THREE.Group(); wing.position.set(-0.1, 0.25, 0.3); g.add(wing);
  line(wing, [[0, 0, 0], [-1.1, 1.65, 0], [-1.5, 0.1, 0], [0, 0, 0]], c, { width: 2.6, k: 2 });
  const tail = new THREE.Group(); tail.position.set(-1.25, -0.1, 0); g.add(tail);
  line(tail, [[0, 0, 0], [-0.75, 0.65, 0], [-0.55, 0, 0], [-0.75, -0.6, 0], [0, 0, 0]], c, { width: 2.6, k: 2 });
  return (t: number, amp: number) => { wing.rotation.x = amp * 0.5 * Math.sin(t * 3); tail.rotation.y = amp * 0.35 * Math.sin(t * 4); g.rotation.z = amp * 0.05 * Math.sin(t * 0.9); };
}
function starfish(g: THREE.Group, c: string) {
  const pts: P3[] = []; for (let i = 0; i <= 10; i++) { const r = i % 2 ? 0.5 : 1.3, a = Math.PI / 2 + (i * Math.PI) / 5; pts.push([Math.cos(a) * r, Math.sin(a) * r, 0.2]); }
  const body = new THREE.Group(); g.add(body);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])))), new THREE.MeshBasicMaterial({ color: "#0a0507" })); m.position.z = 0.18; body.add(m);
  line(body, curve(pts, 120), c, { width: 3.2, k: 2.2 });
  for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (i * Math.PI * 2) / 5; line(body, ringPts(0.06, 10).map(([x, , z]) => [Math.cos(a) * 0.7 + x, Math.sin(a) * 0.7 + z, 0.25] as P3), c, { width: 2.5, k: 2.4 }); }
  for (const sx of [-0.2, 0.2]) line(g, ringPts(0.09, 12).map(([x, , z]) => [sx + x, 0.15 + z, 0.26] as P3), EYE, { width: 3, k: 2.4 });
  return (t: number, amp: number) => { body.rotation.z = amp * 0.12 * Math.sin(t * 0.5); g.scale.setScalar(1 + amp * 0.03 * Math.sin(t * 1.3)); };
}
function crab(g: THREE.Group, c: string) {
  blob(g, sph, c, { scale: [1.15, 0.55, 0.7] });
  const claws: THREE.Group[] = [];
  for (const sx of [-1, 1]) {
    line(g, [[sx * 0.3, 0.4, 0.4], [sx * 0.35, 0.95, 0.4]], c, { width: 2.4, k: 2 });
    line(g, ringPts(0.1, 14).map(([x, , z]) => [sx * 0.35 + x, 1.05 + z, 0.45] as P3), EYE, { width: 3, k: 2.4 });
    const claw = new THREE.Group(); claw.position.set(sx * 1.0, 0.1, 0.3); g.add(claw); claws.push(claw);
    line(claw, [[0, 0, 0], [sx * 0.5, 0.5, 0], [sx * 0.6, 0.8, 0]], c, { width: 2.6, k: 2 });
    blob(claw, sph, c, { pos: [sx * 0.7, 1.05, 0], scale: [0.42, 0.3, 0.3], rot: [0, 0, sx * 0.4] });
    for (let i = 0; i < 3; i++) line(g, [[sx * (0.6 + i * 0.15), -0.25, 0.3], [sx * (1.1 + i * 0.25), -0.5, 0.3], [sx * (1.3 + i * 0.25), -0.95, 0.3]], c, { width: 2.2, k: 1.8 });
  }
  // hermit crab: a spiral shell on its back
  line(g, Array.from({ length: 60 }, (_, i) => { const a = i * 0.32, r = 0.15 + i * 0.012; return [-0.2 + Math.cos(a) * r, 0.75 + Math.sin(a) * r, -0.2] as P3; }), "#fff1e6", { width: 2.4, k: 1.4 });
  return (t: number, amp: number) => { g.position.x = (g.userData.baseX as number) + amp * 0.25 * Math.sin(t * 0.8); claws.forEach((cl, i) => { cl.rotation.z = amp * 0.25 * Math.max(0, Math.sin(t * 2.4 + i * Math.PI)); }); };
}

const BUILD: Record<ClientAnimal, (g: THREE.Group, c: string) => (t: number, amp: number) => void> = { octopus, jellyfish, turtle, flyingFish, starfish, crab };

export function makeAnimal(kind: ClientAnimal, pos: P3, scale = 1): Animal {
  const outer = new THREE.Group(); outer.position.set(...pos);
  const g = new THREE.Group(); g.userData.baseX = 0; outer.add(g);
  const loop = BUILD[kind](g, COLORS[kind]);
  let wake = 0;
  return {
    group: outer,
    update(t, dt, active, amp) {
      loop(t, amp);
      // wake-up: grow a little and rise when the frog arrives; drift gently otherwise
      wake += ((active ? 1 : 0) - wake) * Math.min(1, dt * 4);
      outer.scale.setScalar(scale * (0.92 + 0.13 * wake));
      g.position.y = amp * 0.15 * Math.sin(t * 0.7 + pos[1]) + wake * 0.3;
    },
  };
}
