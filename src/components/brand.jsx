// VThaiDex brand mark: a database cylinder lying on its side (we are the data registry, not a hub).
import { useState } from 'react';

let uid = 0;

/** Horizontal database glyph. size = height in px; colour follows the penlight gradient unless mono. */
export function DbMark({ size = 14, mono = false, className = '' }) {
  const [id] = useState(() => `dbg-${uid++}`);
  const stroke = mono ? 'currentColor' : `url(#${id})`;
  return (
    <svg viewBox="0 0 34 20" height={size} width={(size * 34) / 20} className={`shrink-0 ${className}`} aria-hidden="true" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round">
      {!mono && (
        <defs>
          <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--color-brand)" />
            <stop offset="1" stopColor="var(--color-lilac)" />
          </linearGradient>
        </defs>
      )}
      <ellipse cx="6" cy="10" rx="4" ry="8" />
      <path d="M6 2 H27 A4 8 0 0 1 27 18 H6" />
      <path d="M13 2 A4 8 0 0 1 13 18" />
      <path d="M20 2 A4 8 0 0 1 20 18" />
    </svg>
  );
}

const BARS = {
  brand: 'bg-brand shadow-[0_0_14px_-2px_var(--color-brand)]',
  sky: 'bg-sky shadow-[0_0_14px_-2px_var(--color-sky)]',
};

/** Section heading: a glowing stage-light bar, the title in the display face, optional extra and a quiet subline. */
export function SectionHeading({ as: Tag = 'h2', id, children, extra, sub, tone = 'brand', className = '' }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span className={`mt-1.5 h-7 w-2.5 shrink-0 rounded-full sm:h-8 ${BARS[tone] || BARS.brand}`} aria-hidden="true" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Tag id={id} className="text-2xl sm:text-[1.75rem]">{children}</Tag>
          {extra}
        </div>
        {sub && <p className="mt-0.5 text-sm text-faint">{sub}</p>}
      </div>
    </div>
  );
}
