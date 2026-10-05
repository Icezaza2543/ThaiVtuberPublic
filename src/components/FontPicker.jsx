// Dev-only font tryout: loads any Google Font with a Thai subset at runtime and applies it to headings/body.
// Production keeps self-hosted fonts; once a pair is chosen it is installed via @fontsource and this panel stays dev-only.
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Type, X, RotateCcw } from 'lucide-react';

// Every Google Fonts family with a Thai subset (fonts.google.com/metadata/fonts, 2026-10-06), weights we use.
const FONTS = [
  ['Anuphan', 'Sans', '400;500;600;700'], ['Athiti', 'Sans', '400;500;600;700'], ['Bai Jamjuree', 'Sans', '400;500;600;700'],
  ['Chakra Petch', 'Sans', '400;500;600;700'], ['Fahkwang', 'Sans', '400;500;600;700'], ['Google Sans', 'Sans', '400;500;600;700'],
  ['IBM Plex Sans Thai', 'Sans', '400;500;600;700'], ['IBM Plex Sans Thai Looped', 'Sans', '400;500;600;700'], ['K2D', 'Sans', '400;500;600;700'],
  ['Kanit', 'Sans', '400;500;600;700'], ['KoHo', 'Sans', '400;500;600;700'], ['Kodchasan', 'Sans', '400;500;600;700'],
  ['Krub', 'Sans', '400;500;600;700'], ['Mitr', 'Sans', '400;500;600;700'], ['Niramit', 'Sans', '400;500;600;700'],
  ['Noto Sans Thai', 'Sans', '400;500;600;700'], ['Noto Sans Thai Looped', 'Sans', '400;500;600;700'], ['Pattaya', 'Sans', '400'],
  ['Prompt', 'Sans', '400;500;600;700'], ['Sarabun', 'Sans', '400;500;600;700'], ['Thasadith', 'Sans', '400;700'],
  ['Maitree', 'Serif', '400;500;600;700'], ['Noto Serif Thai', 'Serif', '400;500;600;700'], ['Pridi', 'Serif', '400;500;600;700'],
  ['Taviraj', 'Serif', '400;500;600;700'], ['Trirong', 'Serif', '400;500;600;700'],
  ['Charm', 'ลายมือ', '400;700'], ['Charmonman', 'ลายมือ', '400;700'], ['Itim', 'ลายมือ', '400'], ['Mali', 'ลายมือ', '400;500;600;700'],
  ['Playpen Sans Thai', 'ลายมือ', '400;500;600;700'], ['Sriracha', 'ลายมือ', '400'],
  ['Chonburi', 'Display', '400'], ['Srisakdi', 'Display', '400;700'],
];
const NAMES = FONTS.map((f) => f[0]);
const DEFAULTS = { display: 'Sriracha', body: 'Sarabun' };
const KEY = 'vthaidex-font-tryout';

function load(name) {
  const id = `gf-${name.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const weights = FONTS.find((f) => f[0] === name)?.[2] || '400';
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
}

function apply({ display, body }) {
  load(display);
  load(body);
  const root = document.documentElement.style;
  root.setProperty('--font-display', `'${display}', '${body}', system-ui, sans-serif`);
  root.setProperty('--font-sans', `'${body}', system-ui, sans-serif`);
  document.documentElement.style.fontFamily = `'${body}', system-ui, sans-serif`;
}

function Picker({ label, value, onChange }) {
  const i = NAMES.indexOf(value);
  const step = (d) => onChange(NAMES[(i + d + NAMES.length) % NAMES.length]);
  return (
    <div>
      <p className="text-xs text-faint">{label}</p>
      <div className="mt-1 flex items-center gap-1">
        <button type="button" onClick={() => step(-1)} className="rounded-md p-1.5 hover:bg-raised" aria-label={`${label} ก่อนหน้า`}><ChevronLeft size={16} /></button>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 rounded-md border border-line bg-deep px-2 py-1.5 text-sm text-ink">
          {['Sans', 'Serif', 'ลายมือ', 'Display'].map((cat) => (
            <optgroup key={cat} label={cat}>
              {FONTS.filter((f) => f[1] === cat).map(([n]) => <option key={n} value={n}>{n}</option>)}
            </optgroup>
          ))}
        </select>
        <button type="button" onClick={() => step(1)} className="rounded-md p-1.5 hover:bg-raised" aria-label={`${label} ถัดไป`}><ChevronRight size={16} /></button>
      </div>
      <p className="mt-1.5 truncate text-lg" style={{ fontFamily: `'${value}'` }}>วีทูปเบอร์ไทย 3,799 คน</p>
    </div>
  );
}

export default function FontPicker() {
  const [open, setOpen] = useState(false);
  const [fonts, setFonts] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return DEFAULTS; }
  });
  useEffect(() => {
    apply(fonts);
    try { localStorage.setItem(KEY, JSON.stringify(fonts)); } catch { /* private mode */ }
  }, [fonts]);
  useEffect(() => { if (open) NAMES.forEach(load); }, [open]); // preload all so the dropdown previews are instant

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary fixed bottom-4 right-4 z-50 shadow-xl">
        <Type size={16} aria-hidden="true" /> {fonts.display} / {fonts.body}
      </button>
    );
  }
  return (
    <div className="card fixed bottom-4 right-4 z-50 w-80 space-y-4 p-4 shadow-2xl" role="dialog" aria-label="ลองฟอนต์">
      <div className="flex items-center justify-between">
        <p className="font-medium">ลองฟอนต์ (เห็นเฉพาะตอน dev)</p>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-raised" aria-label="ปิด"><X size={16} /></button>
      </div>
      <Picker label="หัวเรื่อง" value={fonts.display} onChange={(display) => setFonts((f) => ({ ...f, display }))} />
      <Picker label="เนื้อหา" value={fonts.body} onChange={(body) => setFonts((f) => ({ ...f, body }))} />
      <button type="button" onClick={() => setFonts(DEFAULTS)} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <RotateCcw size={14} aria-hidden="true" /> กลับเป็นค่าเดิม
      </button>
    </div>
  );
}
