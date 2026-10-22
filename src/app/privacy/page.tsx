import type { Metadata } from "next";
import { LegalContent } from "@/components/pages/LegalContent";

export const metadata: Metadata = { title: "Политика конфиденциальности — KalkanCheck" };

export default function PrivacyPage() {
  return <LegalContent doc="privacy" />;
}
