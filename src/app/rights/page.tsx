import type { Metadata } from "next";
import { RightsContent } from "@/components/RightsContent";

export const metadata: Metadata = { title: "Твои права — Калкан" };

export default function RightsPage() {
  return <RightsContent />;
}
