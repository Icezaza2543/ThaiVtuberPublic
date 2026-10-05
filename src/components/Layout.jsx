import { useState } from 'react';
import { Menu, X, PenLine } from 'lucide-react';
import { DONATE_URL, SOURCE_URL } from '../lib/api.js';

const NAV = [
  { href: '/', label: 'ภาพรวม' },
  { href: '/directory', label: 'รายชื่อ VTuber' },
  { href: '/about', label: 'เกี่ยวกับข้อมูล' },
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
    <header className="sticky top-0 z-40 border-b-2 border-edge bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <a href="/" className="mr-auto flex items-center gap-2.5" aria-label="VThaiDex หน้าแรก">
          <img src="/assets/logo.svg" alt="" width="34" height="34" />
          <span className="font-display text-xl font-bold tracking-tight">VThaiDex</span>
        </a>
        <nav aria-label="เมนูหลัก" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={path === item.href ? 'page' : undefined}
              className="rounded-md px-3 py-2 text-[15px] font-medium text-muted hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-onair aria-[current=page]:decoration-[3px] aria-[current=page]:underline-offset-[10px]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="/contribute"
          className="hidden items-center gap-2 rounded-md border-2 border-edge bg-card px-3.5 py-1.5 text-[15px] font-semibold shadow-plate-sm hover:translate-x-px hover:translate-y-px hover:shadow-none md:inline-flex"
        >
          <PenLine size={16} aria-hidden="true" />
          แจ้งข้อมูล
        </a>
        <button
          type="button"
          className="rounded-md p-2 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          <span className="sr-only">เมนู</span>
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="เมนูหลัก" className="border-t border-line px-4 pb-4 md:hidden">
          {[...NAV, { href: '/contribute', label: 'แจ้งข้อมูล' }].map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={path === item.href ? 'page' : undefined}
              className="block border-b border-line py-3 text-base font-medium aria-[current=page]:text-onair"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-edge bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-bold">VThaiDex</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            สารบบ VTuber ไทยจากข้อมูลสาธารณะที่ผ่านการตรวจสอบ ไม่เกี่ยวข้องกับครีเอเตอร์หรือแพลตฟอร์มใดในรายชื่อ
          </p>
          <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-sky underline underline-offset-4">
            สนับสนุนผู้พัฒนาผ่าน EasyDonate
          </a>
        </div>
        <nav aria-label="นโยบาย">
          <p className="text-sm font-semibold">นโยบาย</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}><a className="hover:text-ink hover:underline" href={l.href}>{l.label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="text-sm text-muted">
          <p className="font-semibold text-ink">สิทธิ์การใช้งาน</p>
          <ul className="mt-3 space-y-2">
            <li>ซอร์สโค้ด: <a className="underline underline-offset-4 hover:text-ink" href={SOURCE_URL} target="_blank" rel="noopener noreferrer">AGPL-3.0 บน GitHub</a></li>
            <li>ข้อความและเอกสาร: CC BY 4.0</li>
            <li>ฐานข้อมูลที่รวบรวม: สงวนสิทธิ์</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-lemon focus:px-4 focus:py-2 focus:text-paper">
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
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16">
      <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{title}</h1>
      {children && <div className="mt-4 max-w-2xl text-lg text-muted">{children}</div>}
    </div>
  );
}
