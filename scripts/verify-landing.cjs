const { chromium } = require("playwright");
const sharp = require("sharp");
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");

const origin = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const output =
  process.env.REVIEW_OUTPUT || "/private/tmp/90pizza-appetite-review";
const viewports = [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 320, height: 740 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
].filter(
  (viewport) =>
    !process.env.VIEWPORT ||
    process.env.VIEWPORT === `${viewport.width}x${viewport.height}`,
);

async function geometryCheck(page, viewport) {
  const result = await page.evaluate(() => ({
    overflow: document.body.scrollWidth > document.documentElement.clientWidth,
    clipped: [
      ...document.querySelectorAll(
        "h1,h2,h3,.action-button,.flavor-filters button",
      ),
    ]
      .filter((n) => n.clientWidth && n.scrollWidth > n.clientWidth + 2)
      .map((n) => n.textContent),
  }));
  assert.equal(
    result.overflow,
    false,
    "Horizontal overflow: " + JSON.stringify(viewport),
  );
  assert.deepEqual(
    result.clipped,
    [],
    "Clipped text: " + JSON.stringify(viewport),
  );
}
async function jump(page, selector) {
  await page
    .locator(selector)
    .evaluate((node) =>
      node.scrollIntoView({ behavior: "instant", block: "start" }),
    );
  await page.waitForTimeout(750);
}
async function coloredPixels(buffer) {
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let red = 0,
    warm = 0,
    redMinX = info.width,
    redMaxX = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (
      data[i] > 100 &&
      data[i] > data[i + 1] * 1.7 &&
      data[i] > data[i + 2] * 1.7
    ) {
      red++;
      const x = (i / info.channels) % info.width;
      redMinX = Math.min(redMinX, x);
      redMaxX = Math.max(redMaxX, x);
    }
    if (
      data[i] > 100 &&
      data[i] > data[i + 1] * 1.15 &&
      data[i + 1] > data[i + 2] * 1.2
    )
      warm++;
  }
  return { red, warm, redMinX, redMaxX, width: info.width };
}
async function screenshot(page, name) {
  return page.screenshot({ path: `${output}/${name}.png` });
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
    for (const viewport of viewports) {
      const tag = viewport.width + "x" + viewport.height;
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
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("html").getAttribute("lang"), "ka");
      await geometryCheck(page, viewport);
      assert.ok(
        await page
          .locator(".spec-strip")
          .evaluate((n) => n.getBoundingClientRect().top < innerHeight),
        "Next section missing from first viewport",
      );
      const heroVideo = page.locator(".hero-film video");
      await page.locator(".hero-film[data-ready=true]").waitFor();
      await page.waitForTimeout(800);
      if (!(await heroVideo.evaluate((v) => v.paused))) {
        await page
          .getByRole("button", { name: "ვიდეოს შეჩერება", exact: true })
          .click();
      }
      const filmEnded = await heroVideo.evaluate((v) => v.ended);
      await page
        .getByRole("button", {
          name: filmEnded ? "ვიდეოს თავიდან ჩართვა" : "ვიდეოს ჩართვა",
          exact: true,
        })
        .click();
      const beforeTime = await heroVideo.evaluate((v) => v.currentTime);
      await page.waitForFunction(
        (time) =>
          document.querySelector(".hero-film video").currentTime > time + 0.2,
        beforeTime,
      );
      await page
        .getByRole("button", { name: "ვიდეოს შეჩერება", exact: true })
        .click();
      assert.equal(await heroVideo.evaluate((v) => v.paused), true);
      await page
        .getByRole("button", { name: "ხმის ჩართვა", exact: true })
        .click();
      assert.equal(await heroVideo.evaluate((v) => v.muted), false);
      await page
        .getByRole("button", { name: "ხმის გამორთვა", exact: true })
        .click();
      const hero = await screenshot(page, "hero-" + tag);
      assert.ok(
        (await coloredPixels(hero)).warm > 5000,
        "Food missing from hero: " + tag,
      );

      await jump(page, "#format");
      await screenshot(page, "format-" + tag);
      assert.equal(await page.locator(".nine-grid span").count(), 9);
      await page.locator(".bite-chapter").evaluate((n) => {
        const start = n.getBoundingClientRect().top + scrollY - 76;
        scrollTo({
          top: start + (n.offsetHeight - innerHeight + 76) * 0.6,
          behavior: "instant",
        });
      });
      await page.waitForFunction(
        () => document.querySelector(".bite-sticky video").currentTime > 1.5,
      );
      await screenshot(page, "bite-" + tag);
      const slider = page.getByRole("slider", { name: "ნაჭრის აწევა" });
      await slider.focus();
      await slider.press("End");
      await page.waitForFunction(
        () => document.querySelector(".bite-sticky video").currentTime > 4.5,
      );
      await slider.press("Home");
      await page.waitForFunction(
        () => document.querySelector(".bite-sticky video").currentTime < 0.1,
      );

      await jump(page, "#menu");
      assert.equal(await page.locator(".flavor-item").count(), 6);
      const sources = await page
        .locator(".flavor-photo img")
        .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("src")));
      assert.equal(new Set(sources).size, 6, "Menu images must be unique");
      assert.equal(
        await page.getByText(/\d+\s*₾/).count(),
        0,
        "Prices must not appear",
      );
      await page.getByRole("button", { name: "ხორცით", exact: true }).click();
      assert.equal(await page.locator(".flavor-item").count(), 2);
      await page.getByRole("button", { name: "უხორცო", exact: true }).click();
      assert.equal(await page.locator(".flavor-item").count(), 4);
      await page.getByRole("button", { name: "ყველა", exact: true }).click();
      await screenshot(page, "menu-" + tag);
      await page
        .getByRole("button", { name: "გემოს ნახვა: პეპერონი", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor({ state: "visible" });
      assert.equal(
        await dialog
          .getByRole("button", { name: "რაოდენობის შემცირება", exact: true })
          .isDisabled(),
        true,
      );
      for (let i = 0; i < 8; i++)
        await dialog
          .getByRole("button", { name: "რაოდენობის გაზრდა", exact: true })
          .click();
      assert.equal(
        await dialog
          .getByRole("button", { name: "რაოდენობის გაზრდა", exact: true })
          .isDisabled(),
        true,
      );
      await dialog
        .getByRole("button", { name: "ეს ჩემი გემოა", exact: true })
        .click();
      assert.equal(
        await dialog.locator("[role=status]").textContent(),
        "შენახულია შენი არჩევანი. შეკვეთები მალე გაიხსნება.",
      );
      await screenshot(page, "dialog-" + tag);
      await dialog
        .getByRole("button", { name: "შემდეგი გემო", exact: true })
        .click();
      assert.equal(
        await dialog.getByRole("heading").textContent(),
        "მარგარიტა",
      );
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert.equal(
        await page.locator("body").evaluate((n) => n.style.overflow),
        "",
      );

      await page
        .locator(".site-header .language-switch")
        .getByRole("button", { name: "EN", exact: true })
        .click();
      assert.equal(await page.locator("html").getAttribute("lang"), "en");
      assert.equal(
        await page.locator("#menu-title").textContent(),
        "The choice is always yours.",
      );
      await page
        .getByRole("button", {
          name: "Explore flavor: Four Cheese",
          exact: true,
        })
        .click();
      assert.equal(
        await dialog.getByRole("heading").textContent(),
        "Four Cheese",
      );
      await dialog.getByRole("button", { name: "Close", exact: true }).click();
      await page
        .locator(".site-header .language-switch")
        .getByRole("button", { name: "GE", exact: true })
        .click();
      if (viewport.width <= 900) {
        await page
          .getByRole("button", { name: "ნავიგაციის გახსნა", exact: true })
          .click();
        assert.equal(
          await page.locator("#mobile-navigation").isVisible(),
          true,
        );
        await page
          .locator("#mobile-navigation")
          .getByRole("link", { name: "მიტანა", exact: true })
          .click();
        assert.equal(
          await page.locator("#mobile-navigation").isVisible(),
          false,
        );
      }
      await jump(page, "#delivery");
      await page
        .locator(".delivery-box[data-ready=true]")
        .waitFor({ timeout: 20000 });
      await page
        .locator(".delivery-box")
        .evaluate((n) =>
          n.scrollIntoView({ block: "center", behavior: "instant" }),
        );
      await page.waitForTimeout(650);
      const bounds = await page.locator(".delivery-box canvas").boundingBox();
      const visibleClip = (bounds) => ({
        x: Math.max(0, bounds.x),
        y: Math.max(0, bounds.y),
        width:
          Math.min(bounds.x + bounds.width, viewport.width) -
          Math.max(0, bounds.x),
        height:
          Math.min(bounds.y + bounds.height, viewport.height) -
          Math.max(0, bounds.y),
      });
      const before = await page.screenshot({
        clip: visibleClip(bounds),
        style:
          ".site-header,.box-turn,.delivery-format{visibility:hidden!important}",
      });
      assert.ok(
        (await coloredPixels(before)).red > 2000,
        "Blank delivery canvas: " + tag,
      );
      await page
        .getByRole("button", { name: "ყუთის მობრუნება", exact: true })
        .click();
      await page.waitForTimeout(800);
      const after = await page.screenshot({
        clip: visibleClip(
          await page.locator(".delivery-box canvas").boundingBox(),
        ),
        style:
          ".site-header,.box-turn,.delivery-format{visibility:hidden!important}",
      });
      const framePixels = await coloredPixels(after);
      await fs.writeFile(`${output}/box-pixels-${tag}.png`, after);
      assert.ok(
        framePixels.redMinX > 5 && framePixels.redMaxX < framePixels.width - 5,
        "Box clipped horizontally: " + tag + " " + JSON.stringify(framePixels),
      );
      assert.notEqual(
        before.toString("base64"),
        after.toString("base64"),
        "Box is not interactive",
      );
      await screenshot(page, "delivery-" + tag);
      await geometryCheck(page, viewport);
      console.log(
        "PASS",
        tag,
        "film, scroll, six flavors, filters, dialog, language, 3D box",
      );
      await page.close();
    }

    const reduced = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await reduced.goto(origin, { waitUntil: "networkidle" });
    assert.equal(
      await reduced.locator(".hero-film video").evaluate((v) => v.paused),
      true,
    );
    await jump(reduced, "#bite");
    assert.equal(
      await reduced.locator(".bite-sticky video").getAttribute("src"),
      null,
    );
    await screenshot(reduced, "reduced-motion");
    await reduced.close();

    const fallback = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await fallback.route("**/media/*.mp4", (route) => route.abort());
    await fallback.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (
          type === "webgl" ||
          type === "webgl2" ||
          type === "experimental-webgl"
        )
          return null;
        return getContext.call(this, type, ...args);
      };
    });
    await fallback.goto(origin, { waitUntil: "networkidle" });
    assert.equal(
      await fallback
        .locator(".hero-film .film-poster")
        .evaluate((n) => n.complete && n.naturalWidth > 0),
      true,
    );
    await screenshot(fallback, "media-fallback");
    await jump(fallback, "#delivery");
    await fallback.locator(".delivery-box[data-failed=true]").waitFor();
    assert.equal(await fallback.locator(".box-fallback").isVisible(), true);
    await screenshot(fallback, "webgl-fallback");
    await fallback.close();
    assert.deepEqual(errors, [], "Browser errors");
    console.log(
      "PASS reduced motion, video fallback, WebGL fallback. Screenshots:",
      output,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
