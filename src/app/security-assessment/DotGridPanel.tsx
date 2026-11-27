import type { ReactNode } from "react";

// The perimeter direction's plotting ground (#688): a rule-coloured dot grid
// with ink crop marks at the four corners, like a figure plate in a manual.
// Square, with no fill of its own beyond the page ground.

const CORNER_CLASS_NAMES = [
  "top-1.5 left-1.5 border-t-[1.5px] border-l-[1.5px]",
  "top-1.5 right-1.5 border-t-[1.5px] border-r-[1.5px]",
  "bottom-1.5 left-1.5 border-b-[1.5px] border-l-[1.5px]",
  "bottom-1.5 right-1.5 border-b-[1.5px] border-r-[1.5px]",
];

export default function DotGridPanel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative bg-bg bg-[radial-gradient(var(--rule)_1px,transparent_1.2px)] bg-size-[14px_14px] ${className}`}
    >
      {CORNER_CLASS_NAMES.map((cornerClassName) => (
        <span
          key={cornerClassName}
          aria-hidden="true"
          className={`pointer-events-none absolute size-3 border-0 border-ink ${cornerClassName}`}
        />
      ))}
      {children}
    </div>
  );
}
