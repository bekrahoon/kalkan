"use client";

import { useEffect } from "react";
import { ShieldLogo } from "@/components/ui/ShieldLogo";

/** Android shares put the link in `url` or inside `text` ("Look at this https://…"). */
function extractUrl(params: URLSearchParams): string | null {
  for (const v of [params.get("url"), params.get("text"), params.get("title")]) {
    const m = v?.match(/https?:\/\/[^\s"'<>]+/i);
    if (m) return m[0].replace(/[).,;!?»]+$/, "");
  }
  return null;
}

export function ShareRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = extractUrl(params);
    const text = (params.get("text") || "").trim();
    // A bare link is checked as a link; anything longer (a forwarded message) as a message.
    const onlyUrl = url && (!text || text === url || text.replace(url, "").trim().length < 3);
    const target = onlyUrl ? `/?check=${encodeURIComponent(url!)}` : text ? `/?text=${encodeURIComponent(text.slice(0, 6000))}` : url ? `/?check=${encodeURIComponent(url)}` : "/";
    window.location.replace(target);
  }, []);

  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <ShieldLogo size={56} animated />
    </div>
  );
}
