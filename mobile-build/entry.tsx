import { createRoot } from "react-dom/client";
import { usePathname } from "next/navigation";
import { LangProvider } from "@/components/LangProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Checker } from "@/components/Checker";
import { RightsContent } from "@/components/RightsContent";
import { AboutContent } from "@/components/AboutContent";
import { RatingContent } from "@/components/RatingContent";
import { GuidesContent } from "@/components/GuidesContent";

function Page() {
  const path = usePathname();
  if (path === "/rights") return <RightsContent />;
  if (path === "/about") return <AboutContent />;
  if (path === "/rating") return <RatingContent />;
  if (path === "/guides") return <GuidesContent />;
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
