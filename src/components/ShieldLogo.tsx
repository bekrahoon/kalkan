/** Project symbol: a shield woven from glowing data nodes, covering a person. */
const OUTER: [number, number][] = [
  [50, 5],
  [80, 13],
  [91, 20],
  [89, 58],
  [74, 90],
  [50, 113],
  [26, 90],
  [11, 58],
  [9, 20],
  [20, 13],
];
const INNER: [number, number][] = [
  [50, 22],
  [28, 32],
  [72, 32],
  [22, 66],
  [78, 66],
  [36, 96],
  [64, 96],
];
const EDGES: [number, number][] = [
  // outer node → inner node (indices: outer 0-9, inner 10-16)
  [0, 10], [1, 10], [9, 10], [1, 12], [2, 12], [9, 11], [8, 11],
  [3, 14], [2, 14], [7, 13], [8, 13], [4, 16], [3, 16], [6, 15], [7, 15], [5, 15], [5, 16],
  [10, 11], [10, 12], [11, 13], [12, 14], [13, 15], [14, 16], [15, 16],
];

export function ShieldLogo({
  size = 40,
  animated = false,
  className = "",
  title,
}: {
  size?: number;
  animated?: boolean;
  className?: string;
  title?: string;
}) {
  const pts = [...OUTER, ...INNER];
  const outline = OUTER.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <svg
      viewBox="0 0 100 118"
      width={size}
      height={size * 1.18}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <filter id="kalkan-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="kalkan-fill" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#00E5D4" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#00E5D4" stopOpacity="0.02" />
        </radialGradient>
      </defs>

      <polygon points={outline} fill="url(#kalkan-fill)" stroke="#000" strokeWidth="7" strokeLinejoin="round" />
      <g filter="url(#kalkan-glow)" stroke="#00E5D4" strokeLinecap="round">
        <polygon points={outline} fill="none" strokeWidth="2.6" strokeLinejoin="round" />
        <g strokeWidth="1" opacity="0.55">
          {EDGES.map(([a, b], i) => (
            <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} />
          ))}
        </g>
      </g>

      {/* the person being protected */}
      <g fill="#0B0F1A" stroke="#E9EEF8" strokeWidth="2.4">
        <circle cx="50" cy="52" r="10" />
        <path d="M31 88 C33 72 41 66 50 66 C59 66 67 72 69 88 Z" strokeLinejoin="round" />
      </g>

      <g fill="#00E5D4" className={animated ? "node-pulse" : undefined}>
        {pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i < OUTER.length ? 2.8 : 2.2}
            stroke="#000"
            strokeWidth="1"
            style={animated ? { animationDelay: `${(i % 5) * 0.4}s` } : undefined}
          />
        ))}
      </g>
    </svg>
  );
}
