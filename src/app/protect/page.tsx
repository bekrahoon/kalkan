import type { Metadata } from "next";
import { ProtectContent } from "@/components/ProtectContent";

export const metadata: Metadata = { title: "Защита близких — KalkanCheck" };

export default function ProtectPage() {
  return <ProtectContent />;
}
