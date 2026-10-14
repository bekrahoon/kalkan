import type { Metadata } from "next";
import { GuidesContent } from "@/components/GuidesContent";

export const metadata: Metadata = { title: "Как защитить данные — Калкан" };

export default function GuidesPage() {
  return <GuidesContent />;
}
