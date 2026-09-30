// The neon frog, rigged. Every part eases toward the active pose on a spring, so switching motions never snaps.
import * as THREE from "three";
import { blob, C, curve, glow, line } from "./materials";

export type FrogPose = "sit" | "crouch" | "air" | "land" | "tada" | "swim";
type Vec3 = [number, number, number];
type Delta = { p?: Vec3; r?: Vec3; s?: Vec3 };
type NodeName = "body" | "head" | "armL" | "armR" | "legL" | "legR";

// Pose = offsets from the sitting rest pose, per rig node.
const POSES: Record<FrogPose, Partial<Record<NodeName, Delta>>> = {
  sit: {},
  crouch: { body: { p: [0, -0.18, 0], s: [1.08, 0.84, 1.06] }, head: { p: [0, -0.32, 0.05] }, legL: { r: [0, 0, 0.12] }, legR: { r: [0, 0, -0.12] } },
  air: { body: { s: [0.9, 1.14, 0.94] }, head: { p: [0, 0.12, 0] }, armL: { r: [-0.6, 0, 0.2] }, armR: { r: [-0.6, 0, -0.2] }, legL: { r: [1.0, 0, 0.25] }, legR: { r: [1.0, 0, -0.25] } },
  land: { body: { p: [0, -0.22, 0], s: [1.14, 0.8, 1.1] }, head: { p: [0, -0.38, 0.06] }, armL: { r: [0, 0, -0.25] }, armR: { r: [0, 0, 0.25] } },
  tada: { head: { p: [0, 0.08, 0], r: [-0.1, 0, 0] }, armL: { r: [0, 0, -2.35] }, armR: { r: [0, 0, 2.35] }, legR: { r: [0, 0, -0.9] } },
  swim: { body: { s: [0.9, 1.12, 0.95] }, armL: { r: [-0.9, 0, 0.35] }, armR: { r: [-0.9, 0, -0.35] }, legL: { r: [1.2, 0, 0.5] }, legR: { r: [1.2, 0, -0.5] } },
};

// Critically-damped-ish spring (ζ < 1 gives a small, lively overshoot on landings).
const W = 16, ZETA = 0.82;
type Chan = { x: number; v: number };
const spring = (c: Chan, target: number, dt: number) => {
  const a = W * W * (target - c.x) - 2 * ZETA * W * c.v;
  c.v += a * dt; c.x += c.v * dt;
};

type RigNode = { obj: THREE.Object3D; base: { p: THREE.Vector3; s: THREE.Vector3 }; ch: Chan[] }; // 9 channels: p, r, s

export class Frog {
  readonly root = new THREE.Group();
  private nodes = {} as Record<NodeName, RigNode>;
  private eyes: THREE.Object3D[] = [];
  private pupils: THREE.Object3D[] = [];
  private pose: FrogPose = "sit";
  private nextBlink = 2.5;
  private blinkUntil = 0;

  constructor() {
    const sph = new THREE.SphereGeometry(1, 48, 32);
    const node = (name: NodeName, pivot: Vec3, parent: THREE.Object3D = this.root) => {
      const g = new THREE.Group(); g.position.set(...pivot); parent.add(g);
      this.nodes[name] = { obj: g, base: { p: g.position.clone(), s: new THREE.Vector3(1, 1, 1) }, ch: Array.from({ length: 9 }, (_, i) => ({ x: i >= 6 ? 1 : 0, v: 0 })) };
      return g;
    };
    // body pivots at its base so squash keeps the feet on the ground
    const body = node("body", [0, 0, 0]);
    blob(body, sph, C.frog, { pos: [0, 1.15, 0], scale: [0.95, 1.05, 0.8] });
    const head = node("head", [0, 1.9, 0], body);
    blob(head, sph, C.frog, { pos: [0, 0.25, 0.05], scale: [1.25, 0.72, 0.85] });
    for (const sx of [-1, 1]) {
      const eye = new THREE.Group(); eye.position.set(sx * 0.62, 0.85, 0.1); head.add(eye); this.eyes.push(eye);
      blob(eye, sph, C.frog, { scale: [0.42, 0.42, 0.42], t: 0.12 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 12, 40), new THREE.MeshBasicMaterial({ color: glow(C.pink, 2.4), toneMapped: false }));
      ring.position.set(0, 0.03, 0.4); eye.add(ring); this.pupils.push(ring);
    }
    line(head, curve([[-0.78, 0.3, 0.74], [-0.3, 0.09, 0.86], [0.3, 0.09, 0.86], [0.78, 0.3, 0.74]]), C.yellow, { width: 3.2, k: 2.4 });
    for (const sx of [-1, 1]) {
      const arm = node(sx < 0 ? "armL" : "armR", [sx * 0.4, 1.45, 0.5], body);
      blob(arm, new THREE.CapsuleGeometry(0.2, 0.9, 8, 16), C.cyan, { pos: [sx * 0.02, -0.55, 0.05], rot: [0, 0, sx * 0.15] });
      blob(arm, sph, C.cyan, { pos: [sx * 0.15, -1.33, 0.22], scale: [0.45, 0.12, 0.3] });
      const leg = node(sx < 0 ? "legL" : "legR", [sx * 0.8, 0.6, 0], this.root);
      blob(leg, sph, C.frog, { pos: [sx * 0.05, -0.05, -0.05], scale: [0.55, 0.45, 0.9] });
      blob(leg, sph, C.frog, { pos: [sx * 0.4, -0.5, 0.25], scale: [0.5, 0.12, 0.3] });
    }
  }

  setPose(p: FrogPose) { this.pose = p; }
  get currentPose() { return this.pose; }

  /** dt/t in seconds; look = pointer in [-1,1]²; amp 0 disables idle life (?still). */
  update(dt: number, t: number, look = { x: 0, y: 0 }, amp = 1) {
    dt = Math.min(dt, 1 / 30); // never explode after a tab switch
    const target = POSES[this.pose];
    for (const name of Object.keys(this.nodes) as NodeName[]) {
      const n = this.nodes[name], d = target[name] ?? {};
      const goal = [...(d.p ?? [0, 0, 0]), ...(d.r ?? [0, 0, 0]), ...(d.s ?? [1, 1, 1])];
      n.ch.forEach((c, i) => spring(c, goal[i], dt));
      const [px, py, pz, rx, ry, rz, sx, sy, sz] = n.ch.map((c) => c.x);
      n.obj.position.set(n.base.p.x + px, n.base.p.y + py, n.base.p.z + pz);
      n.obj.rotation.set(rx, ry, rz);
      n.obj.scale.set(sx, sy, sz);
    }
    // idle life: breathing, blinking, eyes following the pointer
    const breathe = 1 + 0.015 * Math.sin(t * Math.PI) * amp;
    this.nodes.body.obj.scale.multiplyScalar(breathe);
    if (amp > 0 && t > this.nextBlink) { this.blinkUntil = t + 0.12; this.nextBlink = t + 3 + Math.random() * 3; }
    const lid = t < this.blinkUntil ? 0.12 : 1;
    for (const e of this.eyes) e.scale.y += (lid - e.scale.y) * Math.min(1, dt * 30);
    for (const p of this.pupils) { p.position.x += (look.x * 0.09 * amp - p.position.x) * Math.min(1, dt * 6); p.position.y += (0.03 + look.y * 0.07 * amp - p.position.y) * Math.min(1, dt * 6); }
  }
}
