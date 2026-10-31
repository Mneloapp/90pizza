# 90pizza: The 90-degree detour

An original product-led brand prototype. Only the existing logo and brand idea
were retained. The old flour, kneading, oven, cheese-web and packaging sequence is
not mounted by the new landing route.

## Story

1. A different direction: a thin square pizza in a red architectural studio.
2. The first bite: the camera lowers to reveal the crisp, thin base.
3. Your corner: nine independent meshes separate into an equal sharing grid.
4. Your call: the camera travels around the product, then leads to six flavors.

The scene is rendered live with Three.js. No video is used. The menu is a
selection prototype, not a functioning checkout. Wolt and Glovo are visibly
marked as unavailable until launch. Georgian is the initial language.

## Source and Reproduction

- `build_scene.py`: Blender model builder, GLB exporter and Cycles still renderer.
- `90pizza-detour.blend`: editable source with packed image textures.
- `pepperoni.jpg`, `crumb.jpg`: source textures for Blender.
- `../../public/models/detour-pizza.glb`: nine meshes with Draco compression.
- `../../components/detour/`: scoped application, translations, camera and CSS.
- `../../scripts/verify-detour.cjs`: browser and canvas regression suite.

Build the model with Blender 5.2:

```sh
blender -b --factory-startup --python design/detour/build_scene.py
```

The browser camera fits the actual transformed product bounds into a reserved
screen region. The region moves continuously between chapters, keeping the
product clear of copy and controls. Mobile DPR is capped at 1.5; rendering pauses
offscreen and in hidden tabs. Reduced-motion settings remove idle movement.
Save-Data and WebGL failure use a rendered still, without blocking the menu.

## Generated Visuals

These are new AI-generated concept textures, not photographs of a manufactured
90pizza product. They were created with the built-in image generation tool, then
converted to local WebP/JPEG assets. No OpenArt credits were spent. The website
discloses that it is a visual prototype and the final product may differ.

Common generation brief: premium photorealistic food texture, exact orthographic
overhead view of an entire thin 30 x 30 cm square pizza, whole and uncut, narrow
irregular browned perimeter, natural melted cheese, soft neutral studio light.
The pizza fills the square edge to edge. No plate, box, background, lettering,
prices, drawn grid or physical cut lines. Natural food imperfections, not a
vector illustration or plastic CGI.

Individual topping briefs and output files:

| Asset              | Additional brief                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `pepperoni.webp`   | Cupped pepperoni, mozzarella, tomato sauce, browned cheese bubbles                                                      |
| `margherita.webp`  | Tomato, fior di latte, fresh basil leaves                                                                               |
| `four-cheese.webp` | Mozzarella, gorgonzola, ricotta, parmesan; golden cheese-heavy surface                                                  |
| `mushroom.webp`    | Visible cremini and oyster mushrooms, mozzarella, thyme                                                                 |
| `spicy.webp`       | Salami, red chili rings and seeds, roasted red peppers, mozzarella                                                      |
| `veggie.webp`      | Red/yellow peppers, zucchini, onion, black olives, cherry tomatoes, basil, mozzarella                                   |
| `crumb.webp`       | Photorealistic cut baked bread crumb, pale ivory irregular air pockets, subtle toast; seamless-looking 2:1 albedo strip |

Menu assets are in `public/images/detour/`. `hero.webp` is a Cycles render of the
new Blender scene, not a generated video or a reused image from the old page.

Original generation files (under the thread's `.codex/generated_images` folder):

- Pepperoni: `exec-dd381038-867f-4e9f-a669-3f6acd35574a.png`
- Margherita: `exec-8b03bf8c-9325-4c7c-b081-7cca03f6adbe.png`
- Four cheese: `exec-aa0ecd5d-0446-4c10-bbea-4457f98f0bef.png`
- Mushroom: `exec-62fe5580-c881-439a-95b4-3d15dc7f3dc6.png`
- Spicy: `exec-f4426dad-32a8-417d-a24e-30eb4ec9cf16.png`
- Veggie: `exec-f2fe609a-f7a2-426c-9e19-872c3434d628.png`
- Crumb: `exec-1891791a-548a-4d65-81d7-e46cceb29b1d.png`

Manrope and Noto Sans Georgian are self-hosted under the SIL Open Font License;
license files accompany them in `public/fonts/detour/`. Draco decoder files are
from the installed Three.js distribution; the Apache 2.0 license accompanies them.

## Verification

The public landing is built in an isolated copy of tracked source so unrelated
in-progress ERP/platform files in the working tree are neither modified nor
included in the release. This is not a claim that the unfinished platform builds.

```sh
QA_URL=http://127.0.0.1:3139 node scripts/verify-detour.cjs
```

The suite checks five viewport sizes, Chrome and WebKit, default Georgian and
no-reload English switching, 3D model loading, nine meshes, nonblank canvas
pixels, visual changes, projected product/copy intersections, all six flavor
images, dialog keyboard focus and Escape, mobile navigation, reduced motion,
Save-Data, WebGL failure, network errors and broken images. Screenshots and a
machine-readable report are written to `/private/tmp/90pizza-detour-qa`.

Physical-device GPU performance still depends on device/thermal conditions;
browser emulation is not a substitute for every real handset.
