import { Component, lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Search, Shuffle, X, BarChart3, ArrowRight, Sparkles } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { CreatorCard, Legend, PENLIGHT, YearBars } from '../components/ui.jsx';
import { fetchOverview, fetchSpotlight, fmt, pct, platformLabel } from '../lib/api.js';

const Universe = lazy(() => import('../components/Universe.jsx'));
const SPOTLIGHT_PLATFORMS = ['', 'youtube', 'twitch', 'tiktok'];

class WebGLBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <p className="grid h-full place-items-center px-6 text-center text-sm text-muted">อุปกรณ์นี้แสดงภาพ 3 มิติไม่ได้ แต่ยังสุ่มเจอวีอิสระได้จากปุ่มด้านซ้าย</p>;
    return this.props.children;
  }
}

function useOverview() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchOverview().then(setData, () => setData(false)); }, []);
  return data;
}

function UniversePanel({ data, picked, onPick, onClear, picking }) {
  const [showIndies, setShowIndies] = useState(true);
  const [showAgencies, setShowAgencies] = useState(true);
  const [hover, setHover] = useState(null);
  const [sunClicks, setSunClicks] = useState(0);
  return (
    <div className="card relative h-[420px] overflow-hidden bg-deep sm:h-[500px]">
      {data && (
        <WebGLBoundary>
          <Suspense fallback={<p className="grid h-full place-items-center text-sm text-faint">กำลังจุดดาว…</p>}>
            <Universe
              stats={data}
              showIndies={showIndies}
              showAgencies={showAgencies}
              onPickIndie={onPick}
              onHoverAgency={setHover}
              onSelectAgency={(a) => { location.href = `/directory?q=${encodeURIComponent(a.name)}`; }}
              onSun={() => setSunClicks((n) => n + 1)}
            />
          </Suspense>
        </WebGLBoundary>
      )}

      <div className="absolute left-3 top-3 flex flex-wrap gap-2" role="group" aria-label="เลือกสิ่งที่แสดงในจักรวาล">
        <button type="button" className="chip backdrop-blur" aria-pressed={showIndies} onClick={() => setShowIndies((v) => !v)}>
          <span className="size-2 rounded-full bg-sky" aria-hidden="true" />วีอิสระ {data ? fmt(data.independent_count) : ''}
        </button>
        <button type="button" className="chip backdrop-blur" aria-pressed={showAgencies} onClick={() => setShowAgencies((v) => !v)}>
          <span className="size-2 rounded-full bg-brand" aria-hidden="true" />มีสังกัด
        </button>
      </div>

      {hover && !picked && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-lg bg-raised/95 px-3 py-2 text-sm">
          <p className="font-medium">{hover.name}</p>
          <p className="text-faint">{fmt(hover.count)} คน · คลิกเพื่อดูรายชื่อ</p>
        </div>
      )}

      {sunClicks >= 3 && !picked && (
        <p role="status" className="absolute inset-x-3 top-14 mx-auto w-fit rounded-lg bg-raised/95 px-3 py-2 text-sm">
          <Sparkles size={14} className="mr-1 inline text-lemon" aria-hidden="true" />
          ดวงอาทิตย์นี้คือทุกคนรวมกัน ถ้าไม่มีวีตัวเล็ก ก็ไม่มีจักรวาลนี้
        </p>
      )}

      {picked ? (
        <div className="absolute inset-x-3 bottom-3 sm:left-auto sm:w-80">
          <div className="relative">
            <button type="button" onClick={onClear} className="absolute right-2 top-2 z-10 rounded-full p-1.5 text-faint hover:bg-raised hover:text-ink">
              <X size={16} aria-hidden="true" /><span className="sr-only">ปิด</span>
            </button>
            <CreatorCard creator={picked} accent={PENLIGHT[1]} />
          </div>
          <button type="button" onClick={onPick} disabled={picking} className="btn btn-secondary mt-2 w-full">
            <Shuffle size={15} aria-hidden="true" /> {picking ? 'กำลังสุ่ม…' : 'สุ่มอีกคน'}
          </button>
        </div>
      ) : (
        <p className="pointer-events-none absolute inset-x-3 bottom-3 text-center text-sm text-faint">
          คลิกจุดดาวเล็ก ๆ เพื่อสุ่มเจอวีอิสระ ลากเพื่อหมุน
        </p>
      )}
    </div>
  );
}

function Hero({ data }) {
  const [picked, setPicked] = useState(null);
  const [picking, setPicking] = useState(false);
  const pick = useCallback(async () => {
    setPicking(true);
    try { const [c] = await fetchSpotlight({ n: 1 }); if (c) setPicked(c); } catch { /* keep the current card */ }
    setPicking(false);
  }, []);
  const indiePct = data ? pct(data.independent_count, data.total_vtubers) : null;
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[5fr_7fr]">
      <div>
        <h1 className="text-3xl leading-tight">ค้นพบ VTuber ไทยที่คุณยังไม่รู้จัก</h1>
        <p className="mt-4 max-w-[46ch] text-muted">
          {data && indiePct != null
            ? `รวม ${fmt(data.total_vtubers)} คนจากทุกแพลตฟอร์ม ${indiePct}% เป็นวีอิสระที่ไม่มีค่ายคอยดัน ลองคลิกดาวสักดวงแล้วไปทักทายเขาดู`
            : 'สารบบ VTuber ไทยจากข้อมูลสาธารณะ ลองคลิกดาวสักดวงแล้วไปทักทายเขาดู'}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={pick} disabled={picking} className="btn btn-primary">
            <Shuffle size={16} aria-hidden="true" /> {picking ? 'กำลังสุ่ม…' : 'สุ่มเจอวีอิสระ'}
          </button>
          <a href="/analytics" className="btn btn-secondary"><BarChart3 size={16} aria-hidden="true" /> ดูข้อมูลวงการ</a>
        </div>
        <form action="/directory" method="get" role="search" className="mt-8 flex max-w-sm items-center rounded-lg border border-line bg-card focus-within:border-faint">
          <label htmlFor="hero-q" className="sr-only">ค้นหาชื่อ VTuber หรือสังกัด</label>
          <Search className="ml-3 shrink-0 text-faint" size={16} aria-hidden="true" />
          <input id="hero-q" name="q" type="search" autoComplete="off" placeholder="รู้ชื่ออยู่แล้ว? ค้นหาเลย" className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-faint" />
        </form>
      </div>
      <UniversePanel data={data} picked={picked} onPick={pick} picking={picking} onClear={() => setPicked(null)} />
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
    <section aria-labelledby="spotlight" className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="spotlight" className="text-xl">วีอิสระที่น่าทำความรู้จัก</h2>
          <p className="mt-1 text-sm text-muted">สุ่มใหม่ทุกครั้ง ไม่มีใครได้ที่หนึ่ง</p>
        </div>
        <button type="button" onClick={load} className="btn btn-secondary"><Shuffle size={15} aria-hidden="true" /> สุ่มชุดใหม่</button>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="แพลตฟอร์ม">
        {SPOTLIGHT_PLATFORMS.map((p) => (
          <button key={p || 'all'} type="button" className="chip" aria-pressed={platform === p} onClick={() => setPlatform(p)}>
            {p ? platformLabel(p) : 'ทุกแพลตฟอร์ม'}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3" aria-live="polite">
        {error && <p className="text-sm text-muted sm:col-span-3">สุ่มไม่สำเร็จ ลองกด “สุ่มชุดใหม่” อีกครั้ง</p>}
        {!error && !items && [0, 1, 2].map((i) => <div key={i} className="card h-40 animate-pulse" />)}
        {!error && items?.map((c, i) => <CreatorCard key={`${c.name}-${i}`} creator={c} accent={PENLIGHT[i + 1]} />)}
      </div>
    </section>
  );
}

function Pulse({ data }) {
  const indieYears = Object.fromEntries((data.independent_debut_trend || []).map((r) => [r.year, r.count]));
  const allYears = Object.fromEntries((data.debut_trend || []).map((r) => [r.year, r.known_debuts]));
  const years = Object.keys(allYears).map(Number).filter((y) => allYears[y] > 0).sort();
  const agencyYears = Object.fromEntries(years.map((y) => [y, Math.max((allYears[y] || 0) - (indieYears[y] || 0), 0)]));
  const lastFull = years.filter((y) => y < new Date().getFullYear()).at(-1);
  const facts = [
    Number.isFinite(data.independent_count) && [`${pct(data.independent_count, data.total_vtubers)}%`, 'ของวีไทยเป็นวีอิสระ'],
    lastFull && [fmt(allYears[lastFull]), `คนเดบิวต์ในปี ${lastFull} เท่าที่เรารู้`],
    [fmt((data.platforms || []).length), 'แพลตฟอร์มที่วีไทยใช้'],
  ].filter(Boolean);
  const hasSplit = (data.independent_debut_trend || []).length > 0;
  return (
    <section aria-labelledby="pulse" className="mx-auto mt-20 grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[5fr_7fr] lg:items-center">
      <div>
        <h2 id="pulse" className="text-xl">วงการนี้โตมาจากวีตัวเล็ก</h2>
        <dl className="mt-6 space-y-4">
          {facts.map(([v, l]) => (
            <div key={l} className="flex items-baseline gap-3">
              <dd className="font-display text-2xl tabular-nums">{v}</dd>
              <dt className="text-muted">{l}</dt>
            </div>
          ))}
        </dl>
        <a href="/analytics" className="btn btn-primary mt-8">ดูข้อมูลทั้งวงการ <ArrowRight size={16} aria-hidden="true" /></a>
      </div>
      {years.length > 0 && (
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base">เดบิวต์ต่อปี</h3>
            {hasSplit && <Legend items={[{ label: 'วีอิสระ', color: PENLIGHT[1] }, { label: 'มีสังกัด', color: PENLIGHT[3] }]} />}
          </div>
          <div className="mt-5">
            <YearBars
              label="จำนวนเดบิวต์ต่อปี"
              years={years}
              series={hasSplit
                ? [{ key: 'indie', color: PENLIGHT[1], values: indieYears }, { key: 'agency', color: PENLIGHT[3], values: agencyYears }]
                : [{ key: 'all', color: PENLIGHT[1], values: allYears }]}
              height={180}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function ContributeBand() {
  return (
    <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
      <div className="card flex flex-col items-start gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-xl">รู้จักวีที่ยังไม่อยู่ในนี้?</h2>
          <p className="mt-1 max-w-[52ch] text-muted">ส่งชื่อกับลิงก์ช่องมาได้เลย เราจะเช็กหลักฐานแล้วพาเขาเข้าจักรวาล</p>
        </div>
        <a href="/contribute" className="btn btn-secondary shrink-0">แนะนำวีให้เรารู้จัก</a>
      </div>
    </section>
  );
}

export default function Home() {
  const data = useOverview();
  return (
    <Layout>
      <Hero data={data || null} />
      <Spotlight />
      {data && <Pulse data={data} />}
      <ContributeBand />
    </Layout>
  );
}
