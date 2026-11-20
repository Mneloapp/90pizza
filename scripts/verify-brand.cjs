const { chromium, webkit } = require('playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const base = process.env.QA_URL || 'http://127.0.0.1:3145';
const out = process.env.QA_OUTPUT || '/private/tmp/90pizza-brand-qa';
const report = [];

async function layout(page, label) {
  const problems = await page.evaluate(() => {
    const errors = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) errors.push('horizontal-page-overflow');
    for (const el of document.querySelectorAll('.bp-root h1, .bp-root h2, .bp-root h3, .bp-root p, .bp-root button')) {
      const r = el.getBoundingClientRect();
      if (!r.width || getComputedStyle(el).display === 'none') continue;
      if (el.scrollWidth > el.clientWidth + 2) errors.push(`${el.tagName}: ${el.textContent.trim().slice(0, 45)}`);
    }
    return errors;
  });
  assert.deepEqual(problems, [], `${label}: overflowing text`);
}

async function check(type, name, viewport, options = {}) {
  const browser = await type.launch({ headless: true, ...(type === chromium ? { channel: 'chrome' } : {}) });
  let page;
  const errors = [];
  try {
    page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce', ...options });
    const requests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    page.on('request', r => requests.push(r.url()));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('html').getAttribute('lang'), 'ka');
    assert.equal(await page.locator('h1').innerText(), '90pizza');
    const opening = page.locator('.bp-hero-opening');
    assert.equal(await opening.locator('time').getAttribute('datetime'), '2026-12-15');
    assert.equal(await opening.getAttribute('href'), '#delivery');
    await page.locator('.bp-hero-image img').evaluate(img => img.decode());
    assert.equal(await page.locator('.bp-hero-image img').evaluate(el => getComputedStyle(el).animationName), 'none');
    assert.equal(await page.locator('.bp-reveal[data-reveal-state=pending]').count(), 0);
    const heroPixels = await sharp(await page.locator('.bp-hero').screenshot()).stats();
    assert(heroPixels.channels.some(c => c.stdev > 35), 'Hero image is blank');
    assert(await page.locator('.bp-spec-strip').evaluate(el => el.getBoundingClientRect().top < innerHeight - (innerWidth <= 700 ? 75 : 0)), 'No next-section hint in first viewport');
    const heroCopy = await page.locator('.bp-hero-copy').boundingBox();
    const heroAction = await page.locator('.bp-hero-action').boundingBox();
    const heroOpening = await opening.boundingBox();
    assert(heroCopy.y + heroCopy.height <= heroAction.y + 2, `${name}: hero text overlaps CTA`);
    assert(heroOpening.y + heroOpening.height <= heroCopy.y, `${name}: opening date overlaps headline`);
    await layout(page, `${name}-ge`);
    await page.screenshot({ path: `${out}/${name}-hero-ge.png` });
    await page.locator('.bp-hero-action').click();
    await page.locator('.bp-pizza-photo').first().waitFor({ state: 'visible' });
    assert.equal(await page.locator('.bp-pizza').count(), 6);
    assert.equal(new Set(await page.locator('.bp-pizza-photo img').evaluateAll(imgs => imgs.map(i => i.src))).size, 6);
    await page.locator('.bp-filters button').nth(1).click();
    await page.waitForFunction(() => document.querySelectorAll('.bp-pizza').length === 2);
    await page.locator('.bp-filters button').nth(2).click();
    await page.waitForFunction(() => document.querySelectorAll('.bp-pizza').length === 4);
    await page.locator('.bp-filters button').first().click();
    await page.waitForFunction(() => document.querySelectorAll('.bp-pizza').length === 6);

    for (let i = 0; i < 6; i++) {
      await page.locator('.bp-pizza-photo').nth(i).click();
      assert(await page.locator('.bp-dialog').evaluate(el => el.open));
      assert(await page.locator('#bp-dialog-title').innerText());
      assert(await page.locator('.bp-dialog-copy small').innerText());
      await page.locator('.bp-dialog-copy > .bp-action').click();
      assert(!(await page.locator('.bp-dialog').evaluate(el => el.open)));
      assert.notEqual(await page.locator('body').evaluate(el => el.style.overflow), 'hidden');
      assert.equal(await page.locator('.bp-picked').count(), 1);
    }
    await page.locator('#square').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.bp-nine-stage').getAttribute('data-split'), 'false', 'Reduced motion unexpectedly started the automatic slice animation');
    await page.locator('.bp-segmented button').last().click();
    await page.waitForFunction(() => document.querySelector('.bp-nine-stage').dataset.split === 'true');
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('.bp-slice')).transform).m41 < -10);
    const separated = await page.locator('.bp-slice').first().evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41);
    assert(separated < -10, 'Nine slices did not separate');
    assert.equal(await page.locator('.bp-slice').count(), 9);
    await page.screenshot({ path: `${out}/${name}-nine.png` });
    await page.locator('.bp-segmented button').first().click();
    await page.waitForFunction(() => document.querySelector('.bp-nine-stage').dataset.split === 'false');

    await page.locator('#delivery').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.bp-delivery-partner').count(), 2);
    assert.equal(await page.locator('.bp-delivery-pick strong').innerText(), 'ბოსტნეული');
    await page.locator('.bp-faq summary').last().click();
    assert(await page.locator('.bp-faq details').last().evaluate(el => el.open));
    await page.screenshot({ path: `${out}/${name}-delivery.png` });
    await page.getByRole('banner').getByRole('link', { name: 'EN', exact: true }).click();
    await page.waitForURL('**/en');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('.bp-delivery-pick strong').innerText(), 'Veggie');
    await layout(page, `${name}-en`);
    await page.locator('.bp-brand').click();
    await page.screenshot({ path: `${out}/${name}-hero-en.png` });
    if (viewport.width <= 700) {
      await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      assert.equal(await page.locator('#bp-mobile-nav a').count(), 3);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#bp-mobile-nav').count(), 0);
      await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      await page.locator('#bp-mobile-nav a').nth(1).click();
      assert.equal(await page.locator('#bp-mobile-nav').count(), 0);
    }
    await page.locator('.bp-pizza-photo').first().click();
    await page.keyboard.press('Escape');
    assert(!(await page.locator('.bp-dialog').evaluate(el => el.open)));
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.getByRole('banner').getByRole('link', { name: 'GE', exact: true }).click();
    await page.waitForURL(new URL('/', base).href);
    assert.equal(await page.locator('html').getAttribute('lang'), 'ka');
    await page.locator('.bp-picked').waitFor();
    assert.equal(await page.locator('.bp-delivery-pick strong').innerText(), 'ბოსტნეული');
    await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
    assert(!requests.some(url => /handless|\.mp4|\.glb/.test(url)), 'Rejected film assets are still loading');
    assert(!/₾/.test(await page.locator('.bp-root').innerText()), 'Unapproved prices returned');
    assert.deepEqual(errors, []);
    report.push({ name, viewport, status: 'passed', crawlableLanguagePages: true, openingDate: true, sixUniquePizzas: true, filters: [6, 2, 4], dialogsAndSelection: true, storagePersistence: true, nineSliceInteraction: true, mobileNavigation: viewport.width <= 700, noOverflow: true, noKnownErrors: true });
  } catch (error) {
    if (page) {
      await page.screenshot({ path: `${out}/${name}-failure.png` });
      await fs.writeFile(`${out}/${name}-failure.json`, JSON.stringify({ error: error.message, errors, dialog: await page.locator('.bp-dialog').evaluate(el => ({ open: el.open, scrollTop: el.scrollTop, height: el.clientHeight, contentHeight: el.scrollHeight, text: el.textContent, rect: el.getBoundingClientRect().toJSON() })) }, null, 2));
    }
    throw error;
  } finally { await browser.close(); }
}

async function normalMotion() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.bp-hero-copy h1').evaluate(el => getComputedStyle(el).animationName), 'bp-intro');
    assert.equal(await page.locator('.bp-hero-image img').evaluate(el => getComputedStyle(el).animationName), 'bp-product-arrive');
    await page.waitForFunction(() => document.querySelector('.bp-pizza-reveal').dataset.revealState === 'pending');
    await page.waitForFunction(() => document.querySelector('.bp-hero-copy h1').getAnimations().every(animation => animation.playState === 'finished'));
    await page.screenshot({ path: `${out}/normal-motion-hero.png` });
    await page.locator('.bp-hero-action').hover();
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('.bp-hero-action > svg')).transform).m41 > 1);
    await page.mouse.down();
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('.bp-hero-action')).transform).m11 < .995);
    await page.mouse.up();
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.mouse.move(1300, 350);
    await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('.bp-hero-image')).transform).m41) > 1);
    await page.evaluate(() => scrollTo({ top: scrollY + document.querySelector('#menu').getBoundingClientRect().top - 80, behavior: 'instant' }));
    await page.waitForFunction(() => {
      const element = document.querySelector('.bp-pizza-reveal');
      const opacity = Number(getComputedStyle(element).opacity);
      return element.dataset.revealState === 'shown' && opacity > 0 && opacity < 1;
    });
    const delays = await page.locator('.bp-pizza-reveal').evaluateAll(elements => elements.slice(0, 3).map(el => getComputedStyle(el).getPropertyValue('--bp-reveal-delay').trim()));
    assert.deepEqual(delays, ['0s', '.07s', '.14s']);
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.bp-pizza-reveal')).opacity) === 1);
    await page.screenshot({ path: `${out}/normal-motion-menu.png` });
    await page.locator('.bp-filters button').nth(1).click();
    await page.waitForFunction(() => document.querySelectorAll('.bp-pizza').length === 2);
    await page.locator('.bp-pizza-photo').first().click();
    await page.locator('.bp-action-red').click();
    assert.equal(await page.locator('.bp-picked').count(), 1);
    await page.locator('#square').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.bp-nine-stage').dataset.split === 'true');
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('.bp-slice')).transform).m41 < -12);
    await page.screenshot({ path: `${out}/normal-motion-auto-slices.png` });
    await page.locator('.bp-segmented button').first().click();
    await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('.bp-slice')).transform).m41) < .1);
    await page.locator('#menu').scrollIntoViewIfNeeded();
    await page.locator('#square').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.bp-nine-stage').getAttribute('data-split'), 'false', 'Automatic slices repeated after a manual choice');
    await layout(page, 'normal-motion');
    assert.deepEqual(errors, []);
    report.push({ name: 'normal-motion', heroEntrance: true, productApproach: true, staggeredScrollReveals: true, buttonArrowAndPress: true, pointerParallax: true, animatedFilters: true, pointerSelection: true, automaticSlicesOnce: true, manualSliceOverride: true, reversibleSpringSlices: true, status: 'passed' });
    await page.close();

    const noJs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    await noJs.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await noJs.locator('h1').innerText(), '90pizza');
    assert.equal(await noJs.locator('.bp-hero-copy').evaluate(el => getComputedStyle(el).opacity), '1');
    assert.equal(await noJs.locator('.bp-pizza').count(), 6);
    report.push({ name: 'initial-html', heroAndMenuVisibleWithoutJavaScript: true, status: 'passed' });
  } finally { await browser.close(); }
}

async function touchMotion() {
  const browser = await webkit.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.bp-hero-image img').evaluate(el => getComputedStyle(el).animationName), 'bp-product-arrive');
    await page.waitForFunction(() => document.querySelector('.bp-pizza-reveal').dataset.revealState === 'pending');
    await page.locator('.bp-hero-action').tap();
    await page.waitForFunction(() => document.querySelector('.bp-pizza-reveal').dataset.revealState === 'shown');
    const delays = await page.locator('.bp-pizza-reveal').evaluateAll(elements => elements.slice(0, 3).map(el => getComputedStyle(el).getPropertyValue('--bp-reveal-delay').trim()));
    assert.deepEqual(delays, ['0s', '.07s', '0s']);
    await page.locator('.bp-pizza-photo').first().tap();
    await page.locator('.bp-action-red').tap();
    assert.equal(await page.locator('.bp-picked').count(), 1);
    await page.locator('.bp-nine-stage').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.bp-nine-stage').dataset.split === 'true');
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('.bp-slice')).transform).m41 < -12);
    await page.screenshot({ path: `${out}/iphone-normal-motion-slices.png` });
    await page.locator('.bp-segmented button').first().tap();
    await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('.bp-slice')).transform).m41) < .1);
    await page.locator('#menu').scrollIntoViewIfNeeded();
    await page.locator('.bp-nine-stage').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.bp-nine-stage').getAttribute('data-split'), 'false');
    await layout(page, 'iphone-normal-motion');
    assert.deepEqual(errors, []);
    report.push({ name: 'iphone-normal-motion', touchSelection: true, responsiveStagger: true, heroEntrance: true, automaticSlicesOnce: true, manualOverride: true, status: 'passed' });
  } finally { await browser.close(); }
}

(async () => {
  await fs.mkdir(out, { recursive: true });
  const target = process.env.QA_TARGET;
  if (target === 'webkit') {
    await check(webkit, 'iphone-webkit', { width: 390, height: 844 }, { isMobile: true, hasTouch: true });
    await touchMotion();
  }
  else if (target === 'layout') {
    await check(chromium, 'small-phone', { width: 320, height: 568 }, { isMobile: true, hasTouch: true });
    await check(chromium, 'tablet', { width: 768, height: 1024 }, { isMobile: true, hasTouch: true });
    await check(chromium, 'landscape', { width: 844, height: 390 }, { isMobile: true, hasTouch: true });
    await check(chromium, 'wide', { width: 1920, height: 1080 });
  } else {
    await check(chromium, 'desktop', { width: 1440, height: 1000 });
    await check(chromium, 'mobile', { width: 390, height: 844 }, { isMobile: true, hasTouch: true });
    await normalMotion();
  }
  await fs.writeFile(`${out}/${target || 'chrome'}-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: 'passed', layouts: report.length, out }));
})().catch(e => { console.error(e); process.exit(1); });
