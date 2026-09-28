// The stops along the Ɔ path. No three.js here, so pages can import it for layout.
export type P3 = [number, number, number];

export type Stop = {
  id: string;
  pos: P3; // where the frog sits (feet)
  at: number; // scroll position, in viewport heights, where this stop becomes the target
  via?: P3[]; // extra landing points on the way (e.g. the start of the pier)
};

const TERRACE_TOP = 1.49;
export const STOPS: Stop[] = [
  { id: "hub", pos: [-11.8, 0, 0.3], at: 0 },
  { id: "ai", pos: [-8, TERRACE_TOP, -0.3], at: 0.55 },
  { id: "product", pos: [-2, TERRACE_TOP, -0.3], at: 0.95 },
  { id: "data", pos: [4, TERRACE_TOP, -0.3], at: 1.35 },
  { id: "ledge", pos: [16.4, 0.64, -0.3], at: 1.95, via: [[11.4, 0.64, -0.3]] },
];
/** Scrollable length of the journey built so far (Phase 2 ends at the pier ledge). */
export const JOURNEY_VH = 2.6;

