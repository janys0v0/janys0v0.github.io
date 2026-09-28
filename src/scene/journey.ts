// The frog's journey along the Ɔ path. Scroll decides WHERE the frog should be (a stop);
// a timed move decides HOW it gets there, so it never hangs mid-air:
//   land → land : hop   (crouch → arced flight → landing squash → sit)
//   land → water: dive  (crouch → high arc → splash → swim)
//   water → *   : swim  (kicking glide, body tilted along the path; "ta-da" on arrival at an experience)
import * as THREE from "three";
import type { Frog } from "./frog";
import { STOPS, SURF } from "./stops";

type Move = { from: THREE.Vector3; to: THREE.Vector3; t: number; dur: number; mode: "hop" | "dive" | "swim" };
type Target = { p: THREE.Vector3; stop: number }; // stop = -1 for a via point
const CROUCH = 0.13, LAND = 0.14;
const under = (v: THREE.Vector3) => v.y < SURF - 0.3;

export class Journey {
  /** Index of the stop the frog has actually reached. */
  reached = 0;
  /** Furthest stop ever reached: keyword chips stay once they have popped up. */
  seen = 0;
  readonly pos: THREE.Vector3;
  /** Called when the frog breaks the water surface (x position). */
  onSplash: (x: number) => void = () => {};

  private target = 0;
  private queue: Target[] = [];
  private move: Move | null = null;
  private phase: "idle" | "crouch" | "air" | "land" = "idle";
  private phaseT = 0;
  private speed = 1;
  private facing = 0;
  private tilt = 0;
  private splashed = false;
  private idleT = 0;

  constructor(private frog: Frog) {
    this.pos = new THREE.Vector3(...STOPS[0].pos);
  }

  /** scrollVH = window.scrollY / viewport height. */
  setScroll(scrollVH: number) {
    let t = 0;
    for (let i = 0; i < STOPS.length; i++) if (scrollVH + 0.2 >= STOPS[i].at) t = i;
    this.goTo(t);
  }

  goTo(t: number) {
    if (t === this.target) return;
    // plan landings from the last planned stop toward the new target (via points included)
    const last = [...this.queue].reverse().find((q) => q.stop >= 0)?.stop ?? this.reached;
    const step = t > last ? 1 : -1;
    for (let i = last + step; step > 0 ? i <= t : i >= t; i += step) {
      const s = STOPS[i], leaving = STOPS[i - step];
      const via = step > 0 ? s.via ?? [] : [...(leaving.via ?? [])].reverse();
      for (const v of via) this.queue.push({ p: new THREE.Vector3(...v), stop: -1 });
      this.queue.push({ p: new THREE.Vector3(...s.pos), stop: i });
    }
    this.target = t;
  }

  /** Jump straight to a stop (no animation). Used for reduced motion and visual tests. */
  snapTo(t: number) {
    this.pos.set(...STOPS[t].pos); this.reached = this.target = t; this.seen = Math.max(this.seen, t);
    this.queue = []; this.move = null; this.phase = "idle";
    this.frog.setPose(STOPS[t].exp ? "tada" : "sit");
  }

  update(dt: number, amp: number) {
    dt = Math.min(dt, 1 / 30);
    if (amp === 0 && this.queue.length) this.snapTo(this.target);

    if (this.phase === "idle" && this.queue.length) {
      const to = this.queue[0].p, from = this.pos.clone(), dist = from.distanceTo(to);
      this.speed = this.queue.length > 1 ? 1.6 : 1;
      const mode: Move["mode"] = under(from) ? "swim" : under(to) ? "dive" : "hop";
      const dur = mode === "swim" ? Math.min(0.55 + dist * 0.045, 1.5) : mode === "dive" ? 0.95 : Math.min(0.42 + dist * 0.035, 0.8);
      this.move = { from, to: to.clone(), t: 0, dur: dur / this.speed, mode };
      this.splashed = false; this.phaseT = 0;
      if (mode === "swim") { this.phase = "air"; this.frog.setPose("swim"); }
      else { this.phase = "crouch"; this.frog.setPose("crouch"); }
    }

    this.phaseT += dt;
    const m = this.move;
    if (this.phase === "crouch" && this.phaseT >= CROUCH / this.speed) { this.phase = "air"; this.phaseT = 0; this.frog.setPose("air"); }
    if (this.phase === "air" && m) {
      m.t = Math.min(1, this.phaseT / m.dur);
      const e = m.t < 0.5 ? 2 * m.t * m.t : 1 - Math.pow(-2 * m.t + 2, 2) / 2;
      this.pos.lerpVectors(m.from, m.to, e);
      if (m.mode === "hop") this.pos.y += (1.1 + m.from.distanceTo(m.to) * 0.12) * Math.sin(Math.PI * m.t);
      if (m.mode === "dive") {
        this.pos.y += 3.2 * Math.sin(Math.PI * Math.min(1, m.t * 1.4)); // high arc, then plunge
        if (!this.splashed && this.pos.y < SURF) { this.splashed = true; this.onSplash(this.pos.x); this.frog.setPose("swim"); }
      }
      if (m.mode === "swim") this.pos.x += 0.25 * Math.sin(m.t * Math.PI * 3) * (1 - m.t); // a little side-to-side kick
      if (m.t >= 1) {
        this.pos.copy(m.to);
        if (m.mode === "hop") { this.phase = "land"; this.phaseT = 0; this.frog.setPose("land"); }
        else this.arrive();
      }
    }
    if (this.phase === "land" && this.phaseT >= LAND / this.speed) this.arrive();

    // body direction: turn toward travel while hopping; nose along the path while swimming or diving
    const moving = this.phase === "air" && m ? m : null;
    const wantFacing = moving && moving.mode === "hop" ? Math.sign(moving.to.x - moving.from.x) * 0.55 : 0;
    let wantTilt = 0;
    if (moving && moving.mode !== "hop") {
      const dx = moving.to.x - moving.from.x, dy = moving.to.y - moving.from.y;
      if (Math.hypot(dx, dy) > 0.01) wantTilt = THREE.MathUtils.clamp(Math.atan2(-dx, -dy) * 0.5, -1.1, 1.1);
    }
    this.facing += (wantFacing - this.facing) * Math.min(1, dt * 8);
    this.tilt += (wantTilt - this.tilt) * Math.min(1, dt * 5);

    // floating at an experience: a slow hover so the frog feels underwater, not parked
    this.idleT += dt;
    const hover = this.phase === "idle" && under(this.pos) ? amp * 0.18 * Math.sin(this.idleT * 1.3) : 0;
    this.frog.root.position.set(this.pos.x, this.pos.y + hover, this.pos.z);
    this.frog.root.rotation.set(0, this.facing, this.tilt);
  }

  private arrive() {
    const q = this.queue.shift();
    if (q && q.stop >= 0) { this.reached = q.stop; this.seen = Math.max(this.seen, q.stop); }
    this.move = null; this.phase = "idle";
    const s = q && q.stop >= 0 ? STOPS[q.stop] : null;
    this.frog.setPose(s?.exp ? "tada" : this.queue.length && under(this.pos) ? "swim" : "sit");
  }

  get hopping() { return this.phase !== "idle"; }
  get underwater() { return under(this.pos); }
}
