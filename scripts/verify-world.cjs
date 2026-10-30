const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium, webkit } = require("playwright");
const sharp = require("sharp");

const url = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const output = process.env.REVIEW_OUTPUT || "/private/tmp/90pizza-world-review";
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  (process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : undefined);
const options = {
  headless: true,
  executablePath,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
};

async function snapshot(page, name) {
  await page.screenshot({ path: path.join(output, `${name}.png`) });
}
async function pixels(buffer) {
  return sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}
async function nonblank(buffer) {
  const { data, info } = await pixels(buffer);
  let food = 0,
    clipped = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (
      data[i] > 95 &&
      data[i + 1] > 60 &&
      data[i + 1] < data[i] * 0.92 &&
      data[i + 2] < data[i + 1] * 0.9
    ) {
      food++;
      const x = (i / 4) % info.width,
        y = Math.floor(i / 4 / info.width);
      if (x < 2 || x > info.width - 3 || y < 2 || y > info.height - 3)
        clipped++;
    }
  }
  assert(food > 1000, `3D model missing: ${food} food/carton pixels`);
  assert(
    clipped < 12,
    `3D model is clipped at the canvas edge: ${clipped} pixels`,
  );
  return food;
}
async function changed(before, after) {
  const a = await pixels(before),
    b = await pixels(after);
  assert.equal(a.data.length, b.data.length);
  let count = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (
      Math.abs(a.data[i] - b.data[i]) +
        Math.abs(a.data[i + 1] - b.data[i + 1]) +
        Math.abs(a.data[i + 2] - b.data[i + 2]) >
      40
    )
      count++;
  }
  assert(count > 800, `Scene did not visibly respond: ${count} changed pixels`);
  return count;
}
async function number(page, attribute, expected) {
  await page.waitForFunction(
    ({ attribute, expected }) =>
      Math.abs(
        Number(document.querySelector(".xp-stage")?.getAttribute(attribute)) -
          expected,
      ) < 0.04,
    { attribute, expected },
  );
}
async function scrollTo(page, y) {
  await page.evaluate(
    (value) => window.scrollTo({ top: value, behavior: "instant" }),
    y,
  );
  await page.waitForTimeout(650);
}
async function checkLayout(page) {
  const problems = await page.evaluate(() => {
    const errors = [];
    if (document.documentElement.scrollWidth > innerWidth + 1)
      errors.push("Horizontal page overflow");
    document
      .querySelectorAll(
        ".xp-header,.xp-hero-bottom h2,.xp-wordmark h1,.xp-menu-heading h2,.xp-flavor h3,.xp-delivery h2,.xp-footer-wordmark",
      )
      .forEach((node) => {
        const rect = node.getBoundingClientRect();
        if (node.scrollWidth > node.clientWidth + 2)
          errors.push(`${node.className || node.tagName}: text overflow`);
        if (rect.left < -1 || rect.right > innerWidth + 1)
          errors.push(`${node.className || node.tagName}: outside viewport`);
      });
    return errors;
  });
  assert.deepEqual(problems, []);
}
async function journey(browser, size, engine) {
  const context = await browser.newContext({
    viewport: size,
    deviceScaleFactor: 1,
    hasTouch: size.width < 700,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(url, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  await page.locator(".xp-stage[data-ready=true]").waitFor();
  await number(page, "data-lift", 1);
  await checkLayout(page);
  assert.equal(
    await page.locator("video").count(),
    0,
    "Old film must not be mounted",
  );
  assert.equal(
    await page.locator(".live-cheese").count(),
    0,
    "Old overlay must not be mounted",
  );
  assert.equal(await page.locator("html").getAttribute("lang"), "ka");
  assert(
    Number(await page.locator(".xp-stage").getAttribute("data-triangles")) >
      30000,
  );
  const canvas = page.locator(".xp-stage canvas");
  const initial = await canvas.screenshot();
  const colored = await nonblank(initial);
  await snapshot(page, `${engine}-hero-${size.width}x${size.height}`);
  await page
    .getByRole("button", { name: "ნაჭრის დაბრუნება", exact: true })
    .click();
  await number(page, "data-lift", 0);
  const different = await changed(initial, await canvas.screenshot());
  await page
    .getByRole("button", { name: "პიცის მობრუნება", exact: true })
    .click();
  await page.waitForTimeout(1200);
  await changed(initial, await canvas.screenshot());
  await page
    .getByRole("button", { name: "ყუთის დახურვა", exact: true })
    .click();
  await number(page, "data-open", 0);
  await snapshot(page, `${engine}-closed-${size.width}x${size.height}`);
  await page.getByRole("button", { name: "ყუთის გახსნა", exact: true }).click();
  await number(page, "data-open", 1);
  await page
    .getByRole("button", { name: "ნაჭრების გაშლა", exact: true })
    .click();
  await number(page, "data-spread", 1);
  await page
    .getByRole("button", { name: "ნაჭრების შეკვრა", exact: true })
    .click();
  await number(page, "data-spread", 0);
  await page
    .locator(".xp-header")
    .getByRole("button", { name: "EN", exact: true })
    .click();
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  assert.equal(
    await page.locator(".xp-hero-bottom h2").textContent(),
    "Pizza at the right angle.",
  );
  await checkLayout(page);
  await scrollTo(page, Math.max(size.height, 640) * 0.85);
  await page.locator('.xp-world-sticky[data-chapter="slices"]').waitFor();
  await number(page, "data-spread", 1);
  await snapshot(page, `${engine}-slices-${size.width}x${size.height}`);
  await page
    .getByRole("button", { name: "That slice is mine", exact: true })
    .click();
  await number(page, "data-lift", 1);
  await snapshot(page, `${engine}-pull-${size.width}x${size.height}`);
  await scrollTo(
    page,
    await page
      .locator("#menu")
      .evaluate((node) => node.getBoundingClientRect().top + scrollY - 72),
  );
  await page.waitForTimeout(700);
  await snapshot(page, `${engine}-menu-${size.width}x${size.height}`);
  const frame = await page.locator(".xp-stage").getAttribute("data-frame");
  await page.waitForTimeout(300);
  assert.equal(
    await page.locator(".xp-stage").getAttribute("data-frame"),
    frame,
    "Offscreen renderer should sleep",
  );
  assert.equal(await page.locator(".xp-flavor").count(), 6);
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
  await dialog
    .getByRole("button", { name: "Your choice", exact: true })
    .waitFor();
  await snapshot(page, `${engine}-dialog-${size.width}x${size.height}`);
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  if (size.width < 700) {
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
    await page
      .locator("#xp-mobile-nav")
      .getByRole("link", { name: "Delivery", exact: true })
      .click();
    assert(await page.locator("#xp-mobile-nav").isHidden());
  } else
    await page
      .locator(".xp-desktop-nav")
      .getByRole("link", { name: "Delivery", exact: true })
      .click();
  await page.waitForTimeout(1000);
  await snapshot(page, `${engine}-delivery-${size.width}x${size.height}`);
  await checkLayout(page);
  assert.deepEqual(errors, []);
  console.log(`PASS ${engine} ${size.width}x${size.height}`, {
    colored,
    different,
  });
  await context.close();
}
async function quietCheck(browser, saveData = false) {
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
  await page.waitForTimeout(400);
  assert.equal(
    await page.locator(".xp-stage").getAttribute("data-frame"),
    frame,
  );
  await page
    .getByRole("button", { name: "ნაჭრის დაბრუნება", exact: true })
    .click();
  await number(page, "data-lift", 0);
  await page.getByRole("button", { name: "ნაჭრის აწევა", exact: true }).click();
  await number(page, "data-lift", 1);
  console.log(
    `PASS ${saveData ? "save-data" : "reduced-motion"}: static render, working controls`,
  );
  await context.close();
}
async function fallbackCheck() {
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
    assert(await page.locator(".xp-stage-fallback img").isVisible());
    assert(
      await page
        .getByRole("button", { name: "ნაჭრის დაბრუნება", exact: true })
        .isDisabled(),
    );
    await page.locator(".xp-hero-bottom a").click();
    await page
      .getByRole("button", { name: "ინგრედიენტები: პეპერონი", exact: true })
      .click();
    await page.getByRole("dialog").waitFor();
    console.log("PASS WebGL fallback and menu access");
  } finally {
    await browser.close();
  }
}
async function touchCheck(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".xp-stage[data-ready=true]").waitFor();
  await number(page, "data-lift", 1);
  await page.touchscreen.tap(195, 490);
  await number(page, "data-lift", 0);
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
  await page.waitForTimeout(300);
  assert(
    await page.evaluate(() => scrollY > 100),
    "3D canvas must not trap vertical touch scrolling",
  );
  console.log("PASS direct pizza tap and native touch scroll");
  await context.close();
}
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch(options);
  try {
    for (const size of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 844, height: 390 },
    ])
      await journey(browser, size, "chrome");
    await quietCheck(browser);
    await quietCheck(browser, true);
    await touchCheck(browser);
  } finally {
    await browser.close();
  }
  await fallbackCheck();
  const safari = await webkit.launch({ headless: true });
  try {
    await journey(safari, { width: 390, height: 844 }, "webkit");
  } finally {
    await safari.close();
  }
  console.log("All new 3D world checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
