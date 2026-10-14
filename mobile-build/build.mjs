// Builds a single self-contained HTML page of Kalkan for phones (no server, demo examples only).
// Usage: node mobile-build/build.mjs  →  mobile-build/dist/kalkan.html
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dist = path.join(here, "dist");
mkdirSync(dist, { recursive: true });

// 1. JS bundle
const js = await build({
  entryPoints: [path.join(here, "entry.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  alias: {
    "@": path.join(root, "src"),
    "next/link": path.join(here, "shims/next-link.tsx"),
    "next/navigation": path.join(here, "shims/next-navigation.ts"),
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_KALKAN_STATIC": '"1"',
  },
  logLevel: "warning",
});
const jsText = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

// 2. Tailwind CSS
const cssOut = path.join(dist, "styles.css");
execFileSync(path.join(root, "node_modules/.bin/tailwindcss"), ["-i", path.join(here, "styles.css"), "-o", cssOut, "--minify"], {
  cwd: root,
  stdio: "inherit",
});
const css = readFileSync(cssOut, "utf8");

// 3. Fonts (Cyrillic incl. Kyrgyz ө ү ң + Latin) inlined as data URIs
function faces(pkg) {
  const dir = path.join(root, "node_modules/@fontsource-variable", pkg);
  const src = readFileSync(path.join(dir, "wght.css"), "utf8");
  return src
    .split("/*")
    .filter((b) => /\b(cyrillic-ext|cyrillic|latin)-wght-normal/.test(b) && !/latin-ext/.test(b))
    .map((b) => "/*" + b)
    .join("\n")
    .replace(/url\(\.\/files\/([^)]+)\)/g, (_, f) => {
      const data = readFileSync(path.join(dir, "files", f)).toString("base64");
      return `url(data:font/woff2;base64,${data})`;
    });
}
const fonts = faces("inter") + "\n" + faces("oswald");

const html = `<title>Калкан</title>
<meta name="description" content="ИИ-помощник: кто читает твои данные. Мобильная демо-версия.">
<style>
${fonts}
${css}
</style>
<div id="root" class="flex min-h-dvh flex-col"></div>
<script>
${jsText}
</script>
`;
writeFileSync(path.join(dist, "kalkan.html"), html);
console.log(`kalkan.html: ${(html.length / 1024).toFixed(0)} KB`);
