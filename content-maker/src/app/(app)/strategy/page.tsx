import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { parseObj } from "@/lib/json";

type Persona = {
  swot?: { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] };
  goals?: { m3?: string; m6?: string; m12?: string };
};

export default async function StrategyPage() {
  const s = await requireSession();
  const strategy = await prisma.creatorStrategy.findFirst({
    where: { tenantId: s.tid },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  const persona = parseObj<Persona>(strategy?.personaJson, {});
  const v = strategy?.versions[0];

  const swotBlocks: [string, string, string[]][] = [
    ["نقاط القوة", "b-green", persona.swot?.strengths ?? []],
    ["نقاط الضعف", "b-amber", persona.swot?.weaknesses ?? []],
    ["الفرص", "b-primary", persona.swot?.opportunities ?? []],
    ["المخاطر", "b-rose", persona.swot?.threats ?? []],
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>الهوية والاستراتيجية</h1>
          <p>استراتيجية العلامة الشخصية — مع إصدارات واعتماد.</p>
        </div>
        <div className="actions">
          {v && <span className="badge b-green">النسخة المعتمدة v{v.version}</span>}
        </div>
      </div>

      <div className="grid g-2" style={{ marginBottom: 16 }}>
        {[["الرؤية", strategy?.vision], ["الرسالة", strategy?.mission], ["الوعد للجمهور", strategy?.promise]].map(([t, val]) => (
          <div className="card card-pad" key={t}>
            <div className="faint" style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{t}</div>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>{val || "—"}</div>
          </div>
        ))}
      </div>

      <div className="grid g-4" style={{ marginBottom: 16 }}>
        {swotBlocks.map(([title, cls, items]) => (
          <div className="card card-pad" key={title}>
            <div className={`badge ${cls}`} style={{ marginBottom: 10 }}>{title}</div>
            {items.map((x) => <div key={x} style={{ fontSize: 13, marginBottom: 6 }}>• {x}</div>)}
            {items.length === 0 && <div className="faint" style={{ fontSize: 12 }}>—</div>}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head"><h3>أهداف ٣ / ٦ / ١٢ شهرًا</h3></div>
        <div className="card-pad">
          {[["٣ أشهر", persona.goals?.m3], ["٦ أشهر", persona.goals?.m6], ["١٢ شهرًا", persona.goals?.m12]].map(([t, g]) => (
            <div className="row between" key={t} style={{ padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
              <b style={{ fontSize: 13 }}>{t}</b><span className="faint" style={{ fontSize: 13 }}>{g || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
