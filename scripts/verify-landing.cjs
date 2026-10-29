const { chromium } = require("playwright");
const sharp = require("sharp");
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");
const origin = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const output =
  process.env.REVIEW_OUTPUT || "/private/tmp/90pizza-journey-review";

async function warmPixels(buffer) {
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let i = 0; i < data.length; i += info.channels)
    if (
      data[i] > 90 &&
      data[i] > data[i + 1] * 1.3 &&
      data[i] > data[i + 2] * 1.3
    )
      count++;
  return count;
}
async function chapter(page, index) {
  await page
    .locator("#moment-" + index)
    .evaluate((node) =>
      node.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await page.waitForTimeout(1300);
  await page.waitForFunction(
    (index) =>
      Math.abs(
        Number(document.querySelector(".journey-world").dataset.progress) -
          index,
      ) < 0.015,
    index,
  );
}
async function widthCheck(page, viewport) {
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  assert.ok(
    dimensions.body <= dimensions.viewport,
    "Horizontal overflow at " + viewport.width,
  );
  const clipped = await page
    .locator("h1,h2,h3,.journey-cta,.journey-flavors button")
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => node.scrollWidth > node.clientWidth + 2)
        .map((node) => node.textContent),
    );
  assert.deepEqual(clipped, [], "Clipped text at " + viewport.width);
}
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
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
      const page = await browser.newPage({
        viewport,
        deviceScaleFactor: 1,
        hasTouch: viewport.width < 760,
      });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (response.url().startsWith(origin) && response.status() >= 400)
          errors.push(response.status() + " " + response.url());
      });
      await page.goto(origin, { waitUntil: "networkidle" });
      await page
        .locator(".journey-world[data-ready=true]")
        .waitFor({ timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("html").getAttribute("lang"), "ka");
      assert.equal(
        await page.locator("canvas").count(),
        1,
        "The journey must share a single WebGL world",
      );
      await widthCheck(page, viewport);
      const scenes = [];
      for (let i = 0; i < 5; i++) {
        await chapter(page, i);
        assert.equal(
          await page.locator(".journey-page").getAttribute("data-chapter"),
          String(i),
        );
        const picture = await page.screenshot();
        const canvasFrame = await page.screenshot({
          style:
            ".journey-header,.journey-rail,.journey-timeline,.journey-footer{visibility:hidden!important}",
        });
        const pixels = await warmPixels(canvasFrame);
        assert.ok(
          pixels > 1800,
          "Empty scene at " + viewport.width + " chapter " + i + ": " + pixels,
        );
        scenes.push(pixels);
        await fs.writeFile(
          output +
            "/scene-" +
            viewport.width +
            "x" +
            viewport.height +
            "-" +
            i +
            ".png",
          picture,
        );
      }
      await chapter(page, 3);
      await page.waitForFunction(
        () =>
          Number(document.querySelector(".journey-world").dataset.cheesePull) >
          0.6,
      );
      await page
        .getByRole("button", { name: "ნაჭრის დაბრუნება", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document.querySelector(".journey-world").dataset.cheesePull === "0",
      );
      await page
        .getByRole("button", { name: "ყველის გაწელვა", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          Number(document.querySelector(".journey-world").dataset.cheesePull) >
          0.6,
      );
      const selector = page.locator("#moment-3 .journey-flavors");
      await selector
        .getByRole("radio", { name: "ოთხი ყველი", exact: true })
        .click();
      assert.equal(
        await selector
          .getByRole("radio", { name: "ოთხი ყველი", exact: true })
          .getAttribute("aria-checked"),
        "true",
      );
      await selector
        .getByRole("radio", { name: "ოთხი ყველი", exact: true })
        .press("ArrowRight");
      assert.equal(
        await selector
          .getByRole("radio", { name: "მარგარიტა", exact: true })
          .getAttribute("aria-checked"),
        "true",
      );
      await page
        .getByRole("button", { name: "ნაჭრების გაშლა", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("button", { name: "ნაჭრების შეკვრა", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page
        .getByRole("button", { name: "ეს ჩემი გემოა", exact: true })
        .click();
      const dialog = page.locator("dialog[open]");
      await dialog.waitFor();
      assert.match(
        await dialog.innerText(),
        /გადახდა და შეკვეთების მიღება ჯერ არ ჩართულა/,
      );
      await dialog.getByRole("radio", { name: "სოკო", exact: true }).click();
      assert.equal(await dialog.locator("h3").innerText(), "სოკო");
      const more = dialog.getByRole("button", {
        name: "ერთით მეტი",
        exact: true,
      });
      for (let n = 1; n < 9; n++) await more.click();
      assert.ok(await more.isDisabled());
      assert.equal(await dialog.locator("output").innerText(), "9");
      const less = dialog.getByRole("button", {
        name: "ერთით ნაკლები",
        exact: true,
      });
      for (let n = 9; n > 1; n--) await less.click();
      assert.ok(await less.isDisabled());
      await page.screenshot({
        path:
          output +
          "/selection-" +
          viewport.width +
          "x" +
          viewport.height +
          ".png",
      });
      await page.keyboard.press("Escape");
      await page.locator("dialog").waitFor({ state: "detached" });
      await page
        .locator("header .journey-languages button")
        .filter({ hasText: "EN" })
        .click();
      assert.equal(await page.locator("html").getAttribute("lang"), "en");
      assert.equal(
        await page.locator("#moment-0 h2").innerText(),
        "Inside the flavor.",
      );
      await widthCheck(page, viewport);
      assert.doesNotMatch(
        await page.locator("body").innerText(),
        /\d+\s*(₾|GEL)/,
      );
      await page
        .locator("header .journey-languages button")
        .filter({ hasText: "GE" })
        .click();
      await page.locator(".timeline-stops button").nth(0).click();
      await page.waitForFunction(
        () => document.querySelector(".journey-page").dataset.chapter === "0",
      );
      await page.getByRole("button", { name: "შემოდი", exact: true }).click();
      await page.waitForFunction(
        () => document.querySelector(".journey-page").dataset.chapter === "1",
      );
      console.log(
        JSON.stringify({
          viewport,
          scenePixels: scenes,
          world: "passed",
          flavors: "passed",
          dialog: "passed",
          language: "passed",
          navigation: "passed",
        }),
      );
      await page.close();
    }
    const reduced = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await reduced.goto(origin, { waitUntil: "networkidle" });
    await reduced.locator(".journey-world[data-ready=true]").waitFor();
    await reduced.waitForTimeout(1000);
    const still = await reduced.screenshot();
    await reduced.waitForTimeout(500);
    assert.deepEqual(
      still,
      await reduced.screenshot(),
      "Reduced-motion rendering must be static",
    );
    await chapter(reduced, 3);
    const before = await reduced.screenshot();
    await reduced
      .getByRole("button", { name: "ნაჭრების გაშლა", exact: true })
      .click();
    await reduced.waitForTimeout(100);
    assert.notDeepEqual(
      before,
      await reduced.screenshot(),
      "Manual slice control must work in reduced motion",
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
    const photo = fallback.locator(".journey-fallback img");
    await photo.waitFor();
    assert.ok(
      await photo.evaluate((image) => image.complete && image.naturalWidth > 0),
    );
    await fallback
      .locator("#moment-3")
      .evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
    await fallback
      .locator("#moment-3 .journey-flavors")
      .getByRole("radio", { name: "მარგარიტა", exact: true })
      .click();
    assert.match(await photo.getAttribute("src"), /margherita/);
    await fallback.screenshot({ path: output + "/fallback-390.png" });
    await fallback.close();
    assert.deepEqual(errors, [], "Browser errors: " + errors.join("; "));
    console.log(
      "PASS: six viewports, five nonblank 3D chapters, shared WebGL scene, GE/EN, flavor selection, slice controls, quantity limits, dialogs, chapter navigation, reduced motion, and no-WebGL fallback. Screenshots: " +
        output,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
