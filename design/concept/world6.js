// janys-ponder — v2 "painterly cyber-pond" homepage.
// Painterly, lit environment (textured pads, glowing lotus, reflective water, haze, city, pagoda)
// + neon-outlined characters (the frog) and UI objects. Refs: design/references/*.webp
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const params = new URLSearchParams(location.search);
const W = +(params.get('w') || 1600), H = +(params.get('h') || 900);
const THEME = params.get('t') || 'night';
// Performance budget: phones / low tier skip the mirror reflection, halve geometry and drop minor lights.
const MOBILE = W < H; const LOW = MOBILE || params.get('q') === 'low';
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const R = (a, b) => a + rnd() * (b - a);

const SKY = THEME === 'dusk'
  ? { top: '#1a0f3a', mid: '#5a2a78', hor: '#ff8fc8', fog: '#6a4a8a' }
  : { top: '#050818', mid: '#141c44', hor: '#5a6aa8', fog: '#262d5a' };

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(SKY.fog, 45, 320);

const C = { frog: '#39ff88', cyan: '#29d3ff', pink: '#ff6ad5', yellow: '#f4ff61', purple: '#8b5cff', violet: '#b07cff', sand: '#ffb057' };
const glow = (hex, k = 1.8) => new THREE.Color(hex).multiplyScalar(k);

// ── canvas texture helpers ──────────────────────────────────────────────────
function canvasTex(w, h, draw, srgb = true) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4; return t;
}
function speckle(x, w, h, n, colors, a = 0.08, r = 1.5) {
  for (let i = 0; i < n; i++) { x.globalAlpha = a * rnd(); x.fillStyle = colors[i % colors.length]; x.beginPath(); x.arc(rnd() * w, rnd() * h, rnd() * r + 0.3, 0, 7); x.fill(); }
  x.globalAlpha = 1;
}

// lily pad albedo: soft radial gradient, veins, mottling, darker rim
function padAlbedo(hue = 0) {
  return canvasTex(512, 512, (x, w) => {
    const c = w / 2;
    const g = x.createRadialGradient(c, c, 10, c, c, c);
    const base = [['#5fb07e', '#2f7c55', '#1a4a3a'], ['#6cba84', '#3a8a5c', '#1f5540'], ['#52a276', '#296e4d', '#163f33']][hue];
    g.addColorStop(0, base[0]); g.addColorStop(0.55, base[1]); g.addColorStop(1, base[2]); x.globalCompositeOperation = 'source-over';
    x.fillStyle = g; x.fillRect(0, 0, w, w);
    speckle(x, w, w, 2500, ['#9fd6b5', '#1d3d36', '#5d9d80'], 0.12, 3);
    // mottled patches
    for (let i = 0; i < 40; i++) { x.globalAlpha = 0.06; x.fillStyle = rnd() > 0.5 ? '#a6d8bb' : '#1c3a33'; x.beginPath(); x.ellipse(rnd() * w, rnd() * w, R(10, 50), R(8, 30), rnd() * 3, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    // veins
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + R(-0.04, 0.04);
      x.strokeStyle = 'rgba(190,235,205,0.45)'; x.lineWidth = 2.2;
      x.beginPath(); x.moveTo(c, c);
      const bend = R(-0.08, 0.08);
      x.quadraticCurveTo(c + Math.cos(a + bend) * c * 0.5, c + Math.sin(a + bend) * c * 0.5, c + Math.cos(a) * c * 0.97, c + Math.sin(a) * c * 0.97); x.stroke();
      x.strokeStyle = 'rgba(20,50,40,0.35)'; x.lineWidth = 1.2; x.stroke();
      // branch veins
      for (let k = 1; k < 4; k++) { const rr = c * (0.35 + k * 0.17); x.strokeStyle = 'rgba(170,220,190,0.18)'; x.lineWidth = 1;
        x.beginPath(); x.moveTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); x.lineTo(c + Math.cos(a + 0.12) * (rr + 22), c + Math.sin(a + 0.12) * (rr + 22)); x.stroke(); }
    }
    x.fillStyle = 'rgba(220,255,230,0.5)'; x.beginPath(); x.arc(c, c, 7, 0, 7); x.fill();
    // rim
    x.strokeStyle = 'rgba(15,35,30,0.7)'; x.lineWidth = 10; x.beginPath(); x.arc(c, c, c - 5, 0, 7); x.stroke();
    x.strokeStyle = 'rgba(170,230,195,0.35)'; x.lineWidth = 2; x.beginPath(); x.arc(c, c, c - 11, 0, 7); x.stroke();
  });
}
// circuit emissive (ref 2): cyan traces + pink rim
function padCircuit() {
  return canvasTex(512, 512, (x, w) => {
    const c = w / 2; x.fillStyle = '#000'; x.fillRect(0, 0, w, w);
    x.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const a0 = i / 16 * Math.PI * 2 + R(-0.1, 0.1); let r = R(40, 90), a = a0;
      x.strokeStyle = '#3ff0ff'; x.lineWidth = R(2, 4); x.shadowColor = '#3ff0ff'; x.shadowBlur = 8;
      x.beginPath(); x.moveTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
      while (r < c - 30) { if (rnd() < 0.35) { a += R(-0.18, 0.18); } else { r += R(20, 50); } x.lineTo(c + Math.cos(a) * Math.min(r, c - 30), c + Math.sin(a) * Math.min(r, c - 30)); }
      x.stroke(); x.fillStyle = '#9ffcff'; x.beginPath(); x.arc(c + Math.cos(a) * (c - 30), c + Math.sin(a) * (c - 30), 4, 0, 7); x.fill();
    }
    x.shadowColor = '#ff3fa8'; x.shadowBlur = 14; x.strokeStyle = '#ff4fb4'; x.lineWidth = 9; x.beginPath(); x.arc(c, c, c - 7, 0, 7); x.stroke();
  });
}
// lily pad geometry: polar grid with a notch, curled + wavy rim
function padGeo(r, notch = 0.22) {
  const rings = 10, segs = 72, pos = [], uv = [], idx = [];
  const a0 = notch / 2, a1 = Math.PI * 2 - notch / 2;
  pos.push(0, 0, 0); uv.push(0.5, 0.5);
  for (let i = 1; i <= rings; i++) for (let j = 0; j <= segs; j++) {
    const t = i / rings, a = a0 + (a1 - a0) * j / segs, rr = r * t;
    const lift = Math.pow(t, 5) * r * 0.09 + Math.sin(a * 7) * Math.pow(t, 6) * r * 0.025;
    pos.push(Math.cos(a) * rr, Math.sin(a) * rr, lift); uv.push(0.5 + Math.cos(a) * t * 0.5, 0.5 + Math.sin(a) * t * 0.5);
  }
  const row = segs + 1;
  for (let j = 0; j < segs; j++) idx.push(0, 1 + j, 2 + j);
  for (let i = 1; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = 1 + (i - 1) * row + j, b = a + 1, c = 1 + i * row + j, d = c + 1; idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  g.rotateX(-Math.PI / 2); return g;
}

// ── lines / neon helpers (for characters + UI objects) ──────────────────────
function lineMat(color, width = 3, k = 2.0, opacity = 1) {
  const m = new LineMaterial({ color: glow(color, k), linewidth: width, transparent: opacity < 1, opacity, toneMapped: false });
  m.resolution.set(W, H); return m;
}
function line(parent, pts, color, width = 3, k = 2.0, opacity = 1) {
  const geo = new LineGeometry(); geo.setPositions(pts.flatMap(p => [p[0], p[1], p[2] ?? 0]));
  const l = new Line2(geo, lineMat(color, width, k, opacity)); l.computeLineDistances(); parent.add(l); return l;
}
const curve = (pts, n = 40) => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2] ?? 0))).getPoints(n).map(v => [v.x, v.y, v.z]);
const ringPts = (r, n = 96, y = 0, cx = 0, cz = 0) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos(i / n * 6.2832), y, cz + r * Math.sin(i / n * 6.2832)]);
function hullMat(color, t = 0.075, k = 2.9) {
  return new THREE.ShaderMaterial({ uniforms: { c: { value: glow(color, k) }, t: { value: t } },
    vertexShader: `uniform float t; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * t, 1.0); }`,
    fragmentShader: `uniform vec3 c; void main(){ gl_FragColor = vec4(c,1.0); }`, side: THREE.BackSide, toneMapped: false, fog: false });
}
function fillMat(color, amt = 0.35) {
  return new THREE.ShaderMaterial({ uniforms: { c: { value: new THREE.Color(color) }, a: { value: amt } },
    vertexShader: `varying vec3 n; varying vec3 v; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); n = normalize(normalMatrix*normal); v = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 c; uniform float a; varying vec3 n; varying vec3 v; void main(){ float f = pow(1.0 - max(dot(n,v),0.0), 2.5); gl_FragColor = vec4(vec3(0.012,0.014,0.03) + c * f * a, 1.0); }`, toneMapped: false });
}
function blob(parent, geom, color, { pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0], t = 0.06, fill = 0.35, k = 2.2 } = {}) {
  const g = new THREE.Group(); g.add(new THREE.Mesh(geom, fillMat(color, fill))); g.add(new THREE.Mesh(geom, hullMat(color, t, k)));
  g.position.set(...pos); g.scale.set(...scale); g.rotation.set(...rot); parent.add(g); return g;
}
const sph = new THREE.SphereGeometry(1, 48, 32);
const capsule = (r, l) => new THREE.CapsuleGeometry(r, l, 8, 16);
function frog(parent, { pos = [0, 0, 0], s = 1 } = {}) {
  const f = new THREE.Group(); parent.add(f); f.position.set(...pos); f.scale.setScalar(s);
  blob(f, sph, C.frog, { pos: [0, 1.15, 0], scale: [0.95, 1.05, 0.8] });
  blob(f, sph, C.frog, { pos: [0, 2.15, 0.05], scale: [1.25, 0.72, 0.85] });
  for (const sx of [-1, 1]) {
    blob(f, sph, C.frog, { pos: [sx * 0.62, 2.75, 0.1], scale: [0.42, 0.42, 0.42], t: 0.12 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 12, 40), new THREE.MeshBasicMaterial({ color: glow(C.pink, 2.4), toneMapped: false })); ring.position.set(sx * 0.62, 2.78, 0.5); f.add(ring);
    blob(f, capsule(0.2, 0.9), C.cyan, { pos: [sx * 0.42, 0.9, 0.55], rot: [0, 0, sx * 0.15] });
    blob(f, sph, C.cyan, { pos: [sx * 0.55, 0.12, 0.72], scale: [0.45, 0.12, 0.3] });
    blob(f, sph, C.frog, { pos: [sx * 0.85, 0.55, -0.05], scale: [0.55, 0.45, 0.9] });
    blob(f, sph, C.frog, { pos: [sx * 1.2, 0.1, 0.25], scale: [0.5, 0.12, 0.3] });
  }
  line(f, curve([[-0.78, 2.2, 0.74], [-0.3, 1.99, 0.86], [0.3, 1.99, 0.86], [0.78, 2.2, 0.74]]), C.yellow, 3.2, 2.4);
  return f;
}

// ── sky, haze, stars ────────────────────────────────────────────────────────
const SURF = -0.6;
{
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(900, 260), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(4, 512, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, SKY.top); g.addColorStop(0.62, SKY.mid); g.addColorStop(0.93, SKY.hor); g.addColorStop(1, SKY.hor);
    x.fillStyle = g; x.fillRect(0, 0, 4, 512); }) }));
  sky.position.set(0, 110, -260); scene.add(sky);
  const sp = []; for (let i = 0; i < 400; i++) sp.push(R(-400, 400), R(60, 240), -250);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#dfe6ff', size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.7, fog: false })));
  // moon with halo
  const halo = canvasTex(256, 256, (x) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,240,250,1)'); g.addColorStop(0.18, 'rgba(255,225,245,0.95)'); g.addColorStop(0.24, 'rgba(255,160,220,0.35)'); g.addColorStop(1, 'rgba(120,100,200,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); });
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, fog: false, transparent: true, depthWrite: false })); moon.scale.set(24, 24, 1); moon.material.opacity = 1; moon.position.set(46, 40, -150); scene.add(moon);
  const moonRing = new THREE.Mesh(new THREE.RingGeometry(6.4, 6.9, 96), new THREE.MeshBasicMaterial({ color: glow('#ff6ad5', 1.6), toneMapped: false, fog: false, transparent: true, opacity: 0.8 }));
  moonRing.position.set(46, 40, -149.5); scene.add(moonRing);
}
// soft sprite for bokeh / mist
const softDot = canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
function mist(z, y, w, h, color, opacity) {
  const t = canvasTex(256, 128, (x) => { const g = x.createRadialGradient(128, 64, 5, 128, 64, 128); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 128); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity, depthWrite: false, fog: false }));
  m.position.set(R(-20, 20), y, z); scene.add(m);
}

// ── distant hills + city with light pillars ─────────────────────────────────
{
  for (const [z, col, amp] of [[-165, '#1a2446', 9], [-140, '#141c34', 5]]) {
    const pts = [new THREE.Vector2(-400, -2)]; for (let x = -400; x <= 400; x += 8) pts.push(new THREE.Vector2(x, 1 + Math.abs(Math.sin(x * 0.013) * amp + Math.sin(x * 0.041) * amp * 0.4))); pts.push(new THREE.Vector2(400, -2));
    const hill = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)), new THREE.MeshBasicMaterial({ color: col })); hill.position.z = z; hill.position.y = SURF; scene.add(hill);
  }
  const winTex = (hue) => canvasTex(128, 512, (x) => {
    x.fillStyle = '#0c1026'; x.fillRect(0, 0, 128, 512);
    for (let yy = 6; yy < 506; yy += 10) for (let xx = 6; xx < 122; xx += 12) if (rnd() > 0.45) { x.fillStyle = rnd() > 0.7 ? hue : (rnd() > 0.5 ? '#9fe8ff' : '#c9d2ff'); x.globalAlpha = R(0.35, 1); x.fillRect(xx, yy, 7, 4); }
    x.globalAlpha = 1;
  });
  const texes = [winTex('#ff7ad9'), winTex('#5ff3ff')];
  const tipMat = new THREE.MeshBasicMaterial({ color: glow('#ff6ad5', 0.9), toneMapped: false });
  for (let i = 0; i < (LOW ? 36 : 72); i++) {
    const x = R(-300, 300), z = R(-260, -170), w = R(6, 14), h = x < 25 ? R(5, 13) : R(10, i % 6 === 0 ? 44 : 26);
    const mat = new THREE.MeshStandardMaterial({ color: '#10152e', emissive: '#ffffff', emissiveMap: texes[i % 2], emissiveIntensity: 0.9, roughness: 0.8 });
    const kind = i % 5;
    const geo = kind === 3 ? new THREE.CylinderGeometry(w * 0.42, w * 0.5, h, 14) : new THREE.BoxGeometry(w, h, w * 0.8);
    const b = new THREE.Mesh(geo, mat); b.position.set(x, SURF + h / 2, z); scene.add(b);
    if (kind === 1 || kind === 4) { const t = new THREE.Mesh(new THREE.BoxGeometry(w * 0.62, h * 0.22, w * 0.5), mat); t.position.set(x + R(-1, 1), SURF + h + h * 0.11, z); scene.add(t);
      if (kind === 4) { const t2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.3, h * 0.14, w * 0.3), mat); t2.position.set(x, SURF + h * 1.29, z); scene.add(t2); } }
    if (kind === 1 || kind === 2 || kind === 3) { const ah = R(3, 9), top = SURF + h * (kind === 1 ? 1.22 : 1) ;
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, ah, 6), mat); ant.position.set(x, top + ah / 2, z); scene.add(ant);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), tipMat); tip.position.set(x, top + ah, z); scene.add(tip); }
    if (kind === 0) { const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, R(3, 7), 4), mat); roof.rotation.y = Math.PI / 4; roof.position.set(x, SURF + h + 2, z); scene.add(roof); }
  }
  // glowing pillars (ref 1): tall luminous slabs
  const pillar = (col) => canvasTex(8, 256, (x) => { const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,0.15)'); g.addColorStop(0.5, col); g.addColorStop(1, col); x.fillStyle = g; x.fillRect(0, 0, 8, 256); });
  for (const [x, z, w, h, col] of [[60, -200, 6, 60, 'rgba(255,140,220,0.95)'], [95, -230, 5, 70, 'rgba(120,240,255,0.9)'], [125, -210, 5, 62, 'rgba(200,170,255,0.85)']]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: pillar(col), transparent: true, opacity: 0.32, toneMapped: false, color: new THREE.Color(1, 1, 1) }));
    m.position.set(x, SURF + h / 2, z); scene.add(m);
  }
  mist(-150, 5, 700, 30, 'rgba(150,165,225,0.9)', 0.32);
  mist(-80, 2.5, 460, 12, 'rgba(150,165,225,0.9)', 0.22);
  mist(-35, 1.2, 300, 5, 'rgba(150,165,225,0.9)', 0.14);
}

// ── pagoda on a stone platform (a nod to Shenzhen) ──────────────────────────
{
  const g = new THREE.Group(); g.position.set(27, SURF, -88); g.rotation.y = -0.5; scene.add(g);
  const stone = new THREE.MeshStandardMaterial({ color: '#3b4160', roughness: 0.9 });
  const red = new THREE.MeshStandardMaterial({ color: '#4a2a3c', roughness: 0.7, emissive: '#1e0c16', emissiveIntensity: 0.3 });
  const roof = new THREE.MeshStandardMaterial({ color: '#0d332d', roughness: 0.85, emissive: '#0a2a24', emissiveIntensity: 0.5 });
  const gold = new THREE.MeshStandardMaterial({ color: '#5a5260', roughness: 0.6, metalness: 0.3, emissive: '#1a1420', emissiveIntensity: 0.3 });
  const plat = new THREE.Mesh(new THREE.BoxGeometry(14, 1.4, 11), stone); plat.position.y = 0.7; g.add(plat);
  for (const [x, z] of [[-4.5, -3.5], [4.5, -3.5], [-4.5, 3.5], [4.5, 3.5], [-1.5, 3.5], [1.5, 3.5]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 5.5, 12), red); p.position.set(x, 4.1, z); g.add(p); }
  const band = new THREE.Mesh(new THREE.BoxGeometry(10.4, 1.3, 8.4), gold); band.position.y = 7.2; g.add(band);
  const glowWin = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.6), new THREE.MeshBasicMaterial({ color: glow('#ffcf6a', 0.8), toneMapped: false })); glowWin.position.set(0, 7.2, 4.22); g.add(glowWin);
  const mkRoof = (y, r, h) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4, 1, true), roof); m.rotation.y = Math.PI / 4; m.scale.set(1.25, 1, 1); m.position.y = y; g.add(m);
    line(g, [[-r * 0.88, y - h / 2, r * 0.7], [r * 0.88, y - h / 2, r * 0.7]], '#ffd57a', 1.4, 0.45, 0.6); };
  mkRoof(9.0, 9.2, 3.2);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 5), red); upper.position.y = 11.2; g.add(upper);
  const uwin = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.8), new THREE.MeshBasicMaterial({ color: glow('#ff9ad8', 0.75), toneMapped: false })); uwin.position.set(0, 11.3, 2.52); g.add(uwin);
  mkRoof(13.5, 6.4, 3.4);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.6, 8), gold); tip.position.y = 15.8; g.add(tip);
  const warm = new THREE.PointLight('#ffb870', 9, 14, 1.8); warm.position.set(0, 5, 6); g.add(warm);
}

// ── the water: planar reflection + ripple distortion + fresnel + transparency ─
{
  const shader = {
    uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
      deep: { value: new THREE.Color('#0b1636') }, fogC: { value: new THREE.Color(SKY.fog) } },
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
      void main(){ vUv = textureMatrix * vec4(position,1.0); vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 deep; uniform vec3 fogC; varying vec4 vUv; varying vec3 vW;
      void main(){
        vec2 p = vW.xz;
        float rip = sin(p.x*0.9 + p.y*1.7)*0.5 + sin(p.y*3.3 - p.x*0.6)*0.35 + sin(p.x*5.1 + p.y*0.4)*0.15;
        float streak = smoothstep(0.55, 1.0, sin(p.y*2.2 + sin(p.x*0.15)*2.0)) * 0.5;
        vec4 uv = vUv; uv.x += rip * 0.010 * uv.w; uv.y += (rip*0.004 + streak*0.006) * uv.w;
        vec3 refl = texture2DProj(tDiffuse, uv).rgb;
        vec3 v = normalize(cameraPosition - vW);
        float fres = 0.18 + 0.82 * pow(1.0 - clamp(v.y,0.0,1.0), 3.0);
        vec3 c = mix(deep, refl * 0.9, clamp(fres*1.1, 0.22, 0.88));
        c += vec3(0.05,0.07,0.12) * streak;
        float d = length(cameraPosition - vW);
        c = mix(c, fogC, smoothstep(40.0, 240.0, d) * 0.85);
        float a = mix(0.6, 0.97, clamp(fres*1.3,0.0,1.0));
        gl_FragColor = vec4(c, a);
      }` };
  const water = LOW ? new THREE.Mesh(new THREE.PlaneGeometry(900, 600), new THREE.MeshStandardMaterial({ color: '#0d1a3c', roughness: 0.55, metalness: 0.25, transparent: true, opacity: 0.94 })) : new Reflector(new THREE.PlaneGeometry(900, 600), { textureWidth: W, textureHeight: H, clipBias: 0.003, shader, color: 0xffffff });
  water.material.transparent = true;
  water.rotation.x = -Math.PI / 2; water.position.y = SURF; scene.add(water);
  // murky floor under the transparent near water (so koi read as underwater)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 200), new THREE.MeshStandardMaterial({ color: '#0a1428', roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = SURF - 2.2; scene.add(floor);
}

// ── lights ──────────────────────────────────────────────────────────────────
scene.add(new THREE.HemisphereLight('#9fb0e8', '#1e2a2a', 1.7));
const moonL = new THREE.DirectionalLight('#c9d2ff', 1.3); moonL.position.set(30, 40, -60); scene.add(moonL);
const rim = new THREE.DirectionalLight('#ff9ad8', 0.5); rim.position.set(-40, 10, 20); scene.add(rim);

// ── lily pads, lotus, holo rings, koi ───────────────────────────────────────
const padTex = [padAlbedo(0), padAlbedo(1), padAlbedo(2)], circuit = padCircuit();
const padGeos = [padGeo(1), padGeo(1, 0.3), padGeo(1, 0.16)];
const placed = [];
function pad(x, z, r, { circuitOn = false, rot = rnd() * 6.28 } = {}) {
  for (const [px, pz, pr] of placed) if (Math.hypot(px - x, pz - z) < pr + r + 0.25) return null;
  placed.push([x, z, r]);
  const tex = padTex[Math.floor(rnd() * 3)];
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide,
    emissive: circuitOn ? '#ffffff' : '#3f8f6a', emissiveMap: circuitOn ? circuit : tex, emissiveIntensity: circuitOn ? 0.7 : 0.25 });
  const m = new THREE.Mesh(padGeos[Math.floor(rnd() * 3)], mat); m.scale.set(r, r, r); m.rotation.y = rot; m.position.set(x, SURF + 0.03, z); scene.add(m);
  return m;
}
const petalGeo = (() => { const g = new THREE.SphereGeometry(1, 20, 14); g.scale(0.3, 0.8, 0.13); g.translate(0, 0.8, 0.02); return g; })();
function lotus(x, z, s = 1, light = true, em = 1) {
  const g = new THREE.Group(); g.position.set(x, SURF + 0.1, z); g.scale.setScalar(s); scene.add(g);
  const rings = [[10, 1.05, '#d98fbf', 0.3], [8, 0.62, '#e4a2cc', 0.5], [6, 0.28, '#f0c0de', 0.9]];
  rings.forEach(([n, tilt, col, e0], ri) => {
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(col).multiplyScalar(em < 1 ? 0.5 : 1), emissive: '#ff4fb8', emissiveIntensity: e0 * em, roughness: 0.45, side: THREE.DoubleSide });
    for (let i = 0; i < n; i++) { const p = new THREE.Mesh(petalGeo, mat); const a = i / n * Math.PI * 2 + ri * 0.3;
      p.rotation.order = 'YXZ'; p.rotation.y = a; p.rotation.x = tilt; p.scale.setScalar(1 - ri * 0.12); g.add(p); }
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshBasicMaterial({ color: glow('#fff1b0', 1.1 * em), toneMapped: false })); core.position.y = 0.35; g.add(core);
  if (light && !(LOW && em < 1)) { const l = new THREE.PointLight('#ff6ad5', 4 * s * em, 6 * s, 1.7); l.position.y = 0.9; g.add(l); }
  line(g, ringPts(1.9, 96, -0.05), '#3ff0ff', 1.8, 1.0, 0.7);
  line(g, ringPts(2.15, 96, -0.12), '#6a6bff', 1.2, 0.5, 0.3);
  return g;
}
function holoRing(x, z, r) {
  const g = new THREE.Group(); g.position.set(x, SURF + 0.04, z); scene.add(g);
  line(g, ringPts(r), '#3ff0ff', 2.0, 1.0, 0.8); line(g, ringPts(r * 0.72), '#3ff0ff', 1.2, 0.55, 0.4);
  line(g, ringPts(r * 1.18, 96).slice(0, 60), '#3ff0ff', 1.0, 0.5, 0.3);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; line(g, [[Math.cos(a) * r * 0.2, 0, Math.sin(a) * r * 0.2], [Math.cos(a) * r * 0.62, 0, Math.sin(a) * r * 0.62]], '#3ff0ff', 1.0, 0.5, 0.35); }
  const l = new THREE.PointLight('#29d3ff', 2.5, 6, 1.8); l.position.y = 0.6; g.add(l);
}
function koi(x, z, rot, spots = '#ff7a2a', base = '#fff4ec') {
  const tex = canvasTex(256, 128, (c) => { c.fillStyle = base; c.fillRect(0, 0, 256, 128); for (let i = 0; i < 7; i++) { c.fillStyle = spots; c.globalAlpha = 0.9; c.beginPath(); c.ellipse(R(40, 220), R(20, 108), R(14, 34), R(10, 24), rnd() * 3, 0, 7); c.fill(); } });
  const g = new THREE.Group(); g.position.set(x, SURF - 0.55, z); g.rotation.y = rot; scene.add(g);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.08 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat); body.scale.set(1.25, 0.3, 0.38); g.add(body);
  const finMat = new THREE.MeshStandardMaterial({ color: base, transparent: true, opacity: 0.75, side: THREE.DoubleSide, emissive: base, emissiveIntensity: 0.25 });
  const tail = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-1.1, 0.55), new THREE.Vector2(-0.8, 0), new THREE.Vector2(-1.1, -0.55)])), finMat);
  tail.rotation.x = -Math.PI / 2; tail.position.x = -1.1; tail.rotation.z = 0.25; g.add(tail);
  for (const sz of [-1, 1]) { const fin = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12, 0, Math.PI), finMat); fin.rotation.x = -Math.PI / 2; fin.rotation.z = sz * 1.9; fin.position.set(0.4, 0, sz * 0.3); g.add(fin); }
  // wake lines on the surface
  const w = new THREE.Group(); w.position.set(x, SURF + 0.03, z); w.rotation.y = rot; scene.add(w);
  for (const o of [-0.25, 0.25]) line(w, curve([[-1, 0, o], [-3, 0, o * 3 + Math.sin(o) * 0.5], [-5.5, 0, o * 6]], 20), '#bfefff', 1.0, 0.4, 0.15);
}

// ── land strip (the top arm of the Ɔ) ───────────────────────────────────────
const TERR_X = [-8, -2, 4];
{
  const mossTex = canvasTex(1024, 128, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2c4f4a'); g.addColorStop(1, '#1b3336'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    speckle(x, w, h, 5000, ['#4f7f6c', '#152a2c', '#6a9a82', '#3a5a6a'], 0.25, 2.2);
    for (let i = 0; i < 90; i++) { x.globalAlpha = 0.18; x.fillStyle = rnd() > 0.5 ? '#5c8f78' : '#10242a'; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, R(10, 40), R(4, 12), 0, 0, 7); x.fill(); }
  });
  mossTex.wrapS = THREE.RepeatWrapping; mossTex.repeat.set(3, 1);
  const stoneTex = canvasTex(1024, 128, (x, w, h) => {
    x.fillStyle = '#26304a'; x.fillRect(0, 0, w, h);
    for (let yy = 0; yy < h; yy += 32) for (let xx = (yy / 32) % 2 * 40; xx < w; xx += 80) { x.fillStyle = `hsl(${R(220, 250)},18%,${R(18, 26)}%)`; x.fillRect(xx + 2, yy + 2, 76, 28); }
    speckle(x, w, h, 3000, ['#5a6a8a', '#10141f'], 0.2, 1.6);
  });
  stoneTex.wrapS = THREE.RepeatWrapping; stoneTex.repeat.set(4, 1);
  const land = new THREE.Mesh(new RoundedBoxGeometry(70, 1.4, 6, 3, 0.35), [
    new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ map: mossTex, roughness: 0.85 }), new THREE.MeshStandardMaterial({ color: '#141a2a' }),
    new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 })]);
  land.position.set(-26, -0.7 + 0.0, -0.5); scene.add(land);
  { const edge = []; for (let x = -61; x <= 8.9; x += 0.5) edge.push([x, 0.02, 2.55 + Math.sin(x * 0.7) * 0.12 + Math.sin(x * 0.23) * 0.2]);
    line(scene, edge, C.frog, 1.6, 0.7, 0.55);
    const rockMat = new THREE.MeshStandardMaterial({ color: '#2a3148', roughness: 0.95, flatShading: true });
    for (let i = 0; i < 34; i++) { const x = R(-32, 9.5); if (x > -14 && x < -9.6) continue; const sc = R(0.22, 0.6);
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), rockMat); r.scale.set(sc * R(1, 1.8), sc * 0.55, sc); r.position.set(x, -0.45 + sc * 0.25, R(2.4, 3.3)); r.rotation.set(R(0, 3), R(0, 3), R(0, 3)); scene.add(r); } }
  // grass tufts (lit, dark) + a few neon reeds
  const grassMat = new THREE.MeshStandardMaterial({ color: '#2f6a55', roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 140; i++) { const x = R(-40, 8.5); if (TERR_X.some(t => Math.abs(x - t) < 2.5)) continue;
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05, R(0.4, 1.0), 3), grassMat); blade.position.set(x, 0.3, R(-3, 2.4)); blade.rotation.z = R(-0.3, 0.3); scene.add(blade); }
  for (let i = 0; i < 12; i++) { const x = R(-24, 7); if (TERR_X.some(t => Math.abs(x - t) < 2.5)) continue;
    line(scene, curve([[x, 0, 2.2], [x + 0.1, 0.7, 2.2], [x + R(-0.3, 0.3), 1.4, 2.2]], 8), C.frog, 1.2, 0.5, 0.3); }
  // terraces: stacked stone slabs with violet neon trims
  const terrTex = canvasTex(512, 128, (x, w, h) => { x.fillStyle = '#3b3470'; x.fillRect(0, 0, w, h); speckle(x, w, h, 3200, ['#5a52a0', '#221d45', '#7a70c0'], 0.35, 2.2);
    for (let i = 0; i < 14; i++) { x.strokeStyle = 'rgba(18,14,40,0.65)'; x.lineWidth = 1.5; x.beginPath(); let px = R(0, w), py = R(0, h); x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += R(-30, 30); py += R(-12, 12); x.lineTo(px, py); } x.stroke(); }
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(90,170,120,0.45)'); g.addColorStop(0.28, 'rgba(90,170,120,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const slabMat = new THREE.MeshStandardMaterial({ map: terrTex, roughness: 0.85, emissive: '#1a1440', emissiveIntensity: 0.35 });
  TERR_X.forEach((x) => { for (let k = 0; k < 3; k++) {
    const w = 4.4 - k * 0.5, d = 3 - k * 0.3, y = 0.25 + k * 0.5;
    const s = new THREE.Mesh(new RoundedBoxGeometry(w, 0.46, d, 4, 0.18), slabMat); s.position.set(x, y, -0.5); scene.add(s);
    line(scene, [[x - w / 2 + 0.15, y + 0.23, -0.5 + d / 2], [x + w / 2 - 0.15, y + 0.23, -0.5 + d / 2]], C.cyan, 1.6, 0.85, k === 2 ? 0.9 : 0.5);
  } if (!LOW) { const tl = new THREE.PointLight('#7fa8ff', 4, 5, 1.7); tl.position.set(x, 2.4, 1.5); scene.add(tl); } });
  // signpost
  const wood = new THREE.MeshStandardMaterial({ color: '#5a3d2a', roughness: 0.8 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.4, 10), wood); post.position.set(-16.8, 1.7, -0.6); scene.add(post);
  const board = new THREE.Mesh(new RoundedBoxGeometry(5.6, 1.5, 0.3, 3, 0.1), new THREE.MeshStandardMaterial({ color: '#0e1a24', roughness: 0.6 })); board.position.set(-16.8, 3.3, -0.6); scene.add(board);
  const txt = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false, map: canvasTex(1024, 256, (x) => {
    x.font = '700 108px "JetBrains Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#39ff88'; x.shadowBlur = 26; x.fillStyle = '#7dffb0'; x.fillText('janys-ponder', 512, 128); x.shadowBlur = 0; x.globalAlpha = 0.6; x.fillStyle = '#fff'; x.fillText('janys-ponder', 512, 128); }) }));
  txt.position.set(-16.8, 3.3, -0.43); scene.add(txt); [post, board, txt].forEach(o => o.layers.set(1));
  line(scene, [[-19.55, 2.6, -0.44], [-19.55, 4.0, -0.44], [-14.05, 4.0, -0.44], [-14.05, 2.6, -0.44], [-19.55, 2.6, -0.44]], C.frog, 1.6, 0.9, 0.7).layers.set(1);
  // lantern by the sign
  const lan = new THREE.PointLight('#7dffb0', 3, 6, 1.8); lan.position.set(-16.8, 3.5, 1.2); scene.add(lan);
  // pier (wood planks) + neon edge, palm (neon)
  for (let i = 0; i < 14; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 2.4), wood); p.position.set(10.8 + i * 0.5, 0.55, -0.4); p.rotation.x = R(-0.02, 0.02); scene.add(p); }
  for (const x of [11, 14.3, 17.4]) for (const z of [-1.4, 0.6]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.6, 10), wood); pl.position.set(x, -0.6, z); scene.add(pl); }
  line(scene, curve([[9.2, 0, 0.5], [8.8, 2.5, 0.5], [9.4, 5, 0.5], [10.6, 7.2, 0.5]]), C.pink, 3.4, 2.2);
  for (const [dx, dy] of [[3, -1.6], [2.6, 0.6], [-2.6, -1.4], [-1.6, 1.2], [0.6, 2.2]]) line(scene, curve([[10.6, 7.2, 0.5], [10.6 + dx * 0.55, 7.2 + dy * 0.5 + 0.8, 0.5], [10.6 + dx, 7.2 + dy, 0.5]], 16), C.pink, 2.8, 2.1);
  if (!LOW) { const pl = new THREE.PointLight('#ff6ad5', 6, 9, 1.6); pl.position.set(10.4, 5, 2); scene.add(pl); }
  // thought cloud (UI object, neon)
  const bumps = [[-2.4, -0.2, 1.1], [-1.1, 0.6, 1.25], [0.6, 0.85, 1.35], [2.1, 0.2, 1.1], [1.3, -0.7, 1.0], [-0.6, -0.7, 1.0]], cloud = [];
  for (let i = 0; i <= 180; i++) { const a = i / 180 * 6.2832, dx = Math.cos(a), dy = Math.sin(a); let best = 0;
    for (const [bx, by, r] of bumps) { const b = bx * dx + by * dy, c = bx * bx + by * by - r * r, disc = b * b - c; if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc)); }
    cloud.push([dx * best, dy * best * 0.8, 0]); }
  const cg = new THREE.Group(); cg.position.set(0.2, 10.4, -3); scene.add(cg);
  const cf = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(cloud.map(p => new THREE.Vector2(p[0], p[1])))), new THREE.MeshBasicMaterial({ color: '#0a1030', transparent: true, opacity: 0.75, fog: false })); cf.position.z = -0.05; cg.add(cf);
  line(cg, cloud, '#5a8bff', 2.4, 1.2, 0.9);
  if (false) for (const [x, y, r] of [[-9.8, 4.6, 0.12], [-7.4, 6.3, 0.18], [-4.8, 8.0, 0.26]]) line(scene, Array.from({ length: 25 }, (_, i) => [x + r * Math.cos(i / 24 * 6.2832), y + r * Math.sin(i / 24 * 6.2832), -1]), '#5a8bff', 2.4, 2);
  const heroFrog = frog(scene, { pos: [-11.8, 0, 0.3], s: 1.22 }); heroFrog.traverse(o => o.layers.set(1));
  { const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot, color: '#39ff88', transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    halo.scale.set(11, 11, 1); halo.position.set(-11.8, 1.9, -0.8); halo.layers.set(1); scene.add(halo);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshBasicMaterial({ map: softDot, color: '#39ff88', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(-11.8, 0.03, 0.4); scene.add(pool); }
  const fl = new THREE.PointLight('#39ff88', 18, 8, 1.5); fl.position.set(-11.8, 1.5, 2.5); scene.add(fl);
}

// foreground + background pond life
{
  // hero pads & lotus (hand placed for composition)
  pad(-17, 9, 3.2); lotus(-15.5, 8.3, 0.85, true, 0.25);
  pad(-4, 12.5, 2.6); pad(6, 8, 2.1); lotus(6.3, 8.1, 0.8);
  pad(16, 13, 3.6, { circuitOn: true }); pad(-25, 16, 4); pad(1, 19, 3.2); pad(22, 5.5, 1.9);
  pad(-9, 6, 1.4); pad(12, 3.8, 1.3); lotus(24, 14.5, 0.9, true, 0.25);
  for (let i = 0; i < (LOW ? 45 : 90); i++) pad(R(-60, 60), R(3.2, 24), R(0.8, 2.2), { circuitOn: rnd() < 0.04 });
  for (let i = 0; i < (LOW ? 60 : 120); i++) pad(R(-90, 90), R(-80, -4), R(1.2, 3.5), { circuitOn: rnd() < 0.05 });
  lotus(-30, -10, 1.1, false); lotus(20, -14, 1.2, false); lotus(-6, -22, 1.0, false); lotus(44, -20, 1.3, false);
  holoRing(2, -12, 3);
  koi(-1.5, 10.5, 0.5); koi(10, 15, 2.7, '#ff9ad8', '#fbe9ff');
  // floating bokeh particles in depth
  const bp = [], bc = [];
  const pal = [new THREE.Color('#9ff4ff'), new THREE.Color('#ff9ad8'), new THREE.Color('#c9b8ff'), new THREE.Color('#fff2b0')];
  for (let i = 0; i < 200; i++) { bp.push(R(-60, 60), R(-0.3, 12), R(-60, 26)); const c = pal[i % 4]; bc.push(c.r, c.g, c.b); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));
  scene.add(new THREE.Points(bg, new THREE.PointsMaterial({ map: softDot, size: 0.28, vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })));
}

// ── camera + post: DOF for depth, bloom for glow ────────────────────────────
const camera = new THREE.PerspectiveCamera(MOBILE ? 52 : 36, W / H, 0.1, 600);
if (MOBILE) { camera.position.set(-10.2, 5.8, 20.5); camera.lookAt(-10.2, 3.1, -12); }
else { camera.position.set(-2.5, 6.2, 34); camera.lookAt(-2.5, 5.4, 0); }
camera.layers.enable(1);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(LOW ? W / 2 : W, LOW ? H / 2 : H), MOBILE ? 0.45 : 0.78, 0.5, 0.42));
composer.addPass(new OutputPass());
composer.render();
window.__camera = camera; window.__cloud = [0.2, 10.4, -3];
window.__project = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
window.dispatchEvent(new Event('world-ready'));
