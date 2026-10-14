// One working day plotted over the home hero's contour ground (#632):
// four timestamped stops joined by a dashed accent route, with a caption.
// Desktop only (lg and up); it fills the hero's right half.

const STOPS = [
  { x: 18, y: 16, time: "06:40", place: "Job site" },
  { x: 72, y: 30, time: "09:15", place: "On the road" },
  { x: 34, y: 60, time: "13:30", place: "Client's office" },
  { x: 82, y: 80, time: "21:05", place: "Home" },
];

const MONO_LABEL = "font-mono text-label tracking-[.08em] uppercase";

export default function HeroWaypoints() {
  return (
    <div className="relative hidden lg:block">
      {/* Stretched to the column, so stops and route share % coordinates;
          the stroke stays 1.5px however the box is stretched. */}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full text-fig"
      >
        <polyline
          points={STOPS.map((stop) => `${stop.x},${stop.y}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="6 6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <ol className="m-0 list-none p-0">
        {STOPS.map((stop) => (
          <li
            key={stop.time}
            className="absolute flex -translate-x-[9px] -translate-y-[9px] items-start gap-3"
            style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
          >
            <span
              aria-hidden="true"
              className="grid size-[18px] shrink-0 place-items-center rounded-full border-2 border-fig bg-bg"
            >
              <span className="size-1.5 rounded-full bg-fig" />
            </span>
            <span className="grid gap-1 bg-bg/80 pr-1">
              <span className="font-mono text-h3 leading-none text-ink tabular-nums">
                {stop.time}
              </span>
              <span className={`text-muted ${MONO_LABEL}`}>{stop.place}</span>
            </span>
          </li>
        ))}
      </ol>
      <p
        className={`absolute right-0 bottom-0 m-0 text-right text-muted ${MONO_LABEL}`}
      >
        One working day · four offices · one IT team
      </p>
    </div>
  );
}
