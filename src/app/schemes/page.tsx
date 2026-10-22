import type { Metadata } from "next";
import { SchemesContent } from "@/components/pages/SchemesContent";

export const metadata: Metadata = { title: "Схемы мошенников — KalkanCheck" };

export default function SchemesPage() {
  return <SchemesContent />;
}
