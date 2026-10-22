import { createRoot } from "react-dom/client";
import { usePathname } from "next/navigation";
import { LangProvider } from "../../src/components/providers/LangProvider";
import { SiteHeader } from "../../src/components/layout/SiteHeader";
import { SiteFooter } from "../../src/components/layout/SiteFooter";
import { Checker } from "../../src/components/checker/Checker";
import { AboutContent } from "../../src/components/pages/AboutContent";
import { SchemesContent } from "../../src/components/pages/SchemesContent";
import { HelpContent } from "../../src/components/pages/HelpContent";
import { LegalContent } from "../../src/components/pages/LegalContent";
import { ConsentModal } from "../../src/components/layout/Consent";

function Page() {
  const path = usePathname();
  if (path === "/about") return <AboutContent />;
  if (path === "/schemes") return <SchemesContent />;
  if (path === "/help") return <HelpContent />;
  if (path === "/privacy") return <LegalContent doc="privacy" />;
  if (path === "/terms") return <LegalContent doc="terms" />;
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
      <ConsentModal />
    </LangProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
