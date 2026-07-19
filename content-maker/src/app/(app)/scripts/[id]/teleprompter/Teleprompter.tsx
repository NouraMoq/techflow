"use client";
import { useEffect, useRef, useState } from "react";

// Simple teleprompter: large text, adjustable size, play/pause auto-scroll.
export default function Teleprompter({ lines }: { lines: { label: string; text: string }[] }) {
  const [size, setSize] = useState(34);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const boxRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) { if (raf.current) cancelAnimationFrame(raf.current); return; }
    const step = () => {
      const el = boxRef.current;
      if (el) {
        el.scrollTop += speed;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) setPlaying(false);
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [playing, speed]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => setPlaying((p) => !p)}>{playing ? "إيقاف" : "تشغيل التمرير"}</button>
        <button className="btn btn-ghost" onClick={() => { setPlaying(false); if (boxRef.current) boxRef.current.scrollTop = 0; }}>البداية</button>
        <div className="seg" style={{ display: "inline-flex", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
          <button className="btn btn-ghost" style={{ padding: "6px 11px" }} onClick={() => setSize((s) => Math.max(20, s - 4))}>ﺃ−</button>
          <button className="btn btn-ghost" style={{ padding: "6px 11px" }} onClick={() => setSize((s) => Math.min(72, s + 4))}>ﺃ+</button>
        </div>
        <div className="seg" style={{ display: "inline-flex", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
          <button className="btn btn-ghost" style={{ padding: "6px 11px" }} onClick={() => setSpeed((s) => Math.max(0.5, s - 0.5))}>أبطأ</button>
          <button className="btn btn-ghost" style={{ padding: "6px 11px" }} onClick={() => setSpeed((s) => Math.min(6, s + 0.5))}>أسرع</button>
        </div>
      </div>
      <div ref={boxRef} className="card"
        style={{ flex: 1, overflowY: "auto", padding: "40px 28px", background: "#0b111c", color: "#e8eef6", lineHeight: 1.8, fontWeight: 700, fontSize: size, textAlign: "center" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 13, color: "#64768c", fontWeight: 700, marginBottom: 10 }}>{l.label}</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{l.text}</div>
          </div>
        ))}
        <div style={{ height: "50vh" }} />
      </div>
    </div>
  );
}
