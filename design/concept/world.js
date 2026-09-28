// janys-ponder concept renderer — neon-outline cyberpunk pond world (side-view cross-section, Ɔ path)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const params = new URLSearchParams(location.search);
const SCENE = params.get('s') || 'hero';
const THEME = params.get('t') || 'night';
const W = +(params.get('w')||1600), H = +(params.get('h')||900);

// ── palette ──────────────────────────────────────────────────────────────────
export const C = {
  frog: '#39ff88', cyan: '#29d3ff', pink: '#ff6ad5', yellow: '#f4ff61',
  purple: '#8b5cff', violet: '#b07cff', water: '#22e4ff', sand: '#ffb057',
  octo: '#4d8dff', turtle: '#22e0b5', fish: '#ffd84a', star: '#ff8a3d',
  crab: '#ff4d6d', jelly: '#ff5fd2', earth: '#07060d', strata: '#3a1f6b',
};
const SKY = THEME === 'dusk'
  ? { top: '#0b0620', mid: '#3a0f4f', hor: '#ff2e88', sun: true }
  : { top: '#020309', mid: '#0a0b1f', hor: '#2a1150', sun: false };

// ── renderer ─────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY.top);

const glow = (hex, k = 1.8) => new THREE.Color(hex).multiplyScalar(k);

// ── materials ────────────────────────────────────────────────────────────────
function hullMat(color, t = 0.06, k = 2.2) {
  return new THREE.ShaderMaterial({
    uniforms: { c: { value: glow(color, k) }, t: { value: t } },
    vertexShader: `uniform float t; void main(){ vec3 p = position + normal * t;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
    fragmentShader: `uniform vec3 c; void main(){ gl_FragColor = vec4(c,1.0); }`,
    side: THREE.BackSide, toneMapped: false,
  });
}
function fillMat(color, amt = 0.35) {
  return new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(color) }, a: { value: amt } },
    vertexShader: `varying vec3 n; varying vec3 v; void main(){
      vec4 mv = modelViewMatrix * vec4(position,1.0); n = normalize(normalMatrix*normal); v = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 c; uniform float a; varying vec3 n; varying vec3 v; void main(){
      float f = pow(1.0 - max(dot(n,v),0.0), 2.5);
      gl_FragColor = vec4(vec3(0.012,0.014,0.025) + c * f * a, 1.0); }`,
    toneMapped: false,
  });
}
const lineMats = [];
function lineMat(color, width = 3, k = 2.0, opacity = 1) {
  const m = new LineMaterial({ color: glow(color, k), linewidth: width, transparent: opacity < 1, opacity, toneMapped: false });
  m.resolution.set(W, H); lineMats.push(m); return m;
}

// ── builders ─────────────────────────────────────────────────────────────────
function blob(parent, geom, color, { pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0], t = 0.06, fill = 0.35, k = 2.2 } = {}) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geom, fillMat(color, fill)));
  g.add(new THREE.Mesh(geom, hullMat(color, t, k)));
  g.position.set(...pos); g.scale.set(...scale); g.rotation.set(...rot);
  parent.add(g); return g;
}
function line(parent, pts, color, width = 3, k = 2.0, opacity = 1) {
  const geo = new LineGeometry();
  geo.setPositions(pts.flatMap(p => [p[0], p[1], p[2] ?? 0]));
  const l = new Line2(geo, lineMat(color, width, k, opacity));
  l.computeLineDistances(); parent.add(l); return l;
}
const curve = (pts, n = 40) => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2] ?? 0))).getPoints(n).map(v => [v.x, v.y, v.z]);
const circle = (r, n = 64, cx = 0, cy = 0, cz = 0) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos(i / n * Math.PI * 2), cy + r * Math.sin(i / n * Math.PI * 2), cz]);
const sph = new THREE.SphereGeometry(1, 48, 32);
const capsule = (r, l) => new THREE.CapsuleGeometry(r, l, 8, 16);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ── the frog (matches public/frog.png) ───────────────────────────────────────
export function frog(parent, pose = 'sit', { pos = [0, 0, 0], s = 1, rotZ = 0 } = {}) {
  const f = new THREE.Group(); parent.add(f);
  f.position.set(...pos); f.scale.setScalar(s); f.rotation.z = rotZ;
  const stretch = pose === 'leap' || pose === 'swim' ? 1.15 : 1;
  blob(f, sph, C.frog, { pos: [0, 1.15, 0], scale: [0.95, 1.05 * stretch, 0.8] });
  blob(f, sph, C.frog, { pos: [0, 2.15 * (stretch > 1 ? 1.05 : 1), 0.05], scale: [1.25, 0.72, 0.85] });
  const hy = 2.15 * (stretch > 1 ? 1.05 : 1);
  for (const sx of [-1, 1]) {
    blob(f, sph, C.frog, { pos: [sx * 0.62, hy + 0.6, 0.1], scale: [0.42, 0.42, 0.42], t: 0.12 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 12, 40), new THREE.MeshBasicMaterial({ color: glow(C.pink, 2.4), toneMapped: false }));
    ring.position.set(sx * 0.62, hy + 0.63, 0.5); f.add(ring);
  }
  line(f, curve([[-0.78, hy + 0.05, 0.74], [-0.3, hy - 0.16, 0.86], [0.3, hy - 0.16, 0.86], [0.78, hy + 0.05, 0.74]]), C.yellow, 3.2, 2.4);
  const legs = (sx) => {
    if (pose === 'tada') {
      const a = 0.65 * -sx;
      blob(f, capsule(0.2, 1.0), C.cyan, { pos: [sx * 1.35, 2.35, 0.3], rot: [0, 0, a] });
      blob(f, sph, C.cyan, { pos: [sx * 1.72, 2.95, 0.3], scale: [0.26, 0.26, 0.26] });
    } else if (pose === 'leap' || pose === 'swim') {
      blob(f, capsule(0.18, 1.0), C.cyan, { pos: [sx * 0.75, 2.6, 0.4], rot: [0, 0, -sx * 0.35] });
    } else {
      blob(f, capsule(0.2, 0.9), C.cyan, { pos: [sx * 0.42, 0.9, 0.55], rot: [0, 0, sx * 0.15] });
      blob(f, sph, C.cyan, { pos: [sx * 0.55, 0.12, 0.72], scale: [0.45, 0.12, 0.3] });
    }
    if (pose === 'leap' || pose === 'swim') {
      blob(f, capsule(0.22, 1.5), C.frog, { pos: [sx * 0.7, -0.35, -0.1], rot: [0, 0, sx * 0.3] });
      blob(f, sph, C.frog, { pos: [sx * 1.05, -1.3, -0.1], scale: [0.35, 0.14, 0.3], rot: [0, 0, sx * 0.3] });
    } else if (pose === 'tada' && sx > 0) {
      blob(f, sph, C.frog, { pos: [sx * 0.85, 0.55, -0.05], scale: [0.55, 0.45, 0.9] });
      blob(f, capsule(0.2, 1.2), C.frog, { pos: [1.75, 0.3, 0.1], rot: [0, 0, -1.25] });
      blob(f, sph, C.frog, { pos: [2.5, 0.08, 0.1], scale: [0.4, 0.13, 0.3] });
    } else {
      blob(f, sph, C.frog, { pos: [sx * 0.85, 0.55, -0.05], scale: [0.55, 0.45, 0.9] });
      blob(f, sph, C.frog, { pos: [sx * 1.2, 0.1, 0.25], scale: [0.5, 0.12, 0.3] });
    }
  };
  legs(-1); legs(1);
  return f;
}

// ── client animals ───────────────────────────────────────────────────────────
export function octopus(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  blob(g, sph, C.octo, { pos: [0, 1.3, 0], scale: [1.05, 1.25, 0.95] });
  for (const sx of [-1, 1]) {
    line(g, circle(0.28, 40, sx * 0.4, 1.45, 0.98), '#e6f3ff', 3, 2.2);
    line(g, circle(0.09, 20, sx * 0.4, 1.42, 1.0), C.pink, 3, 2.4);
  }
  for (let i = 0; i < 6; i++) {
    const x0 = -0.85 + i * 0.34, d = x0 * 1.6, cz = 0.2 + (i % 2) * 0.2;
    const pts = [[x0, 0.4, cz], [x0 * 1.3, -0.4, cz], [d, -1.3, cz], [d + (i < 3 ? -0.4 : 0.4), -1.9, cz], [d + (i < 3 ? -0.15 : 0.15), -2.2, cz]];
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 40, 0.15, 10);
    blob(g, tube, C.octo, { t: 0.045 });
  }
  return g;
}
export function jellyfish(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  blob(g, new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), C.jelly, { pos: [0, 0.5, 0], scale: [1.1, 0.85, 1.1], fill: 0.6 });
  blob(g, sph, C.jelly, { pos: [0, 0.75, 0], scale: [0.35, 0.3, 0.35], k: 3 });
  for (let i = 0; i < 7; i++) {
    const x = -0.9 + i * 0.3;
    line(g, Array.from({ length: 30 }, (_, j) => [x + Math.sin(j * 0.45 + i) * 0.12, 0.45 - j * 0.1, 0.3]), C.jelly, 2.2, 1.8, 0.9);
  }
  return g;
}
export function turtle(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  blob(g, sph, C.turtle, { pos: [0, 0, 0], scale: [1.35, 0.6, 1] });
  line(g, [[-0.9, 0.35, 0.75], [-0.3, 0.5, 0.85], [0.3, 0.5, 0.85], [0.9, 0.35, 0.75]], C.turtle, 2.2, 1.6);
  blob(g, sph, C.turtle, { pos: [1.6, 0.15, 0.2], scale: [0.42, 0.36, 0.36] });
  line(g, circle(0.07, 12, 1.78, 0.25, 0.55), C.pink, 3, 2.4);
  blob(g, sph, C.turtle, { pos: [0.6, -0.55, 0.5], scale: [0.7, 0.14, 0.3], rot: [0, 0, -0.5] });
  blob(g, sph, C.turtle, { pos: [-0.9, -0.5, 0.5], scale: [0.45, 0.12, 0.25], rot: [0, 0, 0.5] });
  for (const [dx, dy] of [[-2.2, -0.9], [-1.4, -1.35]]) { // hatchlings
    const h = new THREE.Group(); h.position.set(dx, dy, 0.3); h.scale.setScalar(0.3); g.add(h);
    blob(h, sph, C.turtle, { scale: [1.35, 0.6, 1], t: 0.15 }); blob(h, sph, C.turtle, { pos: [1.6, 0.15, 0.2], scale: [0.42, 0.36, 0.36], t: 0.2 });
  }
  return g;
}
export function flyingFish(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  blob(g, sph, C.fish, { scale: [1.3, 0.42, 0.42], rot: [0, 0, 0.15] });
  line(g, circle(0.08, 12, 0.95, 0.2, 0.4), C.pink, 3, 2.4);
  line(g, [[-0.1, 0.25, 0.3], [-1.2, 1.9, 0.3], [-1.6, 0.35, 0.3], [-0.1, 0.25, 0.3]], C.fish, 2.6, 2);
  line(g, [[-0.2, 0.2, 0.2], [-0.4, 1.5, 0.2], [-0.9, 0.3, 0.2]], C.fish, 1.8, 1.4, 0.8);
  line(g, [[-1.25, -0.1, 0], [-2.0, 0.55, 0], [-1.8, -0.1, 0], [-2.0, -0.7, 0], [-1.25, -0.1, 0]], C.fish, 2.6, 2);
  return g;
}
export function starfish(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  const pts = []; for (let i = 0; i <= 10; i++) { const r = i % 2 ? 0.5 : 1.3, a = Math.PI / 2 + i * Math.PI / 5; pts.push([Math.cos(a) * r, Math.sin(a) * r, 0.2]); }
  const shape = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: '#0a0507' })); m.position.z = 0.18; g.add(m);
  line(g, curve(pts.map(p => [p[0], p[1], 0.22]), 120), C.star, 3.2, 2.2);
  for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + i * Math.PI * 2 / 5; line(g, circle(0.06, 10, Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0.25), C.star, 2.5, 2.4); }
  line(g, circle(0.09, 12, -0.2, 0.15, 0.25), C.pink, 3, 2.4); line(g, circle(0.09, 12, 0.2, 0.15, 0.25), C.pink, 3, 2.4);
  return g;
}
export function crab(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  blob(g, sph, C.crab, { scale: [1.15, 0.55, 0.7] });
  for (const sx of [-1, 1]) {
    line(g, [[sx * 0.3, 0.4, 0.4], [sx * 0.35, 0.95, 0.4]], C.crab, 2.4, 2); line(g, circle(0.1, 14, sx * 0.35, 1.05, 0.45), C.pink, 3, 2.4);
    line(g, [[sx * 1.0, 0.1, 0.3], [sx * 1.5, 0.6, 0.3], [sx * 1.6, 0.9, 0.3]], C.crab, 2.6, 2);
    blob(g, sph, C.crab, { pos: [sx * 1.7, 1.15, 0.3], scale: [0.42, 0.3, 0.3], rot: [0, 0, sx * 0.4] });
    for (let i = 0; i < 3; i++) line(g, [[sx * (0.6 + i * 0.15), -0.25, 0.3], [sx * (1.1 + i * 0.25), -0.5, 0.3], [sx * (1.3 + i * 0.25), -0.95, 0.3]], C.crab, 2.2, 1.8);
  }
  return g;
}
function bottle(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); g.rotation.z = -1.2; parent.add(g);
  const prof = [[0, 0], [0.55, 0], [0.62, 0.1], [0.62, 1.3], [0.45, 1.7], [0.2, 1.9], [0.2, 2.4], [0, 2.4]].map(p => new THREE.Vector2(...p));
  blob(g, new THREE.LatheGeometry(prof, 40), C.cyan, { fill: 0.8, t: 0.05 });
  blob(g, new THREE.CylinderGeometry(0.19, 0.17, 0.35, 20), C.sand, { pos: [0, 2.5, 0] });
  line(g, curve([[-0.2, 0.4, 0.3], [0.05, 0.7, 0.35], [-0.1, 1.0, 0.35], [0.15, 1.2, 0.3]]), C.pink, 2.6, 2.2);
  return g;
}

// ── world pieces ─────────────────────────────────────────────────────────────
function gradientPlane(w, h, pos, stops, opacity = 1) {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 512;
  const cx = cv.getContext('2d'); const gr = cx.createLinearGradient(0, 0, 0, 512);
  stops.forEach(([o, c]) => gr.addColorStop(o, c)); cx.fillStyle = gr; cx.fillRect(0, 0, 4, 512);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 }));
  m.position.set(...pos); scene.add(m); return m;
}
function neonText(text, color, { size = 1, pos = [0, 0, 0], font = '700 110px "JetBrains Mono", monospace' } = {}) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256; const x = cv.getContext('2d');
  x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = color; x.shadowBlur = 24; x.fillStyle = color; x.fillText(text, 512, 128); x.shadowBlur = 0; x.fillStyle = '#ffffff'; x.globalAlpha = 0.55; x.fillText(text, 512, 128);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4 * size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
  m.position.set(...pos); scene.add(m); return m;
}

const WATER_X = 10.5, SURF = -0.6, FLOOR = -62, EARTH_BOTTOM = -47;
const TERR_X = [-8, -2, 4];

function buildWorld() {
  // sky + far haze
  gradientPlane(600, 200, [0, 60, -120], [[0, SKY.top], [0.55, SKY.mid], [1, SKY.hor]]);
  // stars
  const sp = []; for (let i = 0; i < 500; i++) sp.push((rnd() - 0.5) * 260, 5 + rnd() * 90, -110);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: glow('#cfd8ff', 1.2), size: 1.6, sizeAttenuation: false, toneMapped: false })));

  // sun (dusk: synthwave stripes) / moon (night)
  if (SKY.sun) {
    const sun = new THREE.Mesh(new THREE.CircleGeometry(14, 96), new THREE.ShaderMaterial({
      vertexShader: `varying vec2 u; void main(){ u = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec2 u; void main(){ vec3 c = mix(vec3(1.0,0.2,0.55), vec3(1.0,0.85,0.3), u.y);
        float band = step(0.5, fract(u.y*14.0)) + step(0.55, u.y); if(band < 0.5) discard; gl_FragColor = vec4(c*0.85,1.0); }`,
      toneMapped: false }));
    sun.position.set(34, 6, -100); scene.add(sun);
  } else {
    const moon = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64), new THREE.MeshBasicMaterial({ color: glow('#ffe9f7', 0.95), toneMapped: false }));
    moon.position.set(30, 30, -100); scene.add(moon);
    line(scene, circle(4.2, 96, 30, 30, -100), C.pink, 2, 1.8, 0.7);
  }

  // distant neon skyline across the bay
  for (let i = 0; i < 46; i++) {
    const w = 2 + rnd() * 4, h = 2 + rnd() * (i % 5 === 0 ? 14 : 7), x = -110 + i * 5 + rnd() * 2;
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2), new THREE.MeshBasicMaterial({ color: '#05040b' }));
    box.position.set(x, h / 2 - 0.6, -70); scene.add(box);
    const col = [C.pink, C.cyan, C.violet][i % 3];
    line(scene, [[x - w / 2, -0.6, -68.9], [x - w / 2, h - 0.6, -68.9], [x + w / 2, h - 0.6, -68.9], [x + w / 2, -0.6, -68.9]], col, 1.2, 1.0, 0.28);
    for (let k = 0; k < h / 1.6; k++) if (rnd() > 0.55) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.18), new THREE.MeshBasicMaterial({ color: glow(rnd() > 0.5 ? C.yellow : C.cyan, 0.55), toneMapped: false }));
      win.position.set(x - w / 2 + 0.5 + rnd() * (w - 1), 0.5 + k * 1.5, -68.8); scene.add(win);
    }
  }

  // water body (behind actors) + bottom arm under the land
  gradientPlane(160, -SURF - FLOOR + 6, [WATER_X + 70, (SURF + FLOOR - 6) / 2, -5],
    [[0, '#0a3a66'], [0.18, '#062749'], [0.6, '#03142b'], [1, '#01060f']]);
  gradientPlane(140, 20, [-50 + WATER_X, FLOOR + 7, -5], [[0, '#03142b'], [1, '#01060f']]);

  // earth cut-away (land mass above the seabed tunnel)
  const ep = [[-90, 0], [8, 0], [9.5, -0.3], [13, -1.6], [12.5, -6], [13.6, -14], [12.2, -24], [13.2, -34], [11.6, -43], [8, EARTH_BOTTOM + 0.5],
    [0, EARTH_BOTTOM + 1], [-6, EARTH_BOTTOM - 0.5], [-14, EARTH_BOTTOM + 0.8], [-24, EARTH_BOTTOM - 0.2], [-40, EARTH_BOTTOM + 0.6], [-90, EARTH_BOTTOM]];
  const earth = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(ep.map(p => new THREE.Vector2(...p)))), new THREE.MeshBasicMaterial({ color: C.earth }));
  earth.position.z = 2; scene.add(earth);
  line(scene, ep.slice(1, 10).map(p => [p[0], p[1], 2.01]), C.water, 2, 1.4, 0.8);
  line(scene, ep.slice(9).map(p => [p[0], p[1], 2.01]), C.violet, 2, 1.4, 0.8);
  for (let i = 1; i < 9; i++) { // strata lines
    const y = -i * 5; line(scene, Array.from({ length: 30 }, (_, j) => [-90 + j * 3.4, y + Math.sin(j * 0.7 + i) * 0.4, 2.01]).filter(p => p[0] < 11 - (i > 1 ? 0 : 3)), C.strata, 1.2, 1.2, 0.6);
  }
  // stalactites under land
  for (let x = -40; x < 9; x += 3.2) line(scene, [[x, EARTH_BOTTOM + 0.3, 2.01], [x + 0.5, EARTH_BOTTOM - 1.2 - rnd() * 1.6, -1.9], [x + 1.1, EARTH_BOTTOM + 0.3, -1.9]], C.violet, 1.6, 1.4, 0.7);

  // land top: grid plane + front edge
  const lt = new THREE.Group(); scene.add(lt);
  for (let z = -14; z <= 2; z += 4) line(lt, [[-90, 0, z], [8, 0, z]], C.frog, 1.1, 0.7, z === 2 ? 1 : 0.18);
  for (let x = -60; x <= 8; x += 3) line(lt, [[x, 0, -14], [x, 0, 2]], C.frog, 1, 0.7, 0.12);
  line(scene, [[-90, 0, 2.02], [8, 0, 2.02], [9.5, -0.3, 2.02], [13, -1.6, 2.02]], C.frog, 2.6, 1.9);
  // beach slope grid
  for (let z = -14; z <= 2; z += 2) line(scene, [[8, 0, z], [13, -1.6, z]], C.sand, 1.2, 1.2, 0.5);
  // reeds
  for (let i = 0; i < 26; i++) { const x = -24 + rnd() * 30; if (Math.abs(x - TERR_X[0]) < 2.4 || Math.abs(x - TERR_X[1]) < 2.4 || Math.abs(x - TERR_X[2]) < 2.4) continue;
    line(scene, curve([[x, 0, 1.5], [x + 0.1, 0.5 + rnd() * 0.3, 1.5], [x + 0.3 * (rnd() - 0.3), 0.9 + rnd() * 0.6, 1.5]], 8), C.frog, 1.6, 1.3, 0.8); }

  // water surface: wavy wire lines + bright cut edge
  const wave = (x, z) => SURF + Math.sin(x * 0.45 + z * 0.8) * 0.18 + Math.sin(x * 0.17 - z * 0.3) * 0.12;
  for (let z = -18; z <= 2; z += 2) line(scene, Array.from({ length: 90 }, (_, i) => { const x = WATER_X + 1 + i * 1.2; return [x, wave(x, z), z]; }), C.water, z === 2 ? 3 : 1.2, z === 2 ? 2.4 : 1.2, z === 2 ? 1 : 0.4);
  // scan lines underwater
  for (let y = -3; y > FLOOR; y -= 2.2) line(scene, [[WATER_X + 3, y, -4.5], [130, y, -4.5]], '#1a6fff', 1, 0.8, 0.12);
  // light shafts
  for (let i = 0; i < 7; i++) {
    const x = 16 + i * 5.5, sh = new THREE.Mesh(new THREE.PlaneGeometry(1.6 + rnd() * 2, 34), new THREE.MeshBasicMaterial({ color: '#7fe8ff', transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false }));
    sh.position.set(x, -17, -3.5); sh.rotation.z = 0.25; scene.add(sh);
  }
  // particles / bubbles
  const bp = []; for (let i = 0; i < 700; i++) bp.push(WATER_X + 3 + rnd() * 60, SURF - 1 - rnd() * 60, -3 + rnd() * 6);
  for (let i = 0; i < 300; i++) bp.push(-40 + rnd() * 55, FLOOR + 1 + rnd() * 12, -3 + rnd() * 6);
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
  scene.add(new THREE.Points(bg, new THREE.PointsMaterial({ color: glow('#9ff4ff', 1.3), size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.6, toneMapped: false })));

  // seabed floor with cyber grid
  for (let z = -16; z <= 4; z += 2) line(scene, [[-60, FLOOR, z], [130, FLOOR, z]], C.cyan, z === 4 ? 2.4 : 1.2, 1.3, z === 4 ? 0.9 : 0.35);
  for (let x = -60; x <= 130; x += 3) line(scene, [[x, FLOOR, -16], [x, FLOOR, 4]], C.cyan, 1, 1, 0.22);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(200, 20), new THREE.MeshBasicMaterial({ color: '#04050c' })); sand.rotation.x = -Math.PI / 2; sand.position.set(35, FLOOR - 0.02, -6); scene.add(sand);
  // kelp + rocks
  for (let i = 0; i < 16; i++) { const x = -34 + i * 4.5 + rnd() * 2; if (x > -8 && x < 6) continue; const h = 3 + rnd() * 6;
    line(scene, Array.from({ length: 20 }, (_, j) => [x + Math.sin(j * 0.5 + i) * 0.35, FLOOR + j * h / 19, -1 + (i % 3)]), i % 2 ? C.frog : C.turtle, 2, 1.5, 0.85); }
  for (const [x, s] of [[-12, 1.2], [9, 0.9], [14, 1.4], [-20, 0.8]]) blob(scene, new THREE.DodecahedronGeometry(1, 0), C.purple, { pos: [x, FLOOR + s * 0.6, 0], scale: [s * 1.4, s, s], t: 0.07, fill: 0.5 });

  // terraces (purple stacked slabs, level, in a row)
  TERR_X.forEach((x, i) => {
    for (let k = 0; k < 3; k++) blob(scene, new RoundedBoxGeometry(4.4 - k * 0.5, 0.48, 3 - k * 0.3, 4, 0.2), [C.purple, C.violet, '#a78bff'][k],
      { pos: [x, 0.25 + k * 0.5, -0.5], t: 0.05, fill: 0.5 });
  });

  // pier (diving board)
  blob(scene, new RoundedBoxGeometry(7, 0.3, 2.4, 3, 0.1), C.sand, { pos: [14.5, 0.55, -0.4], t: 0.05, fill: 0.4 });
  for (const x of [11.8, 14.5, 17.2]) blob(scene, new THREE.CylinderGeometry(0.14, 0.14, 4.2, 12), C.sand, { pos: [x, -1.6, 0.6], t: 0.04 });

  // palm
  line(scene, curve([[9.2, 0, 0.5], [8.8, 2.5, 0.5], [9.4, 5, 0.5], [10.6, 7.2, 0.5]]), C.pink, 3.4, 2.2);
  for (const [dx, dy] of [[3, -1.6], [2.6, 0.6], [-2.6, -1.4], [-1.6, 1.2], [0.6, 2.2]])
    line(scene, curve([[10.6, 7.2, 0.5], [10.6 + dx * 0.55, 7.2 + dy * 0.5 + 0.8, 0.5], [10.6 + dx, 7.2 + dy, 0.5]], 16), C.pink, 2.8, 2.1);

  // signpost
  blob(scene, new THREE.CylinderGeometry(0.14, 0.14, 3.2, 12), C.sand, { pos: [-18, 1.6, -0.6], t: 0.04 });
  blob(scene, new RoundedBoxGeometry(5.4, 1.5, 0.3, 3, 0.12), C.frog, { pos: [-18, 3.3, -0.6], t: 0.05, fill: 0.3 });
  neonText('janys-ponder', '#7dffb0', { size: 1.1, pos: [-18, 3.3, -0.4] });

  // thought cloud
  const bumps = [[-2.4, -0.2, 1.1], [-1.1, 0.6, 1.25], [0.6, 0.85, 1.35], [2.1, 0.2, 1.1], [1.3, -0.7, 1.0], [-0.6, -0.7, 1.0]];
  const cloud = [];
  for (let i = 0; i <= 180; i++) { const a = i / 180 * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a); let best = 0;
    for (const [bx, by, r] of bumps) { const b = bx * dx + by * dy, c = bx * bx + by * by - r * r, disc = b * b - c; if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc)); }
    cloud.push([dx * best, dy * best * 0.8, 0]); }
  const cg = new THREE.Group(); cg.position.set(-4.5, 8.2, -3); scene.add(cg);
  line(cg, cloud, '#3d7bff', 3, 2.2);
  const cf = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(cloud.map(p => new THREE.Vector2(p[0], p[1])))), new THREE.MeshBasicMaterial({ color: '#050818' })); cf.position.z = -0.05; cg.add(cf);
  return { cg };
}

// ── labels (DOM anchored to world points) ────────────────────────────────────
export function project(camera, x, y, z = 0) {
  const v = new THREE.Vector3(x, y, z).project(camera);
  return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H];
}

// ── scenes ───────────────────────────────────────────────────────────────────
const ISO = ['lineup', 'frogs'].includes(SCENE);
const world = ISO ? { cg: { visible: false } } : buildWorld();
let camera;
const persp = (cx, cy, d, fov = 35, look = [0, -0.12]) => {
  camera = new THREE.PerspectiveCamera(fov, W / H, 0.1, 400);
  camera.position.set(cx, cy, d); camera.lookAt(cx + look[0] * d, cy + look[1] * d * 0.2, 0);
};

const S = {
  hero() { persp(-2.5, 6.2, 34); frog(scene, 'sit', { pos: [-12.6, 0, 0.3], s: 1.05 });
    for (const [x, y, r] of [[-10.9, 4.3, 0.12], [-9.3, 5.6, 0.18], [-7.6, 6.8, 0.26]]) line(scene, circle(r, 24, x, y, -1), '#3d7bff', 2.4, 2); },
  hop() { persp(1.5, 5.4, 30); frog(scene, 'leap', { pos: [0.6, 3.2, 0.3], rotZ: -0.5, s: 1.0 });
    line(scene, curve([[-7.7, 1.8, 0.2], [-5, 4.6, 0.2], [-2.2, 4.8, 0.2], [0.2, 3.4, 0.2]], 30), C.frog, 1.6, 1.4, 0.5); },
  dive() { persp(12, 0.5, 26, 38); frog(scene, 'leap', { pos: [19.8, 1.9, 0.6], rotZ: -2.2, s: 0.95 });
    line(scene, curve([[16.6, 1.2, 0.6], [18, 3.7, 0.6], [19.5, 3.4, 0.6]], 20), C.frog, 1.6, 1.4, 0.5);
    for (const r of [0.8, 1.6, 2.5]) line(scene, Array.from({ length: 49 }, (_, i) => { const a = i / 48 * Math.PI * 2; return [21.5 + Math.cos(a) * r, SURF + 0.05, Math.sin(a) * r * 0.5]; }), '#bff6ff', 2, 2, 1 - r * 0.28);
    for (let i = 0; i < 9; i++) line(scene, [[21.5 + (i - 4) * 0.25, SURF, 0.5], [21.5 + (i - 4) * 0.5, SURF + 1.1 + (i % 3) * 0.5, 0.5]], '#bff6ff', 1.8, 1.8, 0.8);
    octopus(scene, [24, -8.5, -1], 0.9); },
  under() { persp(24, -7, 24, 38, [0, 0]);
    octopus(scene, [15.5, -8, 0], 1.25); frog(scene, 'tada', { pos: [31.5, -10.4, 0.3], s: 1.1 });
    turtle(scene, [22, -19.5, -1], 0.9); },
  seabed() { persp(-2, -54.5, 22, 40, [0, -0.25]);
    bottle(scene, [-6.5, FLOOR + 0.62, 1.2], 1.0); frog(scene, 'sit', { pos: [-11.5, FLOOR, 1.2], s: 1.0 });
    jellyfish(scene, [-15.5, -50.5, -2], 0.8); crab(scene, [-1, FLOOR + 0.55, -2], 0.6); },
  map() {
    camera = new THREE.OrthographicCamera(-W / H * 38, W / H * 38, 38, -38, 0.1, 400);
    camera.position.set(10, -28, 60); camera.lookAt(10, -28, 0);
    frog(scene, 'sit', { pos: [-15, 0, 0.3], s: 0.8 });
    frog(scene, 'swim', { pos: [19, -30, 1], s: 0.7, rotZ: Math.PI });
    frog(scene, 'sit', { pos: [-11.5, FLOOR, 1.2], s: 0.8 });
    octopus(scene, [22, -7, 0], 0.7); turtle(scene, [26, -15, 0], 0.7); flyingFish(scene, [22, -22.5, 0], 0.8);
    starfish(scene, [27, -30, 0], 0.8); crab(scene, [22, -37, 0], 0.7); jellyfish(scene, [27, -43, 0], 0.75);
    bottle(scene, [-6.5, FLOOR + 0.62, 1.2], 0.8);
    line(scene, curve([[-15, 4, 3], [-8, 3.5, 3], [-2, 3.5, 3], [4, 3.5, 3], [14, 4.5, 3], [19, 1, 3], [19, -20, 3], [19, -45, 3], [15, -55, 3], [5, -57, 3], [-10, -57, 3]], 200), '#ffffff', 2, 1.4, 0.45);
  },
  lineup() { persp(0.5, 0.2, 31, 38, [0, 0]);
    gradientPlane(80, 30, [0, 0, -8], [[0, '#041a33'], [1, '#01060f']]);
    octopus(scene, [-12.5, -0.6, 0], 0.95); turtle(scene, [-6.5, 0.2, 0], 0.95); flyingFish(scene, [-1, 0.4, 0], 1.0);
    starfish(scene, [4.2, 0.2, 0], 1.05); crab(scene, [9, -0.1, 0], 0.9); jellyfish(scene, [13.6, 0.5, 0], 0.9); },
  frogs() { persp(1.2, 1.8, 24, 38, [0, 0]);
    gradientPlane(80, 40, [0, 0, -8], [[0, '#07061a'], [1, '#02030a']]);
    for (let z = -6; z <= 2; z += 2) line(scene, [[-20, 0, z], [20, 0, z]], C.frog, 1.2, 1.1, 0.35);
    frog(scene, 'sit', { pos: [-8.5, 0, 0] }); frog(scene, 'leap', { pos: [-2.6, 1.6, 0], rotZ: -0.5 });
    frog(scene, 'tada', { pos: [3, 0, 0] }); frog(scene, 'swim', { pos: [9.2, 3.0, 0], rotZ: -Math.PI / 2, s: 0.9 }); },
};
(S[SCENE] || S.hero)();
if (!['hero', 'hop', 'map'].includes(SCENE)) world.cg.visible = false;

// ── render with bloom ────────────────────────────────────────────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.62, 0.45, 0.32));
composer.addPass(new OutputPass());
composer.render();
window.__camera = camera; window.__project = (x, y, z) => project(camera, x, y, z);
window.dispatchEvent(new Event('world-ready'));
