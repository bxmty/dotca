import { useEffect, useRef, type ReactNode, type Ref } from "react";

/** Each tab has one screen heading at a time; answer lists are labelled by it. */
export const CALL_HEADING_ID = "call-heading";

export function CallHeading({
  headingRef,
  className,
  children,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  className: string;
  children: ReactNode;
}) {
  return (
    <h1
      id={CALL_HEADING_ID}
      ref={headingRef}
      tabIndex={-1}
      className={className}
    >
      {children}
    </h1>
  );
}

/**
 * Each new screen starts at its heading, so screen readers announce it. The
 * first load is left alone rather than stealing focus from the page.
 */
export function useFocusHeadingOnNewScreen(screenKey: string) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasRenderedScreen = useRef(false);

  useEffect(() => {
    if (!hasRenderedScreen.current) {
      hasRenderedScreen.current = true;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo?.({ top: 0 });
  }, [screenKey]);

  return headingRef;
}
