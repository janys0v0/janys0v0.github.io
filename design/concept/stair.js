// janys.ponder — "Floors" concept: a realistic stairwell climbed by scroll, sunset through the windows,
// rooftop reveal at the top. Refs: design/references/ref-floors-*.jpg. No neon: real materials + real light.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const P = new URLSearchParams(location.search);
const SCENE = P.get('s') || 'lobby';
const W = +(P.get('w') || 1600), H = +(P.get('h') || 900);
let seed = 21; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; const R = (a, b) => a + rnd() * (b - a);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#1a1422');

// ── textures ────────────────────────────────────────────────────────────────
function canvasTex(w, h, draw, srgb = true) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
// painted white brick (albedo + bump), 1 tile = 12.8 world units
const BRICK_TILE = 12.8;
function brickTextures() {
  const bw = 64, bh = 24, m = 3, S = 1024;
  const draw = (bump) => (x) => {
    x.fillStyle = bump ? '#303030' : '#ddd7cb'; x.fillRect(0, 0, S, S);
    for (let r = 0; r < S / bh; r++) for (let c = -1; c < S / bw + 1; c++) {
      const ox = (r % 2) * bw / 2, px = c * bw + ox, py = r * bh;
      if (bump) { x.fillStyle = `rgb(${200 + R(-25, 25) | 0},${200},${200})`; }
      else { const v = R(-7, 5); x.fillStyle = `rgb(${240 + v | 0},${236 + v | 0},${226 + v | 0})`; }
      x.beginPath(); x.roundRect(px + m / 2, py + m / 2, bw - m, bh - m, 3); x.fill();
    }
    // paint drips / pits
    for (let i = 0; i < 6000; i++) { x.globalAlpha = R(0.03, bump ? 0.25 : 0.08); x.fillStyle = rnd() > 0.5 ? (bump ? '#000' : '#b9b2a4') : '#fff'; x.fillRect(rnd() * S, rnd() * S, R(1, 3), R(1, 3)); }
    x.globalAlpha = 1;
  };
  const map = canvasTex(S, S, draw(false)); const bump = canvasTex(S, S, draw(true), false);
  for (const t of [map, bump]) t.repeat.set(1 / BRICK_TILE, 1 / BRICK_TILE);
  return { map, bump };
}
// dark varnished walnut
function woodTexture(stretch = 1) {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#3a2416'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const y0 = rnd() * h, amp = R(2, 10), f = R(0.004, 0.02), ph = rnd() * 6;
      x.strokeStyle = rnd() > 0.5 ? `rgba(20,10,5,${R(0.2, 0.5)})` : `rgba(110,70,40,${R(0.15, 0.35)})`; x.lineWidth = R(0.6, 2.4);
      x.beginPath(); for (let xx = 0; xx <= w; xx += 8) x.lineTo(xx, y0 + Math.sin(xx * f + ph) * amp); x.stroke();
    }
    for (let i = 0; i < 18; i++) { x.fillStyle = 'rgba(15,8,4,0.35)'; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, R(6, 18), R(2, 5), 0, 0, 7); x.fill(); }
  });
}
const brick = brickTextures(), wood = woodTexture();
const M = {
  brick: new THREE.MeshStandardMaterial({ map: brick.map, bumpMap: brick.bump, bumpScale: 1.4, roughness: 0.92 }),
  wood: new THREE.MeshStandardMaterial({ map: wood, roughness: 0.38, metalness: 0.05, color: '#b08a70' }),
  woodDark: new THREE.MeshStandardMaterial({ map: wood, roughness: 0.42, color: '#7d5a44' }),
  cream: new THREE.MeshStandardMaterial({ color: '#efe8da', roughness: 0.6 }),
  ceiling: new THREE.MeshStandardMaterial({ color: '#f1efe9', roughness: 0.85 }),
  brass: new THREE.MeshStandardMaterial({ color: '#c9a45c', roughness: 0.3, metalness: 0.9 }),
  glass: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.1, metalness: 0, clearcoat: 1 }),
};
const box = (w, h, d, mat, pos, parent = scene, cast = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(...pos); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };

// ── sunset outside (the "view" behind every window) ─────────────────────────
function sunsetSky({ warmth = 0.5, horizon = 6, z = -60 } = {}) {
  // warmth 0 = violet dusk (lower floors) → 1 = full orange sunset (top floor)
  const top = new THREE.Color('#2e2f7a').lerp(new THREE.Color('#3b2f86'), warmth);
  const mid = new THREE.Color('#7a5bd0').lerp(new THREE.Color('#b0579a'), warmth);
  const low = new THREE.Color('#e36fa3').lerp(new THREE.Color('#ff5a3c'), warmth);
  const hor = new THREE.Color('#ff9f7a').lerp(new THREE.Color('#ffb347'), warmth);
  const tex = canvasTex(8, 1024, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, '#' + top.getHexString()); g.addColorStop(0.45, '#' + mid.getHexString()); g.addColorStop(0.62, '#' + low.getHexString()); g.addColorStop(0.7, '#' + hor.getHexString()); g.addColorStop(0.74, '#' + low.getHexString()); g.addColorStop(1, '#3a1d3a');
    x.fillStyle = g; x.fillRect(0, 0, 8, 1024);
  });
  const skyH = 140, sky = new THREE.Mesh(new THREE.PlaneGeometry(600, skyH), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(1.05, 1.05, 1.05) }));
  sky.position.set(0, horizon + skyH * (0.7 - 0.5), z); scene.add(sky);
  // wispy clouds lit from below
  const cloud = canvasTex(512, 128, (x) => { for (let i = 0; i < 26; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); x.save(); x.translate(R(20, 490), R(40, 90)); x.scale(R(40, 120), R(4, 10)); g.addColorStop(0, 'rgba(255,170,120,0.55)'); g.addColorStop(1, 'rgba(255,170,120,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); } });
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(R(60, 120), R(6, 12)), new THREE.MeshBasicMaterial({ map: cloud, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.35 + warmth * 0.5 }));
    c.position.set(R(-120, 120), horizon + R(2, 12), z + 2); scene.add(c); }
  // silhouettes: rooftops, a spire, tree canopies (Cambridge-ish)
  const sil = new THREE.MeshBasicMaterial({ color: new THREE.Color('#1c1426').lerp(new THREE.Color('#2a1522'), warmth) });
  for (let x = -160; x < 160; x += R(6, 14)) { const w = R(5, 12), h = R(1, 3.5); box(w, h, 1, sil, [x, horizon - 2.2 + h / 2, z + 12], scene, false);
    if (rnd() < 0.3) { const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.7, R(1.5, 2.5), 4), sil); roof.rotation.y = Math.PI / 4; roof.position.set(x, horizon - 2.2 + h + 0.9, z + 12); scene.add(roof); } }
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.6, 7, 6), sil); spire.position.set(-38, horizon + 2.8, z + 11); scene.add(spire);
  box(2.2, 4, 1, sil, [-38, horizon - 0.8, z + 11], scene, false);
  for (let i = 0; i < 70; i++) { const s = R(1.2, 2.8); const t = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), sil); t.scale.y = R(0.7, 1.1); t.position.set(R(-140, 140), horizon - 2.4 + R(-0.6, 1.2), z + 14 + R(0, 4)); scene.add(t); }
  return sky;
}

// ── a window: casing, sash, muntins, sill; patterns grid | lattice | gothic ──
function openingShape(w, h, arch, y0 = 0) {
  const s = new THREE.Shape(); const rh = y0 + (arch ? h - w / 2 : h);
  s.moveTo(-w / 2, y0); s.lineTo(w / 2, y0); s.lineTo(w / 2, rh);
  if (arch) s.absarc(0, rh, w / 2, 0, Math.PI, false); else s.lineTo(-w / 2, rh);
  s.lineTo(-w / 2, y0); return s;
}
function windowUnit({ x, y, w, h, arch = false, pattern = 'grid', cols = 4, rows = 4 }) {
  const g = new THREE.Group(); g.position.set(x, y, 0); scene.add(g);
  const cas = 0.42;
  const ring = (outerW, outerH, innerW, innerH, depth, mat, z, a, oy = 0, iy = 0) => {
    const o = openingShape(outerW, outerH, a, oy); o.holes.push(new THREE.Path(openingShape(innerW, innerH, a, iy).getPoints(48)));
    const geo = new THREE.ExtrudeGeometry(o, { depth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 48 });
    const m = new THREE.Mesh(geo, mat); m.position.z = z; m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  // casing (on the wall face) sits around the opening; its base is 0 at the opening bottom
  ring(w + cas * 2, h + cas * 2, w, h, 0.32, M.wood, 0.0, arch, -cas, 0);
  // sash frame inside the opening (recessed)
  ring(w, h, w - 0.3, h - 0.3, 0.14, M.woodDark, -0.35, arch, 0, 0.15);
  // muntins (recessed); anything beyond the opening is hidden by the wall
  const mz = -0.3, mt = 0.07, rh = arch ? h - w / 2 : h;
  const bar = (bw, bh, px, py) => box(bw, bh, 0.1, M.woodDark, [px, py, mz], g);
  if (pattern === 'grid' || pattern === 'gothic') {
    for (let c = 1; c < cols; c++) bar(mt, rh, -w / 2 + c * w / cols, rh / 2);
    for (let r = 1; r < rows; r++) bar(w, r === rows / 2 ? mt * 2.6 : mt, 0, r * rh / rows);
  }
  if (pattern === 'gothic' && arch) {
    for (const cx of [-w / 4, 0, w / 4]) { const t = new THREE.Mesh(new THREE.TorusGeometry(w / 2, 0.045, 8, 64, Math.PI), M.woodDark); t.position.set(cx, rh, mz); t.castShadow = true; g.add(t); }
    bar(w, mt * 1.6, 0, rh);
  }
  if (pattern === 'lattice') {
    const rr = w * 0.3;
    for (let r = 0; r < 4; r++) for (const cx of [-w / 4, w / 4]) { const t = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.05, 8, 64), M.woodDark); t.position.set(cx, rh * (r + 0.5) / 4 * 1.0, mz); t.castShadow = true; g.add(t); }
  }
  // glass pane + sill
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(openingShape(w, h, arch), 48), M.glass); glass.position.z = -0.33; g.add(glass);
  box(w + cas * 2 + 0.6, 0.26, 0.7, M.wood, [0, -0.13, 0.3], g);
  box(w + cas * 2 + 0.3, 0.16, 0.5, M.woodDark, [0, -0.33, 0.2], g);
  return g;
}

// ── room: brick wall with holes for windows, floor, ceiling, lamp ───────────
function room({ windows, ceilingY = 16, lampX = -3, beam = false }) {
  const wall = new THREE.Shape(); wall.moveTo(-40, -1); wall.lineTo(40, -1); wall.lineTo(40, ceilingY); wall.lineTo(-40, ceilingY); wall.lineTo(-40, -1);
  for (const wd of windows) { const hole = openingShape(wd.w, wd.h, wd.arch); const pts = hole.getPoints(48).map(p => new THREE.Vector2(p.x + wd.x, p.y + wd.y)); wall.holes.push(new THREE.Path(pts)); }
  const wm = new THREE.Mesh(new THREE.ShapeGeometry(wall, 48), M.brick); wm.receiveShadow = true; wm.castShadow = true; scene.add(wm);
  // wall thickness behind the openings (reveals)
  for (const wd of windows) windowUnit(wd);
  // floor (walnut planks) and dark baseboard
  const fl = wood.clone(); fl.repeat.set(6, 3); fl.needsUpdate = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshStandardMaterial({ map: fl, roughness: 0.4, color: '#d8aa86', emissive: '#ffffff', emissiveMap: fl, emissiveIntensity: 0.55 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -1, 20); floor.receiveShadow = true; scene.add(floor);
  box(80, 0.9, 0.2, M.woodDark, [0, -0.55, 0.1]);
  // ceiling, crown, beam and conduit (from photo 2)
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), M.ceiling); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, ceilingY, 20); ceil.receiveShadow = true; scene.add(ceil);
  box(80, 0.3, 0.3, M.cream, [0, ceilingY - 0.15, 0.15]);
  if (beam) { box(80, 0.8, 0.9, M.cream, [0, ceilingY - 0.4, 3.5]); box(80, 0.08, 0.08, M.cream, [0, ceilingY - 0.08, 6.5]); }
  // round ceiling lamp
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.35, 48), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff4e0', emissiveIntensity: 1.6 })); lamp.position.set(lampX, ceilingY - 0.18, 7); scene.add(lamp);
  const L = new THREE.PointLight('#ffe9cc', 120, 0, 2); L.position.set(lampX, ceilingY - 1.2, 7); L.castShadow = true; L.shadow.mapSize.set(2048, 2048); L.shadow.radius = 6; L.shadow.bias = -0.002; scene.add(L);
  scene.add(new THREE.HemisphereLight('#fff3e6', '#6a4a3a', 1.25));
}
// sunset light entering through the windows (casts muntin shadows into the room)
function sunLight(color, intensity, from, to) {
  const s = new THREE.SpotLight(color, intensity, 0, 0.42, 0.7, 2); s.position.set(...from); s.target.position.set(...to);
  s.castShadow = true; s.shadow.mapSize.set(2048, 2048); s.shadow.bias = -0.001; scene.add(s, s.target);
}
// stairs with cream balusters and a walnut handrail
function stairs({ x0 = 4, steps = 10, run = 1.15, rise = 0.62, z0 = 3.2, z1 = 7.2, dir = 1 }) {
  const g = new THREE.Group(); scene.add(g);
  for (let i = 0; i < steps; i++) { const x = x0 + dir * (i + 0.5) * run, y = -1 + (i + 1) * rise;
    box(run + 0.05, 0.14, z1 - z0 + 0.3, M.wood, [x, y, (z0 + z1) / 2], g); box(run, rise - 0.14, z1 - z0, M.cream, [x, y - rise / 2, (z0 + z1) / 2 - 0.05], g);
    for (const f of [0.25, 0.75]) box(0.12, 3.0, 0.12, M.cream, [x - dir * run / 2 + dir * f * run, y + 1.5, z1 - 0.2], g); }
  // stringer (solid side under the treads, facing camera)
  const sh = new THREE.Shape(); sh.moveTo(x0, -1); for (let i = 0; i < steps; i++) { sh.lineTo(x0 + dir * i * run, -1 + (i + 1) * rise); sh.lineTo(x0 + dir * (i + 1) * run, -1 + (i + 1) * rise); } sh.lineTo(x0 + dir * steps * run, -1); sh.lineTo(x0, -1);
  const str = new THREE.Mesh(new THREE.ShapeGeometry(sh), M.cream); str.position.z = z1 + 0.02; str.receiveShadow = true; g.add(str);
  // handrail
  const a = new THREE.Vector3(x0 - dir * 0.2, -1 + 3.4, z1 - 0.2), b = new THREE.Vector3(x0 + dir * steps * run, -1 + steps * rise + 3.1, z1 - 0.2);
  const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 8, 0.2, 12), M.wood); rail.castShadow = true; g.add(rail);
  // newel post
  box(0.6, 4.2, 0.6, M.wood, [x0 - dir * 0.2, 1.1, z1 - 0.2], g); box(0.8, 0.25, 0.8, M.wood, [x0 - dir * 0.2, 3.3, z1 - 0.2], g);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), M.wood); ball.position.set(x0 - dir * 0.2, 3.65, z1 - 0.2); ball.castShadow = true; g.add(ball);
  return g;
}

// ── the frog, as a soft clay figure (no neon) ───────────────────────────────
function clayFrog(parent, pose = 'sit', { pos = [0, 0, 0], s = 1, rotY = 0 } = {}) {
  const f = new THREE.Group(); f.position.set(...pos); f.scale.setScalar(s); f.rotation.y = rotY; parent.add(f);
  const skin = new THREE.MeshStandardMaterial({ color: '#5fb35a', roughness: 0.55 }), belly = new THREE.MeshStandardMaterial({ color: '#d7eeb0', roughness: 0.6 });
  const white = new THREE.MeshStandardMaterial({ color: '#fbfaf3', roughness: 0.25 }), ink = new THREE.MeshStandardMaterial({ color: '#15171a', roughness: 0.2 });
  const cheek = new THREE.MeshStandardMaterial({ color: '#f39ab4', roughness: 0.6 });
  const sph = new THREE.SphereGeometry(1, 40, 28);
  const part = (mat, p, sc, rot = [0, 0, 0], geo = sph) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.scale.set(...sc); m.rotation.set(...rot); m.castShadow = true; m.receiveShadow = true; f.add(m); return m; };
  part(skin, [0, 1.15, 0], [0.95, 1.05, 0.8]); part(belly, [0, 1.0, 0.36], [0.68, 0.78, 0.5]);
  part(skin, [0, 2.15, 0.05], [1.25, 0.72, 0.85]);
  for (const sx of [-1, 1]) {
    part(skin, [sx * 0.62, 2.72, 0.1], [0.42, 0.42, 0.42]); part(white, [sx * 0.62, 2.78, 0.36], [0.3, 0.3, 0.22]); part(ink, [sx * 0.62, 2.8, 0.55], [0.14, 0.14, 0.08]);
    part(white, [sx * 0.57, 2.86, 0.62], [0.045, 0.045, 0.03]);
    part(cheek, [sx * 0.85, 2.02, 0.62], [0.17, 0.1, 0.06]);
    if (pose === 'tada') { part(skin, [sx * 1.3, 2.3, 0.3], [1, 1, 1], [0, 0, -sx * 0.65], new THREE.CapsuleGeometry(0.2, 1.0, 8, 16)); part(skin, [sx * 1.7, 2.92, 0.3], [0.25, 0.25, 0.25]); }
    else { part(skin, [sx * 0.42, 0.9, 0.55], [1, 1, 1], [0, 0, sx * 0.15], new THREE.CapsuleGeometry(0.2, 0.9, 8, 16)); part(skin, [sx * 0.55, 0.12, 0.72], [0.45, 0.12, 0.3]); }
    part(skin, [sx * 0.85, 0.55, -0.05], [0.55, 0.45, 0.9]); part(skin, [sx * 1.2, 0.1, 0.25], [0.5, 0.12, 0.3]);
  }
  const smile = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-0.55, 2.1, 0.8], [-0.2, 1.95, 0.88], [0.2, 1.95, 0.88], [0.55, 2.1, 0.8]].map(p => new THREE.Vector3(...p))), 20, 0.035, 8), ink); f.add(smile);
  f.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return f;
}
function clayCrab(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  const shell = new THREE.MeshStandardMaterial({ color: '#e0663f', roughness: 0.5 }), ink = new THREE.MeshStandardMaterial({ color: '#15171a' });
  const sph = new THREE.SphereGeometry(1, 28, 20);
  const p = (m, pos, sc) => { const o = new THREE.Mesh(sph, m); o.position.set(...pos); o.scale.set(...sc); o.castShadow = true; g.add(o); };
  p(shell, [0, 0.35, 0], [0.8, 0.4, 0.55]);
  for (const sx of [-1, 1]) { p(shell, [sx * 1.05, 0.55, 0.15], [0.32, 0.22, 0.22]); p(ink, [sx * 0.25, 0.8, 0.35], [0.08, 0.08, 0.08]);
    for (let i = 0; i < 3; i++) p(shell, [sx * (0.65 + i * 0.15), 0.12, -0.2 + i * 0.2], [0.28, 0.05, 0.05]); }
  // spiral shell on the back (hermit crab)
  const spiral = new THREE.Mesh(new THREE.TorusKnotGeometry(0.28, 0.12, 64, 10, 2, 3), new THREE.MeshStandardMaterial({ color: '#f1d8b8', roughness: 0.45 })); spiral.position.set(0, 0.75, -0.25); spiral.castShadow = true; g.add(spiral);
}

// ── scenes ──────────────────────────────────────────────────────────────────
let camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 800);
const S = {
  lobby() { // floor 1: tall arched window with gothic tracery + two small lattice windows (IMG_2745)
    sunsetSky({ warmth: 0.35, horizon: 7 });
    room({ windows: [{ x: 6, y: 2.2, w: 5.2, h: 10.5, arch: true, pattern: 'gothic' },
                     { x: 0.2, y: 0.4, w: 2.4, h: 2.6, pattern: 'lattice' }, { x: 11.8, y: 0.4, w: 2.4, h: 2.6, pattern: 'lattice' }], lampX: -4 });
    sunLight('#ff8f6a', 1100, [7, 9, -24], [3, -1, 9]);
    stairs({ x0: 3.2, steps: 9 });
    clayFrog(scene, 'sit', { pos: [-1.2, -1, 4.2], s: 1.2, rotY: 0.25 });
    camera.position.set(0, 5.2, 27); camera.lookAt(0, 5.4, 0);
  },
  floor() { // floor 3: twin windows, lattice + 16-pane, pinker sky (IMG_2743); crab = Ekimetrics client
    sunsetSky({ warmth: 0.6, horizon: 6 });
    room({ windows: [{ x: 1.2, y: 3, w: 3.4, h: 7.6, pattern: 'lattice' }, { x: 8.4, y: 3, w: 6.2, h: 8, pattern: 'grid' }], lampX: -5, beam: true });
    sunLight('#ff8a7a', 1000, [6, 9, -24], [2, -1, 10]);
    clayFrog(scene, 'tada', { pos: [3.2, -1, 3.6], s: 1.1, rotY: -0.2 });
    clayCrab(scene, [11.2, 2.75, 0.45], 0.75);
    camera.position.set(0, 5.2, 27); camera.lookAt(0, 5.4, 0);
  },
  roof() { // rooftop: the ceiling has opened; full sunset, parapet, string lights
    sunsetSky({ warmth: 1.0, horizon: 3, z: -90 });
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 256, (x) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,245,210,1)'); g.addColorStop(0.12, 'rgba(255,220,150,1)'); g.addColorStop(0.3, 'rgba(255,150,80,0.55)'); g.addColorStop(1, 'rgba(255,90,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }), transparent: true, depthWrite: false, toneMapped: false }));
    sun.scale.set(34, 34, 1); sun.position.set(18, 4.2, -85); scene.add(sun);
    // roof deck + white-brick parapet
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshStandardMaterial({ color: '#4a3f48', roughness: 0.95 })); deck.rotation.x = -Math.PI / 2; deck.position.set(0, -1, 0); deck.receiveShadow = true; scene.add(deck);
    const par = new THREE.Mesh(new THREE.BoxGeometry(60, 2.2, 0.9), M.brick); par.position.set(0, 0.1, -2); par.castShadow = par.receiveShadow = true; scene.add(par);
    box(60.4, 0.25, 1.2, M.wood, [0, 1.32, -2]);
    // string lights along the parapet
    const bulbM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.5, 0.6), toneMapped: false });
    const wire = []; for (let i = 0; i <= 150; i++) { const x = -26 + i * 0.35, y = 3.6 - Math.sin((((x + 26) / 2.1 % 6) / 6) * Math.PI) * 0.6; wire.push(new THREE.Vector3(x, y + 0.12, -1.6)); }
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wire), 300, 0.02, 6), new THREE.MeshStandardMaterial({ color: '#1a1216' })));
    for (let i = 0; i < 26; i++) { const x = -26 + i * 2.1, y = 3.6 - Math.sin(((i % 6) / 6) * Math.PI) * 0.6; const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), bulbM); b.position.set(x, y, -1.6); scene.add(b); }
    const warm = new THREE.DirectionalLight('#ff9a5c', 3.2); warm.position.set(18, 5, -40); warm.castShadow = true; warm.shadow.mapSize.set(2048, 2048);
    Object.assign(warm.shadow.camera, { left: -20, right: 20, top: 12, bottom: -6, near: 1, far: 120 }); scene.add(warm);
    scene.add(new THREE.HemisphereLight('#c9a0e6', '#5a3540', 1.6));
    const fill = new THREE.DirectionalLight('#ffd2b0', 1.6); fill.position.set(-6, 6, 14); scene.add(fill);
    const f = clayFrog(scene, 'sit', { pos: [2.5, 1.45, -2], s: 0.95, rotY: 0.55 });
    camera.position.set(-2, 2.6, 15); camera.lookAt(-2, 3.9, -20);
  },
};
(S[SCENE] || S.lobby)();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.35, 0.6, 0.92));
composer.addPass(new OutputPass());
composer.render();
window.__project = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
window.dispatchEvent(new Event('world-ready'));
