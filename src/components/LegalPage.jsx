import Layout, { PageTitle } from './Layout.jsx';

const EFFECTIVE = '5 ตุลาคม 2569';

/** One readable column with an in-page contents list on wide screens. sections: [{id, title, body: ReactNode}] */
export default function LegalPage({ title, intro, sections }) {
  return (
    <Layout>
      <PageTitle title={title} wide>
        {intro}
        <span className="mt-1 block text-sm text-faint">มีผลตั้งแต่ {EFFECTIVE}</span>
      </PageTitle>
      <div className="mx-auto mt-10 grid max-w-[1920px] gap-10 px-4 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8">
        <nav aria-label="หัวข้อในหน้านี้" className="hidden lg:block">
          <ul className="card sticky top-24 space-y-1 p-3 text-sm">
            {sections.map((s) => (
              <li key={s.id}><a className="block rounded-lg px-3 py-2 text-muted transition hover:bg-raised hover:text-ink" href={`#${s.id}`}>{s.title}</a></li>
            ))}
          </ul>
        </nav>
        <div className="card space-y-10 p-6 leading-[1.9] sm:p-10 lg:p-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="flex items-center gap-2.5 text-xl"><span className="h-5 w-1.5 rounded-full bg-brand" aria-hidden="true" />{s.title}</h2>
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
