// Shared neon materials + GPU motion for the pond scene.
// Everything that "breathes" (pads, reeds, grass, particles) moves in the vertex shader off one clock, `motion.uTime`.
import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

export const C = {
  frog: "#39ff88", cyan: "#29d3ff", pink: "#ff6ad5", yellow: "#f4ff61",
  purple: "#8b5cff", violet: "#b07cff", pad: "#3fd89a", sand: "#ffb057",
} as const;

export const glow = (hex: string, k = 1.8) => new THREE.Color(hex).multiplyScalar(k);

/** One clock for all ambient motion. `amp` = 0 freezes ambient motion (?still). */
export const motion = { uTime: { value: 0 }, uAmp: { value: 1 } };

// ── the water's wave field (GLSL + an identical JS twin for CPU-placed objects) ──
// Low, slow swell: ≤ 0.05 units high; neighbours move together because it is one field.
export const WAVE_GLSL = /* glsl */ `
  uniform float uTime; uniform float uAmp;
  float pondWave(vec2 p) {
    return uAmp * (0.03 * sin(p.x * 0.45 + uTime * 0.8) + 0.02 * sin(p.y * 0.6 - uTime * 0.6 + p.x * 0.2));
  }`;
export const pondWave = (x: number, z: number, t: number, amp = 1) =>
  amp * (0.03 * Math.sin(x * 0.45 + t * 0.8) + 0.02 * Math.sin(z * 0.6 - t * 0.6 + x * 0.2));

// Wind: bends things more near the tip (h = height above the ground). Gusts are rare and soft.
export const WIND_GLSL = /* glsl */ `
  uniform float uTime; uniform float uAmp;
  vec2 pondWind(vec3 w, float h) {
    float gust = 0.6 + 0.4 * sin(uTime * 0.13 + w.x * 0.05);
    float s = sin(uTime * 1.1 + w.x * 0.7 + w.z * 0.3) * 0.7 + sin(uTime * 2.3 + w.x * 1.3) * 0.3;
    return uAmp * vec2(s * gust, s * 0.3) * h * h * 0.05;
  }`;

// ── materials ────────────────────────────────────────────────────────────────
/** Glowing silhouette shell: the back faces pushed out along the normal. */
export function hullMat(color: string, t = 0.075, k = 2.9) {
  return new THREE.ShaderMaterial({
    uniforms: { c: { value: glow(color, k) }, t: { value: t } },
    vertexShader: `uniform float t; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * t, 1.0); }`,
    fragmentShader: `uniform vec3 c; void main(){ gl_FragColor = vec4(c, 1.0); }`,
    side: THREE.BackSide, toneMapped: false, fog: false,
  });
}
/** Dark body with a faint coloured rim (fresnel), like the frog drawing. */
export function fillMat(color: string, amt = 0.35) {
  return new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(color) }, a: { value: amt } },
    vertexShader: `varying vec3 n; varying vec3 v; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); n = normalize(normalMatrix*normal); v = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 c; uniform float a; varying vec3 n; varying vec3 v; void main(){ float f = pow(1.0 - max(dot(n,v),0.0), 2.5); gl_FragColor = vec4(vec3(0.012,0.014,0.03) + c * f * a, 1.0); }`,
    toneMapped: false,
  });
}

type LineOpts = { width?: number; k?: number; opacity?: number; worldUnits?: boolean };
const lineMats: LineMaterial[] = [];
export function lineMat(color: string, { width = 3, k = 2, opacity = 1, worldUnits = false }: LineOpts = {}) {
  const m = new LineMaterial({ color: glow(color, k).getHex(), linewidth: width, worldUnits, transparent: opacity < 1, opacity, toneMapped: false });
  m.color = glow(color, k); // keep >1 values for bloom
  lineMats.push(m);
  return m;
}
/** Line materials need the viewport size to draw pixel-width lines. */
export function setLineResolution(w: number, h: number) { for (const m of lineMats) m.resolution.set(w, h); }

/** Patch a LineMaterial so every vertex follows the pond wave or the wind. */
export function withLineMotion(m: LineMaterial, kind: "wave" | "wind", ground = 0) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = motion.uTime; sh.uniforms.uAmp = motion.uAmp;
    const chunk = kind === "wave" ? WAVE_GLSL : WIND_GLSL;
    const disp = kind === "wave"
      ? `vec3 dS = instanceStart; dS.y += pondWave(dS.xz); vec3 dE = instanceEnd; dE.y += pondWave(dE.xz);`
      : `vec3 dS = instanceStart; dS.xz += pondWind(dS, max(dS.y - ${ground.toFixed(2)}, 0.0)); vec3 dE = instanceEnd; dE.xz += pondWind(dE, max(dE.y - ${ground.toFixed(2)}, 0.0));`;
    sh.vertexShader = sh.vertexShader
      .replace("uniform float linewidth;", `uniform float linewidth;\n${chunk}`)
      .replace("vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );", `${disp}\n vec4 start = modelViewMatrix * vec4( dS, 1.0 );`)
      .replace("vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );", "vec4 end = modelViewMatrix * vec4( dE, 1.0 );");
  };
  m.needsUpdate = true;
  return m;
}

/** Patch any built-in material so instanced/regular vertices follow the wave (pads) or wind (grass). */
export function withMeshMotion<T extends THREE.Material>(m: T, kind: "wave" | "wind", ground = 0): T {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = motion.uTime; sh.uniforms.uAmp = motion.uAmp;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>\n${kind === "wave" ? WAVE_GLSL : WIND_GLSL}`)
      .replace("#include <project_vertex>", `
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition = modelMatrix * mvPosition;
        ${kind === "wave" ? "mvPosition.y += pondWave(mvPosition.xz);" : `mvPosition.xz += pondWind(mvPosition.xyz, max(mvPosition.y - ${ground.toFixed(2)}, 0.0));`}
        mvPosition = viewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;`);
  };
  m.needsUpdate = true;
  return m;
}

// ── builders ─────────────────────────────────────────────────────────────────
export type P3 = [number, number, number];
export function line(parent: THREE.Object3D, pts: P3[], color: string, opts: LineOpts = {}) {
  const geo = new LineGeometry(); geo.setPositions(pts.flat());
  const l = new Line2(geo, lineMat(color, opts)); l.computeLineDistances(); parent.add(l); return l;
}
/** Many separate segments in one draw call. `segs` = [x1,y1,z1, x2,y2,z2, ...]. */
export function segments(parent: THREE.Object3D, segs: number[], mat: LineMaterial) {
  const geo = new LineSegmentsGeometry(); geo.setPositions(segs);
  const l = new LineSegments2(geo, mat); parent.add(l); return l;
}
export const curve = (pts: P3[], n = 40): P3[] =>
  new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))).getPoints(n).map((v) => [v.x, v.y, v.z]);
export const ringPts = (r: number, n = 96, y = 0, cx = 0, cz = 0): P3[] =>
  Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2), y, cz + r * Math.sin((i / n) * Math.PI * 2)]);
/** Polyline → segment pairs, for batching many lines into one LineSegments2. */
export const toSegs = (pts: P3[]) => pts.slice(1).flatMap((p, i) => [...pts[i], ...p]);

const matCache = new Map<string, THREE.Material>();
const cached = <T extends THREE.Material>(key: string, make: () => T) => (matCache.get(key) ?? matCache.set(key, make()).get(key)) as T;

export type BlobOpts = { pos?: P3; scale?: P3; rot?: P3; t?: number; fill?: number; k?: number };
/** Neon-outlined solid: dark fill + glowing hull (two meshes, shared materials per style). */
export function blob(parent: THREE.Object3D, geom: THREE.BufferGeometry, color: string, { pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0], t = 0.075, fill = 0.35, k = 2.9 }: BlobOpts = {}) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geom, cached(`f${color}${fill}`, () => fillMat(color, fill))));
  g.add(new THREE.Mesh(geom, cached(`h${color}${t}${k}`, () => hullMat(color, t, k))));
  g.position.set(...pos); g.scale.set(...scale); g.rotation.set(...rot);
  parent.add(g); return g;
}

/** Deterministic random, so the scene is identical on every load. */
export function seeded(seed = 11) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return { rnd, R: (a: number, b: number) => a + rnd() * (b - a) };
}
