import DataError from '../components/DataError.js';
import { useApiData } from '../lib/useApiData.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, ChevronDown, Network, BadgeCheck, IdCard, ExternalLink } from 'lucide-react';
import Layout, { PageTitle } from '../components/Layout.jsx';
import { AgencyTag, PlatformLink, StatusChip } from '../components/ui.jsx';
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
    <li className="group grid gap-3 border-l-4 border-l-transparent px-4 py-4 transition hover:border-l-brand hover:bg-raised/50 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center md:gap-8">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="break-words font-sans text-[1.0625rem] font-bold leading-snug transition [overflow-wrap:anywhere] group-hover:text-brand">{c.name}</h2>
          <StatusChip label={c.statusLabel} />
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-faint">
          <AgencyTag agency={c.agency} />
          {c.debutYear ? <span>· เดบิวต์ {c.debutYear}</span> : null}
        </p>
      </div>
      <ul className="flex flex-wrap gap-1.5 md:justify-end" aria-label={`ช่องทางของ ${c.name}`}>
        {links.map((l) => (
          <li key={l.url}><PlatformLink link={l} creatorName={c.name} /></li>
        ))}
        {hidden > 0 && (
          <li>
            <button type="button" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)} className="inline-flex min-h-9 items-center rounded-full border border-line bg-raised px-3 text-sm font-medium text-sky transition hover:border-sky">
              {expanded ? 'ย่อ' : `+${hidden} ช่องทาง`}
            </button>
          </li>
        )}
      </ul>
    </li>
  );
}

function FilterSelect({ id, label, icon: Icon, tone, value, onChange, options }) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1.5 text-sm">
      <span className="flex items-center gap-1.5 font-medium text-muted"><Icon size={15} className={tone} aria-hidden="true" />{label}</span>
      <span className="field relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="min-h-12 w-full cursor-pointer appearance-none rounded-[0.875rem] bg-transparent pl-3.5 pr-10 text-base text-ink outline-none">
          {options.map(([v, text]) => <option key={v} value={v} className="bg-card text-ink">{text}</option>)}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-3 text-muted" aria-hidden="true" />
      </span>
    </label>
  );
}

export default function Directory() {
  const [filters, setFilters] = useState(readParams);
  const [draft, setDraft] = useState(filters.q);
  const { data: stats, error: statsError, retry: retryStats } = useApiData(fetchOverview);
  const [page, setPage] = useState({ items: [], cursor: null, status: 'loading' });
  const request = useRef(0);

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
      <PageTitle center title={<><span className="text-sky" aria-hidden="true">✦ </span>รายชื่อ VTuber ไทย<span className="text-brand" aria-hidden="true"> ✦</span></>}>
        {stats ? (
          <span className="inline-flex flex-wrap items-center justify-center gap-2">
            <span className="size-2 rounded-full bg-mint shadow-[0_0_8px_var(--color-mint)]" aria-hidden="true" />
            <span className="font-semibold text-ink">{fmt(stats.total_vtubers)} คน</span>
            <span className="text-faint">· เรียงตามตัวอักษร</span>
          </span>
        ) : null}
      </PageTitle>

      {statsError && <div className="mx-auto mt-6 max-w-[1920px] px-4 sm:px-6 lg:px-8"><DataError onRetry={retryStats} /></div>}

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mx-auto mt-10 max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="card relative overflow-hidden p-5 sm:p-6">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand to-transparent opacity-80" aria-hidden="true" />
          <div className="grid gap-4 md:grid-cols-12 md:items-end">
            <label htmlFor="dir-q" className="flex flex-col gap-1.5 text-sm md:col-span-6">
              <span className="flex items-center gap-1.5 font-medium text-muted"><Search size={15} className="text-brand" aria-hidden="true" />ชื่อหรือสังกัด</span>
              <span className="field">
                <Search size={18} className="ml-3.5 shrink-0 text-faint" aria-hidden="true" />
                <input id="dir-q" type="search" value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="off" placeholder="พิมพ์ชื่อวีหรือชื่อค่าย" className="min-h-12 min-w-0 flex-1 bg-transparent px-2.5 text-base text-ink outline-none placeholder:text-faint" />
                {draft && (
                  <button type="button" onClick={() => setDraft('')} className="mr-2 grid size-8 shrink-0 place-items-center rounded-full text-faint transition hover:bg-card hover:text-ink">
                    <X size={16} aria-hidden="true" /><span className="sr-only">ล้างคำค้น</span>
                  </button>
                )}
              </span>
            </label>
            <div className="md:col-span-3">
              <FilterSelect id="dir-platform" label="แพลตฟอร์ม" icon={Network} tone="text-sky" value={filters.platform} options={platformOptions} onChange={(platform) => setFilters((f) => ({ ...f, platform }))} />
            </div>
            <div className="md:col-span-3">
              <FilterSelect id="dir-status" label="สถานะ" icon={BadgeCheck} tone="text-lemon" value={filters.status} options={statusOptions} onChange={(status) => setFilters((f) => ({ ...f, status }))} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="seg" role="group" aria-label="สังกัด">
                {SCOPES.map(([v, label]) => (
                  <button key={v || 'all'} type="button" aria-pressed={filters.scope === v} onClick={() => setFilters((f) => ({ ...f, scope: v }))}>{label}</button>
                ))}
              </div>
              {filtered && (
                <button type="button" onClick={clear} className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-sm text-muted transition hover:bg-raised hover:text-ink">
                  <X size={14} aria-hidden="true" /> ล้างตัวกรอง
                </button>
              )}
            </div>
            <p className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
              <span className="size-2 rounded-full bg-sky" aria-hidden="true" />
              {page.status === 'loading' ? 'กำลังโหลด…' : <>แสดง <strong className="font-semibold text-ink">{fmt(page.items.length)}</strong> คน{page.cursor ? ' (ยังมีต่อ)' : ''}</>}
            </p>
          </div>
        </div>
      </form>

      <section className="mx-auto mt-6 max-w-[1920px] px-4 sm:px-6 lg:px-8" aria-busy={page.status === 'loading'}>
        {page.status === 'error' && page.items.length === 0 ? (
          <DataError onRetry={() => load()} />
        ) : page.status !== 'loading' && page.items.length === 0 ? (
          <div className="card p-6">
            <p className="font-semibold">{filters.q ? `ไม่เจอ “${filters.q}”` : 'ไม่เจอใครตรงกับตัวกรองนี้'}</p>
            <p className="mt-1 text-sm text-muted">ลองพิมพ์ชื่อให้สั้นลงหรือล้างตัวกรอง ถ้ายังไม่เจอ อาจเป็นวีที่เรายังไม่รู้จัก</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={clear} className="btn btn-secondary">ล้างตัวกรอง</button>
              <a href="/contribute" className="btn btn-primary">แนะนำวีคนนี้ให้เรา</a>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="hidden items-center justify-between border-b border-line bg-deep/80 px-6 py-3.5 text-sm font-semibold text-muted md:flex" aria-hidden="true">
              <span className="flex items-center gap-2"><IdCard size={17} className="text-brand" />ข้อมูลครีเอเตอร์ / สังกัด</span>
              <span className="flex items-center gap-2"><ExternalLink size={16} className="text-sky" />ช่องทางทางการ</span>
            </div>
            <ul className={`divide-y divide-line/50 ${page.status === 'loading' ? 'opacity-50' : ''}`}>
              {page.status === 'loading' && page.items.length === 0
                ? [0, 1, 2, 3, 4].map((i) => <li key={i} className="h-20 animate-pulse" />)
                : page.items.map((c, i) => <CreatorRow key={`${c.name}-${i}`} creator={c} />)}
            </ul>
          </div>
        )}

        {page.cursor && page.status !== 'loading' && (
          <div className="mt-8 flex justify-center">
            <button type="button" onClick={() => load(true, page.cursor)} disabled={page.status === 'more'} className="btn btn-secondary px-8">
              <span className="size-2 rounded-full bg-brand shadow-[0_0_8px_var(--color-brand)]" aria-hidden="true" />
              {page.status === 'more' ? 'กำลังโหลด…' : 'โหลดเพิ่มอีก 24 คน'}
            </button>
          </div>
        )}
        {page.status === 'error' && page.items.length > 0 && <DataError className="mt-4" onRetry={() => load(true, page.cursor)} />}
      </section>
    </Layout>
  );
}
