import type { Metadata } from "next";
import { LegalContent } from "@/components/LegalContent";

export const metadata: Metadata = { title: "Пользовательское соглашение — KalkanCheck" };

export default function TermsPage() {
  return <LegalContent doc="terms" />;
}
