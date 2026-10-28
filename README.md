# 90pizza

Georgian-first pizza brand experience built with Next.js App Router, TypeScript,
Tailwind, Framer Motion, and Three.js.

## Development

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. Run `pnpm build` for the production build.

## Experience

- The hero renders nine textured 3D pizza slices. Select a flavor or use the grid
  button to separate and join the slices. Pointer movement tilts the pizza.
- Rendering pauses when the scene is offscreen or the tab is hidden. Reduced
  motion and a photographic fallback are supported.
- The menu supports meat and meat-free filters, accessible native product
  dialogs, and instant GE/EN switching.
- Copy and product metadata live in `components/landing-content.ts`.
- Wolt and Glovo are launch placeholders. The site does not process orders or
  payments yet. No prices are displayed.

## Browser Verification

With the site running locally:

```sh
pnpm exec playwright install chromium
pnpm verify:browser
```

The check covers four desktop/mobile viewports, WebGL image pixels, slice
separation, flavor selection, menu filters, product dialogs, GE/EN switching,
and reduced motion. Screenshots are written to `/private/tmp/90pizza-review`.
Set `PREVIEW_URL`, `REVIEW_OUTPUT`, or `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to override
the preview address, screenshot directory, or browser executable.
