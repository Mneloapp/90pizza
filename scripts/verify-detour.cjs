const { chromium, webkit } = require("playwright");
const sharp = require("sharp");
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");
const path = require("node:path");
require("./verify-assembly.cjs");
const base = process.env.QA_URL || "http://127.0.0.1:3139";
const out = process.env.QA_OUT || "/private/tmp/90pizza-detour-qa";
const quick = process.env.QA_QUICK === "1";
const errors = [];
const results = [];
const stages = [
  [1, 0.245],
  [2, 0.39],
  [2, 0.48],
  [2, 0.58],
  [3, 0.73],
  [4, 0.86],
  [5, 0.997],
];

async function shot(page, name) {
  await page.screenshot({ path: path.join(out, `${name}.png`) });
}

async function settled(page, progress) {
  await page.waitForFunction(
    (p) =>
      Math.abs(
        Number(document.querySelector(".dt-canvas").dataset.progress) - p,
      ) < 0.0012,
    progress,
    { timeout: 15000 },
  );
}

async function canvasCheck(page, name) {
  const framing = await page.locator(".dt-canvas").evaluate((el) => {
    const b = JSON.parse(el.dataset.bounds);
    const collisions = [
      ...document.querySelectorAll(
        ".dt-story-copy,.dt-stage-actions>.dt-primary,.dt-scene-tools",
      ),
    ]
      .filter((node) => {
        const r = node.getBoundingClientRect();
        return (
          r.width &&
          r.height &&
          b.left < r.right - 2 &&
          b.right > r.left + 2 &&
          b.top < r.bottom - 2 &&
          b.bottom > r.top + 2
        );
      })
      .map((node) => node.className);
    return { b, collisions, width: innerWidth, height: innerHeight };
  });
  assert.deepEqual(
    framing.collisions,
    [],
    `${name}: product overlaps text/controls ${JSON.stringify(framing)}`,
  );
  assert(
    framing.b.left >= 0 &&
      framing.b.right <= framing.width &&
      framing.b.top > 60 &&
      framing.b.bottom < framing.height - 45,
    `${name}: clipped product`,
  );
  const buffer = await page.locator(".dt-canvas canvas").screenshot({
    style:
      ".dt-header, .dt-stage > :not(.dt-canvas) { visibility: hidden !important; }",
  });
  const left = Math.max(0, Math.floor(framing.b.left));
  const top = Math.max(0, Math.floor(framing.b.top));
  const crop = sharp(buffer).extract({
    left,
    top,
    width: Math.min(framing.width - left, Math.ceil(framing.b.right) - left),
    height: Math.min(framing.height - top, Math.ceil(framing.b.bottom) - top),
  });
  const { data, info } = await crop
    .clone()
    .resize(160, 100)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let colorful = 0;
  for (let i = 0; i < data.length; i += info.channels)
    if (
      Math.max(data[i], data[i + 1], data[i + 2]) -
        Math.min(data[i], data[i + 1], data[i + 2]) >
      35
    )
      colorful++;
  const phase = await page.locator(".dt-canvas").getAttribute("data-product");
  const closedBox =
    Number(await page.locator(".dt-canvas").getAttribute("data-lid")) > 0.5;
  const stats = await crop.clone().stats();
  assert(
    stats.channels.slice(0, 3).every((c) => c.stdev > 12),
    `${name}: uniform canvas`,
  );
  assert(
    colorful > (closedBox ? 120 : phase === "preparation" ? 150 : 250),
    `${name}: blank or untextured canvas (${colorful})`,
  );
  return { buffer, colorful };
}

async function check(browserType, name, viewport, options = {}) {
  if (process.env.QA_TARGET && process.env.QA_TARGET !== name) return;
  const browser = await browserType.launch({
    headless: true,
    ...(browserType === chromium ? { channel: "chrome" } : {}),
  });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    ...options,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${name}: ${m.text()}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${name}: ${r.status()} ${r.url()}`);
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page
    .locator(".dt-canvas[data-state=ready]")
    .waitFor({ timeout: 45000 });
  await page.waitForTimeout(900);
  if (options.reducedMotion !== "reduce") {
    await page.evaluate(() =>
      window.scrollTo({
        top:
          (document.querySelector(".dt-story").offsetHeight - innerHeight) *
          0.07,
        behavior: "instant",
      }),
    );
    await page.waitForTimeout(400);
    await page
      .getByRole("button", {
        name: "ფქვილის შესავლის თავიდან გაშვება",
        exact: true,
      })
      .click();
    await page.waitForFunction(
      () =>
        Number(document.querySelector(".dt-canvas").dataset.intro) > 0.4 &&
        Number(document.querySelector(".dt-canvas").dataset.progress) < 0.005,
    );
    assert.equal(
      await page.locator(".dt-canvas").getAttribute("data-flour"),
      "true",
    );
    await shot(page, `${name}-flour`);
    await page
      .getByRole("button", { name: "მოძრაობის შეჩერება", exact: true })
      .click();
    const stopped = Number(
      await page.locator(".dt-canvas").getAttribute("data-intro"),
    );
    await page.waitForTimeout(250);
    assert(
      Math.abs(
        Number(await page.locator(".dt-canvas").getAttribute("data-intro")) -
          stopped,
      ) < 0.1,
      "Flour pause did not stop time",
    );
    await page
      .getByRole("button", { name: "მოძრაობის გაგრძელება", exact: true })
      .click();
    await page.waitForFunction(
      () =>
        Number(document.querySelector(".dt-canvas").dataset.formation) > 0.2,
    );
    assert(
      Number(await page.locator(".dt-canvas").getAttribute("data-formation")) <
        1,
    );
    await shot(page, `${name}-gather`);
  }
  await page.waitForFunction(
    () => Number(document.querySelector(".dt-canvas").dataset.intro) >= 5.99,
  );
  assert.equal(
    await page.locator(".dt-canvas").getAttribute("data-product"),
    "preparation",
  );
  assert.equal(await page.locator("html").getAttribute("lang"), "ka");
  assert.equal(
    await page.locator(".dt-canvas").getAttribute("data-slices"),
    "9",
  );
  assert.equal(await page.locator("video").count(), 0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth + 1,
  );
  assert(!overflow, `${name}: horizontal overflow`);
  const initial = await canvasCheck(page, name);
  await shot(page, `${name}-hero`);
  if (quick) {
    for (const [stage, p] of stages) {
      await page.evaluate(
        (p) =>
          window.scrollTo({
            top:
              (document.querySelector(".dt-story").offsetHeight - innerHeight) *
              p,
            behavior: "instant",
          }),
        p,
      );
      await page.waitForTimeout(1200);
      await shot(page, `${name}-chapter-${stage}`);
    }
    await page.locator("#flavors").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await shot(page, `${name}-flavors`);
    results.push({ name, colorful: initial.colorful });
    await browser.close();
    return;
  }
  await page.getByRole("button", { name: "მოვამზადოთ", exact: true }).click();
  await page.waitForTimeout(1600);
  await page
    .getByRole("button", { name: "პიცის 90°-ით მობრუნება", exact: true })
    .click();
  await page.waitForTimeout(1100);
  assert(
    Number(await page.locator(".dt-canvas").getAttribute("data-rotation")) >
      1.5,
    `${name}: rotation control`,
  );
  const rotated = await canvasCheck(page, name);
  assert(
    !initial.buffer.equals(rotated.buffer),
    `${name}: canvas did not change`,
  );
  await page
    .getByRole("button", { name: "მოძრაობის შეჩერება", exact: true })
    .click();
  await page
    .locator(".dt-header")
    .getByRole("button", { name: "EN", exact: true })
    .click();
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  assert.equal(
    await page.locator(".dt-canvas").getAttribute("data-state"),
    "ready",
  );
  const timeOrigin = await page.evaluate(() => performance.timeOrigin);
  if (name === "desktop" || name === "mobile") {
    for (const p of [
      0.12, 0.2, 0.24, 0.27, 0.4, 0.45, 0.49, 0.51, 0.65, 0.68, 0.7, 0.73, 0.76,
      0.98,
    ]) {
      await page.evaluate(
        (p) =>
          window.scrollTo({
            top:
              (document.querySelector(".dt-story").offsetHeight - innerHeight) *
              p,
            behavior: "instant",
          }),
        p,
      );
      await page.waitForTimeout(900);
      await settled(page, p);
      await canvasCheck(page, `${name}-english-sweep-${p}`);
    }
    await shot(page, `${name}-english`);
  }
  await page
    .locator(".dt-header")
    .getByRole("button", { name: "GE", exact: true })
    .click();
  assert.equal(
    await page.evaluate(() => performance.timeOrigin),
    timeOrigin,
    "Language switch reloads page",
  );
  for (const [stage, p] of stages) {
    await page.evaluate(
      (p) =>
        window.scrollTo({
          top:
            (document.querySelector(".dt-story").offsetHeight - innerHeight) *
            p,
          behavior: "instant",
        }),
      p,
    );
    await page.waitForTimeout(1000);
    await settled(page, p);
    assert.equal(
      await page.locator(".dt-stage").getAttribute("data-chapter"),
      String(stage),
    );
    await canvasCheck(page, `${name}-${stage}`);
    const state = await page
      .locator(".dt-canvas")
      .evaluate((el) => ({ ...el.dataset }));
    if (stage === 1)
      assert(
        Number(state.form) > 0.4 && Number(state.topping) === 0,
        "Dough must precede toppings",
      );
    if (p === 0.39)
      assert(
        Number(state.topping) > 0.1 && Number(state.topping) < 0.44,
        "Sauce stage",
      );
    if (p === 0.48)
      assert(
        Number(state.topping) > 0.44 && Number(state.topping) < 0.75,
        "Cheese stage",
      );
    if (p === 0.58)
      assert(
        Number(state.topping) > 0.75 && Number(state.bake) === 0,
        "Pepperoni precedes baking",
      );
    if (stage >= 3) assert.equal(state.product, "baked");
    if (stage === 1) assert.equal(state.hands, "true");
    if (stage === 3)
      assert(Number(state.oven) > 0.99, "Oven environment missing");
    if (stage === 4) {
      assert.equal(state.raised, "1", "Exactly one slice must lift");
      assert.equal(state.cheese, "3", "Three short cheese strands expected");
      assert(Number(state.lift) > 0.9);
    }
    if (stage === 5) {
      assert(Number(state.lid) > 0.99, "Box lid not closed");
      assert.equal(state.branding, "5", "Box print panels missing");
      assert.equal(state.raised, "0");
    }
    await shot(page, `${name}-chapter-${stage}-${p}`);
  }
  for (const [p, raised, cheese] of [
    [0.89, "1", "0"],
    [0.86, "1", "3"],
    [0.8, "0", "0"],
  ]) {
    await page.evaluate(
      (p) =>
        scrollTo({
          top:
            (document.querySelector(".dt-story").offsetHeight - innerHeight) *
            p,
          behavior: "instant",
        }),
      p,
    );
    await page.waitForTimeout(1000);
    await settled(page, p);
    assert.equal(
      await page.locator(".dt-canvas").getAttribute("data-raised"),
      raised,
      "Reverse slice motion",
    );
    assert.equal(
      await page.locator(".dt-canvas").getAttribute("data-cheese"),
      cheese,
      "Cheese release/reverse motion",
    );
    await canvasCheck(page, `${name}-reverse-${p}`);
  }
  await page.locator("#flavors").scrollIntoViewIfNeeded();
  const ids = new Set();
  for (let i = 0; i < 6; i++) {
    await page.locator(".dt-flavor-row").nth(i).click();
    await page.waitForTimeout(600);
    const img = page.locator(".dt-flavor-photo img");
    await img.evaluate((el) => el.decode());
    ids.add(await img.getAttribute("src"));
    assert(await img.evaluate((el) => el.naturalWidth > 0));
    assert.equal(
      await page.locator(".dt-flavor-row[aria-pressed=true]").count(),
      1,
    );
  }
  assert.equal(ids.size, 6, "Menu images not unique");
  assert(
    !(await page.locator(".dt-flavors").innerText()).includes("₾"),
    "Prices unexpectedly visible",
  );
  await shot(page, `${name}-flavors`);
  await page.locator(".dt-choose").click();
  assert(await page.locator("dialog").evaluate((el) => el.open));
  assert(
    (await page.locator("dialog").innerText()).includes(
      "შეკვეთები ჯერ არ გახსნილა",
    ),
  );
  for (let i = 0; i < 7; i++) await page.keyboard.press("Tab");
  assert(
    await page.evaluate(() =>
      document.querySelector("dialog").contains(document.activeElement),
    ),
    "Modal focus escaped",
  );
  await shot(page, `${name}-dialog`);
  await page.keyboard.press("Escape");
  assert(!(await page.locator("dialog").evaluate((el) => el.open)));
  await page.waitForFunction(
    () => document.querySelector(".dt-choose") === document.activeElement,
    { timeout: 2000 },
  );
  assert(
    await page
      .locator(".dt-choose")
      .evaluate((el) => el === document.activeElement),
    "Focus not restored",
  );
  await page.locator("#delivery").scrollIntoViewIfNeeded();
  await shot(page, `${name}-delivery`);
  if (viewport.width < 768) {
    await page.locator(".dt-menu-toggle").click();
    assert(await page.locator("#detour-mobile-nav").isVisible());
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#detour-mobile-nav").count(), 0);
    await page.locator(".dt-menu-toggle").click();
    await page.locator('#detour-mobile-nav a[href="#top"]').click();
    await page.waitForTimeout(1300);
    assert.equal(await page.locator("#detour-mobile-nav").count(), 0);
  }
  const broken = await page
    .locator("img")
    .evaluateAll((imgs) =>
      imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
    );
  assert.deepEqual(broken, [], "Broken image");
  results.push({
    name,
    colorful: initial.colorful,
    triangles: await page.locator(".dt-canvas").getAttribute("data-triangles"),
    images: ids.size,
  });
  console.log(`Passed ${name}`);
  await browser.close();
}

async function fallback(mode) {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript((mode) => {
    if (mode === "webgl") {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type === "webgl" || type === "webgl2") return null;
        return original.call(this, type, ...args);
      };
    } else
      Object.defineProperty(navigator, "connection", {
        value: { saveData: true },
        configurable: true,
      });
  }, mode);
  await page.goto(base, { waitUntil: "networkidle" });
  const selector =
    mode === "webgl"
      ? ".dt-canvas[data-state=fallback] .dt-scene-fallback"
      : ".dt-loading-scene";
  await page.locator(selector).waitFor();
  assert(await page.locator(selector).evaluate((el) => el.naturalWidth > 0));
  for (const [chapter, p] of [0, 0.245, 0.58, 0.73, 0.86, 0.997].entries()) {
    await page.evaluate(
      (p) =>
        scrollTo({
          top:
            (document.querySelector(".dt-story").offsetHeight - innerHeight) *
            p,
          behavior: "instant",
        }),
      p,
    );
    await page.waitForTimeout(500);
    const fallbackImage = page.locator(selector);
    await fallbackImage.evaluate((el) => el.decode());
    assert(
      (await fallbackImage.evaluate((el) => el.currentSrc)).endsWith(
        `story-${chapter}-mobile.webp`,
      ),
      "Fallback chapter mismatch",
    );
    await shot(page, `fallback-${mode}-${chapter}`);
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "მოვამზადოთ", exact: true }).click();
  await page.waitForTimeout(1200);
  await page.locator(".dt-stage-actions a").click();
  await page.waitForTimeout(1000);
  assert(await page.locator(".dt-flavor-row").first().isVisible());
  await shot(page, `fallback-${mode}`);
  results.push({ name: `fallback-${mode}`, passed: true });
  console.log(`Passed fallback-${mode}`);
  await browser.close();
}

(async () => {
  await fs.mkdir(out, { recursive: true });
  await check(chromium, "desktop", { width: 1440, height: 1000 });
  await check(
    chromium,
    "mobile",
    { width: 390, height: 844 },
    { isMobile: true, hasTouch: true },
  );
  if (!quick) {
    await check(
      chromium,
      "small",
      { width: 320, height: 568 },
      { isMobile: true, hasTouch: true },
    );
    await check(chromium, "tablet", { width: 768, height: 1024 });
    await check(chromium, "landscape", { width: 844, height: 390 });
    await check(
      webkit,
      "webkit",
      { width: 390, height: 844 },
      { isMobile: true, hasTouch: true },
    );
    await check(
      chromium,
      "reduced",
      { width: 390, height: 844 },
      { reducedMotion: "reduce" },
    );
    await fallback("webgl");
    await fallback("save-data");
  }
  assert.deepEqual(errors, [], "Browser errors");
  await fs.writeFile(
    path.join(out, "report.json"),
    JSON.stringify({ base, results, errors }, null, 2),
  );
  console.log(JSON.stringify({ base, results, errors }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
