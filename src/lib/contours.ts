// Topographic contour field behind every page hero (#631). Pure and
// deterministic: the same hills always trace the same paths, so the
// server-rendered SVG never disagrees with the client (no hydration
// mismatch). Coordinates are in the CONTOUR_VIEWBOX user space.

export type ContourHill = {
  /** Peak position in viewBox units. */
  cx: number;
  cy: number;
  /** Number of concentric rings around the peak. */
  ringCount: number;
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
const CONTOUR_HILLS: readonly ContourHill[] = [
  { cx: 1180, cy: 260, ringCount: 16, step: 26 },
  { cx: 1560, cy: 640, ringCount: 12, step: 30 },
  { cx: 760, cy: 760, ringCount: 9, step: 34 },
];

const POINTS_PER_RING = 120;
const INDEX_INTERVAL = 5;
const HORIZONTAL_STRETCH = 1.25;
/** Each hill's wobble seed is this plus its index, so no two hills match. */
const HILL_SEED_OFFSET = 0.6;

/**
 * The wobble is a sum of sine harmonics around the ring. Each harmonic's
 * phase shifts with the hill's seed and the ring's index, so neighbouring
 * rings drift apart slightly instead of nesting as perfect copies.
 */
const WOBBLE_HARMONICS: readonly {
  /** Lobes around the ring. */
  frequency: number;
  /** Fraction of the radius the harmonic pushes in or out. */
  amplitude: number;
  /** Phase shift per unit of seed. */
  seedPhase: number;
  /** Phase shift per ring index. */
  ringPhase: number;
}[] = [
  { frequency: 3, amplitude: 0.13, seedPhase: 1, ringPhase: 0.17 },
  { frequency: 5, amplitude: 0.07, seedPhase: 1.9, ringPhase: -0.11 },
  { frequency: 7, amplitude: 0.04, seedPhase: 0, ringPhase: 0.3 },
];

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
    const angleRadians = (i / POINTS_PER_RING) * Math.PI * 2;
    const wobble = WOBBLE_HARMONICS.reduce(
      (sum, { frequency, amplitude, seedPhase, ringPhase }) =>
        sum +
        amplitude *
          Math.sin(
            frequency * angleRadians + seedPhase * seed + ringIndex * ringPhase,
          ),
      1,
    );
    const x =
      cx + radius * wobble * Math.cos(angleRadians) * HORIZONTAL_STRETCH;
    const y = cy + radius * wobble * Math.sin(angleRadians);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `M${points.join("L")}Z`;
}

/** Every hill's rings, each hill largest first so its peak is drawn last. */
export function traceContourRings(
  hills: readonly ContourHill[] = CONTOUR_HILLS,
): ContourRing[] {
  return hills.flatMap((hill, hillIndex) =>
    Array.from({ length: hill.ringCount }, (_, i) => {
      const ringIndex = hill.ringCount - i;
      const radius = ringIndex * hill.step;
      return {
        key: `${hillIndex}-${ringIndex}`,
        path: traceRing({
          cx: hill.cx,
          cy: hill.cy,
          radius,
          ringIndex,
          seed: HILL_SEED_OFFSET + hillIndex,
        }),
        radius,
        isIndex: ringIndex % INDEX_INTERVAL === 0,
      };
    }),
  );
}
