import type { Metadata } from "next";
import { AboutContent } from "@/components/pages/AboutContent";

export const metadata: Metadata = { title: "О проекте — KalkanCheck" };

export default function AboutPage() {
  return <AboutContent />;
}
