# 90pizza

Georgian-first pizza brand experience built with Next.js App Router, TypeScript,
Tailwind, Framer Motion, and Three.js.

## Development

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. Run `pnpm build` for the production build.

## Inside The Flavor

This is a new visual direction, using only the original logo and square-pizza
brand concept. The previous landing page is not used by the application route.

- One full-bleed WebGL world follows a five-chapter camera journey: the oven,
  ingredients, the 30x30 square assembling, nine slices, and a delivery box.
- Ingredient photographs are mapped to bent surfaces in 3D space. Four pizza
  flavors have photographic tops, modeled crusts, and separable pieces.
- Thin crust meshes lift one corner in the sharing chapter, with dynamically
  deforming cheese strands and a manual pull/return control.
- Chapter buttons and a direct flavor link keep the experience accessible
  without requiring the full scroll sequence.
- Rendering pauses in hidden tabs. Mobile resolution/frame-rate limits, reduced
  motion, context restoration, and photographic fallbacks apply.
- Native selection dialogs include flavor and quantity controls and GE/EN support.
- The narrative is in `components/journey-content.ts`; product copy and flavor
  metadata remain in `components/drop-content.ts`.
- New ingredient prompts and paths are in `design/journey-assets.json`. Pizza
  texture prompts remain in `design/asset-prompts.json`.
- FiraGO is self-hosted as WOFF2; its OFL is in `public/fonts/FiraGO-OFL.txt`.
- Wolt and Glovo are launch placeholders. The site does not process orders or
  payments yet. No prices are displayed.

## Browser Verification

With the site running locally:

```sh
pnpm exec playwright install chromium
pnpm verify:browser
```

The check covers six desktop/mobile viewports, five nonblank 3D chapters, chapter
navigation, slice separation, flavor selection, quantity limits, dialogs, GE/EN,
reduced motion, and WebGL fallback. Screenshots go to `/private/tmp/90pizza-journey-review`.
Set `PREVIEW_URL`, `REVIEW_OUTPUT`, or `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to override
the preview address, screenshot directory, or browser executable.
