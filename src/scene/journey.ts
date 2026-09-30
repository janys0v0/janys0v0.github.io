// The frog's journey along the Ɔ path. Scroll decides WHERE the frog should be (a stop);
// a timed move decides HOW it gets there, so it never hangs mid-air:
//   land → land : hop   (crouch → arced flight → landing squash → sit)
//   land → water: dive  (crouch → high arc → splash → swim)
//   water → *   : swim  (kicking glide, body tilted along the path; "ta-da" on arrival at an experience)
import * as THREE from "three";
import type { Frog } from "./frog";
import { SEABED_Y, STOPS, SURF } from "./stops";

type Move = { from: THREE.Vector3; to: THREE.Vector3; t: number; dur: number; mode: "hop" | "dive" | "swim" };
type Target = { p: THREE.Vector3; stop: number }; // stop = -1 for a via point
const CROUCH = 0.13, LAND = 0.14;
const under = (v: THREE.Vector3) => v.y < SURF - 0.3;
// zone boundaries the frog must pass through: land (0) ↔ water column (1) ↔ seabed (2)
const zoneOf = (v: THREE.Vector3) => (v.y < SEABED_Y + 3 ? 2 : under(v) ? 1 : 0);
const LEDGE = new THREE.Vector3(16.4, 0.64, -0.3), SPLASH = new THREE.Vector3(21, -3.2, 0), SEA_GATE = new THREE.Vector3(22, SEABED_Y + 2, 1);
const GATES: Record<string, THREE.Vector3[]> = { "0>1": [SPLASH], "1>0": [LEDGE], "1>2": [SEA_GATE], "2>1": [SEA_GATE] };

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
  private redirect = false;
  /** A clicked stop wins over scroll until the page's smooth scroll catches up with it (or 2.5 s pass). */
  private pin = -1;
  private pinUntil = 0;

  constructor(private frog: Frog) {
    this.pos = new THREE.Vector3(...STOPS[0].pos);
  }

  /** scrollVH = window.scrollY / viewport height. */
  setScroll(scrollVH: number) {
    let t = 0;
    for (let i = 0; i < STOPS.length; i++) if (scrollVH + 0.2 >= STOPS[i].at) t = i;
    if (this.pin >= 0) { if (t !== this.pin && performance.now() < this.pinUntil) return; this.pin = -1; }
    this.goTo(t);
  }

  /** A click on a terrace: hop straight there while the page scrolls to match (no stop-by-stop detour). */
  goToStop(t: number) { this.pin = t; this.pinUntil = performance.now() + 2500; this.goTo(t); }

  /** A click on the ground: hop to that spot. Scrolling again sends the frog back along its path. */
  hopTo(p: THREE.Vector3) {
    if (this.underwater || under(p)) return;
    this.target = -1; this.pin = -1;
    this.queue = [{ p: p.clone(), stop: -1 }];
    if (this.move && this.phase !== "idle") this.redirect = true;
  }

  /** A click on the frog: a happy jump on the spot (on land). */
  poke() { if (this.phase === "idle" && !this.underwater) this.queue = [{ p: this.pos.clone(), stop: -1 }]; }

  /** True after a ground click, until scrolling or a terrace click puts the frog back on its path. */
  get roaming() { return this.target === -1; }

  /** Re-plan from where the frog is right now: no queue of past scroll steps, skipped stops are skipped,
   *  and a change of direction turns the frog around mid-move. */
  goTo(t: number) {
    if (t === this.target) return;
    this.target = t;
    const dest = new THREE.Vector3(...STOPS[t].pos);
    const path: Target[] = [];
    let z = zoneOf(this.pos); const zt = zoneOf(dest);
    while (z !== zt) { const nz = z + Math.sign(zt - z); for (const g of GATES[`${z}>${nz}`]) path.push({ p: g.clone(), stop: -1 }); z = nz; }
    path.push({ p: dest, stop: t });
    const m = this.move;
    if (m && this.phase !== "land" && m.to.distanceTo(path[0].p) < 0.01) { this.queue = path; return; } // already heading there
    this.queue = path;
    if (m && this.phase !== "idle") this.redirect = true; // turn around now instead of finishing the old move
  }

  /** Jump straight to a stop (no animation). Used for ?still and visual tests. */
  snapTo(t: number) {
    this.pos.set(...STOPS[t].pos); this.reached = this.target = t; this.seen = Math.max(this.seen, t);
    this.queue = []; this.move = null; this.phase = "idle";
    this.frog.setPose(STOPS[t].exp ? "tada" : "sit");
  }

  update(dt: number, amp: number) {
    dt = Math.min(dt, 1 / 30);
    if (amp === 0 && this.queue.length) this.snapTo(this.target);

    if (this.redirect) { this.redirect = false; this.move = null; this.phase = "idle"; this.startMove(true); }
    if (this.phase === "idle" && this.queue.length) this.startMove(false);

    this.phaseT += dt;
    const m = this.move;
    if (this.phase === "crouch" && this.phaseT >= CROUCH / this.speed) { this.phase = "air"; this.phaseT = 0; this.frog.setPose("air"); }
    if (this.phase === "air" && m) {
      m.t = Math.min(1, this.phaseT / m.dur);
      const e = m.t < 0.5 ? 2 * m.t * m.t : 1 - Math.pow(-2 * m.t + 2, 2) / 2;
      this.pos.lerpVectors(m.from, m.to, e);
      if (m.mode === "hop") this.pos.y += (1.1 + Math.min(m.from.distanceTo(m.to), 14) * 0.1) * Math.sin(Math.PI * m.t);
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

  /** Start the next leg. midAir = turning around mid-move: skip the crouch and keep going. */
  private startMove(midAir: boolean) {
    const to = this.queue[0].p, from = this.pos.clone(), dist = from.distanceTo(to);
    this.speed = this.queue.length > 1 ? 1.5 : 1;
    const mode: Move["mode"] = under(from) ? "swim" : under(to) ? "dive" : "hop";
    const dur = mode === "swim" ? Math.min(0.55 + dist * 0.04, 1.4) : mode === "dive" ? 0.95 : Math.min(0.42 + dist * 0.03, 0.9);
    this.move = { from, to: to.clone(), t: 0, dur: dur / this.speed, mode };
    this.splashed = !under(from) && under(to) ? false : true; this.phaseT = 0;
    if (mode === "swim") { this.phase = "air"; this.frog.setPose("swim"); }
    else if (midAir) { this.phase = "air"; this.frog.setPose("air"); }
    else { this.phase = "crouch"; this.frog.setPose("crouch"); }
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
