import { ButtonLink } from "./Button";
import TickList from "./TickList";

// Single offer from the Component Spec: two ruled cells on one sheet. The
// first holds the price, the action and a mono terms line (in place of the
// green "first month free" alert); the second lists what's included. The
// cells stack below 620 px.

type OfferProps = {
  title: string;
  /** The price with its currency symbol, e.g. "$99". */
  price: string;
  /** What the price buys, e.g. "per month per user". */
  priceUnit: string;
  action: { href: string; label: string };
  terms: string;
  includes: readonly string[];
};

export default function Offer({
  title,
  price,
  priceUnit,
  action,
  terms,
  includes,
}: OfferProps) {
  return (
    <div className="grid max-w-[760px] border border-rule bg-cell min-[620px]:grid-cols-2">
      <div className="grid content-start gap-3 p-5.5">
        <h3 className="m-0 text-h3 leading-tight font-semibold">{title}</h3>
        <p className="m-0 grid gap-1">
          <span className="font-mono text-h2 leading-tight font-medium text-fig tabular-nums">
            {price}
          </span>
          <span className="font-mono text-label text-muted">{priceUnit}</span>
        </p>
        <ButtonLink variant="primary" href={action.href}>
          {action.label}
        </ButtonLink>
        <p className="m-0 border-t border-rule pt-2.5 font-mono text-label text-muted">
          {terms}
        </p>
      </div>
      <div className="border-t border-rule p-5.5 min-[620px]:border-t-0 min-[620px]:border-l">
        <TickList items={includes.map((label) => ({ label }))} />
      </div>
    </div>
  );
}
