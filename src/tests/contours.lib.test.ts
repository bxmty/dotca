import { CONTOUR_HILLS, traceContourRings } from "@/lib/contours";

describe("traceContourRings", () => {
  const hill = { cx: 100, cy: 50, rings: 10, step: 8 };

  it("traces one ring per contour on every hill", () => {
    expect(traceContourRings([hill])).toHaveLength(10);
    // The hero's field: 16 + 12 + 9 rings.
    expect(traceContourRings(CONTOUR_HILLS)).toHaveLength(37);
  });

  it("is deterministic, so server and client render the same paths", () => {
    expect(traceContourRings(CONTOUR_HILLS)).toEqual(
      traceContourRings(CONTOUR_HILLS),
    );
  });

  it("traces each ring as a closed 120-point path", () => {
    for (const { path } of traceContourRings([hill])) {
      expect(path).toMatch(
        /^M-?\d+\.\d -?\d+\.\d(L-?\d+\.\d -?\d+\.\d){119}Z$/,
      );
    }
  });

  it("starts each ring on the hill's east side, stretched 1.25x across", () => {
    // Ring k=4 (radius 32): at t=0 wobble = 1 + 0.13 sin(seed + 0.68)
    // + 0.07 sin(1.9 seed - 0.44) + 0.04 sin(1.2) with seed 0.6
    // = 1.20692...; x = 100 + 32 * 1.20692 * 1.25 = 148.28.
    const ring = traceContourRings([hill]).find((r) => r.radius === 32);
    expect(ring?.path.startsWith("M148.3 50.0L")).toBe(true);
  });

  it("marks every fifth ring as an index contour", () => {
    const indexRadii = traceContourRings([hill])
      .filter((ring) => ring.isIndex)
      .map((ring) => ring.radius);
    expect(indexRadii.sort((a, b) => a - b)).toEqual([40, 80]);
  });

  it("orders rings largest first, so the peak is drawn last", () => {
    const radii = traceContourRings([hill]).map((ring) => ring.radius);
    expect(radii[0]).toBe(80);
    expect(radii.at(-1)).toBe(8);
  });

  it("gives every ring a unique key across hills", () => {
    const keys = traceContourRings(CONTOUR_HILLS).map((ring) => ring.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
