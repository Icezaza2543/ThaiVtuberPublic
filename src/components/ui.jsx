import { useEffect, useId, useRef, useState } from 'react';
import { CircleHelp, ExternalLink } from 'lucide-react';
import { creatorSummary, fmt } from '../lib/api.js';

// Data colours (idol penlights). A platform keeps its colour across every chart via platformColor().
export const PENLIGHT = ['#ff5fa2', '#43e0ff', '#ffe45c', '#b48cff', '#7dffb3', '#ff9f5c'];
const ORDER = ['youtube', 'x', 'twitch', 'bluesky', 'tiktok', 'easydonate'];
export const platformColor = (name, i = 0) => PENLIGHT[ORDER.indexOf(name) >= 0 ? ORDER.indexOf(name) : i % PENLIGHT.length];

/** Help icon that opens on click/tap (hover does not exist on touch screens). */
export function HelpTip({ children, label = 'คำอธิบาย' }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)} className="rounded-full p-0.5 text-faint hover:text-ink">
        <CircleHelp size={15} aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </button>
      {open && (
        <span id={id} role="note" className="absolute left-1/2 top-7 z-30 w-64 -translate-x-1/2 rounded-lg border border-line bg-raised p-3 text-sm font-normal leading-relaxed text-ink shadow-xl">
          {children}
        </span>
      )}
    </span>
  );
}

/** One creator: name, agency/debut as quiet secondary text, and real channel buttons (the clickable part). */
export function CreatorCard({ creator, accent = PENLIGHT[0] }) {
  const c = creatorSummary(creator);
  return (
    <article className="card flex h-full flex-col p-5">
      <span className="mb-3 block h-1 w-10 rounded-full" style={{ background: accent }} aria-hidden="true" />
      <h3 className="break-words text-lg">{c.name}</h3>
      <p className="mt-0.5 text-sm text-faint">
        {c.agency === 'Independent' ? 'วีอิสระ' : c.agency}
        {c.debutYear ? ` · เดบิวต์ ${c.debutYear}` : ''}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {c.links.slice(0, 3).map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary !px-3 !py-1.5 text-sm">
            ไปที่ {l.label} <ExternalLink size={13} aria-hidden="true" />
          </a>
        ))}
      </div>
    </article>
  );
}

/** Vertical bars for discrete years. series: [{key, color, values: {year: n}}] stacked bottom-up. */
export function YearBars({ years, series, height = 200, label }) {
  const totals = years.map((y) => series.reduce((a, s) => a + (s.values[y] || 0), 0));
  const max = Math.max(...totals, 1);
  return (
    <figure aria-label={label}>
      <div className="flex items-end gap-1 sm:gap-1.5" style={{ height }}>
        {years.map((y, i) => (
          <div key={y} className="group relative flex h-full flex-1 flex-col justify-end" title={`${y}: ${fmt(totals[i])}`}>
            <span className="mb-1 text-center text-[11px] tabular-nums text-faint opacity-0 group-hover:opacity-100">{fmt(totals[i])}</span>
            <div className="flex w-full flex-col-reverse overflow-hidden rounded-t" style={{ height: `${(totals[i] / max) * 100}%` }}>
              {series.map((s) => (
                <span key={s.key} className="block w-full shrink-0" style={{ background: s.color, height: `${totals[i] ? ((s.values[y] || 0) / totals[i]) * 100 : 0}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 sm:gap-1.5" aria-hidden="true">
        {years.map((y) => <span key={y} className="flex-1 text-center text-[11px] tabular-nums text-faint">{String(y).slice(2)}</span>)}
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>{years.map((y, i) => <tr key={y}><th>{y}</th><td>{totals[i]}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Horizontal share bars: rows [{key, label, value, color, part?}] where part is a highlighted sub-share. */
export function ShareBars({ rows, max }) {
  const top = max ?? Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.key} className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3 text-sm">
          <span className="truncate">{r.label}</span>
          <span className="relative h-2 rounded-full bg-deep" aria-hidden="true">
            <span className="bar-grow absolute inset-y-0 left-0 rounded-full opacity-35" style={{ width: `${(r.value / top) * 100}%`, background: r.color, animationDelay: `${i * 40}ms` }} />
            {r.part != null && (
              <span className="bar-grow absolute inset-y-0 left-0 rounded-full" style={{ width: `${(r.part / top) * 100}%`, background: r.color, animationDelay: `${i * 40}ms` }} />
            )}
          </span>
          <span className="text-right tabular-nums text-muted">{fmt(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Legend({ items }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: it.color, opacity: it.faded ? 0.35 : 1 }} aria-hidden="true" />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
