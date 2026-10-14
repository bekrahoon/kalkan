import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { LangProvider } from "@/components/LangProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ConsentModal } from "@/components/Consent";

export const metadata: Metadata = {
  title: "Калкан — проверь, прежде чем нажать",
  description:
    "Проверка ссылок, сообщений, номеров и приложений на мошенничество за несколько секунд. Русский и кыргызский.",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Калкан", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#12161d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-primary px-3 py-2 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Перейти к содержимому
        </a>
        <LangProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <ConsentModal />
        </LangProvider>
      </body>
    </html>
  );
}
