# Release QA

Verified against the isolated production build on 2026-10-31.

- Next.js production build: passed; TypeScript validation passed.
- Initial route JavaScript: 149 kB reported by Next.js; Three.js and the preparation builders are lazy-loaded.
- Product GLB: approximately 1.2 MB, nine independent slices, Draco compressed.
- Full browser matrix: 9 cases passed, no unexpected console or network errors.
- Screenshots: `/private/tmp/90pizza-assembly-production`.
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
product bounds versus copy and controls; fourteen extra English scroll positions on
desktop and mobile; six distinct loaded menu images; language switching without
a reload; no price badges; focus trapping, Escape and focus restoration; mobile
navigation; no horizontal overflow; no broken images; explicit prelaunch status.

The restored opening was additionally checked for flour replay, pause/resume,
flour-to-dough formation, ingredient ordering, all seven chapters and the baked
model handoff. A deterministic timeline test covers every boundary and 1,001
scroll positions. Preparation/baking transition screenshots were reviewed at
0.58, 0.64, 0.67, 0.70, 0.709, 0.711 and 0.73 progress.

After the final replay/context-loss guards, the production build and complete
mobile flow plus both fallbacks passed again (`/private/tmp/90pizza-assembly-final`).
A delayed GLB request combined with forced GPU context loss also passed: the late
load did not hide the fallback, and the opening text stayed readable.

The accepted flavor, delivery, footer and selection-dialog JSX was compared with
the previous release and is unchanged byte-for-byte.

Issues found and repaired during review:

1. Cropped mobile product: replaced fixed camera zoom with projected-bounds fitting.
2. Copy and product intersections: reserved responsive screen regions and continuous transitions.
3. Washed-out cheese: reduced light intensity and exposure.
4. Mobile copy on the red backdrop: moved the architectural turn into the foreground.
5. Tablet CTA intersection: enlarged the reserved controls area.
6. WebKit keyboard focus: added explicit dialog Tab handling and trigger focus restoration.
7. Excessive scroll rerenders: moved continuous progress to a ref, updating React only by chapter.
8. Missing preparation: restored the flour, shared dough mesh and ingredient builders in the new renderer.
9. Baking camera jump: made the preparation/baked orbit continuous and interpolated to the model's actual bounds.
10. Opening flash: show a dark loading surface, not a finished pizza, before the first flour frame.
11. Neutral dough pixel test: check channel variation and a phase-appropriate color threshold instead of requiring pizza-level saturation.
12. Partial-scroll replay: return to the opening before replaying; a late model load cannot override a WebGL-failure fallback.

Scope: the public landing only. Unrelated unfinished ERP/platform work was not
built, modified, staged or released. Checkout and delivery integrations are not
live. Generated food visuals are illustrative, not verified photographs of the
final product. Real-device thermal/GPU behavior remains device-dependent.
