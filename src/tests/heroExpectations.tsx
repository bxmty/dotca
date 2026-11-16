// Shared expectations for the page hero's waypoints (#632), so the home,
// pricing and service page tests agree with the HeroWaypoints tests.
import { within } from "@testing-library/react";
import "@testing-library/jest-dom";

/** Each stop's accessible text: time, a screen-reader-only comma, place. */
export const WAYPOINT_STOP_TEXTS = [
  "06:40, Job site",
  "09:15, On the road",
  "13:30, Client's office",
  "21:05, Home",
];

export const WAYPOINT_CAPTION = "One working day · four offices · one IT team";

/** Returns the stops' list items, after checking they're the day's four. */
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
