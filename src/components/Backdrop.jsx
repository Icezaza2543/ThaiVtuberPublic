// Site-wide decorative background, drawn in code (no image assets): drifting penlight aurora, a faint data
// dot-grid, flowing gradient wave lines and a few twinkles. Purely decorative, behind everything, static when
// the visitor prefers reduced motion.
const TWINKLES = [
  [8, 18, 1.6], [22, 9, 1.1], [37, 26, 1.3], [61, 12, 1.8], [78, 22, 1.2], [90, 8, 1.5],
  [14, 62, 1.2], [47, 71, 1.5], [70, 58, 1.1], [86, 77, 1.7], [30, 88, 1.3], [96, 46, 1.2],
];

export default function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="aurora aurora-c" />
      <div className="dot-grid absolute inset-0" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="wave-a" x1="0" x2="1">
            <stop offset="0" stopColor="#ff5fa2" stopOpacity="0" />
            <stop offset="0.35" stopColor="var(--color-brand)" stopOpacity="0.5" />
            <stop offset="0.7" stopColor="var(--color-lilac)" stopOpacity="0.4" />
            <stop offset="1" stopColor="var(--color-lilac)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wave-b" x1="0" x2="1">
            <stop offset="0" stopColor="var(--color-lilac)" stopOpacity="0" />
            <stop offset="0.4" stopColor="var(--color-lilac)" stopOpacity="0.35" />
            <stop offset="0.75" stopColor="var(--color-brand)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--color-brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="waves" fill="none" strokeWidth="1.4">
          {[0, 14, 28, 42].map((o) => (
            <path key={`a${o}`} stroke="url(#wave-a)" d={`M-40 ${640 + o} C 260 ${520 + o}, 520 ${780 + o}, 820 ${640 + o} S 1300 ${520 + o}, 1500 ${600 + o}`} />
          ))}
          {[0, 16, 32].map((o) => (
            <path key={`b${o}`} stroke="url(#wave-b)" d={`M-40 ${210 + o} C 300 ${120 + o}, 640 ${330 + o}, 960 ${200 + o} S 1340 ${120 + o}, 1500 ${180 + o}`} />
          ))}
        </g>
        {TWINKLES.map(([x, y, r], i) => (
          <g key={i} className="twinkle" style={{ animationDelay: `${(i % 6) * 0.7}s` }} transform={`translate(${x * 14.4} ${y * 9})`}>
            <path d={`M0 ${-r * 4} L${r * 0.8} 0 L0 ${r * 4} L${-r * 0.8} 0 Z M${-r * 4} 0 L0 ${r * 0.8} L${r * 4} 0 L0 ${-r * 0.8} Z`} fill="var(--color-ink)" opacity="0.7" />
          </g>
        ))}
      </svg>
    </div>
  );
}
