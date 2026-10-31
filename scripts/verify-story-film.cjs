const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit, devices } = require('playwright');

const base = process.argv[2] || 'http://localhost:3108';
const output = '/private/tmp/90pizza-film-qa';
fs.mkdirSync(output, { recursive: true });

async function run(name, engine, options) {
  const browser = await engine.launch({ headless: true, ...(engine === chromium ? { channel: 'chrome' } : {}) });
  const errors = [];
  try {
    const page = await browser.newPage(options);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('.dt-film video')?.readyState >= 2, { timeout: 45000 });
    assert.equal(await page.locator('html').getAttribute('lang'), 'ka');
    await page.waitForTimeout(3200);
    const opening = await page.locator('.dt-film video').evaluate(v => v.currentTime);
    await page.evaluate(() => window.scrollTo({ top: 10, behavior: 'instant' }));
    await page.waitForTimeout(200);
    assert.ok(await page.locator('.dt-film video').evaluate(v => v.currentTime) >= opening - 0.1);
    await page.screenshot({ path: `${output}/${name}-hero.png` });
    const source = await page.locator('.dt-film video').getAttribute('src');
    const dimensions = await page.locator('.dt-film video').evaluate(video => [video.videoWidth, video.videoHeight]);
    assert.ok(dimensions[0] >= 960);
    await page.locator('.dt-header .dt-language button').filter({ hasText: 'EN' }).click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.locator('.dt-header .dt-language button').filter({ hasText: 'GE' }).click();
    const seek = async p => {
      await page.evaluate(p => {
        const story = document.querySelector('.dt-story');
        window.scrollTo({ top: story.offsetTop + (story.offsetHeight - innerHeight) * p, behavior: 'instant' });
      }, p);
      await page.waitForFunction(p => {
        const video = document.querySelector('.dt-film video');
        return !video.seeking && Math.abs(video.currentTime - p * (video.duration - 1 / 24)) < 0.25;
      }, p, { timeout: 15000 });
    };
    for (const p of [0.15, 0.28, 0.42, 0.6, 0.75, 0.92, 1, 0.48]) await seek(p);
    await page.waitForTimeout(650);
    await page.screenshot({ path: `${output}/${name}-oven.png` });
    await page.locator('.dt-scene-tools button[aria-pressed]').click();
    const frozen = await page.locator('.dt-film video').evaluate(v => v.currentTime);
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'instant' }));
    await page.waitForTimeout(400);
    assert.equal(await page.locator('.dt-film video').evaluate(v => v.currentTime), frozen);
    await page.locator('.dt-scene-tools button[aria-pressed]').click();
    await seek(0.7);
    await page.locator('.dt-scene-tools button').first().click();
    await page.waitForTimeout(800);
    assert.ok(await page.locator('.dt-film video').evaluate(v => v.currentTime < 3));
    assert.ok(await page.evaluate(() => scrollY < 2));
    await page.locator('#flavors').scrollIntoViewIfNeeded();
    await page.locator('.dt-flavor-row').nth(2).click();
    assert.equal(await page.locator('.dt-flavor-row').nth(2).getAttribute('aria-pressed'), 'true');
    await page.locator('.dt-choose').click();
    await page.waitForFunction(() => document.querySelector('dialog')?.open);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('dialog')?.open);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, `Horizontal overflow ${overflow}`);
    assert.deepEqual(errors, []);
    const result = { name, passed: true, source, dimensions, overflow, errors };
    console.log(JSON.stringify(result));
    return result;
  } finally { await browser.close(); }
}

(async () => {
  const results = [];
  results.push(await run('desktop', chromium, { viewport: { width: 1440, height: 900 } }));
  results.push(await run('iphone', webkit, devices['iPhone 13']));
  results.push(await run('small-mobile', chromium, { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true }));
  results.push(await run('landscape', webkit, { ...devices['iPhone 13'], viewport: { width: 844, height: 390 } }));
  fs.writeFileSync(`${output}/results.json`, JSON.stringify({ base, results }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
