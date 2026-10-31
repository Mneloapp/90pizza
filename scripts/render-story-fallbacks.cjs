const { chromium } = require("playwright");
const sharp = require("sharp");
const path = require("node:path");
const base = process.env.QA_URL || "http://127.0.0.1:3139";
(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  for (const [suffix, width, height] of [
    ["", 1440, 1000],
    ["-mobile", 390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForFunction(
      () => document.querySelector(".dt-canvas")?.dataset.slices === "9",
    );
    let chapter = 0;
    for (const p of [0, 0.245, 0.58, 0.73, 0.86, 0.997]) {
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
      const image = await page.locator(".dt-canvas canvas").screenshot({
        style:
          ".dt-header, .dt-stage > :not(.dt-canvas) { visibility: hidden !important; }",
      });
      await sharp(image)
        .resize({ width: suffix ? 390 : 1080 })
        .webp({ quality: 82 })
        .toFile(
          path.join(
            __dirname,
            `../public/images/detour/story-${chapter++}${suffix}.webp`,
          ),
        );
    }
    await page.close();
  }
  await browser.close();
  console.log("Six matched desktop/mobile fallback frames rendered.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
