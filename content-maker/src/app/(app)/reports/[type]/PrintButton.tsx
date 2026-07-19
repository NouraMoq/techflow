"use client";
import { IconDoc } from "@/components/icons";

export default function PrintButton() {
  return (
    <button className="btn btn-primary" onClick={() => window.print()}>
      <IconDoc /> طباعة / حفظ PDF
    </button>
  );
}
