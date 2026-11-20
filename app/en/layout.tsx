import type { ReactNode } from "react";
import BrandDocument from "../brand-document";

export { metadata, viewport } from "../brand-document";

export default function Layout({ children }: { children: ReactNode }) {
  return <BrandDocument lang="en">{children}</BrandDocument>;
}
