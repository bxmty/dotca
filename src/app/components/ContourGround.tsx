import type { CSSProperties } from "react";
import { CONTOUR_VIEWBOX, traceContourRings } from "@/lib/contours";

// Topographic contour ground behind a page hero (#631). Decorative inline
// SVG: no image request, so the H1 stays the LCP element (decision 7), and
// the strokes use theme tokens so it follows light/dark. Paths are traced
// once at module load; the generator is deterministic, so server and client
// agree.

const RINGS = traceContourRings();

/** Index contours (every fifth ring) are drawn heavier than the rest. */
const INDEX_STROKE_WIDTH_PX = 1.4;
const MINOR_STROKE_WIDTH_PX = 0.8;

const FADE_GRADIENTS =
  "linear-gradient(to right, transparent 10%, black 60%), linear-gradient(to bottom, black 60%, transparent)";

/** Strongest top-right, fading out behind the copy and toward the bottom. */
const FADE: CSSProperties = {
  maskImage: FADE_GRADIENTS,
  maskComposite: "intersect",
  WebkitMaskImage: FADE_GRADIENTS,
  WebkitMaskComposite: "source-in",
};

export default function ContourGround() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full max-md:opacity-35"
      style={FADE}
      viewBox={CONTOUR_VIEWBOX}
      preserveAspectRatio="xMaxYMid slice"
    >
      {RINGS.map((ring) => (
        <path
          key={ring.key}
          d={ring.path}
          fill="none"
          stroke="currentColor"
          strokeWidth={
            ring.isIndex ? INDEX_STROKE_WIDTH_PX : MINOR_STROKE_WIDTH_PX
          }
          className={ring.isIndex ? "text-fig" : "text-rule"}
        />
      ))}
    </svg>
  );
}
