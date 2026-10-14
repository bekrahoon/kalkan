import type { Metadata } from "next";
import { BusinessContent } from "@/components/BusinessContent";

export const metadata: Metadata = { title: "Для бизнеса — Калкан" };

export default function BusinessPage() {
  return <BusinessContent />;
}
