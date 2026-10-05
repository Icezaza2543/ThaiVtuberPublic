import { Check, ExternalLink } from 'lucide-react';
import Layout, { PageTitle } from '../components/Layout.jsx';
import { CONTRIBUTE_FORM_URL } from '../lib/api.js';

const NEEDS = [
  ['ชื่อที่ใช้ต่อสาธารณะ', 'ชื่อ VTuber ตามที่ใช้ในช่อง ไม่ใช่ชื่อจริง'],
  ['ลิงก์ช่องหลักอย่างน้อยหนึ่งช่อง', 'YouTube, Twitch, TikTok, X หรือแพลตฟอร์มอื่น'],
  ['หลักฐานว่าเกี่ยวข้องกับไทย', 'ลิงก์คลิปหรือไลฟ์ภาษาไทย หรือ bio ที่ระบุว่าเป็นคนไทย'],
  ['หลักฐานว่าใช้โมเดลหรือ avatar', 'ลิงก์คลิปหรือไลฟ์ที่เห็นตัวละครชัดเจน'],
  ['สังกัด ปีเดบิวต์ หรือสถานะ', 'ไม่บังคับ ถ้าไม่ทราบสังกัดจะนับเป็น Independent'],
];

export default function Contribute() {
  return (
    <Layout>
      <PageTitle title="แจ้งข้อมูล">
        เพิ่มรายชื่อใหม่ แก้ข้อมูลที่ผิด หรือแจ้งว่าใครจบกิจกรรมแล้ว ทีมงานตรวจหลักฐานสาธารณะทุกรายการก่อนเปลี่ยนสารบบ
      </PageTitle>

      <div className="mx-auto mt-12 grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section aria-labelledby="needs">
          <h2 id="needs" className="font-display text-2xl font-semibold">เตรียมข้อมูลเหล่านี้</h2>
          <ul className="mt-6 space-y-5">
            {NEEDS.map(([title, hint]) => (
              <li key={title} className="flex gap-3">
                <Check className="mt-1 shrink-0 text-onair" size={20} strokeWidth={3} aria-hidden="true" />
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-muted">{hint}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="plate h-fit rounded-2xl p-7">
          <h2 className="font-display text-xl font-semibold">ส่งผ่าน Google Form</h2>
          <p className="mt-2 text-muted">ใช้เวลาประมาณ 3 นาที ไม่ต้องเข้าสู่ระบบ และไม่เก็บอีเมลของคุณ</p>
          {CONTRIBUTE_FORM_URL ? (
            <a
              href={CONTRIBUTE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-onair px-5 py-3.5 font-semibold text-paper hover:bg-lemon"
            >
              เปิดฟอร์มแจ้งข้อมูล <ExternalLink size={17} aria-hidden="true" />
            </a>
          ) : (
            <p className="mt-6 rounded-lg border-2 border-dashed border-line px-5 py-3.5 text-center font-semibold text-muted">
              ฟอร์มแจ้งข้อมูลจะเปิดเร็ว ๆ นี้
            </p>
          )}
          <p className="mt-5 text-sm text-muted">
            ส่งเฉพาะข้อมูลที่เปิดเผยต่อสาธารณะแล้ว ห้ามส่งชื่อจริง ที่อยู่ หรือข้อมูลส่วนตัวของใคร ดู{' '}
            <a className="font-medium text-sky underline underline-offset-4" href="/privacy">นโยบายความเป็นส่วนตัว</a>
          </p>
        </aside>
      </div>
    </Layout>
  );
}
