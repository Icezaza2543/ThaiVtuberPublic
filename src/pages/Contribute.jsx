import { CircleCheck, ClipboardCheck, ExternalLink, ListChecks, ShieldCheck } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { CONTRIBUTE_FORM_URL } from '../lib/api.js';

const NEEDS = [
  ['ชื่อที่ใช้ต่อสาธารณะ', 'ชื่อตัวละครหรือชื่อช่องตามที่ใช้จริง ไม่ใช่ชื่อจริง ถ้าแจ้งแก้ไขหรือจบกิจกรรม ใช้ชื่อหรือลิงก์ตามที่แสดงบน VThaiDex'],
  ['ลิงก์ช่องทางหลัก และช่องทางอื่นถ้ามี', 'YouTube, Twitch, TikTok, Facebook, X หรือแพลตฟอร์มอื่น ลิงก์หน้าโดเนตใส่ได้เฉพาะหน้าโปรไฟล์ ไม่ใช่เลขบัญชีหรือ QR'],
  ['หลักฐานความเกี่ยวข้องกับไทย', 'ลิงก์คลิปหรือไลฟ์ภาษาไทย bio ที่ระบุว่าเป็นคนไทย หรือประกาศของสังกัดไทย ไม่ต้องระบุสัญชาติหรือข้อมูลส่วนตัว'],
  ['หลักฐานการใช้โมเดลหรืออวตาร', 'ลิงก์คลิป ไลฟ์ หรือโพสต์ที่เห็นตัวละครชัดเจน พร้อมระบุประเภท เช่น VTuber, PNGtuber หรือ VArtist'],
  ['ลิงก์ประกาศ เมื่อแจ้งจบกิจกรรมหรือเปิดตัวตนใหม่', 'เราบันทึก "จบกิจกรรม" เฉพาะเมื่อมีประกาศสาธารณะ ส่วนคนที่ไม่ได้ลงคลิปนาน ระบบนับเป็น "ไม่เคลื่อนไหว" ให้เอง'],
  ['สังกัด ปีเดบิวต์ หรือข้อมูลอื่น', 'ไม่บังคับ ถ้าไม่ทราบสังกัดจะนับเป็น Independent และใส่แค่ปีเดบิวต์ได้ ไม่ต้องเดาวันที่'],
];
const CHECK_TONES = ['text-brand', 'text-sky', 'text-lilac', 'text-lemon', 'text-peach', 'text-mint'];

/** Star decals for the banner card (vector stage sparkle). */
function Sparkles() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-40" fill="none" viewBox="0 0 900 240" preserveAspectRatio="xMidYMid slice">
      <circle cx="80" cy="40" fill="var(--color-brand)" r="1.5" />
      <circle cx="210" cy="70" fill="var(--color-lemon)" r="2" />
      <circle cx="430" cy="25" fill="var(--color-mint)" r="1.5" />
      <circle cx="760" cy="60" fill="var(--color-sky)" r="2.5" />
      <circle cx="850" cy="110" fill="var(--color-brand)" r="1.5" />
      <path d="M120 160 L122 153 L129 151 L122 149 L120 142 L118 149 L111 151 L118 153 Z" fill="var(--color-brand)" opacity="0.6" />
      <path d="M780 180 L781.5 174 L787 172.5 L781.5 171 L780 165 L778.5 171 L773 172.5 L778.5 174 Z" fill="var(--color-lemon)" opacity="0.5" />
      <path d="M640 45 L641.5 39 L647 37.5 L641.5 36 L640 30 L638.5 36 L633 37.5 L638.5 39 Z" fill="var(--color-sky)" opacity="0.7" />
    </svg>
  );
}

export default function Contribute() {
  return (
    <Layout>
      <div className="relative mx-auto max-w-[1920px] px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <div className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-56 w-96 -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute right-8 top-24 -z-10 size-64 rounded-full bg-sky/10 blur-2xl" aria-hidden="true" />

        <header className="card relative overflow-hidden p-6 text-center sm:p-10">
          <Sparkles />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center">
            <h1 className="text-[2rem] leading-tight drop-shadow-[0_2px_12px_rgb(255_95_162/0.3)] sm:text-[2.75rem]">แจ้งข้อมูล</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              เสนอรายชื่อใหม่ แจ้งแก้ไขข้อมูลที่คลาดเคลื่อน แจ้งการจบกิจกรรม หรือขอนำข้อมูลออก (เฉพาะเจ้าของช่องหรือสังกัด) ผู้ดูแลตรวจสอบหลักฐานสาธารณะทุกรายการก่อนปรับปรุงสารบบ
            </p>
          </div>
        </header>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-12">
          <section aria-labelledby="needs" className="card overflow-hidden lg:col-span-7">
            <div className="flex items-center gap-2 bg-raised px-6 py-3">
              <span className="relative flex size-3" aria-hidden="true">
                <span className="absolute inline-flex size-full rounded-full bg-brand opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex size-3 rounded-full bg-brand" />
              </span>
              <h2 id="needs" className="flex items-center gap-1.5 font-sans text-base font-semibold"><ListChecks size={17} className="text-brand" aria-hidden="true" />เตรียมข้อมูลเหล่านี้</h2>
            </div>
            <ul className="flex flex-col gap-3 p-5 sm:p-6">
              {NEEDS.map(([title, hint], i) => (
                <li key={title} className="flex items-start gap-3 rounded-xl bg-paper/80 p-4 transition hover:bg-paper">
                  <span className={`icon-tile size-9 rounded-lg ${CHECK_TONES[i % CHECK_TONES.length]}`}><CircleCheck size={20} aria-hidden="true" /></span>
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-snug">{i + 1}. {title}</p>
                    <p className="mt-0.5 text-muted">{hint}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="card overflow-hidden lg:col-span-5">
            <div className="p-6">
              <div className="flex items-center gap-3">
                <span className="icon-tile size-12 rounded-xl text-brand"><ClipboardCheck size={24} aria-hidden="true" /></span>
                <h2 className="text-2xl">ส่งผ่าน Google Form</h2>
              </div>
              <p className="mt-4 text-muted">เลือกประเภทคำขอ แล้วฟอร์มจะถามเฉพาะข้อที่เกี่ยวข้อง ใช้เวลาประมาณ 3 นาที ไม่ต้องเข้าสู่ระบบ และไม่เก็บอีเมลของคุณ</p>
              {CONTRIBUTE_FORM_URL ? (
                <a href={CONTRIBUTE_FORM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-6 w-full !min-h-12 text-lg">
                  เปิดฟอร์มแจ้งข้อมูล <ExternalLink size={18} aria-hidden="true" />
                </a>
              ) : (
                <p className="mt-6 rounded-xl border border-dashed border-line px-5 py-3 text-center text-muted">
                  ฟอร์มแจ้งข้อมูลจะเปิดเร็ว ๆ นี้
                </p>
              )}
            </div>
            <p className="flex items-start gap-2 border-t border-line bg-well px-6 py-4 text-sm text-muted">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
              <span>
                ส่งเฉพาะข้อมูลที่เปิดเผยต่อสาธารณะแล้ว ห้ามส่งชื่อจริง ที่อยู่ หรือข้อมูลส่วนตัวของใคร ดู{' '}
                <a className="font-medium text-sky hover:underline" href="/privacy">นโยบายความเป็นส่วนตัว</a>
              </span>
            </p>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
