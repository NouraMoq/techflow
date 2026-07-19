"use client";
import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children, pendingLabel, className = "btn btn-primary", style,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} style={style} disabled={pending}>
      {pending ? pendingLabel ?? "…" : children}
    </button>
  );
}
