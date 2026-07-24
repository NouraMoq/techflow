import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { generateFromTrend } from "@/lib/trends/generate";
import type { ContentDraft } from "@/lib/trends/types";
import { createIdeaFromDraft, createIdeaAndScriptFromDraft } from "../../actions";

export default async function GeneratePage({ params }: { params: { id: string } }) {
  const s = await requireSession();
  const res = await generateFromTrend(s.tid, params.id);
  if (!res) notFound();
  const mayIdea = can(s.role, "idea.create");
  const mayScript = can(s.role, "script.write");

  return (
    <>
      <div className="page-head">
        <div>
          <Link href={`/trends/${params.id}`} className="faint" style={{ fontSize: 12.5 }}>← عودة للترند</Link>
          <h1 style={{ marginTop: 4 }}>اصنع محتوى — {res.topicName}</h1>
          <p>أفكار محتوى جاهزة مُولّدة من هذا الموضوع بزوايا مختلفة. اختر ما يناسب حسابك.</p>
        </div>
      </div>

      <div className="grid g-2">
        {res.drafts.map((d, i) => (
          <div className="card card-pad" key={i}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <b style={{ fontSize: 15 }}>{d.title}</b>
              <span className="badge b-primary">{d.angleLabel}</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.75 }}>
              <p><b>الهدف:</b> {d.goal}</p>
              <p><b>الخطاف:</b> {d.hook}</p>
              <p><b>السيناريو المختصر:</b> {d.shortScript}</p>
              <p><b>الوصف:</b> {d.description}</p>
              <p><b>الدعوة (CTA):</b> {d.cta}</p>
              <div className="row wrap" style={{ gap: 6, margin: "6px 0" }}>
                {d.hashtags.map((h) => <span key={h} className="badge b-slate" style={{ fontSize: 11 }} dir="auto">{h}</span>)}
              </div>
              <p className="faint" style={{ fontSize: 12 }}><b>سبب الاختيار:</b> {d.reason}</p>
            </div>
            <div className="row wrap" style={{ gap: 8, marginTop: 10 }}>
              {mayIdea && (
                <form action={createIdeaFromDraft}>
                  <DraftInputs trendId={params.id} d={d} />
                  <button className="btn btn-soft" style={{ fontSize: 13 }}>أنشئ فكرة</button>
                </form>
              )}
              {mayIdea && mayScript && (
                <form action={createIdeaAndScriptFromDraft}>
                  <DraftInputs trendId={params.id} d={d} />
                  <button className="btn primary" style={{ fontSize: 13 }}>أنشئ فكرة + سيناريو ←</button>
                </form>
              )}
              {!mayIdea && <span className="faint" style={{ fontSize: 12 }}>تحتاج صلاحية إنشاء الأفكار.</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function DraftInputs({ trendId, d }: { trendId: string; d: ContentDraft }) {
  return (
    <>
      <input type="hidden" name="trendId" value={trendId} />
      <input type="hidden" name="title" value={d.title} />
      <input type="hidden" name="description" value={d.description} />
      <input type="hidden" name="cta" value={d.cta} />
      <input type="hidden" name="hook" value={d.hook} />
      <input type="hidden" name="shortScript" value={d.shortScript} />
      <input type="hidden" name="hashtags" value={d.hashtags.join(" ")} />
    </>
  );
}
