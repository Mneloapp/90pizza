import type { MetadataRoute } from "next";
import { shouldIndex, siteUrl } from "@/components/brand/seo";

export default function robots(): MetadataRoute.Robots {
  // Let crawlers read noindex on archive and preview pages.
  return { rules: { userAgent: "*", allow: "/" }, ...(shouldIndex ? { sitemap: `${siteUrl}/sitemap.xml` } : {}) };
}
