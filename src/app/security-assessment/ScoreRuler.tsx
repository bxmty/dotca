"use client";

import { useEffect, useState } from "react";
import {
  RISK_TIERS,
  type QuizConfig,
  type QuizSegment,
  type RiskTier,
} from "@/lib/security-assessment/quizTypes";

type SegmentThresholds = QuizConfig["thresholds"][QuizSegment];

// The results score (#688, direction B): a ruler with one tick per point,
// lit up to the score, over the four tier bands with the hit band in the
// pale-purple highlight. The figure counts up and the ticks light in order,
// once, over 1.1 s; under reduced motion both show their end state. Exposed
// to assistive tech as one meter, so the counting figure is never read out.

const COUNT_UP_MS = 1100;
const TICK_HEIGHT = 24;

type ScoreRulerProps = {
  score: number;
  maxScore: number;
  thresholds: SegmentThresholds;
  tier: RiskTier;
  tierLabels: Record<RiskTier, string>;
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function useCountUp(target: number) {
  const [value, setValue] = useState(() =>
    prefersReducedMotion() ? target : 0,
  );

  useEffect(() => {
    // Re-scoring after a review lands on the new score the same way
    if (prefersReducedMotion()) {
      const frame = window.requestAnimationFrame(() => setValue(target));
      return () => window.cancelAnimationFrame(frame);
    }
    const start = window.performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_UP_MS);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [target]);

  return value;
}

/** Tier bands as [start, end) score ranges, worst first. */
function getTierBands(thresholds: SegmentThresholds, maxScore: number) {
  const starts: Record<RiskTier, number> = {
    exposed: 0,
    reactive: thresholds.reactive,
    managed: thresholds.managed,
    resilient: thresholds.resilient,
  };
  return RISK_TIERS.map((tier, index) => ({
    tier,
    start: starts[tier],
    end:
      index < RISK_TIERS.length - 1 ? starts[RISK_TIERS[index + 1]] : maxScore,
  }));
}

const toPercent = (value: number, maxScore: number) =>
  `${(value / maxScore) * 100}%`;

export default function ScoreRuler({
  score,
  maxScore,
  thresholds,
  tier,
  tierLabels,
}: ScoreRulerProps) {
  const displayedScore = useCountUp(score);
  const bands = getTierBands(thresholds, maxScore);
  const hitBand = bands.find((band) => band.tier === tier);
  const majorEvery = maxScore > 40 ? 10 : 5;
  const ticks = Array.from({ length: maxScore + 1 }, (_, value) => value);

  return (
    <div
      role="meter"
      aria-label="Score"
      aria-valuemin={0}
      aria-valuemax={maxScore}
      aria-valuenow={score}
      aria-valuetext={`${score} of ${maxScore}, ${tierLabels[tier]}`}
      className="grid gap-2"
    >
      <p aria-hidden="true" className="m-0 flex items-baseline gap-2.5">
        <span className="font-mono text-section leading-none text-fig tabular-nums">
          {displayedScore}
        </span>
        <span className="font-mono text-small text-muted">
          / {maxScore} points
        </span>
      </p>

      <div aria-hidden="true" className="grid gap-1">
        <div className="relative h-8.5 border-b-[1.2px] border-ink">
          {hitBand && (
            <span
              data-testid="hit-band"
              className="absolute top-1 bottom-0 bg-hl"
              style={{
                left: toPercent(hitBand.start, maxScore),
                width: toPercent(hitBand.end - hitBand.start, maxScore),
              }}
            />
          )}
          {/* Stretched to the width, so ticks and bands share score units;
              strokes keep their px width however the box is stretched. */}
          <svg
            viewBox={`0 0 ${maxScore} ${TICK_HEIGHT}`}
            preserveAspectRatio="none"
            className="absolute inset-x-0 top-0 h-[calc(100%+4px)] w-full overflow-visible"
          >
            {[...bands.map((band) => band.start), maxScore].map((edge) => (
              <line
                key={`edge-${edge}`}
                x1={edge}
                y1={0}
                x2={edge}
                y2={TICK_HEIGHT + 4}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                className="stroke-ink"
              />
            ))}
            {ticks.map((value) => {
              const isLit = value > 0 && value <= score;
              const isMajor = value % majorEvery === 0;
              return (
                <line
                  key={value}
                  data-lit={isLit}
                  x1={value}
                  y1={TICK_HEIGHT}
                  x2={value}
                  y2={isMajor ? 4 : 12}
                  strokeWidth={isLit ? 2 : 1}
                  vectorEffect="non-scaling-stroke"
                  className={
                    isLit
                      ? "stroke-fig motion-safe:animate-light-up"
                      : isMajor
                        ? "stroke-ink"
                        : "stroke-field"
                  }
                  style={
                    isLit
                      ? {
                          animationDelay: `${(value / score) * COUNT_UP_MS}ms`,
                        }
                      : undefined
                  }
                />
              );
            })}
          </svg>
        </div>

        <div className="relative h-4 font-mono text-label text-muted tabular-nums">
          {ticks
            .filter((value) => value % majorEvery === 0)
            .map((value) => (
              <span
                key={value}
                className="absolute -translate-x-1/2"
                style={{ left: toPercent(value, maxScore) }}
              >
                {value}
              </span>
            ))}
        </div>

        <div
          className="grid font-mono text-label tracking-[.06em] text-muted uppercase"
          style={{
            gridTemplateColumns: bands
              .map((band) => `${band.end - band.start}fr`)
              .join(" "),
          }}
        >
          {bands.map((band) => (
            <span
              key={band.tier}
              className={`min-w-0 truncate pr-1 ${
                band.tier === tier ? "font-medium text-ink" : "max-sm:invisible"
              }`}
            >
              {tierLabels[band.tier]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
