import type { Metadata } from "next";
import { HelpContent } from "@/components/HelpContent";

export const metadata: Metadata = { title: "Если тебя обманули — KalkanCheck" };

export default function HelpPage() {
  return <HelpContent />;
}
