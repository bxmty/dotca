import DotGridPanel from "./DotGridPanel";

// The assessment landing's aside (#688, direction B): defence in layers,
// drawn as four rings on the dot-grid plate. A scan wedge turns once on load
// and lights the covered checkpoints as it passes; the open ones stay
// hollow. Decorative, so hidden from assistive tech. Pass it as PageHero's
// `aside`, which hides it below lg.

const CENTRE = 150;
const SWEEP_DURATION_S = 1.8;
// The wedge starts at -60° (keyframes `sweep` in globals.css)
const SWEEP_START_DEG = -60;

const LAYERS = [
  { label: "Devices", radius: 40 },
  { label: "Accounts", radius: 68 },
  { label: "Network", radius: 96 },
  { label: "People", radius: 124 },
];

/**
 * Checkpoints by ring radius and bearing (0° is north, clockwise). Bearings
 * from 0° to about 45° stay clear: the ring labels sit there.
 */
const CHECKPOINTS = [
  { radius: 40, bearing: 200, isCovered: true },
  { radius: 40, bearing: 320, isCovered: true },
  { radius: 68, bearing: 60, isCovered: true },
  { radius: 68, bearing: 140, isCovered: false },
  { radius: 68, bearing: 250, isCovered: true },
  { radius: 96, bearing: 80, isCovered: true },
  { radius: 96, bearing: 190, isCovered: false },
  { radius: 96, bearing: 300, isCovered: true },
  { radius: 124, bearing: 55, isCovered: true },
  { radius: 124, bearing: 120, isCovered: true },
  { radius: 124, bearing: 230, isCovered: false },
];

const CHECKPOINT_SIZE = 8;

function getPoint(radius: number, bearing: number) {
  const radians = ((bearing - 90) * Math.PI) / 180;
  return {
    x: CENTRE + radius * Math.cos(radians),
    y: CENTRE + radius * Math.sin(radians),
  };
}

/** When the wedge's leading edge reaches a bearing, in seconds. */
function getSweepDelay(bearing: number) {
  const degreesTravelled = (bearing - SWEEP_START_DEG + 360) % 360;
  return (degreesTravelled / 360) * SWEEP_DURATION_S;
}

export default function PerimeterRings() {
  return (
    <DotGridPanel className="grid place-items-center self-center p-6">
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 300 300"
        className="block h-auto w-full max-w-[480px]"
      >
        <line
          x1={CENTRE}
          y1={10}
          x2={CENTRE}
          y2={290}
          className="stroke-rule"
        />
        <line
          x1={10}
          y1={CENTRE}
          x2={290}
          y2={CENTRE}
          className="stroke-rule"
        />
        {/* One turn, ending transparent; never drawn under reduced motion */}
        <path
          d="M150 150 L150 18 A132 132 0 0 1 264 84 Z"
          className="fill-fig opacity-0 [transform-box:view-box] [transform-origin:150px_150px] motion-safe:animate-sweep"
        />
        {LAYERS.map(({ label, radius }, index) => (
          <g key={label}>
            <circle
              cx={CENTRE}
              cy={CENTRE}
              r={radius}
              fill="none"
              strokeWidth={1}
              strokeDasharray={index === 0 ? undefined : "2 4"}
              className={index === 0 ? "stroke-ink" : "stroke-field"}
            />
            <text
              x={CENTRE + 4}
              y={CENTRE - radius + 11}
              className="fill-muted font-mono text-[9.5px] tracking-[.06em] uppercase"
            >
              {label}
            </text>
          </g>
        ))}
        {CHECKPOINTS.map(({ radius, bearing, isCovered }) => {
          const { x, y } = getPoint(radius, bearing);
          return (
            <rect
              key={`${radius}-${bearing}`}
              data-covered={isCovered}
              x={x - CHECKPOINT_SIZE / 2}
              y={y - CHECKPOINT_SIZE / 2}
              width={CHECKPOINT_SIZE}
              height={CHECKPOINT_SIZE}
              strokeWidth={1.2}
              className={
                isCovered
                  ? "fill-fig stroke-fig motion-safe:animate-light-up"
                  : "fill-cell stroke-ink"
              }
              style={
                isCovered
                  ? { animationDelay: `${getSweepDelay(bearing)}s` }
                  : undefined
              }
            />
          );
        })}
        <circle cx={CENTRE} cy={CENTRE} r={3} className="fill-ink" />
      </svg>
    </DotGridPanel>
  );
}
