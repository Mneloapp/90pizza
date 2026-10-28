const { chromium } = require("playwright");
const sharp = require("sharp");
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");

const origin = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const output = process.env.REVIEW_OUTPUT || "/private/tmp/90pizza-review";

async function foodPixels(buffer) {
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (
      data[i] > 90 &&
      data[i] > data[i + 1] * 1.2 &&
      data[i + 1] > data[i + 2] * 1.2
    )
      count++;
  }
  return count;
}

async function captureCanvas(page, selector) {
  const box = await page.locator(`${selector} canvas`).boundingBox();
  const viewport = page.viewportSize();
  const left = Math.max(0, Math.ceil(box.x));
  const top = Math.max(0, Math.ceil(box.y));
  const width = Math.floor(Math.min(viewport.width, box.x + box.width) - left);
  const height = Math.floor(
    Math.min(viewport.height, box.y + box.height) - top,
  );
  assert.ok(width > 0 && height > 0, "Canvas must intersect the viewport");
  return sharp(await page.screenshot())
    .extract({ left, top, width, height })
    .toBuffer();
}

async function jump(page, selector) {
  await page
    .locator(selector)
    .evaluate((element) =>
      element.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await page.waitForTimeout(850);
}

async function checkWidth(page, width) {
  const size = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  assert.ok(
    size.body <= size.viewport,
    `Horizontal overflow at ${width}: ${JSON.stringify(size)}`,
  );
  const clipped = await page
    .locator("h1,h2,h3,.drop-button,.flavor-picker button")
    .evaluateAll((elements) =>
      elements
        .filter((element) => element.scrollWidth > element.clientWidth + 2)
        .map((element) => element.textContent),
    );
  assert.deepEqual(clipped, [], `Clipped text at ${width}`);
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    args: [
      "--enable-webgl",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const errors = [];
  try {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 320, height: 740 },
      { width: 320, height: 568 },
      { width: 844, height: 390 },
    ]) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (response.url().startsWith(origin) && response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });
      await page.goto(origin, { waitUntil: "networkidle" });
      await page
        .locator('.hero-world [data-ready="true"]')
        .waitFor({ timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(800);
      assert.equal(await page.locator("html").getAttribute("lang"), "ka");
      assert.equal(
        await page.locator(".hero-tagline h2").innerText(),
        "პიცა სწორი კუთხით.",
      );
      await checkWidth(page, viewport.width);
      await page.screenshot({ path: `${output}/hero-${viewport.width}.png` });
      const hero = await captureCanvas(page, ".hero-world");
      const heroSize = await sharp(hero).metadata();
      assert.ok(
        (await foodPixels(hero)) >
          Math.min(6000, heroSize.width * heroSize.height * 0.02),
        "The box must contain a visible pizza",
      );
      await page
        .getByRole("button", { name: "ყუთის დახურვა", exact: true })
        .click();
      await page.waitForTimeout(1100);
      assert.notDeepEqual(
        hero,
        await captureCanvas(page, ".hero-world"),
        "Closing the box must change the scene",
      );
      await page
        .getByRole("button", { name: "ყუთის გახსნა", exact: true })
        .click();
      await jump(page, "#flavors");
      await page
        .locator(".flavor-world")
        .evaluate((element) =>
          element.scrollIntoView({ block: "center", behavior: "instant" }),
        );
      await page.waitForTimeout(500);
      await page.locator('.flavor-world [data-ready="true"]').waitFor();
      const pizza = await captureCanvas(page, ".flavor-world");
      const pixels = await foodPixels(pizza);
      assert.ok(pixels > 10000, `Blank pizza at ${viewport.width}: ${pixels}`);
      await page
        .getByRole("button", { name: "ნაჭრების გაშლა", exact: true })
        .click();
      await page.waitForTimeout(700);
      assert.notDeepEqual(
        pizza,
        await captureCanvas(page, ".flavor-world"),
        "Nine-piece separation must change the canvas",
      );
      await page
        .getByRole("button", { name: "ნაჭრების შეკვრა", exact: true })
        .click();
      const bounds = await page.locator(".flavor-world canvas").boundingBox();
      await page.mouse.move(viewport.width / 2, bounds.y + bounds.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        viewport.width / 2 + 65,
        bounds.y + bounds.height / 2 + 15,
        { steps: 6 },
      );
      await page.mouse.up();
      for (const name of ["ოთხი ყველი", "მარგარიტა", "სოკო"]) {
        await page.getByRole("tab", { name: new RegExp(name) }).click();
        await page.locator('.flavor-world [data-ready="true"]').waitFor();
        assert.match(
          await page
            .locator(".flavor-world [role=img]")
            .getAttribute("aria-label"),
          new RegExp(name),
        );
      }
      await page.getByRole("tab", { name: /სოკო/ }).press("ArrowRight");
      assert.equal(
        await page.locator("#taste-tab-0").getAttribute("aria-selected"),
        "true",
      );
      if ([1440, 390].includes(viewport.width))
        await page.screenshot({
          path: `${output}/flavors-${viewport.width}.png`,
        });
      await page
        .getByRole("button", { name: "ეს ჩემი გემოა", exact: true })
        .click();
      await page.locator("dialog[open]").waitFor();
      const plus = page.getByRole("button", {
        name: "ერთით მეტი",
        exact: true,
      });
      for (let i = 1; i < 9; i++) await plus.click();
      assert.equal(await page.locator("dialog output").innerText(), "9");
      assert.ok(await plus.isDisabled());
      const minus = page.getByRole("button", {
        name: "ერთით ნაკლები",
        exact: true,
      });
      for (let i = 9; i > 1; i--) await minus.click();
      assert.ok(await minus.isDisabled());
      assert.match(
        await page.locator("dialog").innerText(),
        /გადახდა და შეკვეთების მიღება ჯერ არ ჩართულა/,
      );
      if ([1440, 390].includes(viewport.width))
        await page.screenshot({
          path: `${output}/selection-${viewport.width}.png`,
        });
      await page.keyboard.press("Escape");
      await page.locator("dialog").waitFor({ state: "detached" });
      for (const section of ["geometry", "delivery"]) {
        await jump(page, `#${section}`);
        if ([1440, 390].includes(viewport.width))
          await page.screenshot({
            path: `${output}/${section}-${viewport.width}.png`,
          });
      }
      await jump(page, "#geometry");
      assert.equal(await page.locator(".nine-slice").count(), 9);
      await page.getByRole("button", { name: "გაყოფა", exact: true }).click();
      assert.equal(
        await page
          .getByRole("button", { name: "შეკვრა", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page
        .locator("header .drop-languages button")
        .filter({ hasText: "EN" })
        .click();
      assert.equal(await page.locator("html").getAttribute("lang"), "en");
      assert.equal(
        await page.locator(".hero-tagline h2").innerText(),
        "Pizza at the right angle.",
      );
      await checkWidth(page, viewport.width);
      assert.doesNotMatch(
        await page.locator("body").innerText(),
        /\d+\s*(₾|GEL)/,
      );
      await page
        .locator("header .drop-languages button")
        .filter({ hasText: "GE" })
        .click();
      if (viewport.width < 760) {
        await page
          .getByRole("button", { name: "ნავიგაციის გახსნა", exact: true })
          .click();
        await page.locator("#drop-mobile-nav a[href='#flavors']").click();
        assert.equal(
          await page.locator(".mobile-toggle").getAttribute("aria-expanded"),
          "false",
        );
      }
      console.log(
        JSON.stringify({
          viewport,
          pizzaPixels: pixels,
          box: "passed",
          flavors: "passed",
          selection: "passed",
          language: "passed",
        }),
      );
      await page.close();
    }
    const reduced = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await reduced.goto(origin, { waitUntil: "networkidle" });
    await reduced.locator('.hero-world [data-ready="true"]').waitFor();
    const first = await captureCanvas(reduced, ".hero-world");
    await reduced.waitForTimeout(500);
    assert.deepEqual(
      first,
      await captureCanvas(reduced, ".hero-world"),
      "Reduced-motion scenes must stop floating",
    );
    await reduced
      .getByRole("button", { name: "ყუთის დახურვა", exact: true })
      .click();
    await reduced.waitForTimeout(100);
    assert.notDeepEqual(
      first,
      await captureCanvas(reduced, ".hero-world"),
      "Manual control must work with reduced motion",
    );
    await reduced.close();
    const fallback = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        return /webgl/.test(kind) ? null : original.call(this, kind, ...args);
      };
    });
    await fallback.goto(origin, { waitUntil: "networkidle" });
    const photograph = fallback.locator(".hero-world .square-world > img");
    await photograph.waitFor();
    assert.ok(
      await photograph.evaluate(
        (image) =>
          image.complete &&
          image.naturalWidth > 0 &&
          getComputedStyle(image).visibility !== "hidden",
      ),
    );
    await fallback.screenshot({ path: `${output}/fallback-390.png` });
    await fallback.close();
    assert.deepEqual(errors, [], `Browser errors: ${errors.join("; ")}`);
    console.log(
      `PASS: six viewports, real WebGL pixels, box motion, slice separation, flavor changes, quantity limits, dialogs, GE/EN, reduced motion, and photographic fallback. Screenshots: ${output}`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
