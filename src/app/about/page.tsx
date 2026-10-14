import type { Metadata } from "next";
import { AboutContent } from "@/components/AboutContent";

export const metadata: Metadata = { title: "О проекте — Калкан" };

export default function AboutPage() {
  return <AboutContent />;
}
