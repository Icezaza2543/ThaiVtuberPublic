import { useState } from 'react';
import { Menu, X, PenLine, Orbit, BarChart3, ListFilter, Info } from 'lucide-react';
import { DONATE_URL, SOURCE_URL } from '../lib/api.js';

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

function Header() {
  const [open, setOpen] = useState(false);
  const path = currentPath();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <a href="/" className="mr-auto flex items-center gap-2" aria-label="VThaiDex หน้าแรก">
          <img src="/assets/logo.svg" alt="" width="28" height="28" />
          <span className="font-display text-lg font-medium">VThaiDex</span>
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
    <footer className="mt-24 bg-deep">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-base">VThaiDex</p>
          <p className="mt-2 max-w-xs text-muted">สารบบ VTuber ไทย ทำขึ้นเพื่อให้วีตัวเล็กถูกมองเห็นมากขึ้น ไม่เกี่ยวข้องกับครีเอเตอร์หรือแพลตฟอร์มใด</p>
          <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block font-medium text-sky hover:underline">
            เลี้ยงกาแฟคนทำเว็บ
          </a>
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
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

export function PageTitle({ title, children }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
      <h1 className="text-2xl sm:text-3xl">{title}</h1>
      {children && <div className="mt-2 max-w-[60ch] text-muted">{children}</div>}
    </div>
  );
}
