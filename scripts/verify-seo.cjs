const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const sharp = require('sharp');

const base = process.env.QA_URL || 'http://127.0.0.1:3145';
const canonicalBase = 'https://www.90pizza.ge';
const preview = process.env.QA_EXPECT_NOINDEX === '1';
const url = (path) => new URL(path, base).href;

async function main() {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({ javaScriptEnabled: false });
    const titles = [];
    let logoPath;
    const alternates = { ka: `${canonicalBase}/`, en: `${canonicalBase}/en`, 'x-default': `${canonicalBase}/` };

    for (const [path, lang, date, location] of [
      ['/', 'ka', '15 დეკემბერი', 'თბილისში'],
      ['/en', 'en', 'December 15', 'Tbilisi'],
    ]) {
      const response = await page.goto(url(`${path}?seo=qa`), { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('html').getAttribute('lang'), lang);
      assert.match(await page.title(), new RegExp(location));
      titles.push(await page.title());
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('h1').textContent(), '90pizza');
      assert.equal(await page.locator('.bp-pizza h3').count(), 6);
      assert.equal(await page.locator('time[datetime="2026-12-15"]').textContent(), date);
      assert.deepEqual(await page.locator('.bp-delivery-partner strong').allTextContents(), ['Wolt', 'Glovo']);
      assert.equal(await page.locator('.bp-delivery-partner a').count(), 0);

      const head = page.locator('head');
      const canonical = `${canonicalBase}${path}`;
      assert.equal(new URL(await head.locator('link[rel=canonical]').getAttribute('href')).href, canonical);
      assert.deepEqual(await head.locator('link[rel=alternate][hreflang]').evaluateAll((links) =>
        Object.fromEntries(links.map((link) => [link.hreflang, link.href]))), alternates);
      assert.match(await head.locator('meta[name=description]').getAttribute('content'), new RegExp(location));
      assert.equal(new URL(await head.locator('meta[property="og:url"]').getAttribute('content')).href, canonical);
      assert.equal(await head.locator('meta[property="og:image"]').getAttribute('content'), `${canonicalBase}/images/brand/share.jpg`);
      assert.equal(await head.locator('meta[name="twitter:card"]').getAttribute('content'), 'summary_large_image');
      const robots = await head.locator('meta[name=robots]').getAttribute('content');
      assert.equal(/\bnoindex\b/.test(robots), preview);
      if (!preview) assert(!/\bnoindex\b/.test(response.headers()['x-robots-tag'] || ''));
      if (process.env.QA_GOOGLE_VERIFICATION) {
        assert.equal(await head.locator('meta[name=google-site-verification]').getAttribute('content'), process.env.QA_GOOGLE_VERIFICATION);
      }

      const markup = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
      assert.equal(markup['@context'], 'https://schema.org');
      const graph = Object.fromEntries(markup['@graph'].map((entity) => [entity['@type'], entity]));
      assert.equal(graph.Organization.name, '90pizza');
      const logo = new URL(graph.Organization.logo);
      assert.equal(logo.origin, canonicalBase);
      logoPath = logo.pathname;
      assert.equal(graph.WebSite.publisher['@id'], graph.Organization['@id']);
      assert.equal(graph.WebPage.isPartOf['@id'], graph.WebSite['@id']);
      assert.equal(graph.WebPage.url, canonical);
      assert.equal(graph.WebPage.inLanguage, lang);
      assert.equal(graph.LocalBusiness, undefined);
    }
    assert.equal(new Set(titles).size, 2);

    const robotsResponse = await page.request.get(url('/robots.txt'));
    assert.equal(robotsResponse.status(), 200);
    const robotsText = await robotsResponse.text();
    assert.match(robotsText, /Allow: \//);
    assert.equal(robotsText.includes(`Sitemap: ${canonicalBase}/sitemap.xml`), !preview);

    const sitemap = await page.request.get(url('/sitemap.xml'));
    assert.equal(sitemap.status(), 200);
    assert.match(sitemap.headers()['content-type'], /xml/);
    const sitemapUrls = await page.evaluate((xml) => {
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      return Array.from(doc.getElementsByTagName('loc'), (entry) => entry.textContent);
    }, await sitemap.text());
    assert.deepEqual(sitemapUrls, [alternates.ka, alternates.en]);

    const archive = await page.goto(url('/archive/cinematic'), { waitUntil: 'domcontentloaded' });
    assert.equal(archive.status(), 200);
    assert.match(await page.locator('meta[name=robots]').getAttribute('content'), /\bnoindex\b/);

    const missing = await page.request.get(url('/nonexistent-seo-check'));
    assert.equal(missing.status(), 404);
    const og = await page.request.get(url('/images/brand/share.jpg'));
    assert.equal(og.status(), 200);
    const { format, width, height } = await sharp(await og.body()).metadata();
    assert.deepEqual({ format, width, height }, { format: 'jpeg', width: 1200, height: 800 });
    const logo = await page.request.get(url(logoPath));
    assert.equal(logo.status(), 200);
    const icon = await sharp(await logo.body()).metadata();
    assert(icon.width >= 112 && icon.width === icon.height, 'Organization logo resolution');
    console.log(JSON.stringify({ tested: base, preview, titles, sitemapUrls, noJavaScript: true, archiveNoindex: true, missingPage404: true, shareImage: { format, width, height } }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
