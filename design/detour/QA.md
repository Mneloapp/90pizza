# Release QA

Verified against the isolated production build on 2026-10-31.

- Next.js production build: passed; TypeScript validation passed.
- Initial route JavaScript: 148 kB reported by Next.js; Three.js is lazy-loaded.
- Product GLB: approximately 1.2 MB, nine independent slices, Draco compressed.
- Full browser matrix: 9 cases passed, no unexpected console or network errors.
- Screenshots: `/private/tmp/90pizza-detour-qa`.
- Machine-readable results: `qa-report.json`.

| Case | Viewport | Result |
| --- | --- | --- |
| Chrome desktop | 1440 x 1000 | Pass |
| Chrome touch mobile | 390 x 844 | Pass |
| Chrome small touch mobile | 320 x 568 | Pass |
| Chrome tablet | 768 x 1024 | Pass |
| Chrome landscape | 844 x 390 | Pass |
| WebKit touch mobile | 390 x 844 | Pass |
| Reduced motion | 390 x 844 | Pass |
| WebGL unavailable | 390 x 844 | Pass, rendered fallback and usable menu |
| Save-Data | 390 x 844 | Pass, rendered fallback and usable menu |

Checks included actual canvas pixels and changed frames; nine loaded meshes;
product bounds versus copy and controls; ten extra English scroll positions on
desktop and mobile; six distinct loaded menu images; language switching without
a reload; no price badges; focus trapping, Escape and focus restoration; mobile
navigation; no horizontal overflow; no broken images; explicit prelaunch status.

Issues found and repaired during review:

1. Cropped mobile product: replaced fixed camera zoom with projected-bounds fitting.
2. Copy and product intersections: reserved responsive screen regions and continuous transitions.
3. Washed-out cheese: reduced light intensity and exposure.
4. Mobile copy on the red backdrop: moved the architectural turn into the foreground.
5. Tablet CTA intersection: enlarged the reserved controls area.
6. WebKit keyboard focus: added explicit dialog Tab handling and trigger focus restoration.
7. Excessive scroll rerenders: moved continuous progress to a ref, updating React only by chapter.

Scope: the public landing only. Unrelated unfinished ERP/platform work was not
built, modified, staged or released. Checkout and delivery integrations are not
live. Generated food visuals are illustrative, not verified photographs of the
final product. Real-device thermal/GPU behavior remains device-dependent.
