import type { Metadata } from "next";
import { copy, languagePaths, type Language } from "./content";

export const siteUrl = "https://www.90pizza.ge";
export const shouldIndex = process.env.VERCEL_ENV !== "preview" && process.env.SITE_NOINDEX !== "1";

export const alternates = {
  ka: `${siteUrl}/`,
  en: `${siteUrl}/en`,
  "x-default": `${siteUrl}/`,
};

export function canonical(language: Language) {
  return `${siteUrl}${languagePaths[language]}`;
}

export function brandMetadata(language: Language): Metadata {
  const { searchTitle, searchDescription, heroAlt } = copy[language];
  const image = { url: "/images/brand/share.jpg", width: 1200, height: 800, alt: heroAlt };
  return {
    title: searchTitle,
    description: searchDescription,
    alternates: { canonical: canonical(language), languages: alternates },
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
      ...(shouldIndex ? { "max-image-preview": "large" as const } : {}),
    },
    openGraph: {
      type: "website",
      siteName: "90pizza",
      title: searchTitle,
      description: searchDescription,
      url: canonical(language),
      locale: language === "ge" ? "ka_GE" : "en_US",
      alternateLocale: language === "ge" ? "en_US" : "ka_GE",
      images: [image],
    },
    twitter: { card: "summary_large_image", title: searchTitle, description: searchDescription, images: [image] },
  };
}

const organizationId = `${siteUrl}/#organization`;
const websiteId = `${siteUrl}/#website`;

export function BrandStructuredData({ language }: { language: Language }) {
  const url = canonical(language);
  const lang = language === "ge" ? "ka" : "en";
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "90pizza",
        alternateName: "90პიცა",
        url: `${siteUrl}/`,
        logo: `${siteUrl}/images/brand/apple-touch-icon.png`,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: "90pizza",
        alternateName: "90პიცა",
        url: `${siteUrl}/`,
        inLanguage: ["ka", "en"],
        publisher: { "@id": organizationId },
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: copy[language].searchTitle,
        description: copy[language].searchDescription,
        inLanguage: lang,
        isPartOf: { "@id": websiteId },
        about: { "@id": organizationId },
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
