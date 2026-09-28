// The frog's journey along the Ɔ path. Scroll decides WHERE the frog should be (a stop);
// a timed hop (crouch → air → land) decides HOW it gets there, so it never hangs mid-air.
import * as THREE from "three";
import type { Frog } from "./frog";
import { STOPS } from "./stops";

type Hop = { from: THREE.Vector3; to: THREE.Vector3; t: number; dur: number };
const CROUCH = 0.13, LAND = 0.14; // seconds of anticipation and settle around each flight

export class Journey {
  /** Index of the stop the frog has actually reached. */
  reached = 0;
  /** Furthest stop ever reached: keyword chips stay once they have popped up. */
  seen = 0;
  private target = 0;
  private queue: THREE.Vector3[] = [];
  private queueStops: number[] = [];
  private hop: Hop | null = null;
  private phase: "idle" | "crouch" | "air" | "land" = "idle";
  private phaseT = 0;
  private facing = 0;
  private speed = 1;
  readonly pos: THREE.Vector3;

  constructor(private frog: Frog) {
    this.pos = new THREE.Vector3(...STOPS[0].pos);
  }

  /** scrollVH = window.scrollY / viewport height. */
  setScroll(scrollVH: number) {
    let t = 0;
    for (let i = 0; i < STOPS.length; i++) if (scrollVH + 0.2 >= STOPS[i].at) t = i;
    if (t === this.target) return;
    // plan the landings between where we will be and the new target
    const last = this.queueStops.length ? this.queueStops[this.queueStops.length - 1] : this.reached;
    const step = t > last ? 1 : -1;
    for (let i = last + step; step > 0 ? i <= t : i >= t; i += step) {
      const s = STOPS[i], back = STOPS[i - step];
      const via = step > 0 ? s.via ?? [] : [...(back.via ?? [])].reverse();
      for (const v of via) { this.queue.push(new THREE.Vector3(...v)); this.queueStops.push(-1); }
      this.queue.push(new THREE.Vector3(...s.pos)); this.queueStops.push(i);
    }
    this.target = t;
  }

  /** Advance the hop animation. amp 0 = reduced motion: move instantly, no flight. */
  update(dt: number, amp: number) {
    dt = Math.min(dt, 1 / 30);
    if (amp === 0 && this.queue.length) {
      this.pos.copy(this.queue[this.queue.length - 1]);
      this.reached = this.target; this.seen = Math.max(this.seen, this.target); this.queue = []; this.queueStops = []; this.hop = null; this.phase = "idle";
      this.frog.setPose("sit");
    }
    if (this.phase === "idle" && this.queue.length) {
      const to = this.queue[0], dist = this.pos.distanceTo(to);
      // chained hops (a fast scroll across several stops) run quicker so the frog keeps up
      this.speed = this.queue.length > 1 ? 1.6 : 1;
      this.hop = { from: this.pos.clone(), to: to.clone(), t: 0, dur: Math.min(0.42 + dist * 0.035, 0.8) / this.speed };
      this.phase = "crouch"; this.phaseT = 0; this.frog.setPose("crouch");
    }
    this.phaseT += dt;
    const h = this.hop;
    if (this.phase === "crouch" && this.phaseT >= CROUCH / this.speed) { this.phase = "air"; this.phaseT = 0; this.frog.setPose("air"); }
    if (this.phase === "air" && h) {
      h.t = Math.min(1, this.phaseT / h.dur);
      const e = h.t < 0.5 ? 2 * h.t * h.t : 1 - Math.pow(-2 * h.t + 2, 2) / 2; // ease in-out along the ground
      const arc = (1.1 + h.from.distanceTo(h.to) * 0.12) * Math.sin(Math.PI * h.t); // parabola-like lift
      this.pos.lerpVectors(h.from, h.to, e); this.pos.y += arc;
      if (h.t >= 1) { this.pos.copy(h.to); this.phase = "land"; this.phaseT = 0; this.frog.setPose("land"); }
    }
    if (this.phase === "land" && this.phaseT >= LAND / this.speed) {
      this.queue.shift(); const s = this.queueStops.shift();
      if (s !== undefined && s >= 0) { this.reached = s; this.seen = Math.max(this.seen, s); }
      this.hop = null; this.phase = "idle"; this.frog.setPose("sit");
    }
    // turn slightly toward the direction of travel while hopping, then face the camera again
    const want = this.phase === "air" && h ? Math.sign(h.to.x - h.from.x) * 0.55 : 0;
    this.facing += (want - this.facing) * Math.min(1, dt * 8);
    this.frog.root.position.copy(this.pos);
    this.frog.root.rotation.y = this.facing;
  }

  get hopping() { return this.phase !== "idle"; }
}
