"use client";
import { useState } from "react";
import type { HashtagStat } from "@/lib/hashtags";

/** Clickable hashtag chips (click to copy). Data comes pre-aggregated from real tenant content. */
export default function HashtagCloud({ items, compact = false }: { items: HashtagStat[]; compact?: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!items.length) {
    return <p className="faint" style={{ fontSize: 13 }}>لا توجد هاشتاقات بعد — أضِف ترندات أو سيناريوهات لتظهر هنا.</p>;
  }

  const copy = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag);
      setCopied(tag);
      setTimeout(() => setCopied((c) => (c === tag ? null : c)), 1200);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="row wrap" style={{ gap: 8 }}>
      {items.map((h) => (
        <button
          key={h.tag}
          type="button"
          onClick={() => copy(h.tag)}
          title="انقر لنسخ الهاشتاق"
          className="badge b-primary"
          style={{
            cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: compact ? 11 : 12.5, padding: compact ? "4px 9px" : "6px 11px",
          }}
        >
          <span dir="auto">{copied === h.tag ? "✓ نُسخ" : h.tag}</span>
          <span style={{ opacity: 0.65, fontWeight: 800 }}>{h.count}</span>
        </button>
      ))}
    </div>
  );
}
