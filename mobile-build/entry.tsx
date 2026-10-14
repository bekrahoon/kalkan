import { createRoot } from "react-dom/client";
import { usePathname } from "next/navigation";
import { LangProvider } from "@/components/LangProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Checker } from "@/components/Checker";
import { AboutContent } from "@/components/AboutContent";
import { SchemesContent } from "@/components/SchemesContent";
import { HelpContent } from "@/components/HelpContent";

function Page() {
  const path = usePathname();
  if (path === "/about") return <AboutContent />;
  if (path === "/schemes") return <SchemesContent />;
  if (path === "/help") return <HelpContent />;
  return <Checker />;
}

function App() {
  return (
    <LangProvider>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Page />
      </main>
      <SiteFooter />
    </LangProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
