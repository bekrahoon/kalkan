import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/oswald";
import "./globals.css";
import { LangProvider } from "@/components/LangProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CityBackdrop } from "@/components/CityBackdrop";

export const metadata: Metadata = {
  title: "Калкан — кто читает твои данные?",
  description:
    "ИИ-помощник, который простым языком объясняет, что сайт или приложение делает с твоими персональными данными. Русский и кыргызский.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0B0F1A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded bg-amber px-3 py-2 font-bold text-black focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Перейти к содержимому
        </a>
        <LangProvider>
          <CityBackdrop />
          <SiteHeader />
          <main id="main" className="relative z-[1] flex-1">
            {children}
          </main>
          <SiteFooter />
        </LangProvider>
      </body>
    </html>
  );
}
