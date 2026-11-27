// Section head from the Component Spec: sections share one ground and are
// separated by a 2 px ink rule, the way a manual separates chapters. 42 px
// Light heading (28 px on phones) and an optional 18 px muted lede.

type SectionHeadProps = {
  title: string;
  lede?: string;
};

export default function SectionHead({ title, lede }: SectionHeadProps) {
  return (
    <div className="grid max-w-[62ch] gap-2.5 border-t-2 border-ink pt-3.5">
      <h2 className="m-0 text-h2 leading-tight font-light tracking-[-0.02em] text-balance md:text-section">
        {title}
      </h2>
      {lede && <p className="m-0 text-prose text-muted">{lede}</p>}
    </div>
  );
}
