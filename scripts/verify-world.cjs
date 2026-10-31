const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium, webkit } = require("playwright");
const sharp = require("sharp");
const url = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const output =
  process.env.REVIEW_OUTPUT || "/private/tmp/90pizza-making-review";
const options = {
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined),
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
};
const chapters = [
  ["hero", 0],
  ["dough", 0.24],
  ["toppings", 0.46],
  ["oven", 0.62],
  ["slices", 0.78],
  ["box", 0.97],
];

async function seek(page, value) {
  await page.evaluate((progress) => {
    const node = document.querySelector(".xp-world");
    scrollTo({
      top: node.offsetTop + (node.offsetHeight - innerHeight) * progress,
      behavior: "instant",
    });
  }, value);
  await page.waitForTimeout(1200);
}
async function canvasPixels(canvas) {
  const buffer = await canvas.screenshot({
    style: ".xp-header, .xp-wordmark, .xp-opening, .xp-chapter-copy, .xp-recipe-mark, .xp-making-bottom, .xp-scene-controls, .xp-progress { visibility: hidden !important; }",
  });
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const background = [...data.subarray(0, 3)];
  let contrast = 0;
  for (let i = 0; i < data.length; i += 4)
    if (
      Math.abs(data[i] - background[0]) +
        Math.abs(data[i + 1] - background[1]) +
        Math.abs(data[i + 2] - background[2]) >
      65
    )
      contrast++;
  assert(contrast > 700, `Blank scene: only ${contrast} contrasting pixels`);
  return { data, info, contrast };
}
function difference(a, b) {
  assert.equal(a.data.length, b.data.length);
  let changed = 0;
  for (let i = 0; i < a.data.length; i += 4)
    if (
      Math.abs(a.data[i] - b.data[i]) +
        Math.abs(a.data[i + 1] - b.data[i + 1]) +
        Math.abs(a.data[i + 2] - b.data[i + 2]) >
      40
    )
      changed++;
  assert(changed > 500, `The 3D geometry did not change: ${changed} pixels`);
  return changed;
}
async function layout(page) {
  const errors = await page.evaluate(() => {
    const result = [];
    if (document.documentElement.scrollWidth > innerWidth + 1)
      result.push("Page overflow");
    for (const node of document.querySelectorAll(
      "h1,h2,h3,.xp-header,.xp-opening>.xp-button,.xp-chapter-copy>.xp-button,.xp-making-bottom",
    )) {
      if (!node.clientWidth || node.closest("[inert]")) continue;
      if (node.scrollWidth > node.clientWidth + 2)
        result.push(`Text overflow: ${node.textContent}`);
      const rect = node.getBoundingClientRect();
      if (rect.left < -1 || rect.right > innerWidth + 1)
        result.push(`Outside viewport: ${node.textContent}`);
    }
    return result;
  });
  assert.deepEqual(errors, []);
}
async function check(browser, size, engine) {
  const context = await browser.newContext({
    viewport: size,
    hasTouch: size.width < 700,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  assert.equal(
    (await page.goto(url, { waitUntil: "networkidle" })).status(),
    200,
  );
  await page.locator(".xp-stage[data-ready=true]").waitFor();
  const canvas = page.locator(".xp-stage canvas");
  assert.equal(await page.locator("video").count(), 0);
  assert.equal(await page.locator("html").getAttribute("lang"), "ka");
  const counts = {};
  for (const [name, progress] of chapters) {
    await seek(page, progress);
    await page.locator(`.xp-stage[data-phase="${name}"]`).waitFor();
    await layout(page);
    counts[name] = (await canvasPixels(canvas)).contrast;
    await page.screenshot({
      path: `${output}/${engine}-${name}-${size.width}x${size.height}.png`,
    });
  }
  // Two positions within the same chapter prove scroll changes the geometry,
  // rather than merely swapping a heading or a background color.
  await seek(page, 0.165);
  const ball = await canvasPixels(canvas);
  await seek(page, 0.29);
  difference(ball, await canvasPixels(canvas));
  await seek(page, 0.35);
  const sauce = await canvasPixels(canvas);
  await seek(page, 0.485);
  difference(sauce, await canvasPixels(canvas));
  await page.getByRole("button", { name: "4. 9 ნაჭერი", exact: true }).click();
  await page.locator('.xp-stage[data-phase="slices"]').waitFor();
  // Wait for the scroll destination and entering copy, not a transitional frame.
  await page.waitForFunction(
    () => {
      const stage = document.querySelector(".xp-stage");
      const copy = document.querySelector(".xp-chapter-copy");
      return (
        stage.dataset.phase === "slices" &&
        Math.abs(Number(stage.dataset.local) - 0.55) < 0.005 &&
        copy &&
        getComputedStyle(copy).transform === "none"
      );
    },
    null,
    { polling: 100 },
  );
  await page
    .getByRole("button", { name: "ეს ნაჭერი ჩემია", exact: true })
    .click();
  await page
    .locator(".xp-chapter-copy")
    .getByRole("button", { name: "ნაჭრის დაბრუნება", exact: true })
    .waitFor();
  await page.waitForFunction(
    () => Number(document.querySelector(".xp-stage").dataset.lift) > 0.95,
    null,
    { polling: 100 },
  );
  await page.screenshot({
    path: `${output}/${engine}-pull-${size.width}x${size.height}.png`,
  });
  await page
    .locator(".xp-header")
    .getByRole("button", { name: "EN", exact: true })
    .click();
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  await page
    .getByRole("button", { name: "2. Ingredients", exact: true })
    .click();
  await page.locator('.xp-stage[data-phase="toppings"]').waitFor();
  assert.match(
    await page.locator(".xp-chapter-copy h2").textContent(),
    /First, the sauce/,
  );
  await layout(page);
  await page.getByRole("button", { name: "5. To you", exact: true }).click();
  await page.locator('.xp-stage[data-phase="box"]').waitFor();
  await page
    .locator(".xp-chapter-copy")
    .getByRole("link", { name: "Find your flavor", exact: true })
    .click();
  await page.waitForTimeout(1000);
  assert.equal(await page.locator(".xp-flavor").count(), 6);
  const frame = await page.locator(".xp-stage").getAttribute("data-frame");
  await page.waitForTimeout(300);
  assert.equal(
    await page.locator(".xp-stage").getAttribute("data-frame"),
    frame,
  );
  await page.getByRole("button", { name: "With meat", exact: true }).click();
  assert.equal(await page.locator(".xp-flavor").count(), 2);
  await page.getByRole("button", { name: "Meat-free", exact: true }).click();
  assert.equal(await page.locator(".xp-flavor").count(), 4);
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page
    .getByRole("button", { name: "Ingredients: Pepperoni", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await dialog
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "This is my flavor", exact: true })
    .click();
  assert.equal(await dialog.locator("output").textContent(), "2");
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  if (size.width < 700) {
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
    await page
      .locator("#xp-mobile-nav")
      .getByRole("link", { name: "Delivery", exact: true })
      .click();
    assert(await page.locator("#xp-mobile-nav").isHidden());
  }
  assert.deepEqual(errors, []);
  console.log(`PASS ${engine} ${size.width}x${size.height}`, counts);
  await context.close();
}
async function quiet(browser, saveData) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: saveData ? "no-preference" : "reduce",
  });
  if (saveData)
    await context.addInitScript(() =>
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: { saveData: true },
      }),
    );
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".xp-stage[data-ready=true]").waitFor();
  await page.waitForTimeout(300);
  const frame = await page.locator(".xp-stage").getAttribute("data-frame");
  await page.waitForTimeout(350);
  assert.equal(
    await page.locator(".xp-stage").getAttribute("data-frame"),
    frame,
  );
  for (const [name, progress] of chapters) {
    await seek(page, progress);
    assert.equal(
      await page.locator(".xp-stage").getAttribute("data-phase"),
      name,
    );
  }
  console.log(
    `PASS ${saveData ? "save-data" : "reduced-motion"}: all chapters remain accessible`,
  );
  await context.close();
}
async function fallback() {
  const browser = await chromium.launch({
    ...options,
    args: ["--disable-webgl"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator(".xp-stage[data-failed=true]").waitFor();
    assert(await page.locator(".xp-dough-placeholder").isVisible());
    await page.getByRole("button", { name: "3. ღუმელი", exact: true }).click();
    await page.locator('.xp-world-sticky[data-chapter="oven"]').waitFor();
    assert(await page.locator(".xp-chapter-copy h2").isVisible());
    console.log("PASS WebGL fallback and accessible chapter navigation");
  } finally {
    await browser.close();
  }
}
async function touch(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".xp-stage[data-ready=true]").waitFor();
  await seek(page, 0.77);
  await page.locator('.xp-stage[data-phase="slices"]').waitFor();
  await page.touchscreen.tap(195, 490);
  await page.waitForFunction(
    () => Number(document.querySelector(".xp-stage").dataset.lift) > 0.95,
  );
  await page.touchscreen.tap(195, 490);
  await page.waitForFunction(
    () => Number(document.querySelector(".xp-stage").dataset.lift) < 0.04,
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 195, y: 480 }],
  });
  for (let i = 1; i <= 10; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 195, y: 480 - i * 25 }],
    });
    await page.waitForTimeout(20);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(500);
  assert(
    await page.evaluate(() => {
      const node = document.querySelector(".xp-world");
      return scrollY > (node.offsetHeight - innerHeight) * 0.77 + 100;
    }),
    "3D canvas must not trap touch scrolling",
  );
  console.log("PASS direct pizza tap and native touch scroll");
  await context.close();
}
(async () => {
  await fs.mkdir(output, { recursive: true });
  const chrome = await chromium.launch(options);
  try {
    const flourCheck = require("./verify-flour.cjs");
    await flourCheck(chrome, url, output, 1440);
    await flourCheck(chrome, url, output, 390);
    await require("./verify-dough.cjs")(chrome, url, output, 390);
    for (const size of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 844, height: 390 },
    ])
      await check(chrome, size, "chrome");
    await quiet(chrome, false);
    await quiet(chrome, true);
    await touch(chrome);
  } finally {
    await chrome.close();
  }
  await fallback();
  const safari = await webkit.launch({ headless: true });
  try {
    await check(safari, { width: 390, height: 844 }, "webkit");
  } finally {
    await safari.close();
  }
  console.log("All pizza-making story checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
