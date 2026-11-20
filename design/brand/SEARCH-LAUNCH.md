# 90pizza search launch

Planned opening: **15 December 2026**. Tbilisi, delivery only; no public storefront or pickup. Wolt and Glovo are planned, but do not link to a generic storefront or advertise availability until the 90pizza listings are live. Do not publish a kitchen address, hours, phone number, or unconfirmed social profile. Replace illustrative product images with real launch photos when available.

## Search focus

- Brand: `90pizza`, `90პიცა`, `90pizza მენიუ`.
- Product: `ოთხკუთხედი პიცა`, `თხელი პიცა`, `პეპერონის პიცა`.
- Local intent: `პიცის მიტანა თბილისში`, `პიცის გამოძახება თბილისში`. Confirm actual delivery areas before targeting specific neighborhoods. These are query themes, not verified search-volume or ranking claims.
- Use the real menu, product format, and opening information on the two pages. Avoid near-duplicate neighborhood pages or claims like "best pizza".

## Search Console

1. Sign in with the brand's Google account. Use the existing `90pizza.ge` Domain property if present; otherwise add it.
2. Add only the exact TXT value Google provides to Vercel DNS at the domain apex. Keep existing DNS records untouched. For a URL-prefix property only, `GOOGLE_SITE_VERIFICATION` can hold the HTML meta tag's `content` value (not the entire tag); it requires a new build.
3. Verify ownership in Search Console, submit `https://www.90pizza.ge/sitemap.xml`, then run URL Inspection against `/` and `/en`. Request indexing after the live test succeeds. Submission and verification do not guarantee indexing or placement.
4. In Performance, filter to Georgia. Track impressions, clicks and average position for brand vs. non-brand searches, plus Indexed pages and Core Web Vitals. Start checking weekly after launch rather than inferring rankings from `site:` searches.

## Business Profile

1. Find and claim an existing profile before creating one. Use the real brand name `90pizza`; do not add search terms to it.
2. For a delivery-only food brand, keep the address hidden, use the real delivery service areas, and have distinct branded packaging and this website. Do not set up a walk-in or pickup listing. Use Google's available pizza delivery category that best describes the business.
3. Add the future opening date. Complete Google's offered verification with an authorized operator. If Google requests a video, film the real kitchen, packaging, and management access in one take using the Business Profile flow.
4. After approval, keep order links and delivery areas consistent on the site, in the Business Profile, and with the partners. Add approved brand and product photos; never fabricate reviews.

Sources: [localized pages](https://developers.google.com/search/docs/specialty/international/localized-versions), [Search Console ownership](https://support.google.com/webmasters/answer/9008080), [URL Inspection](https://support.google.com/webmasters/answer/9012289), [delivery-only eligibility](https://support.google.com/business/answer/3038177), [future opening dates](https://support.google.com/business/answer/9174409), [local ranking](https://support.google.com/business/answer/7091).
