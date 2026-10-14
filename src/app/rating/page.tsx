import type { Metadata } from "next";
import { RatingContent } from "@/components/RatingContent";

export const metadata: Metadata = { title: "Рейтинг сервисов — Калкан" };

export default function RatingPage() {
  return <RatingContent />;
}
