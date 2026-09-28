# janys.ponder: Website Build Plan

> Content lives in [CONTENT_DRAFT.md](CONTENT_DRAFT.md). Visual theme: the concept deck and the renders in `design/concept/` (a three.js scene file that renders every concept image).

## 1. Concept

A frog lives at **janys.ponder** (*pond* + *ponder*). Tagline: **"amphibian in the how you think & how I build."**

The page is a single journey along an **inverted-C path (Ɔ)**, seen as a side-view cross-section of the world, like a cut-away diorama or ant farm:
1. **Top arm (land, moving right):** the frog starts on land at the top-left (the surface hub). Scrolling makes it take a few **horizontal hops** across flat terraces, and the skill keywords pop up at each landing.
2. **Right side (water, moving down):** at the end of the land, the frog dives into the water and swims **straight down**, meeting each experience's animal on the way. Newest is at the top; deeper means further back in time. Each experience has a **client animal** stating the problem, a **frog in "tada" pose** with the result, and a card. Experiences with case studies link to them naturally from inside the card.
3. **Bottom arm (seabed, curving back left):** the path turns along the seabed to **Let's Chat**: a contact form ("message in a bottle"), LinkedIn, and email. It ends directly beneath where the journey began.

The **sky cloud** (the "Ask the frog" AI chat) floats above the whole journey and can be opened at any point.

---

## 2. Site map

```
/                  The Pond World (one scroll-driven page)
  #surface           hub
  #skills            terraces (3 quick hops)
  #bam #harvard-grid #cathay #isf #ekimetrics #acme    dive, newest → oldest
  #chat              seabed: Let's Chat
/work/isf          case study: Develop for Good × ISF Cambodia
/work/acme         case study: ACME Lab Emotion Compass
/overview          "Skip the pond": the same content as a flat, fast page
404                "This frog hopped too far" → hop home
```

Removed: `/tetete`, the canvas cylinder, dead `/interests` and `/lamb` links. `/portfolio/indochina-starfish` redirects to `/work/isf`.

---

## 3. World layout & controls

```
          ☁ "Ask the frog" (always available)

   LAND ──────────────────────────────────────────▶ (top arm, horizontal)
   🐸 janys.ponder   ▭ AI & ML   ▭ Product   ▭ Prog & Data   ╮
   (surface hub)      hop →        hop →        hop →        │ dive!
   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ~~~~~~~~~~~~~
                                   (earth / cut-away)    │ 2026  🐙 BAM
                                                         │ 2025– 🐢 Harvard Grid
                                                         │ 2025  🐟 Cathay Pacific
                                               WATER     │ 2025  ⭐ DfG × ISF → case study
                                         (right side, ▼) │ 2024  🦀 Ekimetrics
                                                         │ 2022–24 🪼 ACME → case study
                                                         ╯
   ◀──────────────── SEABED: 🍾 Let's Chat ──────────────  (bottom arm, curving back left)
```

- **Camera: side-view cross-section.** A mostly flat side view with slight perspective and depth layers (tilt-shift diorama). Land sits above an earth cut-away, and the water column is on the right. The camera stays locked to the frog as it moves along the Ɔ.
- **One linear path, driven by normal scrolling.** Visitors always scroll *down*, and the frog's route turns that into:
  - **right** along the land (the camera pans horizontally),
  - **down** through the water (the camera descends),
  - **left** along the seabed.

  Technically, scroll progress `t ∈ [0,1]` maps to a position on a spline curve, with fixed segments: land ≈ 0–0.2, dive curve ≈ 0.2–0.25, water ≈ 0.25–0.9, seabed turn ≈ 0.9–1.
- **Scroll is the only control.** No WASD or arrow-key controls. Wheel, trackpad, touch and the browser's own keyboard scrolling (Space, Page Down) all just scroll the page, and the frog follows. Clicking a depth-gauge marker scrolls to that stop.
- **Pacing:** the 3 terrace hops are short (about 40% of a screen of scrolling each) so they feel quick. The dive is a single dramatic beat. Each experience gets about a full screen so its region can wake up.
- **Region activation:** when the frog reaches an experience, its region wakes up (lights, the client animal animating, bubbles unfolding, the frog doing "tada", media fading in). The camera eases to center it, and the URL hash updates.
- **Depth gauge (right edge):** a scrollbar and minimap in one. Markers are labeled with years (2026 … 2022), so it also reads as a timeline. Markers are clickable.

---

## 4. Section & page designs (high level)

### 4.1 Loading: "Metamorphosis"
A 2D animation that appears instantly: a tadpole grows into a frog as the 3D assets load, then hops into the scene. The HTML text is already underneath. Skipped on repeat visits and for reduced-motion preferences.

### 4.2 Surface hub (`#surface`): top-left, on land
- **3D:** the frog sits on land at the far left of the top arm, beside a hand-painted **"janys.ponder" signpost** (the lily-pad lettering moves to the sign, since the hub is now on land). Grass and reeds are around it, the cloud is above, and the first terrace and a glimpse of water are visible to the right. The frog's eyes follow the cursor and it catches a fly when idle.
- **DOM:** name, tagline, a 2-line bio, "Open to relocation", LinkedIn / GitHub / email icons, and a "scroll to hop →" cue. The arrow points right because the first motion is horizontal.

### 4.3 Terraces (`#skills`): top arm, horizontal hops
- Three **flat terraces in a row** (purple stacked slabs, from your sketch), side by side and level with each other: **AI & ML → Product → Programming & Data**.
- Each bit of scrolling = one hop to the right, with squash-and-stretch on landing and a small dust puff. On landing, that terrace's keywords **pop up as chips or fireflies** in a quick burst above the slab and stay visible as the frog moves on, so the three sets read as a row.
- Hovering a keyword highlights which experiences used it (markers on the depth gauge).
- **Dive transition:** past the last terrace, the land ends in a ledge over the water. The frog leaps, the camera swings from panning sideways to descending, there's a splash, and the frog is underwater. This is the signature moment of the page.

### 4.4 The dive (`#bam` … `#acme`)
Each experience uses the same three-part layout:
```
[ client animal + problem bubble ]   [ experience card ]   [ frog "tada" + result bubble ]
```
- **Card:** company, role, dates, location, 2–3 bullets, keyword tags, optional media (image / lazy-loaded muted video).
- **Natural case-study links**, written into the card as a next step rather than a generic "Learn more" button:
  - ISF: "See how we found the 3 biggest usability problems →"
  - ACME: "Try the Emotion Compass yourself →"
- **Environment by depth:** sunlit shallows (2025–26), then darker twilight (2024 and earlier), with fog and light color shifting continuously. Bubbles, particles and small fish sit between regions.

### 4.5 Seabed: Let's Chat (`#chat`): bottom arm
- **Transition:** at the bottom of the water column, the frog touches down and the path curves left along the seabed (the bottom of the Ɔ). The camera pans left and settles.
- **Visual:** the frog on the seabed next to a bottle. The land it started on is visible above, closing the loop. Submitting the form rolls up a note, corks the bottle, and floats it up out of view as the success animation.
- **Contact request form:** name, email, organization (optional), reason (Hiring / Collaboration / Just saying hi), message. It has inline validation and clear success and error states.
- **Direct actions** (big, obvious buttons):
  - **Connect on LinkedIn** → linkedin.com/in/janys-li
  - **Send me a message** → mailto:janysli.jy@gmail.com
  - **Download resume** (general version, no phone number)
- Small interest doodles scattered on the seabed: snowboard, climbing hold, dance, mic.
- Footer: "© 2026 Janys Li · built with React Three Fiber" and a "back to the surface ↑" hop.

### 4.6 "Ask the frog" (AI chat, sky)
A floating cloud button, available everywhere, opens a chat panel laid out like Claude or Codex: a transcript plus a collapsible "Sources" pane. Answers come only from site content, with a scripted fallback. It's separate from "Let's Chat": this one is the AI, and that one reaches you directly. The chat can suggest "Want to reach Janys directly? → Let's Chat."

### 4.7 Case study pages (`/work/isf`, `/work/acme`)
- **Header:** client animal, title, role, team, dates, a one-line result, and "← Back to the pond" (returns to the same region).
- **Body:** Challenge → Research → Design → Testing → Build → Results → Next steps.
- **Reusable blocks:** stat row, quote, problem → fix cards, before/after images, stack chips, embedded demo.
- **ISF:** rebuilt from the 30-page deck; the PDF becomes an optional download.
- **ACME:** centered on a playable **Emotion Compass**. The visitor presses where a music clip makes them feel on the circle, and the jellyfish's glow changes color to match.

### 4.8 Overview (`/overview`)
A flat, accessible page with the same content from the same data files. It's also the fallback when a device can't run the 3D scene or the visitor prefers reduced motion.

---

## 5. Component architecture

```
src/
  content/                 profile.ts  skills.ts  experience.ts  faq.ts
  app/
    page.tsx               sections + <WorldCanvas/>
    work/[slug]/page.tsx   case studies (MDX)
    overview/page.tsx
  components/
    world/
      WorldCanvas.tsx      fixed canvas, quality tiers
      CameraRig.tsx        follows the frog along the path
      FrogPath.ts          Ɔ spline: hub → terraces (→) → dive → water (↓) → seabed (←), keyed to scroll; stop list
      Frog.tsx             idle · hop · dive · swim · tada · ponder
      PondSurface.tsx      water, pads, ripples, reeds
      Terraces.tsx         3 steps + keyword fireflies
      Underwater.tsx       depth fog, caustics, bubbles, particles
      Region.tsx           per-experience anchors
      ClientAnimal.tsx     drawn billboard + wake-up animation
      Seabed.tsx           seabed, bottle, doodles
      SkyCloud.tsx
    sections/              DOM overlay per stop
      SurfaceIntro.tsx  SkillTerrace.tsx  ExperienceCard.tsx  LetsChat.tsx
    ui/
      SpeechBubble.tsx  KeywordChip.tsx  LazyVideo.tsx  CaseStudyLink.tsx
      DepthGauge.tsx  ScrollCue.tsx  ThemeToggle.tsx  SkipLink.tsx
    contact/
      ContactForm.tsx      validation, honeypot, submit states
      BottleAnimation.tsx
    chat/                  ChatPanel.tsx  SourcesPane.tsx  useChat.ts
    demos/                 EmotionCompass.tsx
    case-study/            CaseHeader.tsx  StatRow.tsx  Quote.tsx  ProblemFix.tsx
    loader/                Metamorphosis.tsx
  state/worldStore.ts      scroll progress, active stop, visited, theme
  hooks/                   useScrollProgress · useStopActivation · useQualityTier
worker/                    Cloudflare Worker: /contact (email relay) + /chat (Claude)
```

**Principles**
- **Content is data.** The page, `/overview`, the depth gauge, the keyword cross-highlighting and the chat all read `content/*.ts`. Adding a job means adding one entry plus an animal drawing.
- **The DOM owns text, and 3D owns atmosphere.** All readable text is real HTML.
- **One canvas, loaded in stages.** The surface and terraces load first; the underwater scene loads during the terrace hops.

---

## 6. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 static export, React 19, TypeScript, Tailwind 4 (existing) |
| 3D | React Three Fiber + drei; postprocessing for ink outlines and fog |
| Scroll → path | GSAP ScrollTrigger (existing) mapping scroll position to the frog's route |
| State | zustand |
| Art | Frog: Blender → compressed glTF + coded animations. Client animals: your drawings → transparent WebP billboards |
| Contact form | **Cloudflare Worker** `/contact` → sends email to janysli.jy@gmail.com via Resend (free tier). Spam protection: honeypot + Cloudflare Turnstile + rate limit. *Quick-start alternative: Formspree/Web3Forms, which needs no backend code.* |
| AI chat | Same Worker, `/chat` → Claude Haiku 4.5, grounded on `content/`, with a spend cap and a scripted fallback |
| Hosting | GitHub Pages (existing workflow) + Cloudflare Worker |

**Style:**
- Ink-outline cartoon shading and paper grain
- Pond greens (surface)
- Terrace purples
- Water blues darkening with depth
- One warm "tada" accent

Light theme = day pond, dark theme = night pond with fireflies.

**Budgets:**
- Text usable within 1.5 s
- 3D under 2 MB before the dive
- Frame rate kept at a steady 60 fps on a mid-range laptop, with automatic quality reduction on weaker devices
- Lighthouse performance score of 85 or more on mobile

---

## 7. Build phases

| # | Phase | Output |
|---|---|---|
| 0 | Cleanup & foundations | Remove dead code; `content/` from CONTENT_DRAFT; design tokens; store; `/overview` (shippable) |
| 1 | Grey-box journey | Placeholder blocks along the Ɔ path (land arm → water column → seabed arm); the frog as a simple shape following the scroll path; side-view camera; scroll-only movement; region activation; depth gauge. **Feel check:** hop pacing, how the dive feels, the camera at the corners. |
| 2 | Surface & terraces | Real frog + hop/dive animations, water, keyword pop-ups, the splash |
| 3 | Dive | Experience regions, cards, bubbles, placeholder animals, depth lighting, case-study links |
| 4 | Let's Chat | Contact form + Worker/Resend, bottle animation, LinkedIn/email buttons |
| 5 | Case studies | `/work/isf`, `/work/acme` + Emotion Compass demo |
| 6 | Ask the frog | Chat UI + fallback, then Claude through the Worker |
| 7 | Polish | Your final animal art, night mode, sound, loading animation, performance/accessibility pass, share images |

---

## 8. Open items
1. **BAM video link:** URL, and is it cleared to share publicly?
2. **ISF numbers:** OK to use resume numbers on the card and deck numbers in the case study?
3. **ACME findings:** OK to show publicly?
4. **Resume for download:** a general version without the phone number?
5. **Leadership roles** (GAC Chair, CSSA VP): include as small bubbles, or skip?
6. **Contact form service:** Cloudflare Worker + Resend (recommended, shared with the chat) or Formspree (fastest)?
7. **Animal drawings:** octopus, sea turtle, flying fish, starfish, hermit crab, jellyfish. Placeholders until then.
