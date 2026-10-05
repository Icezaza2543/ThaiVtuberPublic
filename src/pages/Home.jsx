import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { Search, RotateCw, MousePointerClick } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { fetchOverview, fmt, formatDate, pct, platformLabel, STATUS_LABELS } from '../lib/api.js';

const Universe = lazy(() => import('../components/Universe.jsx'));
const PENLIGHT = ['#ff5fa2', '#43e0ff', '#ffe45c', '#b48cff', '#7dffb3', '#ff9f5c'];
const penlight = (i) => PENLIGHT[i % PENLIGHT.length];
const toAgency = (name) => { location.href = `/directory?q=${encodeURIComponent(name)}`; };

class WebGLBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <p className="grid h-full place-items-center px-6 text-center text-muted">อุปกรณ์นี้แสดงภาพ 3 มิติไม่ได้ ดูสถิติเดียวกันได้ใน dashboard ด้านล่าง</p>;
    return this.props.children;
  }
}

function useOverview() {
  const [state, setState] = useState({ data: null, error: false });
  const load = () => {
    setState({ data: null, error: false });
    fetchOverview().then((data) => setState({ data, error: false }), () => setState({ data: null, error: true }));
  };
  useEffect(load, []);
  return { ...state, retry: load };
}

function Hero({ data }) {
  const [hover, setHover] = useState(null);
  const updated = formatDate(data?.meta?.generated_at);
  const agencies = (data?.agencies || []).length;
  return (
    <section className="relative isolate h-[min(92svh,860px)] min-h-[560px] overflow-hidden border-b border-line bg-deep">
      <div
        className="absolute inset-0"
        role="img"
        aria-label={data ? `ภาพจักรวาล VTuber ไทย: ${fmt(data.total_vtubers)} รายชื่อ ดาวเคราะห์ ${agencies} ดวงคือสังกัด และจุดดาว ${fmt(data.independent_count)} จุดคือครีเอเตอร์อิสระ` : 'ภาพจักรวาล VTuber ไทย'}
      >
        {data && (
          <WebGLBoundary>
            <Suspense fallback={null}>
              <Universe stats={data} onSelectAgency={(a) => toAgency(a.name)} onHoverAgency={setHover} />
            </Suspense>
          </WebGLBoundary>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep via-deep/30 to-transparent" />
      <div aria-live="polite" className="pointer-events-none absolute right-4 top-4 sm:right-6 sm:top-6">
        {hover && (
          <div className="rounded-xl border border-edge bg-deep/90 px-4 py-2.5 shadow-glow">
            <p className="font-display text-lg font-semibold">{hover.name}</p>
            <p className="text-sm text-muted">{fmt(hover.count)} คนในสังกัด คลิกเพื่อดูรายชื่อ</p>
          </div>
        )}
      </div>

      <div className="pointer-events-none relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-10 sm:px-6 sm:pb-14">
        <h1 className="penlight-text max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
          จักรวาล VTuber ไทย
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink/85 sm:text-xl">
          {!data ? 'กำลังรวบรวมดวงดาว' : Number.isFinite(data.agency_total) ? `${fmt(data.total_vtubers)} รายชื่อ ใน ${fmt(data.agency_total)} สังกัด และครีเอเตอร์อิสระอีก ${fmt(data.independent_count)} คน` : `${fmt(data.total_vtubers)} รายชื่อจากข้อมูลสาธารณะที่ตรวจแล้ว`}
          {updated && <span className="block text-base text-muted">อัปเดตเมื่อ {updated}</span>}
        </p>

        <form action="/directory" method="get" role="search" className="plate pointer-events-auto mt-8 flex max-w-xl items-center rounded-xl">
          <label htmlFor="hero-q" className="sr-only">ชื่อ VTuber หรือสังกัด</label>
          <Search className="ml-4 shrink-0 text-muted" size={22} aria-hidden="true" />
          <input
            id="hero-q"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="ค้นหาชื่อ VTuber หรือสังกัด"
            className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-lg text-ink outline-none placeholder:text-muted"
          />
          <button type="submit" className="m-2 rounded-lg bg-onair px-5 py-2.5 font-semibold text-paper hover:bg-lemon">ค้นหา</button>
        </form>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-onair" aria-hidden="true" />ดาวเคราะห์ = สังกัด (ใหญ่ตามจำนวนสมาชิก)</li>
          <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-sky shadow-[0_0_8px_#43e0ff]" aria-hidden="true" />จุดดาว = ครีเอเตอร์อิสระหนึ่งคน</li>
          <li className="hidden items-center gap-2 sm:flex"><MousePointerClick size={15} aria-hidden="true" />ลากเพื่อหมุน เลื่อนเพื่อซูม คลิกดาวเคราะห์เพื่อดูรายชื่อ</li>
        </ul>
      </div>
    </section>
  );
}

function Panel({ title, note, className = '', children }) {
  return (
    <section className={`panel p-6 sm:p-7 ${className}`}>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function KeyFigures({ data }) {
  const span = data.platform_span || [];
  const multi = span.filter((r) => r.platforms >= 2).reduce((a, r) => a + r.count, 0);
  const figures = [
    [fmt(data.total_vtubers), 'รายชื่อในสารบบ'],
    Number.isFinite(data.agency_total) && [fmt(data.agency_total), 'สังกัด'],
    Number.isFinite(data.independent_count) && [`${pct(data.independent_count, data.total_vtubers)}%`, 'เป็นครีเอเตอร์อิสระ'],
    span.length > 0 && [`${pct(multi, data.total_vtubers)}%`, 'มีมากกว่าหนึ่งช่องทาง'],
    [fmt((data.platforms || []).length), 'แพลตฟอร์มที่พบ'],
  ].filter(Boolean);
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr">
      {figures.map(([value, label], i) => (
        <div key={label} className="bg-card px-5 py-5">
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="mt-1 font-display text-3xl font-bold tabular-nums" style={{ color: penlight(i) }}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PlatformBars({ data }) {
  const rows = (data.platforms || []).slice(0, 10);
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.platform} className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3 text-sm">
          <span className="truncate font-medium">{platformLabel(r.platform)}</span>
          <span className="h-2.5 rounded-full bg-deep" aria-hidden="true">
            <span className="bar-grow block h-full rounded-full" style={{ width: `${(r.count / max) * 100}%`, background: penlight(i), animationDelay: `${i * 50}ms` }} />
          </span>
          <span className="text-right tabular-nums text-muted">{fmt(r.count)}</span>
        </li>
      ))}
    </ul>
  );
}

function DebutYears({ data }) {
  const rows = (data.debut_trend || []).filter((r) => r.known_debuts > 0);
  const max = Math.max(...rows.map((r) => r.known_debuts), 1);
  if (!rows.length) return <p className="text-muted">ยังไม่มีข้อมูลปีเดบิวต์</p>;
  return (
    <div className="flex h-52 items-end gap-1.5 sm:gap-2" role="list">
      {rows.map((r) => (
        <div key={r.year} role="listitem" className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" aria-label={`ปี ${r.year}: ${fmt(r.known_debuts)} คน`}>
          <span className="text-[11px] tabular-nums text-muted">{fmt(r.known_debuts)}</span>
          <span className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-lilac to-onair" style={{ height: `${Math.max((r.known_debuts / max) * 100, 2)}%` }} aria-hidden="true" />
          <span className="text-[11px] font-medium tabular-nums">{String(r.year).slice(2)}'</span>
        </div>
      ))}
    </div>
  );
}

function PlatformSpan({ data }) {
  const rows = data.platform_span || [];
  const total = rows.reduce((a, r) => a + r.count, 0) || 1;
  return (
    <>
      <div className="flex h-6 overflow-hidden rounded-full" aria-hidden="true">
        {rows.map((r, i) => <span key={r.platforms} style={{ width: `${(r.count / total) * 100}%`, background: penlight(i) }} />)}
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        {rows.map((r, i) => (
          <li key={r.platforms} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: penlight(i) }} aria-hidden="true" />
            <span>{r.platforms >= 5 ? '5 ช่องทางขึ้นไป' : `${r.platforms} ช่องทาง`}</span>
            <span className="ml-auto tabular-nums text-muted">{pct(r.count, total)}%</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function AgencyShare({ data }) {
  const rows = (data.agencies || []).slice(0, 12);
  const max = Math.max(...rows.map((r) => r.count), 1);
  const inAgency = data.total_vtubers - data.independent_count;
  return (
    <>
      <p className="text-sm text-muted">
        อยู่ในสังกัด {fmt(inAgency)} คน ({pct(inAgency, data.total_vtubers)}%) อิสระ {fmt(data.independent_count)} คน ({pct(data.independent_count, data.total_vtubers)}%)
      </p>
      <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {rows.map((r, i) => (
          <li key={r.name}>
            <a href={`/directory?q=${encodeURIComponent(r.name)}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 text-sm">
              <span className="truncate font-medium group-hover:underline">{r.name}</span>
              <span className="tabular-nums text-muted">{fmt(r.count)}</span>
              <span className="col-span-2 mt-1 h-1.5 rounded-full bg-deep" aria-hidden="true">
                <span className="block h-full rounded-full" style={{ width: `${(r.count / max) * 100}%`, background: penlight(i) }} />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

function Dashboard({ data, error, retry }) {
  if (error) {
    return (
      <div className="panel mx-auto mt-12 max-w-6xl p-8">
        <p className="font-semibold">โหลดสถิติไม่สำเร็จ</p>
        <p className="mt-1 text-muted">ตรวจการเชื่อมต่อแล้วลองใหม่อีกครั้ง ส่วนการค้นหารายชื่อยังใช้งานได้</p>
        <button type="button" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-edge px-4 py-2 font-semibold">
          <RotateCw size={16} aria-hidden="true" /> โหลดสถิติอีกครั้ง
        </button>
      </div>
    );
  }
  if (!data) return <div className="mx-auto mt-12 h-96 max-w-6xl animate-pulse rounded-2xl bg-card" aria-label="กำลังโหลดสถิติ" />;
  const graduated = (data.lifecycle || []).find((r) => r.status === 'graduated')?.count;
  return (
    <section aria-labelledby="dash" className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
      <h2 id="dash" className="font-display text-3xl font-bold sm:text-4xl">ข้อมูลทั้งจักรวาลในหน้าเดียว</h2>
      <p className="mt-2 max-w-2xl text-muted">ทุกตัวเลขนับจากรายชื่อที่ตรวจแล้ว หนึ่งรายชื่อคือหนึ่งตัวตน แม้จะมีหลายช่องทาง</p>
      <div className="mt-8"><KeyFigures data={data} /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="อยู่บนแพลตฟอร์มไหน" note="หนึ่งคนอยู่ได้หลายแพลตฟอร์ม ผลรวมจึงเกินจำนวนรายชื่อ"><PlatformBars data={data} /></Panel>
        <Panel title="เดบิวต์ปีไหน" note={`นับจาก ${fmt(data.known_debut_year_count)} รายชื่อที่ทราบปีเดบิวต์ (${pct(data.known_debut_year_count, data.total_vtubers)}%)`}><DebutYears data={data} /></Panel>
        {Array.isArray(data.agencies) && Number.isFinite(data.independent_count) && (
          <Panel title="สังกัดในจักรวาล" note="สังกัดที่มีสมาชิกมากที่สุด 12 แห่ง คือดาวเคราะห์ดวงใหญ่ในภาพด้านบน" className="lg:col-span-2"><AgencyShare data={data} /></Panel>
        )}
        {Array.isArray(data.platform_span) && (
          <Panel title="แต่ละคนมีกี่ช่องทาง" note="นับช่องทางทางการที่ตรวจแล้วของแต่ละรายชื่อ"><PlatformSpan data={data} /></Panel>
        )}
        <Panel title="สถานะ" note="จากสถานะที่ตรวจแล้วในทะเบียน ไม่ได้เดาจากโพสต์ล่าสุด">
          <ul className="space-y-2">
            {(data.lifecycle || []).filter((r) => r.count > 0).map((r) => (
              <li key={r.status} className="flex justify-between border-b border-line pb-2 text-sm">
                <span>{STATUS_LABELS[r.status] || r.status}</span>
                <span className="tabular-nums text-muted">{fmt(r.count)}</span>
              </li>
            ))}
          </ul>
          {graduated > 0 && <p className="mt-4 text-sm text-muted">ครีเอเตอร์ที่จบกิจกรรมยังอยู่ในสารบบ เพราะเป็นส่วนหนึ่งของประวัติวงการ</p>}
        </Panel>
      </div>
    </section>
  );
}

function ContributeBand() {
  return (
    <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
      <div className="plate flex flex-col items-start gap-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">ยังมีดาวที่เราไม่เห็น</h2>
          <p className="mt-2 max-w-xl text-muted">แจ้งรายชื่อใหม่หรือข้อมูลที่ต้องแก้ พร้อมลิงก์หลักฐานสาธารณะ ทีมงานตรวจทุกรายการก่อนเพิ่ม</p>
        </div>
        <a href="/contribute" className="shrink-0 rounded-lg bg-onair px-6 py-3 font-semibold text-paper hover:bg-lemon">แจ้งข้อมูล</a>
      </div>
    </section>
  );
}

export default function Home() {
  const overview = useOverview();
  return (
    <Layout>
      <Hero data={overview.data} />
      <Dashboard {...overview} />
      <ContributeBand />
    </Layout>
  );
}
