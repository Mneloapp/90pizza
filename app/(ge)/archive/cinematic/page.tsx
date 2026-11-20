import DetourExperience from "@/components/detour/DetourExperience";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "90pizza | კინემატოგრაფიული არქივი",
  robots: { index: false, follow: true },
};

export default function CinematicArchive() {
  return <DetourExperience />;
}
