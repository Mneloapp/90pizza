import BrandExperience from "@/components/brand/BrandExperience";
import { BrandStructuredData, brandMetadata } from "@/components/brand/seo";

export const metadata = brandMetadata("en");

export default function EnglishHome() {
  return <><BrandStructuredData language="en" /><BrandExperience language="en" /></>;
}
