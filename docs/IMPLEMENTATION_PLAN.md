# janys.ponder: Implementation Plan

**Target look:** `design/concept/renders/hero_v7.png` (desktop), `hero_v7_mobile.png` (phone), `hero_v7_dusk.png` (light theme).
**Reference code:** `design/concept/world7.js` is a working three.js scene. We port it into React Three Fiber components; we don't redesign it.
**Content:** `docs/CONTENT_DRAFT.md` · **Structure and flow:** `docs/REDESIGN_PLAN.md`
**Direction:** the pond (frog) concept, chosen 2026-09-27. The Floors/stairwell concept (`design/concept/stair.js`) is parked.

---

## Decisions (locked 2026-09-25)

| Topic | Decision |
|---|---|
| Contact form | Formspree now; Cloudflare Worker only when the AI chat upgrades |
| Client animals | Claude builds neon placeholders; Janys can swap in drawings later |
| Ask the frog | Scripted answers (15 Q&As) at launch; Claude API later |
| Java engine | Dropped for now |
| Resume | No PDF download; LinkedIn button instead |
| BAM video | "Watch on LinkedIn" link → https://www.linkedin.com/feed/update/urn:li:ugcPost:7490130801372794880/ |
| ACME findings | Methods only for now; Janys checks with the lab before launch |
| Dusk theme | Keep as a light-theme toggle; tagline pink lightened for contrast |
| Direction | Pond + neon frog (v7), not the Floors stairwell |

---

## Tech feasibility (checked 2026-09-27): feasible, no blockers

**Measured, not estimated:**

| Check | Result | Verdict |
|---|---|---|
| Current site builds as a static export | `pnpm build` passes; first load 150 KB | ✅ Deploy path works |
| Library compatibility (React 19, Next 15, three 0.183) | All peer ranges match; one bump needed: `@react-three/fiber` 9.5 → 9.8 | ✅ |
| Desktop scene on a real GPU (Apple M3 Pro, 1600×900) | **5.9 ms/frame (≈171 fps)**, 1,084 draw calls, 594k triangles | ✅ Fast here; draw calls too high for weak laptops, so fix in Phase 1 |
| Phone scene (light tier, 390×844 @2×) | **1.5 ms/frame**, 170 draw calls, 139k triangles | ✅ ~8–15 ms expected on real phones |
| JavaScript for 3D + scroll (gzipped) | three ≈181 KB · R3F + helpers ≈80 KB · GSAP + ScrollTrigger 44 KB | ✅ ≈305 KB, well under the 2 MB budget |
| Models / textures to download | None: every object is built in code | ✅ |

**Stack (pinned):** Next.js 15.5.x (static export; not 16, to avoid a migration) · React 19 · three 0.183.2 (the version the renders used) · @react-three/fiber 9.8 · @react-three/drei 10.7 · GSAP 3.15 + ScrollTrigger · zustand 5 · Formspree · GitHub Pages.

**Risks and fixes:**

| Risk | Fix | Phase |
|---|---|---|
| 1,084 draw calls on desktop | Instanced lily-pad fills (≈210 → 1), merged frog/lotus parts, reflection at half resolution. Target ≤ 400 calls | 1 |
| iOS Safari address bar jumps break scroll-linked 3D | `ScrollTrigger.config({ ignoreMobileResize: true })` and `svh` units for the pinned canvas | 2 |
| High-DPI screens (4K, Retina) multiply GPU cost | Cap device pixel ratio at 1.5; auto-drop to the light tier if fps < 45 | 1 |
| Look drifts from the approved renders when ported | Reuse the concept's exact shaders: three's own `Reflector` and `UnrealBloomPass`, not look-alike helper libraries. Compare screenshots every phase | 1 |
| Next 15.2.2 security advisories | Upgrade to 15.5.x in Phase 0 (static export doesn't use the affected middleware, but patch anyway) | 0 |

---

## Motion spec (added 2026-09-27)

**Rule:** characters move; the world breathes. Ambient motion is at most about 1/5 of the characters' amplitude, slow (0.2–0.6 Hz), and never sits behind the text. `prefers-reduced-motion` turns ambient motion off and swaps character moves for short crossfades.

**Frog: smooth transitions between every motion**
- One motion state machine: `idle → crouch → hop → land → idle`, `dive → swim → tada`, `sit ↔ swim`.
- Every body part (head, eyes, 4 legs, body) has a target pose. Each frame, parts ease toward the target with critically damped springs (≈200–300 ms), so switching motions never snaps.
- Animation principles: anticipation (a crouch before each hop), squash on landing and stretch in the air, follow-through (legs trail and settle), and arcs (hops follow curves, not straight lines).
- Idle life: breathing (1.5% scale at 0.5 Hz), blinks every 3–6 s, and eyes that follow the cursor on desktop.
- Scroll drives *where* the frog is, but its position is smoothed, so jittery trackpad scrolling never makes the frog jitter.

**Client animals: one idle loop each, and a "wake-up" when their region is reached**
Octopus tentacles wave in sequence · jellyfish bell pulses and tentacles trail · turtle paddles · flying fish glides and bobs · starfish turns slowly · crab side-steps and snaps a claw.

**Environment (subtle, driven by physics)**

| Object | Motion | Max amplitude |
|---|---|---|
| Palm | Wind sway: fronds lag the trunk; layered slow sines plus rare gusts | Trunk 1°, fronds 4° |
| Lily pads | Bob and tilt on the same wave field as the water, so neighbors move together | ±0.03 height, 1.5° tilt |
| Lotus | Sway with the pad under it, plus a slow glow pulse | 2° |
| Water | Ripples moving in the shader; reflections wobble | — |
| Reeds and grass | Wind sway, bending more at the tips | 5° at the tip |
| Koi | Slow looping swim paths under the surface | — |
| Holo rings, city lights | Slow pulse; rare window flicker | ±10% brightness |

**How:** one shared clock. Wind and wave motion runs on the GPU (in the vertex shaders), so the hundreds of pads and reeds cost almost nothing. The frog uses a small parts rig with spring easing, and only the region nearest the frog animates its animal fully.

**Where it's built:** ambient motion and the frog's idle in Phase 1 (+1.5 hrs) · hop state machine in Phase 2 (+1 hr) · swim, tada and animal loops in Phase 3 (+1.5 hrs). The new total is about 34 hours.

---

## Build order

Each phase ends with a deploy you can open. Times assume I build and you review.

| # | Phase | Build time | You see at the end |
|---|---|---|---|
| 0 | Setup and cleanup | ~1 hr | Old cylinder gone; content in data files; `/overview` page live |
| 1 | Homepage scene + ambient motion | ~6.5 hrs | The v7 homepage running live in the browser, desktop and phone |
| 2 | Scroll path + frog motion system | ~5 hrs | Scrolling makes the frog hop across 3 terraces; keywords pop up |
| 3 | Dive + experiences + animal motion | ~7.5 hrs | Frog dives and swims past 6 client animals with cards |
| 4 | Seabed: Let's Chat | ~3 hrs | Contact form sends you an email; LinkedIn and email buttons |

**Then:**

| # | Phase | Build time | You see at the end |
|---|---|---|---|
| 5 | Case studies | ~5 hrs | `/work/isf` and `/work/acme` (with a playable Emotion Compass) |
| 6 | Ask the frog (scripted) | ~2.5 hrs | Chat panel answers 15 prepared questions from your content |
| 7 | Polish, dusk toggle, launch | ~4 hrs | Night/dusk switch, accessibility, performance, share images; live on janys0v0.github.io |

**Total:** about 34 hours of build time, or roughly 5 working sessions.

---

## Phase 0: Setup and cleanup (~1 hr)

1. Commit the current uncommitted work on `main` to a branch `archive/cylinder` so nothing is lost.
2. Create branch `redesign` from `main`.
3. Delete `CylinderScene.tsx`, `frogHop.tsx`, `SocialPanel.tsx`, `navbar.tsx`, `BannerBackground.tsx`, `src/app/tetete/`; point `/portfolio/indochina-starfish` at `/work/isf`.
4. Add `src/content/{profile,skills,experience}.ts` from `CONTENT_DRAFT.md`, plus design tokens (colors from the v7 palette) in `globals.css`.
5. Build `/overview`: a plain HTML version of all content. It becomes the no-3D fallback and the page search engines read.
6. Upgrade: `next@15.5`, `@react-three/fiber@9.8`, `@react-three/drei@10.7.9`, `gsap@3.15`; add `zustand`.

**Done when:** `pnpm build` passes and `/overview` shows every experience.

## Phase 1: Homepage scene (~5 hrs)

Port `world7.js` piece by piece:

| Concept code | R3F component | Notes |
|---|---|---|
| `frog()` + `hullMat`/`fillMat` | `Frog.tsx`, `neonMaterials.ts` | Poses: sit, hop, dive, swim, tada |
| `pad()` + `flushPadLines()` | `LilyPads.tsx` | All outlines in one batched `LineSegments2`; instanced fills |
| `lotus()`, `koi()`, `holoRing()` | `Lotus.tsx`, `Koi.tsx`, `HoloRing.tsx` | |
| pagoda, city, hills, moon, palm | `Skyline.tsx`, `Pagoda.tsx`, `Moon.tsx`, `Palm.tsx` | City windows as one shared texture |
| Reflector water shader | `Water.tsx` | three's `Reflector` with the concept shader on desktop; plain material on phones |
| bloom | three `EffectComposer` + `UnrealBloomPass` | Same pass as the renders; half resolution on phones |
| overlay text (`index.html`) | `HeroOverlay.tsx` | Real HTML; v5 contrast rules; phone layout at ≤600px |

**Done when:** a side-by-side with `hero_v7.png` matches, `design/concept/contrast_check.py` passes on a screenshot, and desktop draw calls are ≤ 400.

## Phase 2: Scroll path + terraces (~4 hrs)

1. `FrogPath.ts`: one spline for the whole Ɔ path (land → dive → water → seabed).
2. GSAP ScrollTrigger maps page scroll (0–1) to a position on the path; camera and frog follow.
3. Terrace stops: hop animation with squash and stretch; keyword chips pop up and stay.
4. `prefers-reduced-motion`: no hop animation, just crossfades between stops.

**Done when:** scrolling the first 20% of the page hops the frog across all 3 terraces on desktop and phone.

## Phase 3: Dive + experiences (~6 hrs)

1. Dive moment: leap off the pier, splash rings, camera turns from sideways to down.
2. Underwater scene in the v7 style: darker water, rising bubbles, neon kelp.
3. Six client animals as neon outlines (octopus, turtle, flying fish, starfish, crab, jellyfish), each with a problem bubble, a card and the frog's "tada".
4. Depth gauge on the right, labeled 2026 → 2022; clicking a year scrolls there.
5. ISF and ACME cards link to their case studies.

BAM card gets a "Watch on LinkedIn ↗" button (opens the post in a new tab; LinkedIn videos can't be embedded reliably).

## Phase 4: Seabed: Let's Chat (~3 hrs)

1. Seabed scene: neon grid floor, bottle, frog sitting.
2. Contact form: name, email, organization, reason, message; validation and error states.
3. Sending: Formspree (no server code, 50 submissions a month free). Bottle floats up on success.
4. Buttons: Connect on LinkedIn, Email me (janysli.jy@gmail.com). No resume download.

**Needs from you:** create a free Formspree form at formspree.io and send me the form ID (looks like `xyzabcd`).

---

## Budgets every phase must meet

| Check | Target |
|---|---|
| Text contrast | ≥ 4.5:1 for all text (run `contrast_check.py`) |
| First text visible | < 1.5 s (text is HTML, 3D loads after) |
| 3D download before the dive | < 2 MB |
| Frame rate | 60 fps on a laptop; phones run the light scene |
| No 3D or reduced motion | Falls back to the `/overview` layout |

---

## Still open

1. **ACME findings:** check with the lab before launch; until then the case study shows methods only.
2. **Formspree form ID:** needed by Phase 4.
