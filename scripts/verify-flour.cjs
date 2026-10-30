const assert = require("node:assert/strict");
const sharp = require("sharp");

module.exports = async function flourCheck(browser, url, output, width) {
  const context = await browser.newContext({
    viewport: { width, height: width > 700 ? 1000 : 844 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let releasePhoto;
  const photoGate = new Promise((resolve) => {
    releasePhoto = resolve;
  });
  await page.route("**/images/square-drop/pepperoni.webp", async (route) => {
    await photoGate;
    await route.continue();
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page
    .locator('.xp-stage[data-ready="true"][data-product="dough"]')
    .waitFor();
  assert.equal(
    await page.locator(".xp-stage").getAttribute("data-triangles"),
    null,
    "The opening must work before the pizza photo loads",
  );
  releasePhoto();
  const stage = page.locator(".xp-stage");
  const bounds = await stage.boundingBox();
  assert.equal(Math.round(bounds.width), width);
  assert.equal(Math.round(bounds.height), width > 700 ? 1000 : 844);
  const replay = page.getByRole("button", {
    name: "ფქვილის ხელახლა დაყრა",
    exact: true,
  });
  await replay.click();
  await page.waitForFunction(
    () => +document.querySelector(".xp-stage").dataset.intro > 1.3,
  );
  assert.equal(await stage.getAttribute("data-flour"), "true");
  const first = await page.screenshot({
    path: `${output}/flour-falling-${width}.png`,
  });
  await page.waitForTimeout(450);
  const second = await page.screenshot();
  const a = await sharp(first)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const b = await sharp(second)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const sides = [0, 0];
  for (let y = Math.floor(a.info.height * 0.28); y < a.info.height * 0.7; y++) {
    for (let x = 0; x < a.info.width; x++) {
      if (x > width * 0.2 && x < width * 0.8) continue;
      const i = (y * width + x) * 4;
      if (Math.abs(a.data[i] - b.data[i]) > 35) sides[x < width / 2 ? 0 : 1]++;
    }
  }
  assert(
    sides.every((pixels) => pixels > 40),
    `Flour must fall on both sides of the screen: ${sides}`,
  );
  await page.waitForFunction(
    () => +document.querySelector(".xp-stage").dataset.intro >= 5.9,
  );
  assert.equal(await stage.getAttribute("data-flour"), "false");
  assert.equal(await stage.getAttribute("data-product"), "dough");
  await page.screenshot({ path: `${output}/flour-settled-${width}.png` });
  await replay.click();
  await page.waitForFunction(
    () => +document.querySelector(".xp-stage").dataset.intro < 2,
  );
  await page
    .locator(".xp-header")
    .getByRole("button", { name: "EN", exact: true })
    .click();
  assert.match(
    await page.locator(".xp-opening h2").textContent(),
    /It all begins/,
  );
  await page
    .getByRole("button", { name: "Let's make it", exact: true })
    .click();
  await page.locator('.xp-stage[data-phase="dough"]').waitFor();
  assert.equal(await stage.getAttribute("data-flour"), "false");
  assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  assert.deepEqual(errors, []);
  console.log(
    `PASS flour ${width}: full-screen motion ${sides}, texture-independent opening, replay, skip and EN`,
  );
  await context.close();
};
