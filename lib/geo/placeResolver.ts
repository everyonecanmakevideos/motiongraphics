import { geoCentroid } from "d3-geo";
import { feature } from "topojson-client";
import countriesTopologyData from "../../public/geo/countries-110m.json";
import indiaGeoData from "../../public/geo/india_state.json";
import statesTopologyData from "../../public/geo/states-10m.json";
import {
  CITY_CATALOG,
  CITY_COORDINATES,
  CITY_FALLBACK_COORDS,
  normalizeLocationKey,
  type SharedMapRegion,
} from "./cityCatalog";

type GeoFeature = {
  type: "Feature";
  geometry: unknown;
  properties?: Record<string, unknown>;
};

type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

export type PlaceKind = "city" | "country" | "us-state" | "india-state";

type PlaceEntry = {
  canonical: string;
  aliases: string[];
  region: SharedMapRegion;
  coordinates: [number, number];
  fallback: { x: number; y: number };
  kind: PlaceKind;
};

export interface ResolvedPlace {
  canonical: string;
  label: string;
  region: SharedMapRegion;
  coordinates: [number, number];
  fallback: { x: number; y: number };
  kind: PlaceKind;
}

export type ResolvePlaceOptions = {
  preferredRegion?: SharedMapRegion;
  preferredKind?: PlaceKind;
  canonical?: string;
  contextText?: string;
  peerKinds?: PlaceKind[];
  peerRegions?: SharedMapRegion[];
};

type AliasMatch = {
  place: PlaceEntry;
  alias: string;
  index: number;
  end: number;
};

type AliasGroup = {
  alias: string;
  start: number;
  end: number;
  candidates: PlaceEntry[];
};

const countriesTopology = countriesTopologyData as {
  objects: { countries: unknown };
};

const statesTopology = statesTopologyData as {
  objects: { states: unknown };
};

const worldFeatureCollection = feature(
  countriesTopology as never,
  countriesTopology.objects.countries as never,
) as unknown as GeoFeatureCollection;

const usaFeatureCollection = feature(
  statesTopology as never,
  statesTopology.objects.states as never,
) as unknown as GeoFeatureCollection;

const indiaFeatureCollection = indiaGeoData as GeoFeatureCollection;

const EUROPE_COUNTRY_ALIASES: Record<string, string[]> = {
  "United Kingdom": ["uk", "u.k.", "britain", "great britain"],
  Netherlands: ["the netherlands", "holland"],
  "Czech Republic": ["czechia"],
};

const WORLD_COUNTRY_ALIASES: Record<string, string[]> = {
  "United States of America": [
    "united states",
    "usa",
    "u s a",
    "u.s.a",
    "us",
    "u.s",
    "america",
  ],
  "United Kingdom": ["england"],
  "United Arab Emirates": ["uae", "u.a.e"],
  "South Korea": ["korea", "republic of korea"],
};

const INDIA_STATE_EXTRA_ALIASES: Record<string, string[]> = {
  "Andaman and Nicobar": ["andaman and nicobar islands", "andaman nicobar"],
  Delhi: ["delhi ncr", "new delhi"],
  "Dadra and Nagar Haveli": ["dadra nagar haveli"],
  "Daman and Diu": ["daman diu"],
  Jammu: ["jammu and kashmir", "jammu kashmir"],
  Karnataka: ["bengaluru state"],
};

const getKindPriority = (kind: PlaceKind): number => {
  switch (kind) {
    case "city":
      return 4;
    case "india-state":
      return 3;
    case "us-state":
      return 2;
    case "country":
    default:
      return 1;
  }
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPlaceKey = (place: Pick<PlaceEntry, "canonical" | "region" | "kind">) =>
  `${place.kind}:${place.region}:${normalizeLocationKey(place.canonical)}`;

const fallbackFromCoordinates = (
  [longitude, latitude]: [number, number],
): { x: number; y: number } => ({
  x: Math.max(0, Math.min(100, ((longitude + 180) / 360) * 100)),
  y: Math.max(0, Math.min(100, ((90 - latitude) / 180) * 100)),
});

const getFeatureCentroid = (featureItem: GeoFeature): [number, number] => {
  const [longitude, latitude] = geoCentroid(featureItem as never);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return [0, 0];
  }
  return [longitude, latitude];
};

const getCountryRegion = (countryName: string): SharedMapRegion => {
  const normalized = normalizeLocationKey(countryName);
  if (
    normalized === "united states of america" ||
    normalized === "united states" ||
    normalized === "usa"
  ) {
    return "usa";
  }
  if (normalized === "india") {
    return "india";
  }
  if (
    [
      "united kingdom",
      "france",
      "germany",
      "spain",
      "portugal",
      "italy",
      "netherlands",
      "belgium",
      "switzerland",
      "austria",
      "poland",
      "sweden",
      "norway",
      "denmark",
      "ireland",
      "finland",
      "greece",
      "romania",
      "hungary",
      "ukraine",
      "czech republic",
      "czechia",
    ].includes(normalized)
  ) {
    return "europe";
  }
  return "world";
};

const manualCityPlaces: PlaceEntry[] = CITY_CATALOG.flatMap((entry) => {
  const coordinates = CITY_COORDINATES[normalizeLocationKey(entry.canonical)];
  if (!coordinates) {
    return [];
  }

  const fallback =
    CITY_FALLBACK_COORDS[entry.canonical] ??
    fallbackFromCoordinates(coordinates);

  return [
    {
      canonical: entry.canonical,
      aliases: [entry.canonical, ...entry.aliases],
      region: entry.region,
      coordinates,
      fallback,
      kind: "city" as const,
    } satisfies PlaceEntry,
  ];
});

const worldCountryPlaces: PlaceEntry[] = worldFeatureCollection.features.flatMap(
  (featureItem) => {
    const canonical = String(featureItem.properties?.name ?? "").trim();
    if (!canonical) {
      return [];
    }
    const coordinates = getFeatureCentroid(featureItem);
    const aliases = [
      canonical,
      ...(WORLD_COUNTRY_ALIASES[canonical] ?? []),
      ...(EUROPE_COUNTRY_ALIASES[canonical] ?? []),
    ];
    return [
      {
        canonical,
        aliases,
        region: getCountryRegion(canonical),
        coordinates,
        fallback: fallbackFromCoordinates(coordinates),
        kind: "country" as const,
      } satisfies PlaceEntry,
    ];
  },
);

const usaStatePlaces: PlaceEntry[] = usaFeatureCollection.features.flatMap(
  (featureItem) => {
    const canonical = String(featureItem.properties?.name ?? "").trim();
    if (!canonical) {
      return [];
    }
    const coordinates = getFeatureCentroid(featureItem);
    return [
      {
        canonical,
        aliases: [canonical],
        region: "usa",
        coordinates,
        fallback: fallbackFromCoordinates(coordinates),
        kind: "us-state" as const,
      } satisfies PlaceEntry,
    ];
  },
);

const indiaStatePlaces: PlaceEntry[] = indiaFeatureCollection.features.flatMap(
  (featureItem) => {
    const canonical = String(featureItem.properties?.NAME_1 ?? "").trim();
    if (!canonical) {
      return [];
    }

    const variantNames =
      typeof featureItem.properties?.VARNAME_1 === "string"
        ? String(featureItem.properties.VARNAME_1)
            .split("|")
            .map((alias) => alias.trim())
            .filter(Boolean)
        : [];
    const coordinates = getFeatureCentroid(featureItem);
    return [
      {
        canonical,
        aliases: [
          canonical,
          ...variantNames,
          ...(INDIA_STATE_EXTRA_ALIASES[canonical] ?? []),
        ],
        region: "india",
        coordinates,
        fallback: fallbackFromCoordinates(coordinates),
        kind: "india-state" as const,
      } satisfies PlaceEntry,
    ];
  },
);

const ALL_PLACES: PlaceEntry[] = [
  ...manualCityPlaces,
  ...indiaStatePlaces,
  ...usaStatePlaces,
  ...worldCountryPlaces,
];

const PLACE_ALIASES = ALL_PLACES.flatMap((place) =>
  place.aliases.map((alias) => ({
    alias,
    normalizedAlias: normalizeLocationKey(alias),
    place,
  })),
)
  .filter((entry) => entry.normalizedAlias.length > 0)
  .sort((a, b) => b.normalizedAlias.length - a.normalizedAlias.length);

const inferRegionHintFromText = (
  text?: string,
): SharedMapRegion | undefined => {
  const normalizedText = normalizeLocationKey(text ?? "");
  if (!normalizedText) {
    return undefined;
  }

  if (
    /\bindia\b/.test(normalizedText) ||
    /\bindian\b/.test(normalizedText)
  ) {
    return "india";
  }

  if (
    /\busa\b|\bunited states\b|\bamerican\b|\bu s a\b|\bu s\b/.test(
      normalizedText,
    )
  ) {
    return "usa";
  }

  if (
    /\beurope\b|\beuropean\b|\bwestern europe\b|\bcontinental europe\b/.test(
      normalizedText,
    )
  ) {
    return "europe";
  }

  return undefined;
};

const inferKindHintFromText = (
  text?: string,
  regionHint?: SharedMapRegion,
): PlaceKind | "state" | undefined => {
  const normalizedText = normalizeLocationKey(text ?? "");
  if (!normalizedText) {
    return undefined;
  }

  if (/\bcountry\b|\bcountries\b/.test(normalizedText)) {
    return "country";
  }

  if (/\bcity\b|\bcities\b/.test(normalizedText)) {
    return "city";
  }

  if (/\bstate\b|\bstates\b/.test(normalizedText)) {
    if (regionHint === "india") {
      return "india-state";
    }
    if (regionHint === "usa") {
      return "us-state";
    }
    return "state";
  }

  return undefined;
};

const getKindHintScore = (
  kind: PlaceKind,
  kindHint?: PlaceKind | "state",
): number => {
  if (!kindHint) {
    return 0;
  }

  if (kindHint === "state") {
    return kind === "india-state" || kind === "us-state" ? 18 : -8;
  }

  return kind === kindHint ? 18 : -8;
};

const getPeerMatchScore = <T extends string>(
  value: T,
  peers?: T[],
  weight = 8,
): number => {
  if (!peers || peers.length === 0) {
    return 0;
  }

  return peers.filter((peer) => peer === value).length * weight;
};

const scorePlaceCandidate = (
  place: PlaceEntry,
  options?: ResolvePlaceOptions,
): number => {
  const regionHint =
    options?.preferredRegion ?? inferRegionHintFromText(options?.contextText);
  const kindHint =
    options?.preferredKind ??
    inferKindHintFromText(options?.contextText, regionHint);
  const normalizedCanonical = normalizeLocationKey(options?.canonical ?? "");
  const matchesCanonical =
    normalizedCanonical.length > 0 &&
    normalizeLocationKey(place.canonical) === normalizedCanonical;

  let score = getKindPriority(place.kind);

  if (options?.preferredRegion) {
    score += place.region === options.preferredRegion ? 24 : -6;
  } else if (regionHint) {
    score += place.region === regionHint ? 16 : -4;
  }

  if (options?.preferredKind) {
    score += place.kind === options.preferredKind ? 34 : -10;
  } else {
    score += getKindHintScore(place.kind, kindHint);
  }

  if (normalizedCanonical.length > 0) {
    score += matchesCanonical ? 44 : -4;
  }

  score += getPeerMatchScore(place.region, options?.peerRegions, 9);
  score += getPeerMatchScore(place.kind, options?.peerKinds, 11);

  return score;
};

const rankPlaceCandidates = (
  candidates: PlaceEntry[],
  options?: ResolvePlaceOptions,
) =>
  [...candidates].sort((a, b) => {
    const scoreDelta =
      scorePlaceCandidate(b, options) - scorePlaceCandidate(a, options);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }
    return getKindPriority(b.kind) - getKindPriority(a.kind);
  });

const toResolvedPlace = (place: PlaceEntry): ResolvedPlace => ({
  canonical: place.canonical,
  label: place.canonical,
  region: place.region,
  coordinates: place.coordinates,
  fallback: place.fallback,
  kind: place.kind,
});

export const resolvePlaceLabel = (
  label: string,
  options?: ResolvePlaceOptions,
): ResolvedPlace | null => {
  const normalizedLabel = normalizeLocationKey(label);
  if (!normalizedLabel) {
    return null;
  }

  const matches = PLACE_ALIASES.filter(
    (entry) => entry.normalizedAlias === normalizedLabel,
  );
  if (matches.length === 0) {
    return null;
  }

  const ranked = rankPlaceCandidates(
    matches.map((match) => match.place),
    options,
  );
  return ranked.length > 0 ? toResolvedPlace(ranked[0]) : null;
};

export const extractPlacesFromText = (
  prompt: string,
  preferredRegion?: SharedMapRegion,
): ResolvedPlace[] => {
  const normalizedPrompt = normalizeLocationKey(prompt);
  if (!normalizedPrompt) {
    return [];
  }

  const rawMatches: AliasMatch[] = PLACE_ALIASES.map((entry) => {
    const pattern = new RegExp(`\\b${escapeRegExp(entry.normalizedAlias)}\\b`, "i");
    const match = pattern.exec(normalizedPrompt);

    return {
      place: entry.place,
      alias: entry.normalizedAlias,
      index: match?.index ?? -1,
      end: match ? match.index + match[0].length : -1,
    };
  }).filter((entry) => entry.index >= 0 && entry.end > entry.index);

  rawMatches.sort((a, b) => {
    if (a.index !== b.index) {
      return a.index - b.index;
    }
    if (a.alias.length !== b.alias.length) {
      return b.alias.length - a.alias.length;
    }
    return getKindPriority(b.place.kind) - getKindPriority(a.place.kind);
  });

  const aliasGroupsMap = new Map<string, AliasGroup>();
  rawMatches.forEach((match) => {
    const key = `${match.index}:${match.end}`;
    const existing = aliasGroupsMap.get(key);
    const candidateKey = getPlaceKey(match.place);

    if (!existing) {
      aliasGroupsMap.set(key, {
        alias: match.alias,
        start: match.index,
        end: match.end,
        candidates: [match.place],
      });
      return;
    }

    if (match.alias.length > existing.alias.length) {
      existing.alias = match.alias;
    }

    const alreadyPresent = existing.candidates.some(
      (candidate) => getPlaceKey(candidate) === candidateKey,
    );
    if (!alreadyPresent) {
      existing.candidates.push(match.place);
    }
  });

  const aliasGroups = [...aliasGroupsMap.values()].sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }
    return (b.end - b.start) - (a.end - a.start);
  });

  const peerKinds = aliasGroups
    .filter((group) => group.candidates.length === 1)
    .map((group) => group.candidates[0].kind);
  const peerRegions = aliasGroups
    .filter((group) => group.candidates.length === 1)
    .map((group) => group.candidates[0].region);

  const seenPlaces = new Set<string>();
  const takenSpans: Array<{ start: number; end: number }> = [];
  const resolved: ResolvedPlace[] = [];

  for (const group of aliasGroups) {
    const span = {
      start: group.start,
      end: group.end,
    };
    const overlaps = takenSpans.some(
      (taken) => span.start < taken.end && span.end > taken.start,
    );
    if (overlaps) {
      continue;
    }

    const rankedCandidates = rankPlaceCandidates(
      group.candidates.filter(
        (candidate) => !seenPlaces.has(getPlaceKey(candidate)),
      ),
      {
        preferredRegion,
        contextText: prompt,
        peerKinds,
        peerRegions,
      },
    );
    const selected = rankedCandidates[0];

    if (!selected) {
      continue;
    }

    seenPlaces.add(getPlaceKey(selected));
    takenSpans.push(span);
    peerKinds.push(selected.kind);
    peerRegions.push(selected.region);
    resolved.push(toResolvedPlace(selected));
  }

  return resolved;
};
