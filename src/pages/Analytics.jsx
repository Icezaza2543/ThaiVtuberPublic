import { useEffect, useState } from 'react';
import { ArrowRight, RotateCw } from 'lucide-react';
import Layout, { PageTitle } from '../components/Layout.jsx';
import { HelpTip, Legend, PENLIGHT, platformColor, ShareBars, YearBars } from '../components/ui.jsx';
import { fetchOverview, fmt, formatDate, pct, platformLabel, STATUS_LABELS } from '../lib/api.js';

const byYear = (rows, key = 'count') => Object.fromEntries((rows || []).map((r) => [r.year, r[key]]));

function Section({ title, help, children }) {
  return (
    <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
      <h2 className="flex items-center gap-2 text-xl">{title}{help && <HelpTip>{help}</HelpTip>}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Card({ title, help, aside, className = '', children }) {
  return (
    <div className={`card p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-base">{title}{help && <HelpTip>{help}</HelpTip>}</h3>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function KeyNumbers({ d }) {
  const span = d.platform_span || [];
  const multi = span.filter((r) => r.platforms >= 2).reduce((a, r) => a + r.count, 0);
  const years = (d.debut_trend || []).filter((r) => r.year < new Date().getFullYear() && r.known_debuts > 0);
  const last = years.at(-1);
  const cards = [
    { value: fmt(d.total_vtubers), label: 'VTuber ไทยทั้งหมด', color: PENLIGHT[0] },
    Number.isFinite(d.independent_count) && { value: fmt(d.independent_count), label: 'วีอิสระ', sub: `${pct(d.independent_count, d.total_vtubers)}% ของทั้งหมด`, color: PENLIGHT[1] },
    Number.isFinite(d.agency_total) && { value: fmt(d.agency_total), label: 'สังกัด', sub: `มีสมาชิก ${fmt(d.total_vtubers - d.independent_count)} คน`, color: PENLIGHT[3] },
    last && { value: fmt(last.known_debuts), label: `เดบิวต์ปี ${last.year}`, sub: 'เท่าที่ทราบปีเดบิวต์', color: PENLIGHT[2] },
    span.length > 0 && { value: `${pct(multi, d.total_vtubers)}%`, label: 'มีมากกว่าหนึ่งช่องทาง', color: PENLIGHT[4] },
  ].filter(Boolean);
  return (
    <ul className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-3 px-4 sm:px-6 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <li key={c.label} className="card p-4 sm:p-5">
          <span className="block h-1 w-8 rounded-full" style={{ background: c.color }} aria-hidden="true" />
          <p className="mt-3 font-display text-2xl tabular-nums">{c.value}</p>
          <p className="text-sm">{c.label}</p>
          {c.sub && <p className="text-xs text-faint">{c.sub}</p>}
        </li>
      ))}
    </ul>
  );
}

function GrowthLine({ rows }) {
  const pts = (rows || []).filter((r) => r.cumulative_known_debuts > 0);
  if (pts.length < 2) return <p className="text-sm text-muted">ข้อมูลยังไม่พอวาดกราฟ</p>;
  const W = 600, H = 200, pad = 8;
  const max = pts.at(-1).cumulative_known_debuts;
  const xy = pts.map((r, i) => [pad + (i * (W - 2 * pad)) / (pts.length - 1), H - pad - (r.cumulative_known_debuts / max) * (H - 2 * pad)]);
  const line = xy.map((p) => p.join(',')).join(' ');
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full" role="img" aria-label={`จำนวนสะสมเพิ่มจาก ${fmt(pts[0].cumulative_known_debuts)} เป็น ${fmt(max)} คน`}>
        <defs>
          <linearGradient id="growth" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={PENLIGHT[0]} stopOpacity="0.35" />
            <stop offset="1" stopColor={PENLIGHT[0]} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${xy[0][0]},${H - pad} ${line} ${xy.at(-1)[0]},${H - pad}`} fill="url(#growth)" />
        <polyline points={line} fill="none" stroke={PENLIGHT[0]} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {xy.map(([x, y], i) => <circle key={pts[i].year} cx={x} cy={y} r="3.5" fill={PENLIGHT[0]}><title>{`${pts[i].year}: ${fmt(pts[i].cumulative_known_debuts)}`}</title></circle>)}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-faint" aria-hidden="true">
        <span>{pts[0].year}</span><span>{pts.at(-1).year}</span>
      </div>
    </figure>
  );
}

function WholeIndustry({ d }) {
  const all = byYear(d.debut_trend, 'known_debuts');
  const indie = byYear(d.independent_debut_trend);
  const years = Object.keys(all).map(Number).filter((y) => all[y] > 0).sort();
  const split = (d.independent_debut_trend || []).length > 0;
  const agency = Object.fromEntries(years.map((y) => [y, Math.max((all[y] || 0) - (indie[y] || 0), 0)]));
  const breakdown = d.platform_breakdown || (d.platforms || []).map((p) => ({ platform: p.platform, count: p.count }));
  return (
    <Section title="ทั้งวงการ">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="เดบิวต์ต่อปี"
          help={`นับเฉพาะ ${fmt(d.known_debut_year_count)} คนที่ทราบปีเดบิวต์ (${pct(d.known_debut_year_count, d.total_vtubers)}%) ปีล่าสุดยังไม่จบปี`}
          aside={split && <Legend items={[{ label: 'วีอิสระ', color: PENLIGHT[1] }, { label: 'มีสังกัด', color: PENLIGHT[3] }]} />}
        >
          <YearBars label="เดบิวต์ต่อปี" years={years} series={split ? [{ key: 'i', color: PENLIGHT[1], values: indie }, { key: 'a', color: PENLIGHT[3], values: agency }] : [{ key: 'all', color: PENLIGHT[1], values: all }]} />
        </Card>
        <Card title="จำนวนสะสม" help="จำนวนวีที่ทราบปีเดบิวต์ รวมสะสมตั้งแต่ปีแรก">
          <GrowthLine rows={d.debut_trend} />
        </Card>
        <Card
          className="lg:col-span-2"
          title="อยู่บนแพลตฟอร์มไหน"
          help="หนึ่งคนอยู่ได้หลายแพลตฟอร์ม ผลรวมจึงเกินจำนวนวีทั้งหมด"
          aside={d.platform_breakdown && <Legend items={[{ label: 'สีเข้ม = วีอิสระ', color: '#ece9f7' }, { label: 'สีจาง = มีสังกัด', color: '#ece9f7', faded: true }]} />}
        >
          <div className="grid gap-x-12 md:grid-cols-2">
            {[breakdown.slice(0, 6), breakdown.slice(6, 12)].map((rows, col) => (
              <ShareBars
                key={col}
                max={breakdown[0]?.count}
                rows={rows.map((r, i) => ({ key: r.platform, label: platformLabel(r.platform), value: r.count, part: r.independent, color: platformColor(r.platform, i + col * 6) }))}
              />
            ))}
          </div>
        </Card>
      </div>
    </Section>
  );
}

function ByPlatform({ d }) {
  const rows = (d.platform_breakdown || []).slice(0, 8);
  const [sel, setSel] = useState(rows[0]?.platform);
  if (!rows.length) return null;
  const r = rows.find((x) => x.platform === sel) || rows[0];
  const i = rows.indexOf(r);
  const color = platformColor(r.platform, i);
  const years = (r.debut_years || []).filter((y) => y.count > 0);
  return (
    <Section title="แยกตามแพลตฟอร์ม">
      <div role="tablist" aria-label="แพลตฟอร์ม" className="flex flex-wrap gap-2">
        {rows.map((x) => (
          <button key={x.platform} role="tab" type="button" id={`tab-${x.platform}`} aria-selected={x.platform === r.platform} aria-controls="platform-panel" className="chip" onClick={() => setSel(x.platform)}>
            {platformLabel(x.platform)}
          </button>
        ))}
      </div>
      <div id="platform-panel" role="tabpanel" aria-labelledby={`tab-${r.platform}`} className="card mt-4 grid gap-8 p-5 sm:p-6 lg:grid-cols-[2fr_3fr]">
        <div>
          <span className="block h-1 w-10 rounded-full" style={{ background: color }} aria-hidden="true" />
          <p className="mt-3 font-display text-3xl tabular-nums">{fmt(r.count)}</p>
          <p className="text-muted">วีไทยบน {platformLabel(r.platform)} คิดเป็น {pct(r.count, d.total_vtubers)}% ของทั้งหมด</p>
          <div className="mt-6">
            <div className="flex justify-between text-sm"><span>วีอิสระ</span><span className="tabular-nums">{pct(r.independent, r.count)}%</span></div>
            <div className="mt-1.5 h-2 rounded-full bg-deep" aria-hidden="true"><div className="h-full rounded-full" style={{ width: `${pct(r.independent, r.count)}%`, background: color }} /></div>
            <p className="mt-1.5 text-sm text-faint">{fmt(r.independent)} คนไม่มีสังกัด</p>
          </div>
          <a href={`/directory?platform=${encodeURIComponent(r.platform)}&scope=independent`} className="btn btn-secondary mt-6">
            ดูวีอิสระบน {platformLabel(r.platform)} <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>
        <div>
          <h3 className="flex items-center gap-1.5 text-base">เดบิวต์ต่อปีบน {platformLabel(r.platform)}<HelpTip>นับเฉพาะคนที่ทราบปีเดบิวต์</HelpTip></h3>
          <div className="mt-5">
            {years.length ? <YearBars label={`เดบิวต์ต่อปีบน ${platformLabel(r.platform)}`} years={years.map((y) => y.year)} series={[{ key: 'p', color, values: byYear(years) }]} height={170} /> : <p className="text-sm text-muted">ยังไม่มีข้อมูลปีเดบิวต์บนแพลตฟอร์มนี้</p>}
          </div>
        </div>
      </div>
    </Section>
  );
}

function IndieVsAgency({ d }) {
  const sizes = d.agency_sizes || [];
  const maxMembers = Math.max(...sizes.map((s) => s.members), d.independent_count || 0, 1);
  const span = d.platform_span || [];
  const spanTotal = span.reduce((a, r) => a + r.count, 0) || 1;
  const life = (d.lifecycle || []).filter((r) => r.count > 0);
  return (
    <Section title="วีอิสระกับค่าย" help="ไม่มีการจัดอันดับค่าย เราแสดงเฉพาะว่าค่ายขนาดไหนมีกี่แห่ง เพราะอยากให้คนเห็นวีตัวเล็กมากกว่า">
      <div className="grid gap-4 lg:grid-cols-3">
        {sizes.length > 0 && (
          <Card title="วีอยู่ที่ไหนกันบ้าง" className="lg:col-span-2">
            <ul className="space-y-4">
              {[{ label: 'ไม่มีสังกัด', note: 'วีอิสระ', members: d.independent_count, color: PENLIGHT[1] },
                ...sizes.map((s, i) => ({ label: `ค่าย ${s.size} คน`, note: `${fmt(s.agencies)} ค่าย`, members: s.members, color: PENLIGHT[[3, 2, 5, 0][i] ?? 3] }))].map((row) => (
                <li key={row.label} className="grid grid-cols-[7rem_1fr_4rem] items-center gap-3 text-sm">
                  <span>{row.label}<span className="block text-xs text-faint">{row.note}</span></span>
                  <span className="h-2.5 rounded-full bg-deep" aria-hidden="true"><span className="bar-grow block h-full rounded-full" style={{ width: `${(row.members / maxMembers) * 100}%`, background: row.color }} /></span>
                  <span className="text-right tabular-nums text-muted">{fmt(row.members)} คน</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <div className="flex flex-col gap-4">
        {span.length > 0 && (
          <Card title="มีกี่ช่องทาง" help="นับช่องทางทางการที่ตรวจแล้วของแต่ละคน">
            <div className="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
              {span.map((r, i) => <span key={r.platforms} style={{ width: `${(r.count / spanTotal) * 100}%`, background: PENLIGHT[i % PENLIGHT.length] }} />)}
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {span.map((r, i) => (
                <li key={r.platforms} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ background: PENLIGHT[i % PENLIGHT.length] }} aria-hidden="true" />
                  {r.platforms >= 5 ? '5 ช่องทางขึ้นไป' : `${r.platforms} ช่องทาง`}
                  <span className="ml-auto tabular-nums text-muted">{pct(r.count, spanTotal)}%</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Card title="สถานะ" help="จากสถานะที่ตรวจแล้ว ไม่ได้เดาจากโพสต์ล่าสุด คนที่จบกิจกรรมยังอยู่ในสารบบ เพราะเป็นส่วนหนึ่งของประวัติวงการ">
          <ul className="space-y-2 text-sm">
            {life.map((r) => (
              <li key={r.status} className="flex justify-between"><span>{STATUS_LABELS[r.status] || r.status}</span><span className="tabular-nums text-muted">{fmt(r.count)}</span></li>
            ))}
          </ul>
        </Card>
        </div>
      </div>
    </Section>
  );
}

export default function Analytics() {
  const [d, setD] = useState(null);
  const [error, setError] = useState(false);
  const load = () => { setError(false); fetchOverview().then(setD, () => setError(true)); };
  useEffect(load, []);
  const updated = formatDate(d?.meta?.generated_at);
  return (
    <Layout>
      <PageTitle title="ข้อมูลวงการ VTuber ไทย">
        {updated ? <span className="text-sm text-faint">อัปเดต {updated}</span> : null}
      </PageTitle>
      {error && (
        <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
          <div className="card p-6">
            <p className="font-medium">โหลดข้อมูลไม่สำเร็จ</p>
            <p className="mt-1 text-sm text-muted">เช็กอินเทอร์เน็ตแล้วลองอีกครั้ง</p>
            <button type="button" onClick={load} className="btn btn-secondary mt-4"><RotateCw size={15} aria-hidden="true" /> โหลดอีกครั้ง</button>
          </div>
        </div>
      )}
      {!d && !error && <div className="mx-auto mt-8 h-96 max-w-6xl animate-pulse rounded-2xl bg-card" aria-label="กำลังโหลดข้อมูล" />}
      {d && (
        <>
          <KeyNumbers d={d} />
          <WholeIndustry d={d} />
          <ByPlatform d={d} />
          <IndieVsAgency d={d} />
        </>
      )}
    </Layout>
  );
}
