import Layout, { PageTitle } from './Layout.jsx';

const EFFECTIVE = '5 ตุลาคม 2569';

/** One readable column with an in-page contents list on wide screens. sections: [{id, title, body: ReactNode}] */
export default function LegalPage({ title, intro, sections }) {
  return (
    <Layout>
      <PageTitle title={title}>
        {intro}
        <span className="mt-1 block text-sm text-faint">มีผลตั้งแต่ {EFFECTIVE}</span>
      </PageTitle>
      <div className="mx-auto mt-12 grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="หัวข้อในหน้านี้" className="hidden lg:block">
          <ul className="sticky top-24 space-y-2 border-l border-line pl-4 text-sm">
            {sections.map((s) => (
              <li key={s.id}><a className="text-muted hover:text-ink" href={`#${s.id}`}>{s.title}</a></li>
            ))}
          </ul>
        </nav>
        <div className="max-w-[68ch] space-y-10 leading-[1.8]">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-lg">{s.title}</h2>
              <div className="mt-3 space-y-3 text-muted [&_a]:font-medium [&_a]:text-sky hover:[&_a]:underline [&_li]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Layout>
  );
}
