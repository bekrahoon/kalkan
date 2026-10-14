/** Night-city silhouette behind every page. Seeded so server and client render the same SVG. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

interface Building {
  x: number;
  w: number;
  h: number;
  windows: { x: number; y: number; c: string; f: boolean }[];
  antenna: boolean;
}

function makeSkyline(seed: number, minH: number, maxH: number, litChance: number): Building[] {
  const r = rng(seed);
  const out: Building[] = [];
  let x = -20;
  while (x < 1460) {
    const w = 40 + Math.floor(r() * 70);
    const h = minH + Math.floor(r() * (maxH - minH));
    const windows: Building["windows"] = [];
    for (let wy = 400 - h + 14; wy < 392; wy += 14) {
      for (let wx = x + 7; wx < x + w - 9; wx += 11) {
        if (r() < litChance) {
          const pick = r();
          windows.push({ x: wx, y: wy, c: pick < 0.7 ? "#FFB627" : pick < 0.93 ? "#00E5D4" : "#E9EEF8", f: r() < 0.06 });
        }
      }
    }
    out.push({ x, w, h, windows, antenna: r() < 0.25 });
    x += w + Math.floor(r() * 6);
  }
  return out;
}

const FAR = makeSkyline(7, 120, 300, 0.05);
const NEAR = makeSkyline(42, 60, 210, 0.09);

export function CityBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* sky glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 75% 0%, rgba(0,229,212,0.10), transparent 70%), radial-gradient(ellipse 60% 40% at 10% 100%, rgba(255,182,39,0.07), transparent 70%)",
        }}
      />
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 left-0 h-[42vh] min-h-[220px] w-full opacity-90"
      >
        <defs>
          <linearGradient id="city-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0B0F1A" stopOpacity="0" />
            <stop offset="1" stopColor="#0B0F1A" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <g fill="#141c30">
          {FAR.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={400 - b.h} width={b.w} height={b.h} />
              {b.antenna && <rect x={b.x + b.w / 2 - 1} y={400 - b.h - 26} width={2} height={26} />}
            </g>
          ))}
        </g>
        <g opacity="0.55">
          {FAR.flatMap((b) => b.windows).map((w, i) => (
            <rect key={i} x={w.x} y={w.y} width={4} height={6} fill={w.c} className={w.f ? "window-flicker" : undefined} />
          ))}
        </g>
        <g fill="#05070d">
          {NEAR.map((b, i) => (
            <rect key={i} x={b.x} y={400 - b.h} width={b.w} height={b.h} />
          ))}
        </g>
        <g opacity="0.8">
          {NEAR.flatMap((b) => b.windows).map((w, i) => (
            <rect key={i} x={w.x} y={w.y} width={5} height={7} fill={w.c} className={w.f ? "window-flicker" : undefined} />
          ))}
        </g>
        <rect x="0" y="0" width="1440" height="400" fill="url(#city-fade)" />
      </svg>
    </div>
  );
}
