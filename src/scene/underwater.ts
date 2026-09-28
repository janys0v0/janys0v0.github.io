// Below the surface: the water column (experiences), the seabed (Let's Chat), bubbles, light shafts,
// the splash when the frog dives, and the message bottle that floats up when a note is sent.
import * as THREE from "three";
import { experience } from "@/content/experience";
import { makeAnimal, type Animal } from "./animals";
import { blob, C, curve, glow, lineMat, motion, P3, ringPts, seeded, segments, toSegs, withLineMotion } from "./materials";
import { ANIMAL_X, EXP_DEPTHS, SEABED_Y, SURF } from "./stops";

export type Underwater = {
  update: (t: number, dt: number, amp: number, activeExp: string | null, camY: number) => void;
  splash: (x: number) => void;
  launchBottle: () => void;
  fog: { color: THREE.Color; near: number; far: number };
};

export function buildUnderwater(scene: THREE.Scene, tier: { low: boolean }, softDot: THREE.Texture): Underwater {
  const { R, rnd } = seeded(29);
  const root = new THREE.Group(); scene.add(root);
  const deepTex = (() => {
    const cv = document.createElement("canvas"); cv.width = 4; cv.height = 512; const x = cv.getContext("2d")!;
    const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, "#0e4a7a"); g.addColorStop(0.12, "#0a2f5a"); g.addColorStop(0.55, "#061a38"); g.addColorStop(1, "#02060f");
    x.fillStyle = g; x.fillRect(0, 0, 4, 512); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  // backdrop behind the column (only visible from below the surface)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(420, SURF - SEABED_Y + 20), new THREE.MeshBasicMaterial({ map: deepTex, fog: false }));
  back.position.set(10, (SURF + SEABED_Y - 20) / 2, -70); root.add(back);
  // the underside of the water surface, with a bright rippling cut line
  const lid = new THREE.Mesh(new THREE.PlaneGeometry(420, 220), new THREE.MeshBasicMaterial({ color: "#2a8fb8", transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false }));
  lid.rotation.x = -Math.PI / 2; lid.position.y = SURF - 0.02; root.add(lid);
  segments(root, toSegs(Array.from({ length: 160 }, (_, i) => [-60 + i, SURF - 0.05, 3] as P3)), withLineMotion(lineMat(C.cyan, { width: 2.2, k: 1.6 }), "wave")).frustumCulled = false;

  // light shafts from the surface
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(R(1.4, 3.2), 34), new THREE.MeshBasicMaterial({ color: "#7fe8ff", transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    s.position.set(12 + i * 4.2, SURF - 17, -6); s.rotation.z = 0.22; root.add(s);
  }

  // bubbles rising through the column (GPU loop)
  {
    const n = tier.low ? 160 : 320, pos: number[] = [];
    for (let i = 0; i < n; i++) pos.push(R(-10, 44), R(SEABED_Y, SURF), R(-8, 6));
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ map: softDot, color: glow("#bff6ff", 1.1), size: 0.22, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
    const span = (SURF - SEABED_Y).toFixed(1), base = SEABED_Y.toFixed(1);
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = motion.uTime; sh.uniforms.uAmp = motion.uAmp;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTime; uniform float uAmp;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          transformed.y = ${base} + mod(transformed.y - ${base} + uTime * (0.9 + fract(transformed.x * 7.3) * 0.8), ${span});
          transformed.x += uAmp * 0.15 * sin(uTime * 2.0 + transformed.y);`);
    };
    const p = new THREE.Points(g, m); p.frustumCulled = false; root.add(p);
  }

  // the client animals, one per experience, on the left of the column
  const animals: { id: string; a: Animal }[] = experience.map((e, i) => {
    const a = makeAnimal(e.animal, [ANIMAL_X, EXP_DEPTHS[i] + 0.4, 0], e.animal === "crab" || e.animal === "starfish" ? 1.15 : 1.05);
    root.add(a.group); return { id: e.id, a };
  });

  // the seabed: dark sand, a neon grid, kelp that sways, rocks, and the message bottle
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(200, 40), new THREE.MeshBasicMaterial({ color: "#04050c" }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, SEABED_Y - 0.02, -8); root.add(sand);
  const grid: number[] = [];
  for (let z = -16; z <= 4; z += 2) grid.push(-80, SEABED_Y, z, 60, SEABED_Y, z);
  for (let x = -80; x <= 60; x += 3) grid.push(x, SEABED_Y, -16, x, SEABED_Y, 4);
  segments(root, grid, lineMat(C.cyan, { width: 1.1, k: 1.1, opacity: 0.35 }));
  segments(root, [-80, SEABED_Y, 4, 60, SEABED_Y, 4], lineMat(C.cyan, { width: 2.4, k: 1.4, opacity: 0.9 }));
  const kelp: number[] = [];
  for (let i = 0; i < 26; i++) { const x = R(-24, 40); if (x > 2 && x < 14) continue; const h = R(3, 8), z = R(-4, 2);
    kelp.push(...toSegs(Array.from({ length: 16 }, (_, j) => [x + Math.sin(j * 0.6 + i) * 0.3, SEABED_Y + (j * h) / 15, z] as P3))); }
  segments(root, kelp, withLineMotion(lineMat(C.frog, { width: 2, k: 1.4, opacity: 0.85 }), "wind", SEABED_Y)).frustumCulled = false;
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: "#2a2550", roughness: 0.9, flatShading: true, emissive: "#140f30" }), 12);
  const mtx = new THREE.Matrix4();
  for (let i = 0; i < 12; i++) { const s = R(0.5, 1.4); rocks.setMatrixAt(i, mtx.compose(new THREE.Vector3(R(-20, 38), SEABED_Y + s * 0.4, R(-5, 1)), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(), rnd(), rnd())), new THREE.Vector3(s * 1.3, s * 0.8, s))); }
  root.add(rocks);
  // message bottle
  const bottle = new THREE.Group(); bottle.position.set(3.5, SEABED_Y + 0.6, 2); bottle.rotation.z = -1.2; root.add(bottle);
  const prof = [[0, 0], [0.55, 0], [0.62, 0.1], [0.62, 1.3], [0.45, 1.7], [0.2, 1.9], [0.2, 2.4], [0, 2.4]].map(([a, b]) => new THREE.Vector2(a, b));
  blob(bottle, new THREE.LatheGeometry(prof, 40), C.cyan, { fill: 0.8, t: 0.05, k: 2.2 });
  blob(bottle, new THREE.CylinderGeometry(0.19, 0.17, 0.35, 20), C.sand, { pos: [0, 2.5, 0], k: 2 });
  segments(bottle, toSegs(curve([[-0.2, 0.4, 0.3], [0.05, 0.7, 0.35], [-0.1, 1.0, 0.35], [0.15, 1.2, 0.3]], 20)), lineMat(C.pink, { width: 2.6, k: 2.2 }));
  let bottleT = -1;

  // splash: rings spreading on the surface + a few droplet streaks
  const splashes: { g: THREE.Group; t: number }[] = [];
  const ringMat = lineMat("#bff6ff", { width: 2.2, k: 2, opacity: 1 });
  const splash = (x: number) => {
    const g = new THREE.Group(); g.position.set(x, SURF + 0.05, 0); scene.add(g);
    for (const r of [0.8, 1.6, 2.5]) segments(g, toSegs(ringPts(r, 48)), ringMat);
    const drops: number[] = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; drops.push(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3, Math.cos(a) * 0.9, 1.4 + (i % 3) * 0.5, Math.sin(a) * 0.9); }
    segments(g, drops, ringMat);
    splashes.push({ g, t: 0 });
  };

  const fog = { color: new THREE.Color("#082a4a"), near: 6, far: 70 };
  return {
    fog, splash,
    launchBottle() { bottleT = 0; },
    update(t, dt, amp, activeExp, camY) {
      root.visible = camY < SURF + 9; // the column is hidden while the camera is high above the pond
      for (const { id, a } of animals) a.update(t, dt, id === activeExp, amp);
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]; s.t += dt; s.g.scale.set(1 + s.t * 2.2, 1 - s.t * 0.6, 1 + s.t * 2.2);
        ringMat.opacity = Math.max(0, 1 - s.t / 0.9);
        if (s.t > 0.9) { scene.remove(s.g); splashes.splice(i, 1); }
      }
      if (bottleT >= 0) { // the note floats up out of view, then the bottle returns to the sand
        bottleT += dt; const k = Math.min(1, bottleT / 3.5);
        bottle.position.y = SEABED_Y + 0.6 + k * k * 40; bottle.rotation.z = -1.2 + k * 1.2; bottle.visible = k < 1;
        if (k >= 1 && bottleT > 5) { bottleT = -1; bottle.visible = true; bottle.position.y = SEABED_Y + 0.6; bottle.rotation.z = -1.2; }
      } else bottle.position.y = SEABED_Y + 0.6 + amp * 0.05 * Math.sin(t * 1.1);
    },
  };
}
