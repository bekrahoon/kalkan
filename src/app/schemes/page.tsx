import type { Metadata } from "next";
import { SchemesContent } from "@/components/SchemesContent";

export const metadata: Metadata = { title: "Схемы мошенников — KalkanCheck" };

export default function SchemesPage() {
  return <SchemesContent />;
}
