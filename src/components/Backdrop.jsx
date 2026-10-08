// Site-wide "night stage" background, drawn in code (no image assets): soft stage-light glows in brand pink,
// sky and violet, a faint stage-line dot grid, coloured star dust and a few twinkling sparkles. Purely
// decorative, behind everything, static when the visitor prefers reduced motion.
const SPARKLES = [
  [8, 16, 1.6, 'var(--color-brand)'], [24, 8, 1.1, 'var(--color-sky)'], [41, 22, 1.3, 'var(--color-lemon)'],
  [63, 11, 1.7, 'var(--color-brand)'], [79, 24, 1.2, 'var(--color-sky)'], [92, 9, 1.5, 'var(--color-lemon)'],
  [13, 61, 1.2, 'var(--color-sky)'], [46, 72, 1.5, 'var(--color-brand)'], [71, 57, 1.1, 'var(--color-lemon)'],
  [87, 78, 1.6, 'var(--color-brand)'], [29, 88, 1.3, 'var(--color-sky)'], [96, 45, 1.2, 'var(--color-brand)'],
];

export default function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="glow glow-pink" />
      <div className="glow glow-sky" />
      <div className="glow glow-violet" />
      <div className="dot-grid absolute inset-0" />
      <div className="stardust absolute inset-0" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        {SPARKLES.map(([x, y, r, color], i) => (
          <g key={i} className="twinkle" style={{ animationDelay: `${(i % 6) * 0.7}s` }} transform={`translate(${x * 14.4} ${y * 9})`}>
            <path d={`M0 ${-r * 4} L${r * 0.8} 0 L0 ${r * 4} L${-r * 0.8} 0 Z M${-r * 4} 0 L0 ${r * 0.8} L${r * 4} 0 L0 ${-r * 0.8} Z`} fill={color} opacity="0.75" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Two curved "stage light beams" for page headers (directory/analytics/contribute style). */
export function StageBeams({ className = '' }) {
  return (
    <svg aria-hidden="true" className={`pointer-events-none ${className}`} fill="none" viewBox="0 0 800 140" preserveAspectRatio="none">
      <defs>
        <linearGradient id="beam-a" x1="0" x2="800" y1="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-brand)" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="var(--color-brand)" stopOpacity="0.8" />
          <stop offset="1" stopColor="var(--color-sky)" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="beam-b" x1="0" x2="800" y1="80" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-sky)" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="var(--color-brand)" stopOpacity="0.6" />
          <stop offset="1" stopColor="var(--color-lemon)" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path d="M0 40C200 90 600 -10 800 40" stroke="url(#beam-a)" strokeDasharray="4 6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d="M0 80C260 20 540 120 800 70" stroke="url(#beam-b)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
