"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { importAndAnalyze, type ImportState } from "./actions";

const SOURCES = [
  { key: "mock", label: "بيانات تجريبية" },
  { key: "manual", label: "إشارة يدوية" },
  { key: "csv", label: "استيراد CSV" },
  { key: "json", label: "استيراد JSON" },
];
const PLANNED = ["Google Trends", "TikTok Creative Center", "TikTok الرسمي", "مزوّد مرخّص"];

function SubmitBtn() {
  const { pending } = useFormStatus();
  return <button className="btn primary" disabled={pending} style={{ fontSize: 13 }}>{pending ? "جارٍ التحليل…" : "استورد وحلّل ←"}</button>;
}

export default function DiscoverPanel() {
  const [state, action] = useFormState<ImportState, FormData>(importAndAnalyze, {});
  const [source, setSource] = useState("mock");

  return (
    <div className="card card-pad">
      <b style={{ fontSize: 15 }}>اكتشف موضوعات رائجة</b>
      <p className="faint" style={{ fontSize: 12.5, margin: "6px 0 12px" }}>
        اختر مصدرًا؛ يستوعب النظام الإشارات، يستخرج الموضوع الحقيقي، يجمّع المتشابه، ثم يقيس النمو والملاءمة لك.
      </p>

      <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}>
        {SOURCES.map((sc) => (
          <button key={sc.key} type="button" onClick={() => setSource(sc.key)}
            className={`btn ${source === sc.key ? "primary" : "btn-ghost"}`} style={{ fontSize: 12.5 }}>{sc.label}</button>
        ))}
      </div>

      <form action={action}>
        <input type="hidden" name="source" value={source} />
        {source === "manual" && (
          <>
            <div className="field"><label>نص الإشارة (وصف أو عنوان فيديو)</label>
              <textarea name="text" rows={2} placeholder="مثال: ليش ارتفاع أسعار القهوة المختصة هالفترة؟" /></div>
            <div className="field"><label>هاشتاقات (اختياري، بمسافات)</label>
              <input name="hashtags" placeholder="#قهوة #قهوة_مختصة" /></div>
          </>
        )}
        {source === "csv" && (
          <div className="field"><label>محتوى CSV — الأعمدة: text,hashtags,views,likes,shares,accounts,postedAt</label>
            <textarea name="csv" rows={5} placeholder={"text,hashtags,views,likes,shares,accounts,postedAt\nروتين العناية بالبشرة,#عناية #بشرة,320000,41000,5200,1,2026-07-18"} /></div>
        )}
        {source === "json" && (
          <div className="field"><label>محتوى JSON — مصفوفة عناصر فيها text و hashtags و views…</label>
            <textarea name="json" rows={5} placeholder={'[{"text":"انتقالات المرآة","hashtags":["#انتقالات"],"views":260000,"likes":30000,"shares":4100,"postedAt":"2026-07-18"}]'} /></div>
        )}
        {source === "mock" && (
          <p className="faint" style={{ fontSize: 12.5, marginBottom: 10 }}>سيُحمّل مجموعة إشارات تجريبية عبر ٣ موضوعات لتجربة الاستخراج والتجميع والقياس.</p>
        )}

        <div className="row wrap" style={{ gap: 10, marginTop: 8, alignItems: "center" }}>
          <SubmitBtn />
          {state.ok && <span style={{ color: "var(--green)", fontSize: 13 }}>✓ استوعب {state.imported} إشارة ← {state.topics} موضوع. راجع تبويب «② حلّل».</span>}
          {state.error && <span style={{ color: "var(--rose)", fontSize: 13 }}>{state.error}</span>}
        </div>
      </form>

      <p className="faint" style={{ fontSize: 11.5, marginTop: 14 }}>
        مصادر قادمة (مغلقة حتى تتوفّر مفاتيح رسمية): {PLANNED.join(" · ")}.
      </p>
    </div>
  );
}
