# 90pizza

Georgian-first pizza brand experience built with Next.js App Router, TypeScript,
Tailwind, Framer Motion, and Three.js.

## Development

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. Run `pnpm build` for the production build.

## The First Slice

This is a new visual direction, using only the original logo and square-pizza
brand concept. The previous landing page is not used by the application route.

- A full-bleed product film introduces the brand. It plays once, with pause,
  replay and sound controls. A smaller encode is selected for phones.
- A second, scroll-controlled film shows a slice lifting with melted cheese.
  Its all-intra encode supports seeking; a keyboard-accessible slider also
  controls the shot. Reduced motion shows a still until manually activated.
- Six unique pizza photos, meat/meat-free filters and native product dialogs
  make flavor selection directly accessible, without completing a story first.
- A real Three.js delivery-box model rotates with scroll and a manual control.
  It loads near the viewport, pauses offscreen and falls back without WebGL.
- GE is the default; GE/EN updates instantly without navigation or a reload.
- The route uses `components/AppetitePage.tsx`. All copy and six recipes live
  in `components/appetite-content.ts`; film controls are in `ProductFilm.tsx`
  and the packaging scene is in `DeliveryBox.tsx`.
- The approved OpenArt concept film and optimized media provenance are recorded
  in `design/first-bite-media.json`. No live product footage is implied.
- Earlier page components are retained as unused source history, not imported
  into the current page.
- FiraGO is self-hosted as WOFF2; its OFL is in `public/fonts/FiraGO-OFL.txt`.
- Wolt and Glovo are launch placeholders. The site does not process orders or
  payments yet. No prices are displayed.

## Browser Verification

With the site running locally:

```sh
pnpm exec playwright install chromium
pnpm verify:browser
```

The check covers six desktop/mobile viewports, moving video, scroll seeking,
flavor filters, selection, quantity limits, dialogs, GE/EN, nonblank interactive
3D packaging, reduced motion, and media/WebGL fallback. Screenshots go to
`/private/tmp/90pizza-appetite-review`.
Set `PREVIEW_URL`, `REVIEW_OUTPUT`, or `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to override
the preview address, screenshot directory, or browser executable.
Set `VIEWPORT=390x844` to isolate one viewport during a focused check.
