// The janys-ponder homepage world, ported from design/concept/world7.js (the approved v7 look).
// Draw-call budget: repeated objects are instanced or merged (pads, grass, rocks, reeds, city, pier, lotus petals).
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { Frog } from "./frog";
import { buildUnderwater, type Underwater } from "./underwater";
import {
  blob, C, curve, glow, line, lineMat, motion, P3, pondWave, ringPts, seeded, segments, toSegs,
  withLineMotion, withMeshMotion,
} from "./materials";

export type Tier = { low: boolean; mobile: boolean; theme: "night" | "dusk" };
import { SURF } from "./stops";
export { SURF };
export const TERR_X = [-8, -2, 4] as const;
export const ANCHORS = { cloud: [0.2, 10.4, -3] as P3, frog: [-11.8, 0, 0.3] as P3 };

const SKIES = {
  night: { top: "#050818", mid: "#141c44", hor: "#5a6aa8", fog: "#262d5a" },
  dusk: { top: "#1a0f3a", mid: "#5a2a78", hor: "#ff8fc8", fog: "#6a4a8a" },
};

function canvasTex(w: number, h: number, draw: (x: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const softDotTex = () => canvasTex(64, 64, (x) => {
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.4, "rgba(255,255,255,0.5)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
});

/** Lily-pad disc: polar grid with a notch; the rim curls up a little. */
function padGeo(notch = 0.24) {
  const rings = 8, segs = 56, pos: number[] = [], idx: number[] = [];
  const a0 = notch / 2, a1 = Math.PI * 2 - notch / 2;
  pos.push(0, 0, 0);
  for (let i = 1; i <= rings; i++) for (let j = 0; j <= segs; j++) {
    const t = i / rings, a = a0 + ((a1 - a0) * j) / segs;
    pos.push(Math.cos(a) * t, Math.sin(a) * t, Math.pow(t, 5) * 0.09 + Math.sin(a * 7) * Math.pow(t, 6) * 0.025);
  }
  const row = segs + 1;
  for (let j = 0; j < segs; j++) idx.push(0, 1 + j, 2 + j);
  for (let i = 1; i < rings; i++) for (let j = 0; j < segs; j++) { const a = 1 + (i - 1) * row + j, c = 1 + i * row + j; idx.push(a, c, a + 1, a + 1, c, c + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g.rotateX(-Math.PI / 2);
  return g;
}

export type Pond = {
  scene: THREE.Scene;
  frog: Frog;
  /** Glow that travels with the frog: halo behind it, light pool on the ground, green point light. */
  frogFx: { halo: THREE.Object3D; pool: THREE.Object3D; light: THREE.Object3D };
  /** The "ask the frog" thought cloud; the page moves it so it always sits right of the name. */
  cloud: THREE.Group;
  cloudBase: { x: number; y: number };
  underwater: Underwater;
  pagoda: THREE.Group;
  /** Rendered after the bloom pass: crisp elements that must not glow (the sign lettering). */
  overlay: THREE.Scene;
  reflector: Reflector | null;
  bloom: { strength: number; radius: number; threshold: number };
  update: (t: number, dt: number, look: { x: number; y: number }, amp: number, activeExp: string | null, camY: number) => void;
};

export function buildPond(tier: Tier, size: { w: number; h: number }): Pond {
  const { R, rnd } = seeded(11);
  const SKY = SKIES[tier.theme];
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(SKY.fog, 45, 320);
  const softDot = softDotTex();
  const tick: ((t: number, dt: number, amp: number) => void)[] = [];

  // ── sky, stars, moon ──────────────────────────────────────────────────────
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1800, 260), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(4, 512, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, SKY.top); g.addColorStop(0.62, SKY.mid); g.addColorStop(0.93, SKY.hor); g.addColorStop(1, SKY.hor); x.fillStyle = g; x.fillRect(0, 0, 4, 512);
  }) }));
  sky.position.set(0, 110, -260); scene.add(sky);
  const stars: number[] = []; for (let i = 0; i < 400; i++) stars.push(R(-400, 400), R(60, 240), -250);
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(stars, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: "#dfe6ff", size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.7, fog: false })));
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ fog: false, transparent: true, depthWrite: false, map: canvasTex(256, 256, (x) => {
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,240,250,1)"); g.addColorStop(0.18, "rgba(255,225,245,0.95)"); g.addColorStop(0.24, "rgba(255,160,220,0.35)"); g.addColorStop(1, "rgba(120,100,200,0)");
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  }) }));
  moon.scale.set(24, 24, 1); moon.position.set(46, 40, -150); scene.add(moon);
  const moonRing = new THREE.Mesh(new THREE.RingGeometry(6.4, 6.9, 96), new THREE.MeshBasicMaterial({ color: glow(C.pink, 1.6), toneMapped: false, fog: false, transparent: true, opacity: 0.8 }));
  moonRing.position.set(46, 40, -149.5); scene.add(moonRing);

  // ── hills, city (merged), light pillars, mist ─────────────────────────────
  for (const [z, col, amp] of [[-165, "#1a2446", 9], [-140, "#141c34", 5]] as const) {
    const pts = [new THREE.Vector2(-400, -2)];
    for (let x = -400; x <= 400; x += 8) pts.push(new THREE.Vector2(x, 1 + Math.abs(Math.sin(x * 0.013) * amp + Math.sin(x * 0.041) * amp * 0.4)));
    pts.push(new THREE.Vector2(400, -2));
    const hill = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)), new THREE.MeshBasicMaterial({ color: col }));
    hill.position.set(0, SURF, z); scene.add(hill);
  }
  {
    const winTex = (hue: string) => canvasTex(128, 512, (x) => {
      x.fillStyle = "#0c1026"; x.fillRect(0, 0, 128, 512);
      for (let yy = 6; yy < 506; yy += 10) for (let xx = 6; xx < 122; xx += 12) if (rnd() > 0.45) {
        x.fillStyle = rnd() > 0.7 ? hue : rnd() > 0.5 ? "#9fe8ff" : "#c9d2ff"; x.globalAlpha = R(0.35, 1); x.fillRect(xx, yy, 7, 4);
      }
    });
    const bodies: THREE.BufferGeometry[][] = [[], []], tips: THREE.BufferGeometry[] = [];
    const put = (g: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0) => { g.rotateY(ry); g.translate(x, y, z); return g; };
    for (let i = 0; i < (tier.low ? 36 : 72); i++) {
      const x = R(-300, 300), z = R(-260, -170), w = R(6, 14), h = x < 25 ? R(5, 13) : R(10, i % 6 === 0 ? 44 : 26), kind = i % 5, B = bodies[i % 2];
      B.push(put(kind === 3 ? new THREE.CylinderGeometry(w * 0.42, w * 0.5, h, 14) : new THREE.BoxGeometry(w, h, w * 0.8), x, SURF + h / 2, z));
      if (kind === 1 || kind === 4) {
        B.push(put(new THREE.BoxGeometry(w * 0.62, h * 0.22, w * 0.5), x + R(-1, 1), SURF + h * 1.11, z));
        if (kind === 4) B.push(put(new THREE.BoxGeometry(w * 0.3, h * 0.14, w * 0.3), x, SURF + h * 1.29, z));
      }
      if (kind === 1 || kind === 2 || kind === 3) {
        const ah = R(3, 9), top = SURF + h * (kind === 1 ? 1.22 : 1);
        B.push(put(new THREE.CylinderGeometry(0.12, 0.2, ah, 6), x, top + ah / 2, z));
        tips.push(put(new THREE.SphereGeometry(0.45, 8, 6), x, top + ah, z));
      }
      if (kind === 0) B.push(put(new THREE.ConeGeometry(w * 0.72, R(3, 7), 4), x, SURF + h + 2, z, Math.PI / 4));
    }
    const hues = ["#ff7ad9", "#5ff3ff"];
    bodies.forEach((list, i) => {
      const nonIndexed = list.map((g) => (g.index ? g.toNonIndexed() : g));
      scene.add(new THREE.Mesh(mergeGeometries(nonIndexed), new THREE.MeshStandardMaterial({ color: "#10152e", emissive: "#ffffff", emissiveMap: winTex(hues[i]), emissiveIntensity: 0.9, roughness: 0.8 })));
    });
    scene.add(new THREE.Mesh(mergeGeometries(tips), new THREE.MeshBasicMaterial({ color: glow(C.pink, 0.9), toneMapped: false })));
    const pillar = (col: string) => canvasTex(8, 256, (x) => { const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, "rgba(255,255,255,0.15)"); g.addColorStop(0.5, col); g.addColorStop(1, col); x.fillStyle = g; x.fillRect(0, 0, 8, 256); });
    for (const [x, z, w, h, col] of [[60, -200, 6, 60, "rgba(255,140,220,0.95)"], [95, -230, 5, 70, "rgba(120,240,255,0.9)"], [125, -210, 5, 62, "rgba(200,170,255,0.85)"]] as const) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: pillar(col), transparent: true, opacity: 0.32, toneMapped: false }));
      m.position.set(x, SURF + h / 2, z); scene.add(m);
    }
    const mist = (z: number, y: number, w: number, h: number, opacity: number) => {
      const t = canvasTex(256, 128, (x) => { const g = x.createRadialGradient(128, 64, 5, 128, 64, 128); g.addColorStop(0, "rgba(150,165,225,0.9)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 128); });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity, depthWrite: false, fog: false }));
      m.position.set(R(-20, 20), y, z); scene.add(m);
    };
    mist(-150, 5, 700, 30, 0.32); mist(-80, 2.5, 460, 12, 0.22); mist(-35, 1.2, 300, 5, 0.14);
  }

  // ── pagoda: ink-black shapes with neon edges ─────────────────────────────
  const pagoda = new THREE.Group();
  {
    const g = pagoda; g.position.set(27, SURF, -88); g.rotation.y = -0.5; scene.add(g);
    const ink = new THREE.MeshBasicMaterial({ color: "#070812" });
    const add = (geo: THREE.BufferGeometry, pos: P3, color: string, { rotY = 0, sc = [1, 1, 1] as P3, k = 1.05 } = {}) => {
      const m = new THREE.Mesh(geo, ink); m.position.set(...pos); m.rotation.y = rotY; m.scale.set(...sc); g.add(m);
      const e = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geo, 20)), lineMat(color, { width: 2.2, k }));
      e.position.copy(m.position); e.rotation.copy(m.rotation); e.scale.copy(m.scale); g.add(e);
    };
    const teal = "#2ee8b0";
    add(new THREE.BoxGeometry(14, 1.4, 11), [0, 0.7, 0], C.violet);
    const pillars: number[] = [];
    for (const [x, z] of [[-4.5, -3.5], [4.5, -3.5], [-4.5, 3.5], [4.5, 3.5], [-1.5, 3.5], [1.5, 3.5]]) pillars.push(x, 1.4, z, x, 6.5, z);
    segments(g, pillars, lineMat(C.pink, { width: 2.4, k: 1.1 }));
    add(new THREE.BoxGeometry(10.4, 1.3, 8.4), [0, 7.2, 0], C.yellow, { k: 0.9 });
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 0.35), new THREE.MeshBasicMaterial({ color: glow("#ffe27a", 1.5), toneMapped: false })); strip.position.set(0, 7.2, 4.22); g.add(strip);
    const roof = (y: number, r: number, h: number) => {
      add(new THREE.ConeGeometry(r, h, 4, 1, true), [0, y, 0], teal, { rotY: Math.PI / 4, sc: [1.25, 1, 1] });
      const e = y - h / 2, zf = r * 0.72;
      line(g, curve([[-r * 1.02, e + 0.9, zf], [-r * 0.5, e - 0.05, zf], [r * 0.5, e - 0.05, zf], [r * 1.02, e + 0.9, zf]], 24), teal, { width: 2.4, k: 1.2 });
    };
    roof(9, 9.2, 3.2);
    add(new THREE.BoxGeometry(6, 2.6, 5), [0, 11.2, 0], C.pink);
    const uwin = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.4), new THREE.MeshBasicMaterial({ color: glow("#ff9ad8", 1.4), toneMapped: false })); uwin.position.set(0, 11.3, 2.52); g.add(uwin);
    roof(13.5, 6.4, 3.4);
    line(g, [[0, 15.2, 0], [0, 17.2, 0]], C.yellow, { width: 2.4, k: 1.8 });
  }

  // ── water: mirror + animated ripples (desktop) or a plain glossy plane (phones) ──
  let reflector: Reflector | null = null;
  {
    const plane = new THREE.PlaneGeometry(900, 600);
    let water: THREE.Mesh;
    if (tier.low) {
      water = new THREE.Mesh(plane, new THREE.MeshStandardMaterial({ color: "#0d1a3c", roughness: 0.55, metalness: 0.25, transparent: true, opacity: 0.94 }));
    } else {
      const shader = {
        name: "PondWater",
        uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uTime: { value: 0 },
          deep: { value: new THREE.Color("#0b1636") }, fogC: { value: new THREE.Color(SKY.fog) } },
        vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
          void main(){ vUv = textureMatrix * vec4(position,1.0); vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 deep; uniform vec3 fogC; uniform float uTime; varying vec4 vUv; varying vec3 vW;
          void main(){
            vec2 p = vW.xz;
            float rip = sin(p.x*0.9 + p.y*1.7 + uTime*0.9)*0.5 + sin(p.y*3.3 - p.x*0.6 - uTime*0.7)*0.35 + sin(p.x*5.1 + p.y*0.4 + uTime*1.3)*0.15;
            float streak = smoothstep(0.55, 1.0, sin(p.y*2.2 + sin(p.x*0.15 + uTime*0.2)*2.0)) * 0.5;
            vec4 uv = vUv; uv.x += rip * 0.010 * uv.w; uv.y += (rip*0.004 + streak*0.006) * uv.w;
            vec3 refl = texture2DProj(tDiffuse, uv).rgb;
            // the half-float mirror image can hold NaN/Inf from very bright neon; the bloom blur would spread it over the frame
            if (any(isnan(refl)) || any(isinf(refl))) refl = vec3(0.0);
            refl = min(refl, vec3(8.0));
            vec3 v = normalize(cameraPosition - vW);
            float fres = 0.18 + 0.82 * pow(1.0 - clamp(v.y,0.0,1.0), 3.0);
            vec3 c = mix(deep, refl * 0.9, clamp(fres*1.1, 0.22, 0.88));
            c += vec3(0.05,0.07,0.12) * streak;
            c = mix(c, fogC, smoothstep(40.0, 240.0, length(cameraPosition - vW)) * 0.85);
            gl_FragColor = vec4(c, mix(0.6, 0.97, clamp(fres*1.3,0.0,1.0)));
          }`,
      };
      reflector = new Reflector(plane, { textureWidth: Math.round(size.w * 0.6), textureHeight: Math.round(size.h * 0.6), clipBias: 0.003, shader, color: 0xffffff });
      (reflector.material as THREE.ShaderMaterial).uniforms.uTime = motion.uTime; // share the clock (Reflector clones uniforms)
      water = reflector;
    }
    (water.material as THREE.Material).transparent = true;
    water.rotation.x = -Math.PI / 2; water.position.y = SURF; scene.add(water);
    // murky floor under the pond, stopping short of the dive column so the frog can swim down
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 200), new THREE.MeshStandardMaterial({ color: "#0a1428", roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(-68, SURF - 2.2, 0); scene.add(floor);
  }

  // ── lights ────────────────────────────────────────────────────────────────
  scene.add(new THREE.HemisphereLight("#9fb0e8", "#1e2a2a", 1.7));
  const moonL = new THREE.DirectionalLight("#c9d2ff", 1.3); moonL.position.set(30, 40, -60); scene.add(moonL);
  const rim = new THREE.DirectionalLight("#ff9ad8", 0.5); rim.position.set(-40, 10, 20); scene.add(rim);

  const underwater = buildUnderwater(scene, tier, softDot);
  const overlay = new THREE.Scene(); // things drawn after bloom (crisp, never glowing)
  const landFog = { color: new THREE.Color(SKY.fog), near: 45, far: 320 };
  const fog = scene.fog as THREE.Fog;

  // ── lily pads: one instanced fill + four batched outline sets, all riding the wave field ──
  const placed: [number, number, number][] = [];
  const pads: { x: number; z: number; r: number; rot: number; circuit: boolean }[] = [];
  const pad = (x: number, z: number, r: number, circuit = false) => {
    for (const [px, pz, pr] of placed) if (Math.hypot(px - x, pz - z) < pr + r + 0.25) return;
    placed.push([x, z, r]); pads.push({ x, z, r, rot: rnd() * Math.PI * 2, circuit });
  };
  pad(-17, 9, 3.2); pad(-4, 12.5, 2.6); pad(6, 8, 2.1); pad(16, 13, 3.6, true); pad(-25, 16, 4); pad(1, 19, 3.2); pad(22, 5.5, 1.9); pad(-9, 6, 1.4); pad(12, 3.8, 1.3);
  for (let i = 0; i < (tier.low ? 45 : 90); i++) pad(R(-60, 60), R(3.2, 24), R(0.8, 2.2), rnd() < 0.04);
  for (let i = 0; i < (tier.low ? 60 : 120); i++) pad(R(-90, 90), R(-80, -4), R(1.2, 3.5), rnd() < 0.05);
  {
    const fill = new THREE.InstancedMesh(padGeo(), withMeshMotion(new THREE.MeshBasicMaterial({ color: "#061410", side: THREE.DoubleSide }), "wave"), pads.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    pads.forEach((p, i) => fill.setMatrixAt(i, m.compose(new THREE.Vector3(p.x, SURF + 0.03, p.z), q.setFromAxisAngle(up, p.rot), new THREE.Vector3(p.r, p.r, p.r))));
    fill.frustumCulled = false; scene.add(fill);
    const S = { rim: [] as number[], vein: [] as number[], rimC: [] as number[], veinC: [] as number[] };
    const notch = 0.24, a0 = notch / 2, a1 = Math.PI * 2 - notch / 2;
    for (const p of pads) {
      const y = SURF + 0.06 + p.r * 0.02, Q = (a: number, rr: number): P3 => [p.x + Math.cos(-a - p.rot) * rr, y, p.z + Math.sin(-a - p.rot) * rr];
      const rim = p.circuit ? S.rimC : S.rim, vein = p.circuit ? S.veinC : S.vein;
      const arc: P3[] = []; for (let i = 0; i <= 40; i++) arc.push(Q(a0 + ((a1 - a0) * i) / 40, p.r));
      rim.push(...toSegs(arc), ...Q(a0, p.r), ...Q(0, 0), ...Q(a1, p.r), ...Q(0, 0));
      for (let i = 1; i < 6; i++) vein.push(...Q(0, p.r * 0.08), ...Q((i / 6) * Math.PI * 2, p.r * 0.9));
    }
    const mk = (arr: number[], color: string, width: number, k: number, opacity: number) => {
      if (arr.length) segments(scene, arr, withLineMotion(lineMat(color, { width, k, opacity, worldUnits: true }), "wave")).frustumCulled = false;
    };
    mk(S.rim, C.pad, 0.06, 0.62, 0.9); mk(S.vein, C.pad, 0.03, 0.42, 0.5); mk(S.rimC, C.pink, 0.07, 0.9, 1); mk(S.veinC, C.cyan, 0.035, 0.8, 0.8);
  }

  // ── lotus: petals merged per flower (2 draw calls each); sway with the pad under them ──
  const petal = (() => { const g = new THREE.SphereGeometry(1, 20, 14); g.scale(0.3, 0.8, 0.13); g.translate(0, 0.8, 0.02); return g; })();
  const lotusGeo = (() => {
    const parts: THREE.BufferGeometry[] = [];
    [[8, 1.0], [6, 0.55], [5, 0.2]].forEach(([n, tilt], ri) => {
      for (let i = 0; i < n; i++) {
        const g = petal.clone(); const s = 1 - ri * 0.12;
        g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(tilt, (i / n) * Math.PI * 2 + ri * 0.35, 0, "YXZ")).scale(new THREE.Vector3(s, s, s)));
        parts.push(g);
      }
    });
    return mergeGeometries(parts);
  })();
  const sph = new THREE.SphereGeometry(1, 48, 32);
  const lotus = (x: number, z: number, s = 1, light = true, em = 1) => {
    const g = new THREE.Group(); g.position.set(x, SURF + 0.1, z); g.scale.setScalar(s); scene.add(g);
    blob(g, lotusGeo, C.pink, { t: 0.045, fill: 0.55, k: 1.85 * em });
    blob(g, sph, C.yellow, { pos: [0, 0.4, 0], scale: [0.18, 0.18, 0.18], t: 0.05, k: 2.2 * em });
    if (light && !(tier.low && em < 1)) { const l = new THREE.PointLight(C.pink, 3 * s * em, 6 * s, 1.7); l.position.y = 0.9; g.add(l); }
    line(g, ringPts(1.9, 96, -0.05), "#3ff0ff", { width: 1.8, k: 1, opacity: 0.7 });
    const ph = rnd() * 6;
    tick.push((t, _dt, amp) => {
      g.position.y = SURF + 0.1 + pondWave(x, z, t, amp);
      g.rotation.z = amp * 0.035 * Math.sin(t * 0.55 + ph); // ≤ 2°
      g.rotation.x = amp * 0.025 * Math.sin(t * 0.43 + ph * 1.7);
    });
  };
  lotus(-15.5, 8.3, 0.85, true, 0.25); lotus(6.3, 8.1, 0.8); lotus(24, 14.5, 0.9, true, 0.25);
  lotus(-30, -10, 1.1, false); lotus(20, -14, 1.2, false); lotus(-6, -22, 1, false); lotus(44, -20, 1.3, false);

  // holo ring: slow brightness/scale pulse
  {
    const g = new THREE.Group(); g.position.set(2, SURF + 0.04, -12); scene.add(g);
    const r = 3, segs: number[] = [...toSegs(ringPts(r)), ...toSegs(ringPts(r * 0.72))];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; segs.push(Math.cos(a) * r * 0.2, 0, Math.sin(a) * r * 0.2, Math.cos(a) * r * 0.62, 0, Math.sin(a) * r * 0.62); }
    segments(g, segs, lineMat("#3ff0ff", { width: 1.6, k: 0.9, opacity: 0.7 }));
    tick.push((t, _dt, amp) => g.scale.setScalar(1 + amp * 0.03 * Math.sin(t * 0.8)));
  }

  // koi: slow loops under the surface, tail wagging
  const koi = (cx: number, cz: number, rx: number, rz: number, speed: number, spots: string) => {
    const g = new THREE.Group(); scene.add(g);
    blob(g, sph, "#fff1e6", { scale: [1.25, 0.28, 0.38], t: 0.035, fill: 0.5, k: 1.3 });
    const tail = new THREE.Group(); tail.position.x = -1.1; g.add(tail);
    line(tail, [[0, 0.05, 0], [-0.9, 0.05, 0.55], [-0.65, 0.05, 0], [-0.9, 0.05, -0.55], [0, 0.05, 0]], "#fff1e6", { width: 2, k: 1.2 });
    line(g, ringPts(0.22, 24, 0.3, 0.2, 0.05), spots, { width: 2, k: 1.4 }); line(g, ringPts(0.16, 24, 0.3, -0.5, -0.08), spots, { width: 2, k: 1.4 });
    const ph = rnd() * 6;
    tick.push((t) => {
      const a = t * speed + ph, x = cx + Math.cos(a) * rx, z = cz + Math.sin(a) * rz;
      g.position.set(x, SURF - 0.45, z);
      // face along the path: local +x (the head) points along the velocity
      const s = Math.sign(speed), vx = -Math.sin(a) * rx * s, vz = Math.cos(a) * rz * s;
      g.rotation.y = Math.atan2(-vz, vx);
      tail.rotation.y = 0.35 * Math.sin(t * 5 + ph);
    });
  };
  koi(-1.5, 10.5, 4, 1.6, 0.12, "#ff9a4a"); koi(10, 15, 3.5, 1.4, -0.09, C.pink);

  // ── the land strip (top arm of the Ɔ) ────────────────────────────────────
  {
    const stoneTex = canvasTex(1024, 128, (x, w, h) => {
      x.fillStyle = "#26304a"; x.fillRect(0, 0, w, h);
      for (let yy = 0; yy < h; yy += 32) for (let xx = ((yy / 32) % 2) * 40; xx < w; xx += 80) { x.fillStyle = `hsl(${R(220, 250)},18%,${R(18, 26)}%)`; x.fillRect(xx + 2, yy + 2, 76, 28); }
    });
    stoneTex.wrapS = THREE.RepeatWrapping; stoneTex.repeat.set(4, 1);
    const mossTex = canvasTex(1024, 128, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#2c4f4a"); g.addColorStop(1, "#1b3336"); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { x.globalAlpha = 0.18; x.fillStyle = rnd() > 0.5 ? "#5c8f78" : "#10242a"; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, R(10, 40), R(4, 12), 0, 0, 7); x.fill(); }
    });
    mossTex.wrapS = THREE.RepeatWrapping; mossTex.repeat.set(3, 1);
    const stone = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 });
    const land = new THREE.Mesh(new RoundedBoxGeometry(70, 1.4, 6, 3, 0.35), [stone, stone, new THREE.MeshStandardMaterial({ map: mossTex, roughness: 0.85 }), new THREE.MeshStandardMaterial({ color: "#141a2a" }), stone, stone]);
    land.position.set(-26, -0.7, -0.5); scene.add(land);
    const edge: P3[] = []; for (let x = -61; x <= 8.9; x += 0.5) edge.push([x, 0.02, 2.55 + Math.sin(x * 0.7) * 0.12 + Math.sin(x * 0.23) * 0.2]);
    line(scene, edge, C.frog, { width: 1.8, k: 0.8, opacity: 0.7 });
    // rocks and grass: one instanced mesh each; grass bends in the wind
    const rocks: THREE.Matrix4[] = [];
    for (let i = 0; i < 34; i++) { const x = R(-32, 9.5); if (x > -14 && x < -9.6) continue; const sc = R(0.22, 0.6);
      rocks.push(new THREE.Matrix4().compose(new THREE.Vector3(x, -0.45 + sc * 0.25, R(2.4, 3.3)), new THREE.Quaternion().setFromEuler(new THREE.Euler(R(0, 3), R(0, 3), R(0, 3))), new THREE.Vector3(sc * R(1, 1.8), sc * 0.55, sc))); }
    const rockMesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: "#2a3148", roughness: 0.95, flatShading: true }), rocks.length);
    rocks.forEach((m, i) => rockMesh.setMatrixAt(i, m)); scene.add(rockMesh);
    const blades: THREE.Matrix4[] = [];
    for (let i = 0; i < 140; i++) { const x = R(-40, 8.5); if (TERR_X.some((t) => Math.abs(x - t) < 2.5)) continue; const h = R(0.4, 1.0);
      blades.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.3 + (h - 1) / 2, R(-3, 2.4)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, R(-0.3, 0.3))), new THREE.Vector3(1, h, 1))); }
    const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 1, 3), withMeshMotion(new THREE.MeshStandardMaterial({ color: "#2f6a55", roughness: 0.8, side: THREE.DoubleSide }), "wind", 0), blades.length);
    blades.forEach((m, i) => grass.setMatrixAt(i, m)); grass.frustumCulled = false; scene.add(grass);
    const reeds: number[] = [];
    for (let i = 0; i < 12; i++) { const x = R(-24, 7); if (TERR_X.some((t) => Math.abs(x - t) < 2.5)) continue; reeds.push(...toSegs(curve([[x, 0, 2.2], [x + 0.1, 0.7, 2.2], [x + R(-0.3, 0.3), 1.4, 2.2]], 8))); }
    segments(scene, reeds, withLineMotion(lineMat(C.frog, { width: 1.2, k: 0.5, opacity: 0.3 }), "wind", 0)).frustumCulled = false;
    // terraces
    TERR_X.forEach((x) => { for (let k = 0; k < 3; k++) blob(scene, new RoundedBoxGeometry(4.4 - k * 0.5, 0.48, 3 - k * 0.3, 4, 0.2), [C.purple, C.violet, "#a78bff"][k], { pos: [x, 0.25 + k * 0.5, -0.5], t: 0.05, fill: 0.5, k: 2 }); });
    // signpost (kept out of the water reflection: layer 1)
    const wood = new THREE.MeshStandardMaterial({ color: "#5a3d2a", roughness: 0.8 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.4, 10), wood); post.position.set(-16.8, 1.7, -0.6);
    const board = new THREE.Mesh(new RoundedBoxGeometry(5.6, 1.5, 0.3, 3, 0.1), new THREE.MeshStandardMaterial({ color: "#0e1a24", roughness: 0.6 })); board.position.set(-16.8, 3.3, -0.6);
    const txt = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 1, depthWrite: false, map: canvasTex(1024, 256, (x) => {
      x.font = '700 108px "JetBrains Mono", ui-monospace, monospace'; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillStyle = "#b8ffd4"; x.fillText("janys-ponder", 512, 128); // crisp, no halo
    }) }));
    txt.position.set(-16.8, 3.3, -0.43);
    const frame = line(scene, [[-19.55, 2.6, -0.44], [-19.55, 4, -0.44], [-14.05, 4, -0.44], [-14.05, 2.6, -0.44], [-19.55, 2.6, -0.44]], C.frog, { width: 1.6, k: 0.9, opacity: 0.7 });
    for (const o of [post, board, frame]) { o.layers.set(1); scene.add(o); }
    txt.layers.set(1); overlay.add(txt); // drawn after the glow pass, so the letters never bloom
    const lan = new THREE.PointLight("#7dffb0", 3, 6, 1.8); lan.position.set(-16.8, 3.5, 1.2); scene.add(lan);
    // pier: planks + posts merged into one mesh
    const pier: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 14; i++) pier.push(new THREE.BoxGeometry(0.46, 0.18, 2.4).translate(10.8 + i * 0.5, 0.55, -0.4));
    for (const x of [11, 14.3, 17.4]) for (const z of [-1.4, 0.6]) pier.push(new THREE.CylinderGeometry(0.16, 0.16, 2.6, 10).toNonIndexed().translate(x, -0.6, z));
    scene.add(new THREE.Mesh(mergeGeometries(pier.map((g) => (g.index ? g.toNonIndexed() : g))), wood));
  }

  // ── the palm: trunk sways ≤ 1°, fronds ≤ 4° and lag the trunk (wind moves the crown after the stem) ──
  {
    const palm = new THREE.Group(); palm.position.set(9.2, 0, 0.5); scene.add(palm);
    line(palm, curve([[0, 0, 0], [-0.4, 2.5, 0], [0.2, 5, 0], [1.4, 7.2, 0]]), C.pink, { width: 3.4, k: 2.2 });
    const crown = new THREE.Group(); crown.position.set(1.4, 7.2, 0); palm.add(crown);
    const fronds = [[3, -1.6], [2.6, 0.6], [-2.6, -1.4], [-1.6, 1.2], [0.6, 2.2]].map(([dx, dy]) => {
      const f = new THREE.Group(); crown.add(f);
      line(f, curve([[0, 0, 0], [dx * 0.55, dy * 0.5 + 0.8, 0], [dx, dy, 0]], 16), C.pink, { width: 2.8, k: 2.1 });
      return f;
    });
    if (!tier.low) { const pl = new THREE.PointLight(C.pink, 6, 9, 1.6); pl.position.set(10.4, 5, 2); scene.add(pl); }
    tick.push((t, _dt, amp) => {
      const gust = 0.6 + 0.4 * Math.sin(t * 0.13);
      const trunk = Math.sin(t * 0.5) * 0.7 + Math.sin(t * 1.1) * 0.3;
      palm.rotation.z = amp * 0.017 * trunk * gust;
      fronds.forEach((f, i) => { f.rotation.z = amp * gust * 0.07 * (Math.sin(t * 0.5 - 0.6 - i * 0.4) * 0.7 + Math.sin(t * 1.7 + i) * 0.3); });
    });
  }

  // ── thought cloud ("ask the frog"): a slow bob ───────────────────────────
  const cg = new THREE.Group(); const cloudBase = { x: ANCHORS.cloud[0], y: ANCHORS.cloud[1] };
  {
    const bumps = [[-2.4, -0.2, 1.1], [-1.1, 0.6, 1.25], [0.6, 0.85, 1.35], [2.1, 0.2, 1.1], [1.3, -0.7, 1], [-0.6, -0.7, 1]];
    const cloud: P3[] = [];
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a); let best = 0;
      for (const [bx, by, r] of bumps) { const b = bx * dx + by * dy, c = bx * bx + by * by - r * r, disc = b * b - c; if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc)); }
      cloud.push([dx * best, dy * best * 0.8, 0]);
    }
    cg.position.set(...ANCHORS.cloud); scene.add(cg);
    const cf = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(cloud.map((p) => new THREE.Vector2(p[0], p[1])))), new THREE.MeshBasicMaterial({ color: "#0a1030", transparent: true, opacity: 0.75, fog: false }));
    cf.position.z = -0.05; cg.add(cf);
    line(cg, cloud, "#5a8bff", { width: 2.4, k: 1.2, opacity: 0.9 });
    tick.push((t, _dt, amp) => { cg.position.x = cloudBase.x; cg.position.y = cloudBase.y + amp * 0.12 * Math.sin(t * 0.6); });
  }

  // ── the frog (kept out of the reflection so its bright double doesn't compete) ──
  const frog = new Frog();
  frog.root.position.set(...ANCHORS.frog); frog.root.scale.setScalar(1.22); scene.add(frog.root);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot, color: C.frog, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  halo.scale.set(11, 11, 1); halo.position.set(-11.8, 1.9, -0.8); scene.add(halo);
  frog.root.traverse((o) => o.layers.set(1)); halo.layers.set(1);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshBasicMaterial({ map: softDot, color: C.frog, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(-11.8, 0.03, 0.4); scene.add(pool);
  const fl = new THREE.PointLight(C.frog, 18, 8, 1.5); fl.position.set(-11.8, 1.5, 2.5); scene.add(fl);

  // ── floating motes: drift upward slowly, looping (GPU) ────────────────────
  {
    const bp: number[] = [], bc: number[] = [];
    const pal = ["#9ff4ff", "#ff9ad8", "#c9b8ff", "#fff2b0"].map((c) => new THREE.Color(c));
    for (let i = 0; i < (tier.low ? 100 : 200); i++) { bp.push(R(-60, 60), R(-0.3, 12), R(-60, 26)); const c = pal[i % 4]; bc.push(c.r, c.g, c.b); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute("color", new THREE.Float32BufferAttribute(bc, 3));
    const pm = new THREE.PointsMaterial({ map: softDot, size: 0.28, vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
    pm.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = motion.uTime; sh.uniforms.uAmp = motion.uAmp;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTime; uniform float uAmp;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\n transformed.y = -0.3 + mod(transformed.y + 0.3 + uAmp * uTime * 0.18, 12.3);\n transformed.x += uAmp * 0.25 * sin(uTime * 0.3 + transformed.z);");
    };
    const pts = new THREE.Points(bg, pm); pts.frustumCulled = false; scene.add(pts);
  }

  const bloom = tier.mobile ? { strength: 0.45, radius: 0.5, threshold: 0.42 } : { strength: 0.78, radius: 0.5, threshold: 0.42 };
  return {
    scene, frog, reflector, bloom, frogFx: { halo, pool, light: fl }, cloud: cg, cloudBase, underwater, pagoda, overlay,
    update(t, dt, look, amp, activeExp, camY) {
      for (const f of tick) f(t, dt, amp);
      frog.update(dt, t, look, amp);
      underwater.update(t, dt, amp, activeExp, camY);
      // fog turns deep blue and close once the camera is below the surface
      const w = THREE.MathUtils.smoothstep(SURF + 0.5 - camY, 0, 3.5);
      fog.color.copy(landFog.color).lerp(underwater.fog.color, w);
      fog.near = THREE.MathUtils.lerp(landFog.near, underwater.fog.near, w); fog.far = THREE.MathUtils.lerp(landFog.far, underwater.fog.far, w);
    },
  };
}
