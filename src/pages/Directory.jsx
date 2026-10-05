import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, RotateCw, ExternalLink, X } from 'lucide-react';
import Layout, { PageTitle } from '../components/Layout.jsx';
import { creatorSummary, fetchCreatorsPage, fetchOverview, fmt, platformLabel, STATUS_LABELS } from '../lib/api.js';

const VISIBLE_LINKS = 4;

function readParams() {
  const p = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
  return { q: p.get('q') || '', platform: p.get('platform') || '', status: p.get('status') || '' };
}

function writeParams({ q, platform, status }) {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (platform) p.set('platform', platform);
  if (status) p.set('status', status);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `/directory?${qs}` : '/directory');
}

function CreatorRow({ creator }) {
  const c = creatorSummary(creator);
  const [expanded, setExpanded] = useState(false);
  const links = expanded ? c.links : c.links.slice(0, VISIBLE_LINKS);
  const hidden = c.links.length - VISIBLE_LINKS;
  return (
    <li className="grid gap-3 border-b border-line py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center md:gap-8">
      <div className="min-w-0">
        <h2 className="break-words font-display text-xl font-semibold leading-snug">{c.name}</h2>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>{c.agency}</span>
          {c.debutYear && <span>เดบิวต์ {c.debutYear}</span>}
          {c.statusLabel && <span className="font-medium text-ink">{c.statusLabel}</span>}
        </p>
      </div>
      <ul className="flex flex-wrap gap-2 md:justify-end" aria-label={`ช่องทางของ ${c.name}`}>
        {links.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-card px-2.5 py-1.5 text-sm font-medium hover:border-edge"
            >
              {l.label}
              <ExternalLink size={13} className="text-muted" aria-hidden="true" />
              <span className="sr-only">(เปิดในแท็บใหม่)</span>
            </a>
          </li>
        ))}
        {hidden > 0 && (
          <li>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
              className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-sky hover:underline"
            >
              {expanded ? 'ย่อ' : `อีก ${hidden} ช่องทาง`}
            </button>
          </li>
        )}
      </ul>
    </li>
  );
}

function FilterSelect({ id, label, value, onChange, options }) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1 text-sm">
      <span className="font-medium text-muted">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border-2 border-edge bg-card px-3 py-2.5 text-base"
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>{text}</option>
        ))}
      </select>
    </label>
  );
}

export default function Directory() {
  const [filters, setFilters] = useState(readParams);
  const [draft, setDraft] = useState(filters.q);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState({ items: [], cursor: null, status: 'loading' });
  const request = useRef(0);

  useEffect(() => {
    fetchOverview().then(setStats, () => setStats(null));
  }, []);

  const load = useCallback(async (append = false, cursor = '') => {
    const id = ++request.current;
    setPage((p) => ({ ...p, status: append ? 'more' : 'loading' }));
    try {
      const res = await fetchCreatorsPage({ ...filters, cursor });
      if (id !== request.current) return;
      setPage((p) => ({ items: append ? [...p.items, ...res.items] : res.items, cursor: res.next_cursor, status: 'ready' }));
    } catch {
      if (id === request.current) setPage((p) => ({ ...p, status: 'error' }));
    }
  }, [filters]);

  useEffect(() => {
    writeParams(filters);
    load();
  }, [filters, load]);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === draft.trim() ? f : { ...f, q: draft.trim() })), 300);
    return () => clearTimeout(t);
  }, [draft]);

  const platformOptions = [['', 'ทุกแพลตฟอร์ม'], ...(stats?.platforms || []).map((p) => [p.platform, `${platformLabel(p.platform)} (${fmt(p.count)})`])];
  if (filters.platform && !platformOptions.some(([v]) => v === filters.platform)) platformOptions.push([filters.platform, platformLabel(filters.platform)]);
  const statusOptions = [['', 'ทุกสถานะ'], ...(stats?.lifecycle || []).filter((s) => s.count > 0).map((s) => [s.status, `${STATUS_LABELS[s.status] || s.status} (${fmt(s.count)})`])];
  const filtered = filters.q || filters.platform || filters.status;
  const clear = () => { setDraft(''); setFilters({ q: '', platform: '', status: '' }); };

  return (
    <Layout>
      <PageTitle title="รายชื่อ VTuber ไทย">
        {stats ? `${fmt(stats.total_vtubers)} รายชื่อ เรียงตามตัวอักษร` : 'เรียงตามตัวอักษร'} ค้นหาด้วยชื่อหรือสังกัด แล้วกรองตามแพลตฟอร์ม
      </PageTitle>

      <div className="z-30 mt-8 md:sticky md:top-16 border-y-2 border-edge bg-paper/95 backdrop-blur">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="mx-auto grid max-w-6xl gap-3 px-4 py-4 sm:px-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-end">
          <label htmlFor="dir-q" className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-muted">ชื่อหรือสังกัด</span>
            <span className="flex items-center rounded-lg border-2 border-edge bg-card">
              <Search size={18} className="ml-3 shrink-0 text-muted" aria-hidden="true" />
              <input
                id="dir-q"
                type="search"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoComplete="off"
                placeholder="เช่น ชื่อ VTuber หรือชื่อค่าย"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base outline-none"
              />
            </span>
          </label>
          <FilterSelect id="dir-platform" label="แพลตฟอร์ม" value={filters.platform} options={platformOptions} onChange={(platform) => setFilters((f) => ({ ...f, platform }))} />
          <FilterSelect id="dir-status" label="สถานะ" value={filters.status} options={statusOptions} onChange={(status) => setFilters((f) => ({ ...f, status }))} />
        </form>
      </div>

      <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-live="polite" aria-busy={page.status === 'loading'}>
        <div className="flex items-center justify-between gap-4 py-4 text-sm text-muted">
          <span>{page.status === 'loading' ? 'กำลังโหลดรายชื่อ' : `แสดง ${fmt(page.items.length)} รายชื่อ${page.cursor ? ' (มีต่อ)' : ''}`}</span>
          {filtered && (
            <button type="button" onClick={clear} className="inline-flex items-center gap-1 font-semibold text-ink hover:underline">
              <X size={15} aria-hidden="true" /> ล้างตัวกรอง
            </button>
          )}
        </div>

        {page.status === 'error' && page.items.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-line p-8">
            <p className="font-semibold">โหลดรายชื่อไม่สำเร็จ</p>
            <p className="mt-1 text-muted">ตรวจการเชื่อมต่อแล้วลองใหม่อีกครั้ง</p>
            <button type="button" onClick={() => load()} className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-edge px-4 py-2 font-semibold">
              <RotateCw size={16} aria-hidden="true" /> โหลดอีกครั้ง
            </button>
          </div>
        ) : page.status !== 'loading' && page.items.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-line p-8">
            <p className="font-semibold">{filters.q ? `ไม่พบรายชื่อที่ตรงกับ “${filters.q}”` : 'ไม่พบรายชื่อที่ตรงกับตัวกรองนี้'}</p>
            <p className="mt-1 text-muted">ลองสะกดแบบอื่น ใช้ชื่อสั้นลง หรือล้างตัวกรอง ถ้ายังไม่เจอ แจ้งรายชื่อใหม่ให้เราได้</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={clear} className="rounded-lg border-2 border-edge px-4 py-2 font-semibold">ล้างตัวกรอง</button>
              <a href="/contribute" className="rounded-lg bg-onair px-4 py-2 font-semibold text-paper hover:bg-lemon">แจ้งรายชื่อใหม่</a>
            </div>
          </div>
        ) : (
          <ul className={`border-t border-line ${page.status === 'loading' ? 'opacity-50' : ''}`}>
            {page.items.map((c, i) => <CreatorRow key={`${c.name}-${i}`} creator={c} />)}
          </ul>
        )}

        {page.cursor && page.status !== 'loading' && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => load(true, page.cursor)}
              disabled={page.status === 'more'}
              className="rounded-lg border-2 border-edge bg-card px-6 py-3 font-semibold shadow-plate-sm hover:translate-x-px hover:translate-y-px hover:shadow-none disabled:opacity-60"
            >
              {page.status === 'more' ? 'กำลังโหลด' : 'โหลดอีก 24 รายชื่อ'}
            </button>
          </div>
        )}
        {page.status === 'error' && page.items.length > 0 && (
          <p className="mt-4 text-center text-sm text-onair">โหลดหน้าถัดไปไม่สำเร็จ กดปุ่มเพื่อลองอีกครั้ง</p>
        )}
      </section>
    </Layout>
  );
}
