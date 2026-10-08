import type { ReactNode } from "react";

// Status line from the Component Spec: a ruled note with a mono label. The
// left edge and label are fig for success and danger for errors; a plain
// note keeps an ink edge. Errors are announced as alerts, success as a status.

export type StatusTone = "ok" | "error" | "note";

const classNamesByTone: Record<StatusTone, { edge: string; label: string }> = {
  ok: { edge: "border-l-fig", label: "text-fig" },
  error: { edge: "border-l-danger", label: "text-danger" },
  note: { edge: "border-l-ink", label: "" },
};

const rolesByTone: Record<StatusTone, "status" | "alert" | undefined> = {
  ok: "status",
  error: "alert",
  note: undefined,
};

type StatusNoteProps = {
  tone: StatusTone;
  /** The mono label, e.g. "Sent" or "Error". */
  label: string;
  children: ReactNode;
  className?: string;
};

export default function StatusNote({
  tone,
  label,
  children,
  className = "",
}: StatusNoteProps) {
  const { edge, label: labelClassName } = classNamesByTone[tone];
  return (
    <div
      role={rolesByTone[tone]}
      className={`grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1 border border-l-3 border-rule bg-cell px-3.5 py-3 text-small ${edge} ${className}`}
    >
      <b className={`pt-1 font-mono text-label font-medium ${labelClassName}`}>
        {label}
      </b>
      <div className="grid gap-1">{children}</div>
    </div>
  );
}
