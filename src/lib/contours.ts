// Topographic contour field behind every page hero (#631). Pure and
// deterministic: the same hills always trace the same paths, so the
// server-rendered SVG never disagrees with the client (no hydration
// mismatch). Coordinates are in the CONTOUR_VIEWBOX user space.

export type ContourHill = {
  /** Peak position in viewBox units. */
  cx: number;
  cy: number;
  /** Number of concentric rings around the peak. */
  rings: number;
  /** Radius added per ring. */
  step: number;
};

export type ContourRing = {
  /** Stable React key, unique across hills. */
  key: string;
  /** Closed SVG path (`M…L…Z`). */
  path: string;
  radius: number;
  /** Every fifth ring is an index contour: heavier, in the accent. */
  isIndex: boolean;
};

export const CONTOUR_VIEWBOX = "0 0 1600 700";

/** Three hills sitting to the right, as picked in the hero prototype. */
export const CONTOUR_HILLS: readonly ContourHill[] = [
  { cx: 1180, cy: 260, rings: 16, step: 26 },
  { cx: 1560, cy: 640, rings: 12, step: 30 },
  { cx: 760, cy: 760, rings: 9, step: 34 },
];

const POINTS_PER_RING = 120;
const INDEX_INTERVAL = 5;
const HORIZONTAL_STRETCH = 1.25;

/** Slightly irregular closed ring; `ringIndex` and `seed` vary the wobble. */
function traceRing({
  cx,
  cy,
  radius,
  ringIndex,
  seed,
}: {
  cx: number;
  cy: number;
  radius: number;
  ringIndex: number;
  seed: number;
}): string {
  const points = Array.from({ length: POINTS_PER_RING }, (_, i) => {
    const t = (i / POINTS_PER_RING) * Math.PI * 2;
    const wobble =
      1 +
      0.13 * Math.sin(3 * t + seed + ringIndex * 0.17) +
      0.07 * Math.sin(5 * t + 1.9 * seed - ringIndex * 0.11) +
      0.04 * Math.sin(7 * t + ringIndex * 0.3);
    const x = cx + radius * wobble * Math.cos(t) * HORIZONTAL_STRETCH;
    const y = cy + radius * wobble * Math.sin(t);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `M${points.join("L")}Z`;
}

/** Every hill's rings, each hill largest first so its peak is drawn last. */
export function traceContourRings(
  hills: readonly ContourHill[] = CONTOUR_HILLS,
): ContourRing[] {
  return hills.flatMap((hill, hillIndex) =>
    Array.from({ length: hill.rings }, (_, i) => {
      const ringIndex = hill.rings - i;
      const radius = ringIndex * hill.step;
      return {
        key: `${hillIndex}-${ringIndex}`,
        path: traceRing({
          cx: hill.cx,
          cy: hill.cy,
          radius,
          ringIndex,
          seed: 0.6 + hillIndex,
        }),
        radius,
        isIndex: ringIndex % INDEX_INTERVAL === 0,
      };
    }),
  );
}
