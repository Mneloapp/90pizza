const { chromium, webkit } = require("playwright");
const sharp = require("sharp");
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");

const origin = process.env.PREVIEW_URL || "http://127.0.0.1:3137";
const output =
  process.env.REVIEW_OUTPUT || "/private/tmp/90pizza-cheese-review";
const viewports = [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 320, height: 740 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
];
const chromePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chromeOptions = {
  headless: true,
  executablePath: chromePath,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
};

async function pixels(buffer) {
  return sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}
async function movingPixels(a, b) {
  const first = await pixels(a),
    second = await pixels(b);
  assert.equal(first.data.length, second.data.length);
  let different = 0,
    cream = 0;
  for (let i = 0; i < first.data.length; i += first.info.channels) {
    const r = first.data[i],
      g = first.data[i + 1],
      blue = first.data[i + 2];
    if (r > 130 && g > 125 && r > g * 1.015 && g > blue * 1.02) cream++;
    if (
      Math.abs(r - second.data[i]) +
        Math.abs(g - second.data[i + 1]) +
        Math.abs(blue - second.data[i + 2]) >
      30
    )
      different++;
  }
  return { cream, different };
}
async function layerImage(page) {
  const bounds = await page.locator(".live-cheese canvas").boundingBox();
  return page.screenshot({
    clip: bounds,
    style:
      ".film-viewport,.hero-wordmark,.hero-discover,.film-controls{visibility:hidden!important}",
  });
}
async function checkLayout(page, viewport) {
  const result = await page.evaluate(() => ({
    overflow: document.body.scrollWidth > document.documentElement.clientWidth,
    clipped: [...document.querySelectorAll("h1,h2,h3,.action-button")]
      .filter((n) => n.clientWidth && n.scrollWidth > n.clientWidth + 2)
      .map((n) => n.textContent),
  }));
  assert.equal(
    result.overflow,
    false,
    "Horizontal overflow at " + viewport.width,
  );
  assert.deepEqual(result.clipped, [], "Text overflow at " + viewport.width);
}

async function normal(browser, viewport, engine) {
  const page = await browser.newPage({
    viewport,
    reducedMotion: "no-preference",
    hasTouch: viewport.width < 760,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator(".live-cheese[data-ready=true]")
    .waitFor({ timeout: 30000 });
  await page.locator(".hero-film[data-ready=true]").waitFor();
  await page.locator(".hero-film video").evaluate((video) => {
    video.pause();
    video.currentTime = Math.min(2.5, video.duration - 0.1);
  });
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "ყველის დნობა", exact: true }).click();
  await page.waitForFunction(
    () => Number(document.querySelector(".live-cheese").dataset.energy) > 0.95,
  );
  assert.equal(
    await page.locator(".melt-button").getAttribute("aria-pressed"),
    "true",
  );
  assert.ok(
    Number(await page.locator(".live-cheese").getAttribute("data-vertices")) >
      500,
    "Empty cheese geometry",
  );
  await page.mouse.move(viewport.width * 0.45, 200);
  await page.waitForTimeout(400);
  const before = await layerImage(page);
  await page.waitForTimeout(550);
  const after = await layerImage(page);
  const evidence = await movingPixels(before, after);
  assert.ok(
    evidence.cream > 200,
    "Blank cheese canvas: " + JSON.stringify(evidence),
  );
  assert.ok(
    evidence.different > 20,
    "Frozen cheese canvas: " + JSON.stringify(evidence),
  );
  assert.equal(
    await page.locator(".hero-film video").evaluate((v) => v.paused),
    true,
    "The 3D layer must animate independently of video",
  );
  await fs.writeFile(
    `${output}/layer-${engine}-${viewport.width}x${viewport.height}.png`,
    after,
  );
  await page.screenshot({
    path: `${output}/hero-${engine}-${viewport.width}x${viewport.height}.png`,
  });
  const beforeTransform = await page
    .locator(".film-surface")
    .evaluate((n) => getComputedStyle(n).transform);
  const hero = await page.locator(".hero-film").boundingBox();
  await page.mouse.move(hero.x + hero.width * 0.8, hero.y + hero.height * 0.65);
  await page.waitForTimeout(500);
  const afterTransform = await page
    .locator(".film-surface")
    .evaluate((n) => getComputedStyle(n).transform);
  assert.notEqual(
    beforeTransform,
    afterTransform,
    "Pointer parallax is not responding",
  );
  await page
    .getByRole("button", { name: "საწყის ფორმაზე დაბრუნება", exact: true })
    .click();
  assert.equal(
    await page.locator(".melt-button").getAttribute("aria-pressed"),
    "false",
  );
  await page.waitForFunction(
    () => Number(document.querySelector(".live-cheese").dataset.energy) < 0.85,
  );
  await page
    .locator(".site-header .language-switch")
    .getByRole("button", { name: "EN", exact: true })
    .click();
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  await page
    .getByRole("button", { name: "Melt the cheese", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reset the melt", exact: true })
    .click();
  await checkLayout(page, viewport);
  await page
    .locator("#menu")
    .evaluate((n) => n.scrollIntoView({ behavior: "instant" }));
  await page.locator(".live-cheese").waitFor({ state: "detached" });
  await page
    .getByRole("button", { name: "Explore flavor: Pepperoni", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  assert.deepEqual(errors, [], "Browser errors");
  console.log(
    "PASS",
    engine,
    viewport.width + "x" + viewport.height,
    evidence,
    "independent motion, pointer, controls, GE/EN, cleanup, menu",
  );
  await page.close();
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch(chromeOptions);
  try {
    for (const viewport of viewports)
      await normal(browser, viewport, "chromium");
    const reduced = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await reduced.goto(origin, { waitUntil: "networkidle" });
    assert.equal(await reduced.locator(".live-cheese").count(), 0);
    assert.equal(await reduced.locator(".melt-button").count(), 0);
    assert.equal(
      await reduced.locator(".hero-film video").evaluate((v) => v.paused),
      true,
    );
    await reduced.close();
    const saveData = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await saveData.addInitScript(() =>
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: { saveData: true },
      }),
    );
    await saveData.goto(origin, { waitUntil: "networkidle" });
    assert.equal(await saveData.locator(".live-cheese").count(), 0);
    await saveData.close();

    const fallback = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "no-preference",
    });
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (
          type === "webgl" ||
          type === "webgl2" ||
          type === "experimental-webgl"
        )
          return null;
        return original.call(this, type, ...args);
      };
    });
    await fallback.goto(origin, { waitUntil: "networkidle" });
    await fallback
      .locator(".live-cheese[data-failed=true]")
      .waitFor({ state: "attached" });
    assert.equal(await fallback.locator(".melt-button").isDisabled(), true);
    assert.equal(await fallback.locator(".melt-button").isVisible(), false);
    await fallback.locator(".hero-film[data-ready=true]").waitFor();
    await fallback.screenshot({ path: output + "/webgl-fallback.png" });
    await fallback.close();

    const touch = await browser.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      reducedMotion: "no-preference",
    });
    await touch.goto(origin, { waitUntil: "networkidle" });
    await touch.locator(".live-cheese[data-ready=true]").waitFor();
    const client = await touch.context().newCDPSession(touch);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 190, y: 510 }],
    });
    await touch.waitForFunction(
      () => Number(document.querySelector(".live-cheese").dataset.energy) > 0.9,
    );
    for (let i = 1; i <= 8; i++) {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 190, y: 510 - i * 35 }],
      });
      await touch.waitForTimeout(30);
    }
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await touch.waitForFunction(() => scrollY > 90);
    await touch.close();
    console.log(
      "PASS reduced motion, save-data, WebGL fallback, native touch and scrolling",
    );
  } finally {
    await browser.close();
  }

  const safari = await webkit.launch({ headless: true });
  try {
    await normal(safari, { width: 390, height: 844 }, "webkit");
    await normal(safari, { width: 1440, height: 1000 }, "webkit");
  } finally {
    await safari.close();
  }
  console.log("All live-cheese checks passed. Evidence:", output);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
