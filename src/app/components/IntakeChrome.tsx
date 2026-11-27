import Logo from "./Logo";
import { COMPANY_PHONE_DISPLAY } from "@/lib/company-phone";

/**
 * The header and footer of a service request page: the lockup and the
 * contact details, with no link, so the requester stays on the form.
 */
export function IntakeHeader() {
  return (
    <header className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-[720px] px-4 py-3.5">
        <Logo className="block h-6 w-auto" />
      </div>
    </header>
  );
}

export function IntakeFooter() {
  return (
    <footer className="border-t border-rule bg-bg">
      <p className="mx-auto m-0 max-w-[720px] px-4 py-4 font-mono text-label text-muted">
        © 2026 Boximity MSP · hi@boximity.ca · {COMPANY_PHONE_DISPLAY}
      </p>
    </footer>
  );
}
