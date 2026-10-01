// The stops along the Ɔ path. No three.js here, so pages can import it for layout.
export type P3 = [number, number, number];

export type Stop = {
  id: string;
  kind: "land" | "water" | "seabed";
  pos: P3; // where the frog sits / floats (feet)
  at: number; // scroll position, in viewport heights, where this stop becomes the target
  via?: P3[]; // extra landing points on the way (the start of the pier, the splash point)
  exp?: string; // experience id shown at this stop
};

export const SURF = -0.6;
const TERRACE_TOP = 1.49;
/** Water column: animals on the left (x = ANIMAL_X), frog on the right (x = FROG_X), card between. */
export const ANIMAL_X = 16.5, FROG_X = 28.5, CARD_X = 22.5;
export const EXP_DEPTHS = [-8, -16, -24, -32, -40, -48];
export const SEABED_Y = -56;

const EXP_IDS = ["bam", "harvard-grid", "isf", "cathay", "ekimetrics", "acme"]; // same order as content/experience.ts

export const STOPS: Stop[] = [
  { id: "hub", kind: "land", pos: [-11.8, 0, 0.3], at: 0 },
  { id: "ai", kind: "land", pos: [-8, TERRACE_TOP, -0.3], at: 0.55 },
  { id: "product", kind: "land", pos: [-2, TERRACE_TOP, -0.3], at: 0.95 },
  { id: "data", kind: "land", pos: [4, TERRACE_TOP, -0.3], at: 1.35 },
  { id: "ledge", kind: "land", pos: [16.4, 0.64, -0.3], at: 1.95, via: [[11.4, 0.64, -0.3]] },
  // the dive: leap off the pier, splash, swim down past each experience (newest at the top)
  ...EXP_IDS.map((id, i): Stop => ({
    id, kind: "water", exp: id, pos: [FROG_X, EXP_DEPTHS[i], 0], at: 2.7 + i * 0.85,
    ...(i === 0 ? { via: [[21, -3.2, 0] as P3] } : {}),
  })),
  // the seabed turns left, back under the land: Let's Chat
  { id: "chat", kind: "seabed", pos: [8, SEABED_Y, 1.5], at: 2.7 + 6 * 0.85 + 0.2, via: [[22, SEABED_Y + 2, 1]] },
];
/** Scrollable length of the whole journey, in viewport heights. */
export const JOURNEY_VH = STOPS[STOPS.length - 1].at + 0.6;
export const stopIndex = (id: string) => STOPS.findIndex((s) => s.id === id);
