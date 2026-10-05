// "What the data says" cards for /analytics: each card's headline is the finding, computed from
// summary.insights (count-only aggregates published by the data pipeline). Definitions follow Master's insights.
import { ArrowRight } from 'lucide-react';
import { BRAND, NEUTRAL, RAMP } from '../components/ui.jsx';
import PlatformIcon from '../components/PlatformIcon.jsx';
import { Waffle } from '../components/charts.jsx';
import { fmt, pct } from '../lib/api.js';

const TIERS = ['independent', 'small_mid', 'big'];
const TIER_LABEL = { independent: 'วีอิสระ', small_mid: 'ค่ายเล็ก/กลาง', big: 'ค่ายใหญ่' };
const TIER_COLOR = { independent: BRAND, small_mid: RAMP[2], big: NEUTRAL };
const BAND_LABEL = { '<1K': 'ต่ำกว่า 1K', '1K-10K': '1K–10K', '10K-100K': '10K–100K', '100K+': '100K ขึ้นไป' };
const sumTiers = (r) => TIERS.reduce((a, t) => a + (r[t] || 0), 0);
const Hi = ({ children }) => <span className="text-brand">{children}</span>;

function TierLegend({ tiers = TIERS }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
      {tiers.map((t) => (
        <li key={t} className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: TIER_COLOR[t] }} aria-hidden="true" />{TIER_LABEL[t]}</li>
      ))}
    </ul>
  );
}

function InsightCard({ title, children, note, className = '' }) {
  return (
    <article className={`card flex flex-col p-5 sm:p-6 ${className}`}>
      <h3 className="text-xl leading-snug sm:text-2xl">{title}</h3>
      <div className="mt-5 flex-1">{children}</div>
      {note && <p className="mt-5 border-t border-line pt-3 text-xs text-faint">{note}</p>}
    </article>
  );
}

/** One 100%-stacked bar per row; segments labelled with their % when wide enough. */
function StackRows({ rows, keys, colors, labelWidth = '6.5rem' }) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const total = keys.reduce((a, k) => a + (r.values[k] || 0), 0) || 1;
        return (
          <li key={r.label} className="grid items-center gap-3 text-sm" style={{ gridTemplateColumns: `${labelWidth} 1fr` }}>
            <span className="font-medium">{r.label}</span>
            <span className="flex h-8 overflow-hidden rounded-md" title={keys.map((k) => `${k}: ${fmt(r.values[k] || 0)}`).join(' / ')}>
              {keys.map((k) => {
                const p = ((r.values[k] || 0) / total) * 100;
                return (
                  <span key={k} className="flex items-center px-2 text-xs font-semibold" style={{ width: `${p}%`, background: colors[k], color: k === keys[0] ? 'var(--color-on-brand)' : 'var(--color-ink)' }}>
                    {p >= 9 ? `${Math.round(p)}%` : ''}
                  </span>
                );
              })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function TierShare({ ins }) {
  const c = Object.fromEntries(ins.tiers.map((t) => [t.tier, t.count]));
  const total = sumTiers(c);
  const notBig = 100 - (pct(c.big, total) ?? 0);
  return (
    <InsightCard title={<><Hi>{notBig}%</Hi> ของวีไทย<br />ไม่ได้อยู่ค่ายใหญ่</>} note={`ค่ายใหญ่ = สมาชิกในทะเบียน 5 คนขึ้นไป และยอดผู้ติดตาม YouTube รวม 500K ขึ้นไป (ตอนนี้มี ${ins.big_agency_count} ค่าย) · 1 ช่อง = 1%`}>
      <Waffle label="สัดส่วนวีตามประเภทสังกัด" parts={TIERS.map((t) => ({ label: TIER_LABEL[t], value: c[t], color: TIER_COLOR[t] }))} />
    </InsightCard>
  );
}

function StillActive({ ins }) {
  const rows = ins.activity;
  const active = rows.reduce((a, r) => a + r.active, 0);
  const indie = rows.find((r) => r.tier === 'independent');
  const max = Math.max(...rows.map((r) => r.scanned), 1);
  return (
    <InsightCard title={<>วีที่ยังทำอยู่ <Hi>{pct(indie.active, active)}%</Hi><br />เป็นวีอิสระ</>} note={`ยังทำอยู่ = มีคลิปใหม่ใน 90 วัน · นับเฉพาะ ${fmt(ins.basis.activity_scanned)} ช่องที่ระบบตรวจการลงคลิปได้`}>
      <div className="flex h-56 items-end justify-around gap-4">
        {rows.map((r) => (
          <div key={r.tier} className="flex h-full w-full max-w-28 flex-col items-center justify-end">
            <span className="mb-1 font-display text-lg tabular-nums">{fmt(r.active)}</span>
            <div className="relative w-full rounded-t-md" style={{ height: `${(r.scanned / max) * 82}%`, background: `color-mix(in srgb, ${TIER_COLOR[r.tier]} 22%, transparent)` }} title={`ตรวจได้ ${fmt(r.scanned)} · ยังทำอยู่ ${fmt(r.active)}`}>
              <span className="absolute inset-x-0 bottom-0 rounded-t-md" style={{ height: `${(r.active / r.scanned) * 100}%`, background: TIER_COLOR[r.tier] }} />
            </div>
            <span className="mt-2 text-center text-sm">{TIER_LABEL[r.tier]}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">สีเข้ม = มีคลิปใหม่ใน 90 วัน · สีจาง = ทั้งหมดที่ตรวจได้</p>
    </InsightCard>
  );
}

function ActiveDots({ ins }) {
  const a = Object.fromEntries(ins.activity.map((r) => [r.tier, r.active]));
  const times = a.big ? Math.round(a.independent / a.big) : null;
  const dots = (n) => Math.round(n / 10);
  return (
    <InsightCard title={<>วีอิสระที่ยังทำอยู่<br />มากกว่าค่ายใหญ่ <Hi>{times ?? '—'} เท่า</Hi></>} note="1 จุด = 10 คน · นับคนที่มีคลิปใหม่ใน 90 วัน">
      {['independent', 'big'].map((t) => (
        <div key={t} className="mb-5">
          <p className="flex justify-between text-sm"><span className="font-medium">{TIER_LABEL[t]}ที่ยังทำอยู่</span><span className="font-display text-lg tabular-nums">{fmt(a[t])}</span></p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="img" aria-label={`${TIER_LABEL[t]} ${a[t]} คน`}>
            {Array.from({ length: Math.max(dots(a[t]), a[t] ? 1 : 0) }, (_, i) => <span key={i} className="size-3 rounded-full" style={{ background: TIER_COLOR[t] }} />)}
          </div>
        </div>
      ))}
    </InsightCard>
  );
}

function BandsByTier({ ins }) {
  const rows = ins.size_bands.map((b) => ({ label: BAND_LABEL[b.band] || b.band, values: b }));
  const small = ins.size_bands.filter((b) => b.band === '<1K' || b.band === '1K-10K');
  const smallTotal = small.reduce((a, b) => a + sumTiers(b), 0);
  const smallNotBig = small.reduce((a, b) => a + b.independent + b.small_mid, 0);
  return (
    <InsightCard title={<>ช่องเล็ก <Hi>{pct(smallNotBig, smallTotal)}%</Hi><br />ไม่ใช่ค่ายใหญ่</>} note={`ใช้ช่อง YouTube ที่มีผู้ติดตามมากที่สุดของแต่ละคน · ${fmt(ins.basis.with_youtube_followers)} ช่องที่มียอดผู้ติดตาม`}>
      <TierLegend />
      <div className="mt-4"><StackRows rows={rows} keys={TIERS} colors={TIER_COLOR} /></div>
    </InsightCard>
  );
}

function BandLines({ ins }) {
  const bands = ins.size_bands;
  const share = (b, t) => (sumTiers(b) ? (b[t] / sumTiers(b)) * 100 : 0);
  const last = bands.at(-1);
  const indieLeads = share(last, 'independent') >= share(last, 'big');
  const W = 560, H = 220, padL = 34, padR = 96, padY = 14;
  const X = (i) => padL + (i * (W - padL - padR)) / (bands.length - 1);
  const Y = (v) => H - padY - (v / 100) * (H - 2 * padY);
  return (
    <InsightCard title={<>ยิ่งช่องใหญ่ ค่ายใหญ่ยิ่งเยอะ<br />{indieLeads ? <>แต่<Hi>วีอิสระยังนำ</Hi></> : <>และ<Hi>ค่ายใหญ่นำ</Hi></>}</>} note="สัดส่วนของช่องในแต่ละช่วงยอดผู้ติดตาม YouTube">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" role="img" aria-label="สัดส่วนประเภทสังกัดในแต่ละช่วงยอดผู้ติดตาม">
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}><line x1={padL} x2={W - padR} y1={Y(v)} y2={Y(v)} stroke="var(--color-line)" /><text x={padL - 6} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="var(--color-faint)">{v}%</text></g>
        ))}
        {bands.map((b, i) => <text key={b.band} x={X(i)} y={H + 18} textAnchor="middle" fontSize="12" fill="var(--color-muted)">{BAND_LABEL[b.band] || b.band}</text>)}
        {TIERS.map((t) => (
          <g key={t}>
            <polyline points={bands.map((b, i) => `${X(i)},${Y(share(b, t))}`).join(' ')} fill="none" stroke={TIER_COLOR[t]} strokeWidth="2.75" strokeLinejoin="round" />
            {bands.map((b, i) => <circle key={b.band} cx={X(i)} cy={Y(share(b, t))} r="4.5" fill={TIER_COLOR[t]} />)}
            <text x={X(bands.length - 1) + 10} y={Y(share(last, t)) + 4} fontSize="13" fontWeight="600" fill="var(--color-ink)">{Math.round(share(last, t))}% <tspan fontWeight="400" fill="var(--color-muted)" fontSize="11">{TIER_LABEL[t]}</tspan></text>
          </g>
        ))}
      </svg>
    </InsightCard>
  );
}

function TierBands({ ins }) {
  const order = ['<1K', '1K-10K', '10K-100K', '100K+'];
  const colors = Object.fromEntries(order.map((b, i) => [b, RAMP[RAMP.length - 1 - i] ?? RAMP[0]]));
  colors['100K+'] = RAMP[0];
  const rows = TIERS.map((t) => ({ label: TIER_LABEL[t], values: Object.fromEntries(ins.size_bands.map((b) => [b.band, b[t]])) }));
  const big = rows[2].values;
  const bigTotal = order.reduce((a, b) => a + (big[b] || 0), 0);
  return (
    <InsightCard title={<>ช่องค่ายใหญ่ <Hi>{pct((big['10K-100K'] || 0) + (big['100K+'] || 0), bigTotal)}%</Hi><br />อยู่ระดับ 10K ขึ้นไป</>} note="ช่วงยอดผู้ติดตามของช่อง YouTube หลัก แยกตามประเภทสังกัด">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        {order.map((b) => <li key={b} className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: colors[b] }} aria-hidden="true" />{BAND_LABEL[b]}</li>)}
      </ul>
      <div className="mt-4"><StackRows rows={rows} keys={order} colors={colors} labelWidth="7rem" /></div>
    </InsightCard>
  );
}

function SmallChoices({ ins }) {
  const small = ins.size_bands.filter((b) => b.band === '<1K' || b.band === '1K-10K');
  const notBig = small.reduce((a, b) => a + b.independent + b.small_mid, 0);
  const indie = small.reduce((a, b) => a + b.independent, 0);
  const big = small.reduce((a, b) => a + b.big, 0);
  const rounded = Math.floor(notBig / 100) * 100;
  return (
    <InsightCard title={<>อยากจุ่มวีตัวเล็ก<br />มีให้เลือก<Hi>เกือบ {fmt(rounded + 100)} ช่อง</Hi></>} note="ช่องที่มีผู้ติดตาม YouTube ต่ำกว่า 10K">
      <p className="text-sm font-medium">ช่องต่ำกว่า 10K ที่ไม่ใช่ค่ายใหญ่</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex h-12 flex-1 overflow-hidden rounded-md">
          <span style={{ width: `${(indie / notBig) * 100}%`, background: TIER_COLOR.independent }} />
          <span style={{ width: `${((notBig - indie) / notBig) * 100}%`, background: TIER_COLOR.small_mid }} />
        </div>
        <span className="font-display text-2xl tabular-nums">{fmt(notBig)}</span>
      </div>
      <p className="mt-5 text-sm font-medium">ช่องต่ำกว่า 10K ของค่ายใหญ่</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="h-12 w-1.5 rounded-full" style={{ background: TIER_COLOR.big }} />
        <span className="font-display text-2xl tabular-nums">{fmt(big)}</span>
      </div>
      <a href="/directory?scope=independent" className="btn btn-secondary mt-5">ดูวีอิสระทั้งหมด <ArrowRight size={15} aria-hidden="true" /></a>
    </InsightCard>
  );
}

function NewDebuts({ ins }) {
  const thisYear = new Date().getFullYear();
  const full = ins.debuts_by_tier.filter((r) => r.year < thisYear && sumTiers(r) > 0);
  const show = full.slice(-4);
  const last = full.at(-1);
  if (!last) return null;
  const max = Math.max(...show.map(sumTiers), 1);
  return (
    <InsightCard title={<>วีหน้าใหม่ปี {last.year}<br /><Hi>{pct(last.independent, sumTiers(last))}%</Hi> เป็นวีอิสระ</>} note="ปีเดบิวต์จากเหตุการณ์เดบิวต์ที่มีหลักฐาน · ใช้สังกัดปัจจุบัน สมาชิกใหม่ของค่ายอาจยังไม่ถูกบันทึก">
      <TierLegend />
      <div className="mt-4 flex h-56 items-end justify-around gap-4">
        {show.map((r) => {
          const total = sumTiers(r);
          return (
            <div key={r.year} className="flex h-full w-full max-w-24 flex-col items-center justify-end">
              <span className="mb-1 text-sm tabular-nums text-muted">{fmt(total)}</span>
              <div className="flex w-full flex-col-reverse overflow-hidden rounded-t-md" style={{ height: `${(total / max) * 85}%` }}>
                {TIERS.map((t) => <span key={t} className="block w-full shrink-0" style={{ height: `${(r[t] / total) * 100}%`, background: TIER_COLOR[t] }} title={`${TIER_LABEL[t]}: ${fmt(r[t])}`} />)}
              </div>
              <span className="mt-2 text-sm font-medium">ปี {r.year}</span>
            </div>
          );
        })}
      </div>
    </InsightCard>
  );
}

function LiveWhere({ ins }) {
  const combos = [...ins.live_combos].sort((a, b) => b.count - a.count);
  const total = combos.reduce((a, c) => a + c.count, 0);
  const ytOnly = combos.find((c) => c.platforms.length === 1 && c.platforms[0] === 'youtube');
  const multi = combos.filter((c) => c.platforms.length > 1).reduce((a, c) => a + c.count, 0);
  const max = Math.max(...combos.map((c) => c.count), 1);
  return (
    <InsightCard className="lg:col-span-2" title={<>วีไทย <Hi>{pct(ytOnly?.count, total)}%</Hi> อยู่บน YouTube อย่างเดียว<br />อีก <Hi>{pct(multi, total)}%</Hi> อยู่หลายแพลตฟอร์มพร้อมกัน</>} note={`นับจากบัญชี YouTube / Twitch / TikTok ที่ยืนยันแล้ว ไม่ได้ดูว่าไลฟ์พร้อมกันจริงไหม · อีก ${fmt(ins.no_live_platform)} คนไม่มีบัญชีบนสามแพลตฟอร์มนี้`}>
      <ul className="grid gap-x-10 gap-y-3 md:grid-cols-2">
        {combos.filter((c) => c.count > 0).map((c) => (
          <li key={c.platforms.join('+')} className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3 text-sm" title={`${fmt(c.count)} คน · วีอิสระ ${fmt(c.independent)}`}>
            <span className="flex items-center gap-1.5">{c.platforms.map((p) => <PlatformIcon key={p} name={p} size={17} />)}</span>
            <span className="relative h-3 rounded-full bg-deep" aria-hidden="true">
              <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(c.count / max) * 100}%`, background: NEUTRAL }} />
              <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(c.independent / max) * 100}%`, background: BRAND }} />
            </span>
            <span className="text-right tabular-nums text-muted">{fmt(c.count)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex flex-wrap gap-x-4 text-sm text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand" aria-hidden="true" />วีอิสระ</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: NEUTRAL }} aria-hidden="true" />มีสังกัด</span>
      </p>
    </InsightCard>
  );
}

/** The whole "what the data says" block; renders nothing until the snapshot carries insights. */
export default function Insights({ ins }) {
  if (!ins) return null;
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <TierShare ins={ins} />
        <StillActive ins={ins} />
        <ActiveDots ins={ins} />
        <SmallChoices ins={ins} />
        <BandsByTier ins={ins} />
        <BandLines ins={ins} />
        <TierBands ins={ins} />
        <NewDebuts ins={ins} />
        <LiveWhere ins={ins} />
      </div>
      <p className="mt-3 text-right text-xs text-faint">ข้อมูลประมาณการ ณ {ins.basis.data_as_of} · ไม่ควรใช้อ้างอิงทางวิชาการ</p>
    </>
  );
}
