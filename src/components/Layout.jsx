import { lazy, Suspense, useState } from 'react';
import { Menu, X, PenLine, Orbit, BarChart3, ListFilter, Info, Sun, Moon, Coffee } from 'lucide-react';
import { DONATE_URL, SOURCE_URL } from '../lib/api.js';
import Backdrop from './Backdrop.jsx';

// Dev-only font tryout panel; excluded from the production bundle.
const FontPicker = import.meta.env.DEV ? lazy(() => import('./FontPicker.jsx')) : null;

const NAV = [
  { href: '/', label: 'หน้าแรก', icon: Orbit },
  { href: '/analytics', label: 'ข้อมูลวงการ', icon: BarChart3 },
  { href: '/directory', label: 'รายชื่อ', icon: ListFilter },
  { href: '/about', label: 'เกี่ยวกับ', icon: Info },
];

export const LEGAL_LINKS = [
  { href: '/terms', label: 'ข้อกำหนดการให้บริการ' },
  { href: '/terms-of-use', label: 'เงื่อนไขการใช้งาน' },
  { href: '/privacy', label: 'ความเป็นส่วนตัว' },
  { href: '/data-license', label: 'สัญญาอนุญาต' },
];

function currentPath() {
  if (typeof location === 'undefined') return '/';
  return location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/$/, '$1') || '/';
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => (typeof document !== 'undefined' && document.documentElement.dataset.theme) || 'dark');
  const next = theme === 'dark' ? 'light' : 'dark';
  const toggle = () => {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('vthaidex-theme', next); } catch { /* private mode */ }
    setTheme(next);
  };
  return (
    <button type="button" onClick={toggle} className="rounded-lg p-2 text-muted hover:bg-raised hover:text-ink" aria-label={next === 'light' ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'} title={next === 'light' ? 'ธีมสว่าง' : 'ธีมมืด'}>
      {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const path = currentPath();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <a href="/" className="mr-auto flex items-center gap-2" aria-label="VThaiDex หน้าแรก">
          <img src="/assets/logo.svg" alt="" width="28" height="28" />
          <span className="font-display text-xl">VThai<span className="text-brand">Dex</span></span>
        </a>
        <nav aria-label="เมนูหลัก" className="hidden items-center gap-1 md:flex">
          {NAV.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              aria-current={path === href ? 'page' : undefined}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:text-ink aria-[current=page]:bg-raised aria-[current=page]:text-ink"
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </a>
          ))}
        </nav>
        <a href="/contribute" className="btn btn-secondary hidden !px-3 !py-1.5 text-sm md:inline-flex">
          <PenLine size={15} aria-hidden="true" />
          แจ้งข้อมูล
        </a>
        <ThemeToggle />
        <button
          type="button"
          className="rounded-lg p-2 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          <span className="sr-only">เมนู</span>
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="เมนูหลัก" className="space-y-1 px-4 pb-4 md:hidden">
          {[...NAV, { href: '/contribute', label: 'แจ้งข้อมูล', icon: PenLine }].map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              aria-current={path === href ? 'page' : undefined}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-ink aria-[current=page]:bg-raised"
            >
              <Icon size={17} className="text-muted" aria-hidden="true" />
              {label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 bg-deep/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand"><Coffee size={22} aria-hidden="true" /></span>
            <div>
              <p className="font-display text-lg">สนับสนุนคนทำ VThaiDex</p>
              <p className="mt-0.5 max-w-[52ch] text-sm text-muted">เว็บนี้ทำโดยคนคนเดียว ไม่มีโฆษณา ถ้าชอบที่นี่ เลี้ยงกาแฟหนึ่งแก้วช่วยค่าเซิร์ฟเวอร์และเวลาทำข้อมูลได้ เงินนี้ไม่ได้ไปถึงวีในรายชื่อ</p>
            </div>
          </div>
          <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary shrink-0">
            <Coffee size={16} aria-hidden="true" /> เลี้ยงกาแฟผ่าน EasyDonate
          </a>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 text-sm sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-base">VThai<span className="text-brand">Dex</span></p>
          <p className="mt-2 max-w-xs text-muted">สารบบ VTuber ไทย ทำขึ้นเพื่อให้วีตัวเล็กถูกมองเห็นมากขึ้น ไม่เกี่ยวข้องกับครีเอเตอร์หรือแพลตฟอร์มใด</p>
        </div>
        <nav aria-label="นโยบาย">
          <p className="text-faint">นโยบาย</p>
          <ul className="mt-3 space-y-2 text-muted">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}><a className="hover:text-ink" href={l.href}>{l.label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="text-muted">
          <p className="text-faint">สิทธิ์การใช้งาน</p>
          <ul className="mt-3 space-y-2">
            <li>โค้ด: <a className="hover:text-ink hover:underline" href={SOURCE_URL} target="_blank" rel="noopener noreferrer">AGPL-3.0 บน GitHub</a></li>
            <li>ข้อความ: CC BY 4.0</li>
            <li>ฐานข้อมูล: สงวนสิทธิ์</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-deep">
        ข้ามไปยังเนื้อหา
      </a>
      <Backdrop />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      {FontPicker && <Suspense fallback={null}><FontPicker /></Suspense>}
    </>
  );
}

export function PageTitle({ title, children }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
      <h1 className="w-fit text-2xl sm:text-3xl">{title}</h1>
      {children && <div className="mt-2 max-w-[60ch] text-muted">{children}</div>}
    </div>
  );
}
