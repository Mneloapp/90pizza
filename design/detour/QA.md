# Approved Story: Release QA

Production build verified on 2026-10-31 in an isolated checkout of the public
landing. TypeScript validation passed. The route remains statically generated,
with 149 kB first-load JavaScript; the Three.js scene is lazy-loaded.

All nine cases passed in the final consolidated browser run, with no unexpected
console or network errors. Results: `qa-report.json`.
Screenshots: `/private/tmp/90pizza-approved-final`.

## Browser Matrix

- Chrome desktop, 1440 x 1000.
- Chrome touch mobile, 390 x 844.
- Chrome small touch mobile, 320 x 568.
- Chrome tablet, 768 x 1024.
- Chrome landscape, 844 x 390.
- WebKit touch mobile, 390 x 844.
- Reduced motion, 390 x 844.
- WebGL unavailable, 390 x 844.
- Save-Data, 390 x 844.

## Checks

- Flour replay, pause/resume, water and continuous dough formation.
- Hand-worked square dough, then sauce, mozzarella and pepperoni in that order.
- Separate oven environment and the raw-to-baked model handoff.
- Nine loaded slice meshes; exactly one lifted corner and three short strands.
- Cheese release, reverse scrolling and the return of the lifted slice.
- Five loaded box print panels and a closed lid at the last chapter.
- Actual canvas-only pixels, product-region color variation and changed frames.
- Projected product bounds against headings and controls in both languages.
- Georgian default, English switching without navigation or scene recreation.
- Six distinct menu images; no prices; selection dialog focus trap and Escape.
- Mobile navigation, horizontal overflow, broken images and network errors.
- Every fallback chapter has a matching scene-only mobile image.
- Timeline continuity at all boundaries and finite values at 1,001 positions.

## Corrections During Review

1. Repositioned both hands on the near side and matched their contact height to
   the shared dough shape; removed the obsolete rolling pin.
2. Replaced the old oven portal with a separate stone environment and warmer light.
3. Replaced the noisy raw/baked dither with a short alpha handoff.
4. Restricted the cheese lift to one corner and three strands, with release.
5. Removed HTML overlays from fallback captures; mobile/desktop frames are separate.
6. Widened tablet copy to prevent dough/text intersection.
7. Isolated canvas pixels from HTML and tested the product region rather than
   requiring a white printed box to have pizza-level saturation.
8. Waited for actual animation progress in WebKit instead of assuming a fixed
   one-second delay was sufficient on the test host.

## Scope and Limits

The flavor, delivery, footer and selection-dialog JSX is unchanged from the
previous release. Unrelated ERP/platform work was not modified, built or staged.

This is a real-time 3D visual prototype, not photographic footage. Hands and food
preparation are stylized CGI. Food textures are concept imagery, not verified
photos of a manufactured product. No OpenArt credits were used for this revision.

Checkout and delivery integrations remain prelaunch. Browser emulation does not
establish performance on every physical handset or under thermal throttling.
