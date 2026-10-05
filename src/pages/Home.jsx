import { Component, lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Search, Shuffle, X, BarChart3, ArrowRight, Sparkles, ListFilter, PenLine, ChevronDown, Scale, Dices, EyeOff } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { DbMark, SectionHeading } from '../components/brand.jsx';
import { BRAND, CreatorCard } from '../components/ui.jsx';
import { fetchOverview, fetchSpotlight, platformLabel } from '../lib/api.js';

const Universe = lazy(() => import('../components/Universe.jsx'));
const SPOTLIGHT_PLATFORMS = ['', 'youtube', 'twitch', 'tiktok'];
// One line of personality per visit, in our own data-registry voice.
const QUIPS = [
  'SELECT * FROM วีอิสระ WHERE ยังไม่มีคนรู้จัก',
  'ฐานข้อมูลนี้ไม่มียอดซับ มีแต่ความน่ารัก',
  'ทุก row คือคนจริงที่อยู่หลังโมเดล',
  'index วีไทยแบบไม่จัดอันดับ ใครก็เป็นดาวได้',
  'โมเดลหลุดวาร์ปไม่เป็นไร ข้อมูลเราไม่หลุด',
];

class WebGLBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <p className="grid h-full place-items-center px-6 text-center text-sm text-muted">อุปกรณ์นี้แสดงภาพ 3 มิติไม่ได้ แต่ยังกด “สุ่มเจอวีอิสระ” ได้ตามปกติ</p>;
    return this.props.children;
  }
}

function usePicker() {
  const [picked, setPicked] = useState(null);
  const [picking, setPicking] = useState(false);
  const pick = useCallback(async () => {
    setPicking(true);
    try { const [c] = await fetchSpotlight({ n: 1 }); if (c) setPicked(c); } catch { /* keep the current card */ }
    setPicking(false);
  }, []);
  return { picked, picking, pick, clear: () => setPicked(null) };
}

/** Full-screen hero: the universe fills the screen and stays playable; copy sits on a glass panel. */
function Hero() {
  const [stats, setStats] = useState(null);
  const [showIndies, setShowIndies] = useState(true);
  const [showAgencies, setShowAgencies] = useState(true);
  const [hover, setHover] = useState(null);
  const [sunClicks, setSunClicks] = useState(0);
  const [quip] = useState(() => QUIPS[Math.floor(Math.random() * QUIPS.length)]);
  const { picked, picking, pick, clear } = usePicker();
  useEffect(() => { fetchOverview().then(setStats, () => setStats(null)); }, []);

  return (
    <section className="relative isolate h-[calc(100svh-3.5rem)] min-h-[620px] overflow-hidden bg-[#0c0922]">
      <div className="absolute inset-0">
        {stats && (
          <WebGLBoundary>
            <Suspense fallback={null}>
              <Universe
                stats={stats}
                showIndies={showIndies}
                showAgencies={showAgencies}
                onPickIndie={pick}
                onHoverAgency={setHover}
                onSelectAgency={(a) => { location.href = `/directory?q=${encodeURIComponent(a.name)}`; }}
                onSun={() => setSunClicks((n) => n + 1)}
              />
            </Suspense>
          </WebGLBoundary>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[#0c0922]/55 sm:bg-transparent sm:bg-gradient-to-r sm:from-[#0c0922]/90 sm:via-[#0c0922]/30 sm:to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--bg-top)] to-transparent" />

      <div className="pointer-events-none relative mx-auto flex h-full max-w-6xl flex-col justify-center px-4 sm:px-6">
        <div className="pointer-events-auto max-w-lg text-[#fbf9ff]">
          <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/75 backdrop-blur">
            <DbMark size={11} /> <span className="truncate">{quip}</span>
          </p>
          <h1 className="mt-5 text-3xl leading-tight sm:text-[2.75rem]">
            ค้นพบ <span className="text-[#ff5fa2]">VTuber ไทย</span><br />ที่คุณยังไม่รู้จัก
          </h1>
          <p className="mt-4 max-w-[42ch] text-white/75">
            ดาวทุกดวงในภาพนี้คือวีไทยหนึ่งคน คลิกดาวสักดวงแล้วไปทักทายเขา โดยเฉพาะวีตัวเล็กที่ยังไม่มีใครพาไปเจอ
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={pick} disabled={picking} className="btn bg-[#ff5fa2] text-[#1a0b2e] shadow-[0_8px_22px_-10px_#ff5fa2] hover:bg-[#ff7fb5]">
              <Shuffle size={16} aria-hidden="true" /> {picking ? 'กำลังสุ่ม…' : 'สุ่มเจอวีอิสระ'}
            </button>
            <a href="/directory" className="btn border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15">
              <Search size={16} aria-hidden="true" /> ค้นหาชื่อ
            </a>
          </div>
        </div>
      </div>

      {/* Universe controls and feedback */}
      <div className="absolute right-4 top-4 flex flex-wrap justify-end gap-2 sm:right-6" role="group" aria-label="เลือกสิ่งที่แสดงในจักรวาล">
        <button type="button" className="chip border-white/20 text-white/80 backdrop-blur aria-pressed:border-white/50 aria-pressed:bg-white/20 aria-pressed:text-white" aria-pressed={showIndies} onClick={() => setShowIndies((v) => !v)}>
          <span className="size-2 rounded-full bg-[#43e0ff]" aria-hidden="true" />วีอิสระ
        </button>
        <button type="button" className="chip border-white/20 text-white/80 backdrop-blur aria-pressed:border-white/50 aria-pressed:bg-white/20 aria-pressed:text-white" aria-pressed={showAgencies} onClick={() => setShowAgencies((v) => !v)}>
          <span className="size-2 rounded-full bg-[#ff5fa2]" aria-hidden="true" />มีสังกัด
        </button>
      </div>
      {hover && !picked && (
        <div className="pointer-events-none absolute right-4 top-16 rounded-lg bg-[#1d1747]/95 px-3 py-2 text-sm text-white sm:right-6">
          <p className="font-medium">{hover.name}</p>
          <p className="text-white/60">คลิกเพื่อดูรายชื่อในสังกัด</p>
        </div>
      )}
      {sunClicks >= 3 && !picked && (
        <p role="status" className="absolute inset-x-4 top-16 mx-auto w-fit rounded-lg bg-[#1d1747]/95 px-3 py-2 text-sm text-white">
          <Sparkles size={14} className="mr-1 inline text-[#ffe45c]" aria-hidden="true" />
          ดวงอาทิตย์นี้คือทุกคนรวมกัน ถ้าไม่มีวีตัวเล็ก ก็ไม่มีจักรวาลนี้
        </p>
      )}
      {picked && (
        <div className="absolute bottom-28 right-4 w-[min(22rem,calc(100%-2rem))] sm:right-6" aria-live="polite">
          <div className="relative">
            <button type="button" onClick={clear} className="absolute right-2 top-2 z-10 rounded-full p-1.5 text-faint hover:bg-raised hover:text-ink">
              <X size={16} aria-hidden="true" /><span className="sr-only">ปิด</span>
            </button>
            <CreatorCard creator={picked} accent={BRAND} />
          </div>
          <button type="button" onClick={pick} disabled={picking} className="btn btn-secondary mt-2 w-full">
            <Shuffle size={15} aria-hidden="true" /> {picking ? 'กำลังสุ่ม…' : 'สุ่มอีกคน'}
          </button>
        </div>
      )}

      <a href="#explore" className="absolute bottom-20 left-1/2 flex -translate-x-1/2 flex-col items-center rounded-full bg-black/30 px-3 py-1 text-xs text-white/80 backdrop-blur hover:text-white">
        เลื่อนดูต่อ <ChevronDown size={18} className="motion-safe:animate-bounce" aria-hidden="true" />
      </a>
    </section>
  );
}

const PATHS = [
  { icon: Dices, title: 'สุ่มเจอวีอิสระ', body: 'ไม่ต้องรู้ชื่อก่อน กดสุ่มแล้วไปเจอวีที่ยังไม่มีค่ายคอยดัน', cta: 'ลองสุ่มด้านล่าง', href: '#spotlight' },
  { icon: ListFilter, title: 'ค้นหาตามแพลตฟอร์ม', body: 'อยากดูวีบน Twitch หรือ TikTok เลือกแพลตฟอร์มแล้วกรองเฉพาะวีอิสระได้', cta: 'เปิดรายชื่อ', href: '/directory?scope=independent' },
  { icon: BarChart3, title: 'ดูภาพรวมทั้งวงการ', body: 'วงการโตแค่ไหน วีอยู่แพลตฟอร์มไหน ค่ายใหญ่แค่ไหน ดูเป็นกราฟได้ในหน้าเดียว', cta: 'ดูข้อมูลวงการ', href: '/analytics' },
];

function Explore() {
  return (
    <section id="explore" className="mx-auto max-w-6xl scroll-mt-16 px-4 pt-14 sm:px-6">
      <SectionHeading>ทำอะไรได้ที่นี่</SectionHeading>
      <ul className="mt-5 grid gap-4 md:grid-cols-3">
        {PATHS.map(({ icon: Icon, title, body, cta, href }) => (
          <li key={title} className="card flex flex-col p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-brand/12 text-brand"><Icon size={22} aria-hidden="true" /></span>
            <h3 className="mt-4 text-lg">{title}</h3>
            <p className="mt-1 text-muted">{body}</p>
            <a href={href} className="btn btn-secondary mt-6 self-start">{cta} <ArrowRight size={15} aria-hidden="true" /></a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Spotlight() {
  const [platform, setPlatform] = useState('');
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const load = useCallback(() => {
    setError(false);
    fetchSpotlight({ n: 3, platform }).then(setItems, () => setError(true));
  }, [platform]);
  useEffect(load, [load]);
  return (
    <section id="spotlight" aria-labelledby="spotlight-title" className="mx-auto max-w-6xl scroll-mt-16 px-4 pt-14 sm:px-6">
      <SectionHeading id="spotlight-title">วีอิสระที่น่าทำความรู้จัก</SectionHeading>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="แพลตฟอร์ม">
          {SPOTLIGHT_PLATFORMS.map((p) => (
            <button key={p || 'all'} type="button" className="chip" aria-pressed={platform === p} onClick={() => setPlatform(p)}>
              {p ? platformLabel(p) : 'ทุกแพลตฟอร์ม'}
            </button>
          ))}
        </div>
        <button type="button" onClick={load} className="btn btn-primary"><Shuffle size={15} aria-hidden="true" /> สุ่มชุดใหม่</button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3" aria-live="polite">
        {error && <p className="text-sm text-muted sm:col-span-3">สุ่มไม่สำเร็จ ลองกด “สุ่มชุดใหม่” อีกครั้ง</p>}
        {!error && !items && [0, 1, 2].map((i) => <div key={i} className="card h-40 animate-pulse" />)}
        {!error && items?.map((c, i) => <CreatorCard key={`${c.name}-${i}`} creator={c} accent={BRAND} />)}
      </div>
    </section>
  );
}

const PRINCIPLES = [
  { icon: Scale, title: 'ไม่จัดอันดับ', body: 'ไม่มีท็อป 10 ไม่มีใครได้ที่หนึ่ง ทุกคนอยู่ในสารบบเท่ากัน' },
  { icon: EyeOff, title: 'ไม่โชว์ยอดซับ', body: 'ยอดผู้ติดตามไม่ได้บอกว่าใครน่าดู เราเลยไม่เอามาตัดสิน' },
  { icon: Dices, title: 'สุ่มอย่างยุติธรรม', body: 'การสุ่มเลือกเฉพาะวีอิสระ และทุกคนมีโอกาสถูกสุ่มเท่ากัน' },
];

function Why() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <SectionHeading>ทำไมต้องมี VThaiDex</SectionHeading>
      <div className="mt-5 grid gap-8 lg:grid-cols-[5fr_7fr] lg:items-start">
        <p className="max-w-[46ch] text-lg leading-relaxed">
          วีค่ายใหญ่มีคนดูแลและมีคนเห็นอยู่แล้ว แต่วีตัวเล็กอีกหลายพันคนทำคอนเทนต์ทุกวันโดยแทบไม่มีใครเจอ
          <span className="text-brand"> เราทำที่นี่เพื่อให้พวกเขาถูกมองเห็น</span>
        </p>
        <ul className="grid gap-4 sm:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Icon size={22} className="text-brand" aria-hidden="true" />
              <h3 className="mt-2 text-base">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ContributeBox() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <div className="card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand/15 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl">รู้จักวีที่ยังไม่อยู่ในนี้?</h2>
            <p className="mt-2 max-w-[52ch] text-muted">ส่งชื่อกับลิงก์ช่องมาได้เลย เราตรวจจากหน้าโปรไฟล์สาธารณะแล้วพาเขาเข้าจักรวาล ใช้เวลาไม่ถึง 3 นาที</p>
          </div>
          <a href="/contribute" className="btn btn-primary shrink-0 !px-6 !py-3"><PenLine size={16} aria-hidden="true" /> แนะนำวีให้เรารู้จัก</a>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout>
      <Hero />
      <Explore />
      <Spotlight />
      <Why />
      <ContributeBox />
    </Layout>
  );
}
