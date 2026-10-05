import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, RotateCw, ExternalLink, X } from 'lucide-react';
import Layout, { PageTitle } from '../components/Layout.jsx';
import { creatorSummary, fetchCreatorsPage, fetchOverview, fmt, platformLabel, STATUS_LABELS } from '../lib/api.js';

const VISIBLE_LINKS = 4;
const SCOPES = [['', 'ทั้งหมด'], ['independent', 'วีอิสระ'], ['agency', 'มีสังกัด']];

function readParams() {
  const p = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
  const scope = p.get('scope') || '';
  return { q: p.get('q') || '', platform: p.get('platform') || '', status: p.get('status') || '', scope: ['independent', 'agency'].includes(scope) ? scope : '' };
}

function writeParams(filters) {
  const p = new URLSearchParams();
  for (const k of ['q', 'platform', 'status', 'scope']) if (filters[k]) p.set(k, filters[k]);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `/directory?${qs}` : '/directory');
}

function CreatorRow({ creator }) {
  const c = creatorSummary(creator);
  const [expanded, setExpanded] = useState(false);
  const links = expanded ? c.links : c.links.slice(0, VISIBLE_LINKS);
  const hidden = c.links.length - VISIBLE_LINKS;
  return (
    <li className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center md:gap-8">
      <div className="min-w-0">
        <h2 className="break-words font-sans text-base font-semibold">{c.name}</h2>
        <p className="text-sm text-faint">
          {c.agency === 'Independent' ? 'วีอิสระ' : c.agency}
          {c.debutYear ? ` · เดบิวต์ ${c.debutYear}` : ''}
          {c.statusLabel ? ` · ${c.statusLabel}` : ''}
        </p>
      </div>
      <ul className="flex flex-wrap gap-1.5 md:justify-end" aria-label={`ช่องทางของ ${c.name}`}>
        {links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-raised px-2.5 py-1 text-sm text-ink hover:bg-line">
              {l.label}
              <ExternalLink size={12} className="text-faint" aria-hidden="true" />
              <span className="sr-only">(เปิดในแท็บใหม่)</span>
            </a>
          </li>
        ))}
        {hidden > 0 && (
          <li>
            <button type="button" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)} className="rounded-md px-2.5 py-1 text-sm font-medium text-sky hover:underline">
              {expanded ? 'ย่อ' : `+${hidden} ช่องทาง`}
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
      <span className="text-faint">{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink">
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
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

  useEffect(() => { fetchOverview().then(setStats, () => setStats(null)); }, []);

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

  useEffect(() => { writeParams(filters); load(); }, [filters, load]);
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === draft.trim() ? f : { ...f, q: draft.trim() })), 300);
    return () => clearTimeout(t);
  }, [draft]);

  const platformOptions = [['', 'ทุกแพลตฟอร์ม'], ...(stats?.platforms || []).map((p) => [p.platform, `${platformLabel(p.platform)} (${fmt(p.count)})`])];
  if (filters.platform && !platformOptions.some(([v]) => v === filters.platform)) platformOptions.push([filters.platform, platformLabel(filters.platform)]);
  const statusOptions = [['', 'ทุกสถานะ'], ...(stats?.lifecycle || []).filter((s) => s.count > 0).map((s) => [s.status, STATUS_LABELS[s.status] || s.status])];
  const filtered = filters.q || filters.platform || filters.status || filters.scope;
  const clear = () => { setDraft(''); setFilters({ q: '', platform: '', status: '', scope: '' }); };

  return (
    <Layout>
      <PageTitle title="รายชื่อ VTuber ไทย">
        {stats ? `${fmt(stats.total_vtubers)} คน เรียงตามตัวอักษร` : null}
      </PageTitle>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mx-auto mt-6 max-w-6xl space-y-3 px-4 sm:px-6">
        <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-end">
          <label htmlFor="dir-q" className="flex flex-col gap-1 text-sm">
            <span className="text-faint">ชื่อหรือสังกัด</span>
            <span className="flex items-center rounded-lg border border-line bg-card focus-within:border-faint">
              <Search size={16} className="ml-3 shrink-0 text-faint" aria-hidden="true" />
              <input id="dir-q" type="search" value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="off" placeholder="พิมพ์ชื่อวีหรือชื่อค่าย" className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-faint" />
            </span>
          </label>
          <FilterSelect id="dir-platform" label="แพลตฟอร์ม" value={filters.platform} options={platformOptions} onChange={(platform) => setFilters((f) => ({ ...f, platform }))} />
          <FilterSelect id="dir-status" label="สถานะ" value={filters.status} options={statusOptions} onChange={(status) => setFilters((f) => ({ ...f, status }))} />
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="สังกัด">
          {SCOPES.map(([v, label]) => (
            <button key={v || 'all'} type="button" className="chip" aria-pressed={filters.scope === v} onClick={() => setFilters((f) => ({ ...f, scope: v }))}>{label}</button>
          ))}
          {filtered && (
            <button type="button" onClick={clear} className="ml-auto inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
              <X size={14} aria-hidden="true" /> ล้างตัวกรอง
            </button>
          )}
        </div>
      </form>

      <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6" aria-live="polite" aria-busy={page.status === 'loading'}>
        <p className="text-sm text-faint">{page.status === 'loading' ? 'กำลังโหลด…' : `แสดง ${fmt(page.items.length)} คน${page.cursor ? ' (ยังมีต่อ)' : ''}`}</p>

        {page.status === 'error' && page.items.length === 0 ? (
          <div className="card mt-4 p-6">
            <p className="font-medium">โหลดรายชื่อไม่สำเร็จ</p>
            <p className="mt-1 text-sm text-muted">เช็กอินเทอร์เน็ตแล้วลองอีกครั้ง</p>
            <button type="button" onClick={() => load()} className="btn btn-secondary mt-4"><RotateCw size={15} aria-hidden="true" /> โหลดอีกครั้ง</button>
          </div>
        ) : page.status !== 'loading' && page.items.length === 0 ? (
          <div className="card mt-4 p-6">
            <p className="font-medium">{filters.q ? `ไม่เจอ “${filters.q}”` : 'ไม่เจอใครตรงกับตัวกรองนี้'}</p>
            <p className="mt-1 text-sm text-muted">ลองพิมพ์ชื่อให้สั้นลงหรือล้างตัวกรอง ถ้ายังไม่เจอ อาจเป็นวีที่เรายังไม่รู้จัก</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={clear} className="btn btn-secondary">ล้างตัวกรอง</button>
              <a href="/contribute" className="btn btn-primary">แนะนำวีคนนี้ให้เรา</a>
            </div>
          </div>
        ) : (
          <ul className={`mt-2 divide-y divide-line/70 ${page.status === 'loading' ? 'opacity-50' : ''}`}>
            {page.items.map((c, i) => <CreatorRow key={`${c.name}-${i}`} creator={c} />)}
          </ul>
        )}

        {page.cursor && page.status !== 'loading' && (
          <div className="mt-8 flex justify-center">
            <button type="button" onClick={() => load(true, page.cursor)} disabled={page.status === 'more'} className="btn btn-secondary">
              {page.status === 'more' ? 'กำลังโหลด…' : 'โหลดเพิ่มอีก 24 คน'}
            </button>
          </div>
        )}
        {page.status === 'error' && page.items.length > 0 && <p className="mt-4 text-center text-sm text-brand">โหลดหน้าถัดไปไม่สำเร็จ กดปุ่มเพื่อลองอีกครั้ง</p>}
      </section>
    </Layout>
  );
}
