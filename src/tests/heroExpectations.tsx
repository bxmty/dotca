// Shared expectations for the page hero's waypoints (#632, #766), so the home,
// pricing and service page tests agree with the HeroWaypoints tests.
import { within } from "@testing-library/react";
import "@testing-library/jest-dom";

/** Each stop's accessible text: step, a screen-reader-only comma, place. */
export const WAYPOINT_STOP_TEXTS = [
  "01, Dispatch",
  "02, ERP",
  "03, Accounting",
  "04, Invoice",
];

export const WAYPOINT_CAPTION = "Enter it once · it flows everywhere";

/** Returns the stops' list items, after checking they're the job's four. */
export function expectWaypointStops(container: HTMLElement): HTMLElement[] {
  const stops = within(within(container).getByRole("list")).getAllByRole(
    "listitem",
  );
  expect(stops.map((stop) => stop.textContent)).toEqual(WAYPOINT_STOP_TEXTS);
  return stops;
}

/** Service and pricing heroes carry the contour ground but no waypoints. */
export function expectContoursWithoutWaypoints(hero: HTMLElement) {
  expect(hero.querySelector("svg path")).not.toBeNull();
  expect(within(hero).queryByRole("list")).not.toBeInTheDocument();
  expect(within(hero).queryByText(WAYPOINT_CAPTION)).not.toBeInTheDocument();
}
