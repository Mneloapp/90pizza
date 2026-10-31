const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const THREE = require("three");
const sharp = require("sharp");
const { chromium } = require("playwright");

function source(name) {
  const file = path.resolve(__dirname, `../components/${name}.ts`);
  const loaded = new Module(file, module);
  loaded.filename = file;
  loaded.paths = Module._nodeModulePaths(path.dirname(file));
  loaded._compile(
    ts.transpile(fs.readFileSync(file, "utf8"), {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    }),
    file,
  );
  return loaded.exports;
}

function geometry() {
  const { boxPose, BOX_LID_HEIGHT } = source("pizza-packaging");
  const { toppingState, saucePath } = source("pizza-toppings");
  const { buildCheese, cheeseConnections } = source("pizza-cheese");
  const { ovenFraming } = source("pizza-camera");
  for (const [width, height] of [
    [1440, 1000],
    [390, 844],
    [320, 568],
    [768, 1024],
    [844, 390],
  ]) {
    for (const local of [0.18, 0.3, 0.55, 0.85]) {
      const view = ovenFraming(width, height, local);
      const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 60);
      camera.position.fromArray(view.position);
      camera.lookAt(...view.target);
      camera.updateMatrixWorld();
      for (const x of [-1.85, 1.85])
        for (const z of [-1.85, 1.85]) {
          const corner = new THREE.Vector3(x, 0.2, z + view.travel).project(
            camera,
          );
          assert(
            Math.abs(corner.x) < 0.99 && Math.abs(corner.y) < 0.9,
            `Oven pizza clipped at ${width}x${height}, ${local}`,
          );
        }
    }
  }
  assert.equal(boxPose(1).open, 0);
  assert.equal(boxPose(0.88).open, 0);
  assert(BOX_LID_HEIGHT > 0.2, "Closed lid must clear pizza and toppings");
  assert.equal(boxPose(0.32).landing, 1);
  assert.equal(boxPose(0.32).open, 1, "Lid cannot close before landing");
  assert.equal(toppingState(0.75).cheese, 1);
  assert.equal(
    toppingState(0.75).pepperoni,
    0,
    "Meat follows the complete cheese layer",
  );
  for (let t = 0; t <= 1; t += 0.01) {
    const point = saucePath(t);
    assert(Math.abs(point.x) < 1.5 && Math.abs(point.z) < 1.5);
  }
  assert.equal(
    new Set(cheeseConnections().map((p) => `${p.a}-${p.b}`)).size,
    12,
  );
  const resources = [];
  const cheese = buildCheese({
    keep: (item) => {
      resources.push(item);
      return item;
    },
  });
  const slices = Array.from({ length: 9 }, (_, i) => {
    const group = new THREE.Group();
    group.position.set(
      ((i % 3) - 1) * 1.208 * 1.13,
      0,
      (Math.floor(i / 3) - 1) * 1.208 * 1.13,
    );
    return group;
  });
  cheese.update(slices, 1, 0);
  assert.equal(cheese.active, 48, "All twelve cuts have four cheese bridges");
  slices.forEach((slice, i) =>
    slice.position.set(
      ((i % 3) - 1) * 1.208,
      0,
      (Math.floor(i / 3) - 1) * 1.208,
    ),
  );
  slices[6].position.y += 1.8;
  cheese.update(slices, 0, 1);
  assert.equal(
    cheese.active,
    8,
    "Only the lifted slice's two neighboring cuts stretch",
  );
  for (const mesh of cheese.group.children) {
    const vertices = mesh.geometry.attributes.position.array;
    assert([...vertices].every(Number.isFinite));
  }
  cheese.update(slices, 0, 0);
  assert.equal(cheese.group.visible, false);
  resources.forEach((r) => r.dispose());
  console.log(
    "PASS sauce path, topping order, 48 anchored cheese bridges and box clearance",
  );
}

async function check(browser, url, output, width) {
  const page = await browser.newPage({
    viewport: { width, height: width < 700 ? 844 : 1000 },
    deviceScaleFactor: 1,
  });
  const errors = [],
    failedAssets = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && /shader|WebGL|THREE/.test(m.text()))
      errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.url().includes("/images/") && r.status() >= 400)
      failedAssets.push(r.url());
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".xp-stage[data-ready=true]").waitFor();
  async function seek(t, name) {
    await page.evaluate((value) => {
      const root = document.querySelector(".xp-world");
      scrollTo({
        top: root.offsetTop + (root.offsetHeight - innerHeight) * value,
        behavior: "instant",
      });
    }, t);
    await page.waitForTimeout(1600);
    const buffer = await page.screenshot({
      path: `${output}/${name}-${width}.png`,
    });
    const raw = await sharp(buffer).raw().toBuffer();
    assert(raw.some((v) => v > 100));
    return page.locator(".xp-stage").evaluate((el) => ({ ...el.dataset }));
  }
  await seek(0.344, "sauce-start");
  await seek(0.369, "sauce-spread");
  await seek(0.397, "sauce-finished");
  await seek(0.437, "cheese-rain");
  const covered = await seek(0.455, "cheese-covered");
  assert.equal(Number(covered.cheeseCoverage), 1);
  await seek(0.495, "pepperoni-ready");
  const oven = await seek(0.6, "oven-room");
  assert.equal(oven.oven, "true");
  await seek(0.643, "oven-baked");
  const separated = await seek(0.77, "cheese-bridges");
  assert.equal(Number(separated.cheeseBridges), 48);
  await page
    .getByRole("button", { name: "ეს ნაჭერი ჩემია", exact: true })
    .click();
  await page.waitForFunction(
    () => Number(document.querySelector(".xp-stage").dataset.lift) > 0.95,
    null,
    { polling: 100 },
  );
  await page.screenshot({ path: `${output}/cheese-pull-${width}.png` });
  await seek(0.889, "box-open");
  await seek(0.932, "box-closing");
  const closed = await seek(0.99, "box-closed");
  assert(Number(closed.open) < 0.02);
  assert.equal(Number(closed.boxArt), 5);
  const replay = await seek(0.369, "sauce-reversed");
  assert.equal(replay.product, "dough");
  assert.equal(replay.oven, "false");
  assert.equal(replay.cheeseCoverage, "0.000");
  assert.deepEqual(errors, []);
  assert.deepEqual(failedAssets, []);
  console.log(
    `PASS cooking sequence ${width}px; all five PDF artwork panels loaded`,
  );
  await page.close();
}

async function run(browser, url, output, widths = [1440, 390]) {
  geometry();
  fs.mkdirSync(output, { recursive: true });
  for (const width of widths) await check(browser, url, output, width);
}
module.exports = run;
if (require.main === module)
  (async () => {
    const browser = await chromium.launch({
      headless: true,
      executablePath:
        process.platform === "darwin"
          ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
          : undefined,
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    });
    try {
      await run(
        browser,
        process.env.PREVIEW_URL || "http://127.0.0.1:3139",
        process.env.REVIEW_OUTPUT || "/private/tmp/90pizza-cooking-review",
      );
    } finally {
      await browser.close();
    }
  })().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
