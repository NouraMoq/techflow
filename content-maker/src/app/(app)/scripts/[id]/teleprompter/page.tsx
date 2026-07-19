import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Teleprompter from "./Teleprompter";

export default async function TeleprompterPage({ params }: { params: { id: string } }) {
  const s = await requireSession();
  const script = await prisma.script.findFirst({ where: { id: params.id, tenantId: s.tid, deletedAt: null } });
  if (!script) notFound();

  const lines = [
    { label: "Hook", text: script.hook },
    { label: "المقدمة", text: script.intro },
    { label: "المحتوى", text: script.body },
    { label: "CTA", text: script.cta },
  ].filter((l) => l.text && l.text.trim()) as { label: string; text: string }[];

  return (
    <>
      <div className="page-head" style={{ marginBottom: 12 }}>
        <div>
          <Link href={`/scripts/${script.id}`} className="faint" style={{ fontSize: 13 }}>← عودة للمحرر</Link>
          <h1 style={{ marginTop: 6 }}>Teleprompter — {script.title}</h1>
        </div>
      </div>
      {lines.length > 0
        ? <Teleprompter lines={lines} />
        : <div className="card card-pad faint">لا نص كافٍ للعرض — أضف Hook/مقدمة/محتوى في المحرر.</div>}
    </>
  );
}
