import BrandExperience from "@/components/brand/BrandExperience";
import { BrandStructuredData, brandMetadata } from "@/components/brand/seo";

export const metadata = brandMetadata("ge");

export default function Home() {
  return <><BrandStructuredData language="ge" /><BrandExperience language="ge" /></>;
}
