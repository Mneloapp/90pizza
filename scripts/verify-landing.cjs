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

async function captureCanvas(page) {
  const box = await page.locator(".pizza-scene canvas").boundingBox();
  const viewport = page.viewportSize();
  const left = Math.max(0, Math.ceil(box.x));
  const top = Math.max(0, Math.ceil(box.y));
  const width = Math.floor(Math.min(viewport.width, box.x + box.width) - left);
  const height = Math.floor(
    Math.min(viewport.height, box.y + box.height) - top,
  );
  return sharp(await page.screenshot())
    .extract({ left, top, width, height })
    .toBuffer();
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
    ]) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (response.url().startsWith(origin) && response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });
      await page.goto(origin, { waitUntil: "networkidle" });
      await page
        .locator('.pizza-scene[data-ready="true"]')
        .waitFor({ timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1700);
      assert.equal(await page.locator("html").getAttribute("lang"), "ka");
      assert.equal(
        await page.locator(".hero-slogan").innerText(),
        "პიცა სწორი კუთხით",
      );
      const overflow = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      assert.ok(
        overflow.body <= overflow.viewport,
        `Horizontal overflow at ${viewport.width}: ${JSON.stringify(overflow)}`,
      );
      await page.screenshot({ path: `${output}/hero-${viewport.width}.png` });
      const before = await captureCanvas(page);
      await fs.writeFile(`${output}/canvas-${viewport.width}.png`, before);
      const pixels = await foodPixels(before);
      assert.ok(
        pixels > 10000,
        `3D pizza is blank at ${viewport.width}: ${pixels}`,
      );
      await page.screenshot({ path: `${output}/hero-${viewport.width}.png` });
      await page
        .getByRole("button", { name: "9 ნაჭრად გაშლა", exact: true })
        .click();
      await page.waitForTimeout(500);
      const after = await captureCanvas(page);
      assert.notDeepEqual(
        before,
        after,
        "3D separation must change the canvas",
      );
      await page
        .getByRole("button", { name: "პიცის შეკვრა", exact: true })
        .click();
      await page
        .getByRole("button", { name: "ნაინთი მარგარიტა", exact: true })
        .click();
      await page.locator('.pizza-scene[data-ready="true"]').waitFor();
      assert.match(
        await page.locator(".hero-product-caption").innerText(),
        /Ninety Margherita/,
      );

      for (const section of ["story", "menu", "delivery"]) {
        await page
          .locator(`#${section}`)
          .evaluate((element) =>
            element.scrollIntoView({ block: "start", behavior: "instant" }),
          );
        await page.waitForTimeout(900);
        if (viewport.width === 1440 || viewport.width === 390)
          await page.screenshot({
            path: `${output}/${section}-${viewport.width}.png`,
          });
      }
      await page.locator("#menu").scrollIntoViewIfNeeded();
      await page.getByRole("button", { name: "უხორცო", exact: true }).click();
      assert.equal(await page.locator(".pizza-card").count(), 4);
      await page.getByRole("button", { name: "ხორცით", exact: true }).click();
      assert.equal(await page.locator(".pizza-card").count(), 2);
      await page.getByRole("button", { name: "ყველა", exact: true }).click();
      assert.equal(await page.locator(".pizza-card").count(), 6);
      await page
        .getByRole("button", {
          name: "პიცის ნახვა: პეპერონი გრიდი",
          exact: true,
        })
        .click();
      await page.locator("dialog[open]").waitFor();
      assert.match(
        await page.locator("dialog").innerText(),
        /პეპერონი, მოცარელა და ჩილის თაფლი/,
      );
      if (viewport.width === 1440 || viewport.width === 390)
        await page.screenshot({
          path: `${output}/dialog-${viewport.width}.png`,
        });
      await page.keyboard.press("Escape");
      await page.locator("dialog").waitFor({ state: "detached" });
      await page
        .getByRole("button", { name: "შეარჩიე", exact: true })
        .first()
        .click();
      await page
        .getByRole("button", { name: "მიტანის ნახვა", exact: true })
        .click();
      await page.locator("dialog").waitFor({ state: "detached" });
      await page
        .locator("header .language-switch button")
        .filter({ hasText: "EN" })
        .click();
      assert.equal(await page.locator("html").getAttribute("lang"), "en");
      assert.equal(
        await page.locator(".hero-slogan").innerText(),
        "Pizza at the right angle",
      );
      assert.match(
        await page.locator(".menu-heading").innerText(),
        /The choice is always yours/,
      );
      assert.equal(
        await page
          .locator("body")
          .innerText()
          .then((text) => /\d+\s*(₾|GEL)/.test(text)),
        false,
      );
      await page
        .locator("header .language-switch button")
        .filter({ hasText: "GE" })
        .click();
      if (viewport.width < 760) {
        await page
          .getByRole("button", { name: "მენიუს გახსნა", exact: true })
          .click();
        await page.locator("#mobile-navigation a[href='#menu']").click();
        assert.equal(
          await page
            .locator(".mobile-menu-button")
            .getAttribute("aria-expanded"),
          "false",
        );
      }
      console.log(
        JSON.stringify({
          viewport,
          pizzaPixels: pixels,
          filters: "passed",
          dialog: "passed",
          language: "passed",
        }),
      );
      await page.close();
    }
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await page.goto(origin, { waitUntil: "networkidle" });
    await page.locator('.pizza-scene[data-ready="true"]').waitFor();
    assert.ok((await foodPixels(await captureCanvas(page))) > 10000);
    await page.close();
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
    await fallback.locator(".scene-fallback img").waitFor();
    assert.ok(
      await fallback
        .locator(".scene-fallback img")
        .evaluate((image) => image.complete && image.naturalWidth > 0),
    );
    await fallback.close();
    assert.deepEqual(errors, [], `Browser errors: ${errors.join("; ")}`);
    console.log(
      `PASS: four viewports, real WebGL pixels, interaction, filters, dialogs, GE/EN, and reduced motion. Screenshots: ${output}`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
