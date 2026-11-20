import type { MetadataRoute } from "next";
import { canonical } from "@/components/brand/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return (["ge", "en"] as const).map((language) => ({ url: canonical(language) }));
}
