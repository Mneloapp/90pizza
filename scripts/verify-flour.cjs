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
  page.on("console", (message) => {
    if (message.type() === "error" && /shader|WebGL|THREE/.test(message.text()))
      errors.push(message.text());
  });
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
    name: "დასაწყისის გამეორება",
    exact: true,
  });
  await replay.click();
  await page.waitForFunction(
    () => +document.querySelector(".xp-stage").dataset.intro > 1.0,
  );
  assert.equal(await stage.getAttribute("data-flour"), "true");
  assert.equal(await stage.getAttribute("data-burst"), "expand");
  assert.equal(await page.locator(".xp-opening").getAttribute("inert"), "");
  const first = await page.screenshot({
    path: `${output}/flour-burst-${width}.png`,
  });
  await page.waitForFunction(
    () => +document.querySelector(".xp-stage").dataset.intro > 3.15,
  );
  assert.equal(await stage.getAttribute("data-burst"), "gather");
  const second = await page.screenshot({
    path: `${output}/flour-gather-${width}.png`,
  });
  const a = await sharp(first)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const b = await sharp(second)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mass = [0, 0];
  for (
    let y = Math.floor(a.info.height * 0.32);
    y < a.info.height * 0.73;
    y++
  ) {
    for (let x = 0; x < a.info.width; x++) {
      const i = (y * width + x) * 4;
      if (a.data[i] > 50) mass[0]++;
      if (b.data[i] > 50) mass[1]++;
    }
  }
  assert(
    mass[0] > 2500 && mass[1] < mass[0] * 0.85,
    `The expanded powder must visibly gather into the dough: ${mass}`,
  );
  await page.waitForFunction(
    () => +document.querySelector(".xp-stage").dataset.intro >= 5.9,
  );
  assert.equal(await stage.getAttribute("data-flour"), "false");
  assert.equal(await stage.getAttribute("data-product"), "dough");
  assert.equal(await stage.getAttribute("data-burst"), "settled");
  assert.equal(await page.locator(".xp-opening").getAttribute("inert"), null);
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
    /Big flavor/,
  );
  await page.getByRole("button", { name: "1. Dough", exact: true }).click();
  await page.locator('.xp-stage[data-phase="dough"]').waitFor();
  await page.locator('.xp-stage[data-flour="false"]').waitFor();
  assert.equal(await stage.getAttribute("data-flour"), "false");
  assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  assert.deepEqual(errors, []);
  console.log(
    `PASS burst ${width}: powder area ${mass}, texture-independent opening, replay, skip and EN`,
  );
  await context.close();
};
