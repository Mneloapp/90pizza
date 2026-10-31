const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const THREE = require("three");

function sourceModule(name) {
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

function geometryChecks() {
  const { doughPose, sampleDough } = sourceModule("pizza-dough");
  const { sceneFraming } = sourceModule("pizza-camera");
  const sphere = new THREE.SphereGeometry(1, 96, 64);
  const positions = sphere.attributes.position,
    index = sphere.index;
  const points = Array.from(
    { length: positions.count },
    () => new THREE.Vector3(),
  );
  const cross = new THREE.Vector3();
  const volumes = [];
  for (let step = 0; step <= 20; step++) {
    const pose = doughPose(step / 20);
    for (let i = 0; i < points.length; i++)
      sampleDough(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i),
        pose,
        points[i],
      );
    let volume = 0;
    for (let i = 0; i < index.count; i += 3) {
      const a = points[index.getX(i)],
        b = points[index.getX(i + 1)],
        c = points[index.getX(i + 2)];
      volume += a.dot(cross.crossVectors(b, c)) / 6;
    }
    volumes.push(volume);
    assert(volume > 0 && Number.isFinite(volume));
    assert(pose.halfHeight > 0.04, "Dough must not collapse to a plane");
  }
  for (const volume of volumes)
    assert(
      Math.abs(volume / volumes[0] - 1) < 0.04,
      `Dough changed volume: ${volumes}`,
    );
  sphere.dispose();
  for (const [w, h] of [
    [1440, 1000],
    [390, 844],
    [320, 568],
    [844, 390],
  ]) {
    for (const stop of [0.14, 0.32, 0.5, 0.68, 0.84]) {
      const before = sceneFraming(stop - 0.00001, w, h),
        after = sceneFraming(stop + 0.00001, w, h);
      for (const key of [
        "aspect",
        "distance",
        "cameraX",
        "cameraY",
        "lookY",
        "lookZ",
        "x",
        "y",
        "scale",
      ])
        assert(
          Math.abs(before[key] - after[key]) < 0.01,
          `Camera cut at ${stop}: ${key}`,
        );
    }
  }
  console.log("PASS conserved dough volume and continuous chapter framing");
}

module.exports = async function doughCheck(browser, url, output, width) {
  geometryChecks();
  fs.mkdirSync(output, { recursive: true });
  const height = width > 700 ? 1000 : 844;
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /shader|WebGL|THREE/.test(message.text()))
      errors.push(message.text());
  });
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator('.xp-stage[data-ready="true"]').waitFor();
    await page
      .getByRole("button", { name: "დასაწყისის გამეორება", exact: true })
      .click();
    let previous = 0;
    for (const time of [2.5, 3.2, 4.1, 5.8]) {
      await page.waitForFunction(
        (time) => +document.querySelector(".xp-stage").dataset.intro >= time,
        time,
      );
      const data = await page
        .locator(".xp-stage")
        .evaluate((node) => ({ ...node.dataset }));
      assert(
        +data.formation > previous,
        "Flour must continuously accumulate into solid dough",
      );
      assert.equal(
        data.doughOpacity,
        "1",
        "The dough must not appear through a crossfade",
      );
      previous = +data.formation;
      await page.screenshot({
        path: `${output}/refined-intro-${width}-${time}.png`,
      });
    }
    for (const [name, progress, roller] of [
      ["boundary-before", 0.139, false],
      ["boundary-after", 0.141, false],
      ["press", 0.18, true],
      ["roll", 0.21, true],
      ["stretch", 0.27, true],
      ["sheet", 0.3199, false],
      ["oven", 0.6, false],
      ["slices", 0.77, false],
    ]) {
      await page.evaluate((value) => {
        const node = document.querySelector(".xp-world");
        scrollTo({
          top: node.offsetTop + (node.offsetHeight - innerHeight) * value,
          behavior: "instant",
        });
      }, progress);
      await page.waitForTimeout(1300);
      const bounds = await page.locator(".xp-stage").boundingBox();
      assert.equal(Math.round(bounds.width), width);
      assert.equal(Math.round(bounds.height), height);
      assert.equal(
        await page.locator(".xp-stage").getAttribute("data-roller"),
        String(roller),
      );
      await page.screenshot({ path: `${output}/refined-${name}-${width}.png` });
    }
    assert.deepEqual(errors, []);
    console.log(
      `PASS continuous flour formation, rolling passes and full canvas ${width}`,
    );
  } finally {
    await context.close();
  }
};

if (require.main === module) {
  const { chromium } = require("playwright");
  (async () => {
    const browser = await chromium.launch({
      headless: true,
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
        (process.platform === "darwin"
          ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
          : undefined),
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    });
    try {
      for (const width of [1440, 390])
        await module.exports(
          browser,
          process.env.PREVIEW_URL || "http://127.0.0.1:3139",
          process.env.REVIEW_OUTPUT || "/private/tmp/90pizza-continuity",
          width,
        );
    } finally {
      await browser.close();
    }
  })().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
