/**
 * Address autocomplete backed by OpenStreetMap's Nominatim search API.
 *
 * Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/)
 * requires a real identifying User-Agent and caps bulk callers at 1 request/second.
 * The throttle + cache below keep this server (not each visitor) within that limit;
 * per-visitor abuse is capped separately by the API route's rate limiter.
 */

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const USER_AGENT =
  "boximity-msp-website/1.0 (https://boximity.ca; hi@boximity.ca)";
const MIN_REQUEST_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_LIMIT = 5;

export interface AddressSuggestion {
  id: string;
  displayName: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
}

interface RawNominatimAddress {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  state?: string;
  province?: string;
  region?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

interface RawNominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: RawNominatimAddress;
}

const cache = new Map<
  string,
  { expiresAt: number; results: AddressSuggestion[] }
>();

// Serializes outgoing requests so callers never burst past Nominatim's 1 req/sec cap.
let requestQueue: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

function waitForTurn(): Promise<void> {
  const turn = requestQueue.then(async () => {
    const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastRequestAt = Date.now();
  });
  requestQueue = turn.catch(() => undefined);
  return turn;
}

function normalizeResult(raw: RawNominatimResult): AddressSuggestion {
  const address = raw.address ?? {};
  const addressLine =
    [address.house_number, address.road].filter(Boolean).join(" ") ||
    raw.display_name.split(",")[0];
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    "";
  const state = address.state || address.province || address.region || "";

  return {
    id: String(raw.place_id),
    displayName: raw.display_name,
    addressLine,
    city,
    state,
    postalCode: address.postcode || "",
    country: address.country || "",
    countryCode: (address.country_code || "").toUpperCase(),
    lat: parseFloat(raw.lat),
    lon: parseFloat(raw.lon),
  };
}

export interface SearchAddressesOptions {
  countryCodes?: string;
  limit?: number;
}

export async function searchAddresses(
  query: string,
  options: SearchAddressesOptions = {},
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    return [];
  }

  const cacheKey = `${trimmed.toLowerCase()}|${options.countryCodes ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  await waitForTurn();

  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    limit: String(options.limit ?? DEFAULT_LIMIT),
    q: trimmed,
  });
  if (options.countryCodes) {
    params.set("countrycodes", options.countryCodes);
  }

  const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed: ${response.status}`);
  }

  const raw = (await response.json()) as RawNominatimResult[];
  const results = raw.map(normalizeResult);

  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, results });

  return results;
}

/** Test hook: clear the response cache and request queue state. */
export function resetNominatimState(): void {
  cache.clear();
  requestQueue = Promise.resolve();
  lastRequestAt = 0;
}
