import type { Metadata } from "next";
import { LegalContent } from "@/components/LegalContent";

export const metadata: Metadata = { title: "Политика конфиденциальности — Калкан" };

export default function PrivacyPage() {
  return <LegalContent doc="privacy" />;
}
