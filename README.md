# 90pizza

Georgian-first pizza brand experience built with Next.js App Router, TypeScript,
Tailwind, Framer Motion, and Three.js.

## Development

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. Run `pnpm build` for the production build.

## Square Drop

This is a new visual direction, using only the original logo and square-pizza
brand concept. The previous landing page is not used by the application route.

- A physical 3D delivery box opens and closes in the light, poster-style hero.
- The dark flavor studio has four freshly generated photographic textures,
  real pizza thickness, pointer/keyboard rotation, and nine separable slices.
- A scroll-driven nine-piece composition leads into the delivery route.
- Rendering pauses offscreen and in hidden tabs. Reduced motion, constrained
  mobile pixel density, context restoration, and photographic fallbacks apply.
- Native selection dialogs include quantity controls and instant GE/EN switching.
- New copy and product metadata live in `components/drop-content.ts`.
- Image-generation prompts are recorded in `design/asset-prompts.json`.
- FiraGO is self-hosted as WOFF2; its OFL is in `public/fonts/FiraGO-OFL.txt`.
- Wolt and Glovo are launch placeholders. The site does not process orders or
  payments yet. No prices are displayed.

## Browser Verification

With the site running locally:

```sh
pnpm exec playwright install chromium
pnpm verify:browser
```

The check covers six desktop/mobile viewports, WebGL image pixels, box motion,
slice separation, flavor selection, quantity limits, dialogs, GE/EN switching,
reduced motion, and WebGL fallback. Screenshots go to `/private/tmp/90pizza-review`.
Set `PREVIEW_URL`, `REVIEW_OUTPUT`, or `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to override
the preview address, screenshot directory, or browser executable.
