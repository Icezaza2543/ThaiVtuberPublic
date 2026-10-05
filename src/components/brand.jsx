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
            <stop offset="0" stopColor="#ff5fa2" />
            <stop offset="0.5" stopColor="#ffe45c" />
            <stop offset="1" stopColor="#43e0ff" />
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

/** Section heading: mark, title, optional extra, then a thin guide line that leads the eye across. */
export function SectionHeading({ as: Tag = 'h2', id, children, extra, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <DbMark size={13} />
      <Tag id={id} className="shrink-0 text-xl">{children}</Tag>
      {extra}
      <span className="h-px flex-1 bg-gradient-to-r from-line via-line/60 to-transparent" aria-hidden="true" />
    </div>
  );
}
