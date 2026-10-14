/** Project symbol: a shield of connected data nodes covering a person. Colors follow the theme. */
const OUTER: [number, number][] = [
  [50, 6],
  [88, 18],
  [86, 60],
  [50, 110],
  [14, 60],
  [12, 18],
];

export function ShieldLogo({
  size = 36,
  animated = false,
  className = "",
  title,
}: {
  size?: number;
  animated?: boolean;
  className?: string;
  title?: string;
}) {
  const outline = OUTER.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <svg
      viewBox="0 0 100 116"
      width={size}
      height={size * 1.16}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <polygon
        points={outline}
        fill="var(--primary-soft)"
        stroke="var(--primary)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <g fill="var(--primary)">
        <circle cx="50" cy="48" r="11" />
        <path d="M30 88 C32 72 40 65 50 65 C60 65 68 72 70 88 Z" />
      </g>
      <g fill="var(--surface)" stroke="var(--primary)" strokeWidth="3" className={animated ? "pulse-soft" : undefined}>
        {OUTER.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" />
        ))}
      </g>
    </svg>
  );
}
