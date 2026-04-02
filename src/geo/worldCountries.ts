import worldMap from "../../data/geo/world/worldMap.js";

type WorldLocation = {
  name: string;
  id: string;
  path: string;
};

type WorldMapShape = {
  label: string;
  viewBox: string;
  locations: WorldLocation[];
};

const RAW_WORLD_MAP = worldMap as WorldMapShape;

const COUNTRY_ALIASES: Record<string, string> = {
  usa: "united states",
  "united states of america": "united states",
  "u s a": "united states",
  uk: "united kingdom",
  uae: "united arab emirates",
  "south korea": "korea south",
  "north korea": "korea north",
  russia: "russian federation",
  vietnam: "viet nam",
  syria: "syrian arab republic",
  laos: "lao people's democratic republic",
  bolivia: "bolivia plurinational state of",
  tanzania: "tanzania united republic of",
  venezuela: "venezuela bolivarian republic of",
  moldova: "moldova republic of",
  brunei: "brunei darussalam",
  iran: "iran islamic republic of",
  palestine: "palestine state of",
  "czech republic": "czechia",
  ivory: "cote divoire",
  "ivory coast": "cote divoire",
};

// Some countries render poorly when we use the first SVG path command as the label
// anchor, because that point can land on an island, a coastline, or an arbitrary
// outline segment rather than the visually expected center of the country.
const COUNTRY_ANCHOR_OVERRIDES: Record<string, { x: number; y: number }> = {
  "united states": { x: 187, y: 325 },
  canada: { x: 196, y: 203 },
  brazil: { x: 286, y: 471 },
  germany: { x: 480, y: 291 },
  japan: { x: 836, y: 316 },
  singapore: { x: 755, y: 474 },
  "united arab emirates": { x: 631, y: 396 },
  india: { x: 675, y: 388 },
  australia: { x: 839, y: 530 },
  "united kingdom": { x: 462, y: 274 },
  france: { x: 470, y: 314 },
};

type CountryMatchCandidate = {
  label: string;
  name: string;
  canonicalName: string;
};

function normalizeCountryName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalizeCountryName(value: string): string {
  const normalized = normalizeCountryName(value);
  return COUNTRY_ALIASES[normalized] ?? normalized;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const CANONICAL_COUNTRY_NAMES = RAW_WORLD_MAP.locations.map((location) => ({
  name: location.name,
  canonicalName: canonicalizeCountryName(location.name),
}));

const COUNTRY_NAME_BY_CANONICAL = new Map(
  CANONICAL_COUNTRY_NAMES.map((location) => [location.canonicalName, location.name]),
);

const COUNTRY_MATCH_CANDIDATES: CountryMatchCandidate[] = [
  ...CANONICAL_COUNTRY_NAMES.map((location) => ({
    label: location.canonicalName,
    name: location.name,
    canonicalName: location.canonicalName,
  })),
  ...Object.entries(COUNTRY_ALIASES)
    .map(([alias, canonicalName]) => {
      const matchedName = COUNTRY_NAME_BY_CANONICAL.get(canonicalName);
      if (!matchedName) {
        return null;
      }

      return {
        label: alias,
        name: matchedName,
        canonicalName,
      };
    })
    .filter((candidate): candidate is CountryMatchCandidate => candidate !== null),
];

export const WORLD_COUNTRY_NAMES = CANONICAL_COUNTRY_NAMES.map(
  (location) => location.name,
);

export const WORLD_MAP_VIEWBOX = (() => {
  const [, , width, height] = RAW_WORLD_MAP.viewBox.split(" ").map(Number);
  return { width, height };
})();

export const WORLD_COUNTRY_MAP = {
  ...RAW_WORLD_MAP,
  findLocation(value: string): WorldLocation | undefined {
    const canonicalName = canonicalizeCountryName(value);
    const matched = CANONICAL_COUNTRY_NAMES.find(
      (location) => location.canonicalName === canonicalName,
    );
    return matched
      ? RAW_WORLD_MAP.locations.find((location) => location.name === matched.name)
      : undefined;
  },
};

export function getWorldCountryAnchor(
  value: string,
): { x: number; y: number } | null {
  const canonicalName = canonicalizeCountryName(value);
  const override = COUNTRY_ANCHOR_OVERRIDES[canonicalName];
  if (override) {
    return override;
  }

  const location = WORLD_COUNTRY_MAP.findLocation(value);
  if (!location) return null;

  const moveMatch = location.path.match(
    /^\s*[mM]\s*(-?\d*\.?\d+(?:e[-+]?\d+)?)\s*,\s*(-?\d*\.?\d+(?:e[-+]?\d+)?)/i,
  );

  if (!moveMatch) return null;

  const x = Number(moveMatch[1]);
  const y = Number(moveMatch[2]);

  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  return { x, y };
}

export function matchWorldCountries(prompt: string): string[] {
  const normalizedPrompt = normalizeCountryName(prompt);
  const matches = COUNTRY_MATCH_CANDIDATES.map((candidate) => ({
    name: candidate.name,
    index: normalizedPrompt.search(
      new RegExp(`(^|\\b)${escapeRegex(candidate.label)}(\\b|$)`),
    ),
  }))
    .filter((candidate) => candidate.index >= 0)
    .sort((left, right) => left.index - right.index)
    .map((candidate) => candidate.name);

  return Array.from(new Set(matches));
}
