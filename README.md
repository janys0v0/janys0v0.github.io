# janys-ponder

Janys (Jiayang) Li's portfolio: a neon frog hops across skill terraces, dives into a pond, swims past six experiences and lands on the seabed to chat.

## Run it

```bash
pnpm install
pnpm dev            # http://localhost:3000  (add ?motion to force animation on if your OS has "reduce motion" enabled)
pnpm build          # static export into ./out
scripts/visual-check.sh /tmp/shots   # screenshots of every stop, desktop + phone
```

## Where things live

| What | File |
|---|---|
| Your text (bio, skills, experiences, chat answers) | `src/content/*.ts` |
| The 3D pond, frog rig, animals, underwater world | `src/scene/*.ts` |
| Path stops and scroll positions | `src/scene/stops.ts` |
| Cards, bubbles, depth gauge, chips | `src/components/SceneOverlay.tsx` |
| Case studies | `src/app/work/{isf,acme}/page.tsx` |
| Design concepts, references, renders | `design/` |

## Contact form

Without configuration the form opens the visitor's email app with the note filled in. To receive notes directly:
create a form at formspree.io, then in GitHub → Settings → Secrets and variables → Actions → Variables add `FORMSPREE_ID`.

## Test switches (harmless in production)

`?motion` force animation on · `?shot=N` jump to stop N · `?ask` open the chat · `?theme=dusk` dusk sky · `?q=low` phone-quality scene
