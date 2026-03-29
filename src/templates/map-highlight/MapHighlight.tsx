import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  geoAlbersUsa,
  geoGraticule10,
  geoMercator,
  geoNaturalEarth1,
  geoPath,
} from "d3-geo";
import { feature } from "topojson-client";
import countriesTopologyData from "../../../public/geo/countries-110m.json";
import indiaGeoData from "../../../public/geo/india_state.json";
import statesTopologyData from "../../../public/geo/states-10m.json";
import {
  CITY_COORDINATES,
  normalizeLocationKey,
} from "../../../lib/geo/cityCatalog";
import { Background } from "../../primitives/Background";
import {
  fadeIn,
  microFloat,
  scalePop,
  secToFrame,
  staggerDelay,
} from "../../primitives/animations";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import type { MapHighlightProps } from "./schema";

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

type MapTemplateVariant =
  | "highlight"
  | "route-animation"
  | "network"
  | "heatmap"
  | "city-spotlight"
  | "radius-rings"
  | "targeting";

type MapRenderProps = MapHighlightProps & {
  templateVariant?: MapTemplateVariant;
};

type RouteSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx: number;
  cy: number;
  estimatedLength: number;
  progress: number;
};

type NetworkLink = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  pulseProgress: number;
};

type ResolvedLocation = MapHighlightProps["locations"][number] & {
  pixelX: number;
  pixelY: number;
  longitude?: number;
  latitude?: number;
};

type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties?: Record<string, unknown>;
  }>;
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

const EUROPE_FOCUS_BOUNDS: GeoFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-15, 34],
            [35, 34],
            [35, 72],
            [-15, 72],
            [-15, 34],
          ],
        ],
      },
    },
  ],
};

type CountryPath = {
  key: string;
  d: string;
  bounds: [[number, number], [number, number]];
};

const getLinearPoint = (link: NetworkLink, progress: number) => ({
  x: link.x1 + (link.x2 - link.x1) * progress,
  y: link.y1 + (link.y2 - link.y1) * progress,
});

const getQuadraticPoint = (segment: RouteSegment, progress: number) => {
  const t = Math.max(0, Math.min(1, progress));
  const oneMinusT = 1 - t;

  return {
    x:
      oneMinusT * oneMinusT * segment.x1 +
      2 * oneMinusT * t * segment.cx +
      t * t * segment.x2,
    y:
      oneMinusT * oneMinusT * segment.y1 +
      2 * oneMinusT * t * segment.cy +
      t * t * segment.y2,
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const inferMapRegionFromLabels = (
  labels: string[],
  requestedRegion: MapHighlightProps["mapRegion"],
): MapHighlightProps["mapRegion"] => {
  if (requestedRegion !== "world") {
    return requestedRegion;
  }

  const normalizedLabels = labels.map(normalizeLocationKey);
  const matches = {
    india: normalizedLabels.filter((label) => {
      const coords = CITY_COORDINATES[label];
      return (
        coords !== undefined &&
        [
          "bangalore",
          "bengaluru",
          "hyderabad",
          "pune",
          "chennai",
          "mumbai",
          "delhi",
          "delhi ncr",
        ].includes(label)
      );
    }).length,
    europe: normalizedLabels.filter((label) =>
      [
        "london",
        "paris",
        "berlin",
        "amsterdam",
        "madrid",
        "rotterdam",
      ].includes(label),
    ).length,
    usa: normalizedLabels.filter((label) =>
      [
        "san francisco",
        "sf",
        "new york",
        "los angeles",
        "seattle",
        "austin",
        "chicago",
        "boston",
      ].includes(label),
    ).length,
  };

  if (matches.india > 0 && matches.india === normalizedLabels.length) {
    return "india";
  }
  if (matches.europe > 0 && matches.europe === normalizedLabels.length) {
    return "europe";
  }
  if (matches.usa > 0 && matches.usa === normalizedLabels.length) {
    return "usa";
  }

  return "world";
};

const createCoordinateBoundsFeature = (
  coordinates: Array<[number, number]>,
  region: MapHighlightProps["mapRegion"],
  focusMode: "standard" | "tight" = "standard",
): GeoFeatureCollection | null => {
  if (coordinates.length < 1) {
    return null;
  }

  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);

  const regionPadding =
    focusMode === "tight"
      ? {
          world: { lon: 9, lat: 6 },
          europe: { lon: 3.2, lat: 2.4 },
          usa: { lon: 4.5, lat: 3.2 },
          india: { lon: 2.4, lat: 2 },
        }[region]
      : {
          world: { lon: 18, lat: 10 },
          europe: { lon: 7, lat: 5 },
          usa: { lon: 9, lat: 6 },
          india: { lon: 4, lat: 3.5 },
        }[region];

  const hasSpread =
    Math.abs(maxLon - minLon) > 0.25 || Math.abs(maxLat - minLat) > 0.25;
  const paddedMinLon = minLon - regionPadding.lon;
  const paddedMaxLon = maxLon + regionPadding.lon;
  const paddedMinLat = minLat - regionPadding.lat;
  const paddedMaxLat = maxLat + regionPadding.lat;
  const singleLon = longitudes[0] ?? 0;
  const singleLat = latitudes[0] ?? 0;
  const finalMinLon = hasSpread ? paddedMinLon : singleLon - regionPadding.lon;
  const finalMaxLon = hasSpread ? paddedMaxLon : singleLon + regionPadding.lon;
  const finalMinLat = hasSpread ? paddedMinLat : singleLat - regionPadding.lat;
  const finalMaxLat = hasSpread ? paddedMaxLat : singleLat + regionPadding.lat;

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [finalMinLon, finalMinLat],
              [finalMaxLon, finalMinLat],
              [finalMaxLon, finalMaxLat],
              [finalMinLon, finalMaxLat],
              [finalMinLon, finalMinLat],
            ],
          ],
        },
      },
    ],
  };
};

export const MapHighlight: React.FC<MapRenderProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, scale } = useResponsiveConfig();
  const templateVariant = props.templateVariant ?? "highlight";
  const isRouteVariant = templateVariant === "route-animation";
  const isNetworkVariant = templateVariant === "network";
  const isClusterVariant = templateVariant === "heatmap";
  const isSpotlightVariant = templateVariant === "city-spotlight";
  const isRadiusVariant = templateVariant === "radius-rings";
  const isTargetingVariant = templateVariant === "targeting";
  const isHighlightVariant =
    !isRouteVariant &&
    !isNetworkVariant &&
    !isClusterVariant &&
    !isSpotlightVariant &&
    !isRadiusVariant &&
    !isTargetingVariant;

  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const motion = resolveMotionStyle(resolved.motionStyle);
  const fx = resolveEffects(resolved.effects);
  const usesWorldDotsStyle = props.mapStyle === "world-dots";
  const usesMinimalOutlineStyle = props.mapStyle === "minimal-outline";
  const usesTechnicalDarkStyle = props.mapStyle === "technical-dark";
  const usesEditorialLightStyle = props.mapStyle === "editorial-light";
  const usesGeoColorStyle = props.mapStyle === "geo-color";
  const usesExplicitFilledStyle =
    usesTechnicalDarkStyle || usesEditorialLightStyle || usesGeoColorStyle;

  const totalFrames = secToFrame(props.duration);
  const MAP_WIDTH = Math.round(
    width *
      (isNetworkVariant
        ? 0.94
        : isClusterVariant || isTargetingVariant
          ? 0.92
          : isSpotlightVariant || isRadiusVariant
            ? 0.91
            : 0.9),
  );
  const MAP_HEIGHT = Math.round(
    MAP_WIDTH *
      (isNetworkVariant
        ? 0.54
        : isClusterVariant
          ? 0.56
          : isTargetingVariant
            ? 0.58
            : isSpotlightVariant || isRadiusVariant
              ? 0.54
              : 0.5),
  );
  const mapFadeEnd = Math.round(totalFrames * 0.15);
  const markersStart = Math.round(totalFrames * 0.12);
  const markersDuration = Math.round(totalFrames * 0.5);
  const routesStart = Math.round(totalFrames * 0.14);
  const routesDuration = Math.round(totalFrames * 0.42);
  const titleEnd = Math.round(totalFrames * 0.12 * motion.durationMultiplier);
  const exitStart = Math.round(totalFrames * 0.85);

  const exitOpacity = interpolate(
    frame,
    [exitStart, totalFrames],
    [1, 0],
    CLAMP,
  );
  const isMainPhase =
    frame >= Math.round(totalFrames * 0.25 * motion.durationMultiplier) &&
    frame < exitStart;
  const floatY =
    motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, totalFrames], [0, 8], CLAMP)
    : 0;
  const mapOpacity = fadeIn(frame, {
    startFrame: 0,
    endFrame: mapFadeEnd,
  }).opacity;

  const titleOpacity =
    props.title && props.entranceAnimation !== "none"
      ? interpolate(frame, [0, titleEnd], [0, 1], CLAMP)
      : 1;
  const titleY =
    props.title && props.entranceAnimation !== "none"
      ? interpolate(frame, [0, titleEnd], [15, 0], CLAMP)
      : 0;

  const pulseFrame = frame % 30;
  const pulseScale = props.markerPulse
    ? 1 + interpolate(pulseFrame, [0, 15, 30], [0, 0.8, 0], CLAMP)
    : 1;
  const pulseOpacity = props.markerPulse
    ? interpolate(pulseFrame, [0, 15, 30], [0.5, 0, 0], CLAMP)
    : 0;
  const sweepProgress = interpolate(
    frame,
    [0, totalFrames],
    [0, MAP_WIDTH],
    CLAMP,
  );

  const activeMapRegion = inferMapRegionFromLabels(
    props.locations.map((loc) => loc.label),
    props.mapRegion,
  );
  const coordinateMatches = props.locations
    .map((loc) => {
      const cityKey = normalizeLocationKey(loc.label);
      const coordinates = CITY_COORDINATES[cityKey];
      return coordinates ?? null;
    })
    .filter((value): value is [number, number] => value !== null);
  const coordinateFocusEnabled =
    isHighlightVariant ||
    isClusterVariant ||
    isSpotlightVariant ||
    isRadiusVariant;
  const coordinateFocusThreshold =
    isSpotlightVariant || isRadiusVariant ? 1 : 2;
  const regionalProjectionTarget =
    coordinateFocusEnabled && coordinateMatches.length >= coordinateFocusThreshold
      ? createCoordinateBoundsFeature(
          coordinateMatches,
          activeMapRegion,
          isSpotlightVariant || isRadiusVariant ? "tight" : "standard",
        )
      : null;
  const hasRegionalFocus = regionalProjectionTarget !== null;
  const regionalInsetXStart =
    (isSpotlightVariant || isClusterVariant) && hasRegionalFocus
      ? 0.02
      : isRadiusVariant && hasRegionalFocus
        ? 0.03
        : (isHighlightVariant && hasRegionalFocus)
          ? 0.05
          : isNetworkVariant
            ? 0.025
            : 0.03;
  const regionalInsetYStart =
    isSpotlightVariant && hasRegionalFocus
      ? 0.08
      : isClusterVariant && hasRegionalFocus
        ? 0.1
        : isRadiusVariant && hasRegionalFocus
          ? 0.11
          : (isHighlightVariant && hasRegionalFocus)
            ? 0.16
            : 0.1;
  const regionalInsetXEnd =
    (isSpotlightVariant || isClusterVariant) && hasRegionalFocus
      ? 0.98
      : isRadiusVariant && hasRegionalFocus
        ? 0.97
        : (isHighlightVariant && hasRegionalFocus)
          ? 0.95
          : isNetworkVariant
            ? 0.975
            : 0.97;
  const regionalInsetYEnd =
    isSpotlightVariant && hasRegionalFocus
      ? 0.95
      : isClusterVariant && hasRegionalFocus
        ? 0.92
        : isRadiusVariant && hasRegionalFocus
          ? 0.91
          : (isHighlightVariant && hasRegionalFocus)
            ? 0.9
            : isNetworkVariant
              ? 0.92
              : 0.9;
  const projectionExtent: [[number, number], [number, number]] = [
    [
      MAP_WIDTH * regionalInsetXStart,
      MAP_HEIGHT * regionalInsetYStart,
    ],
    [
      MAP_WIDTH * regionalInsetXEnd,
      MAP_HEIGHT * regionalInsetYEnd,
    ],
  ];
  const regionFeatureCollection =
    activeMapRegion === "india"
      ? indiaFeatureCollection
      : activeMapRegion === "usa"
        ? usaFeatureCollection
        : worldFeatureCollection;
  const projectionTarget =
    (((isClusterVariant ||
      isHighlightVariant ||
      isSpotlightVariant ||
      isRadiusVariant) &&
      hasRegionalFocus)
      ? regionalProjectionTarget
      : null) ??
    (activeMapRegion === "europe"
      ? EUROPE_FOCUS_BOUNDS
      : regionFeatureCollection);
  const projection =
    ((activeMapRegion === "world" || activeMapRegion === "usa") &&
    hasRegionalFocus &&
    coordinateFocusEnabled
      ? geoMercator()
          .fitExtent(projectionExtent, projectionTarget as never)
          .precision(0.1)
      : activeMapRegion === "usa"
      ? geoAlbersUsa().fitExtent(projectionExtent, projectionTarget as never)
      : activeMapRegion === "world"
        ? geoNaturalEarth1()
            .fitExtent(projectionExtent, projectionTarget as never)
            .precision(0.1)
        : geoMercator()
            .fitExtent(projectionExtent, projectionTarget as never)
            .precision(0.1));

  const regionPath = geoPath(projection);
  const graticule = geoGraticule10();
  const graticulePath = regionPath(graticule as never) ?? "";
  const countryPaths: CountryPath[] = regionFeatureCollection.features
    .map((featureItem, index) => ({
      key: `country-${index}`,
      d: regionPath(featureItem as never) ?? "",
      bounds: regionPath.bounds(featureItem as never) as [
        [number, number],
        [number, number],
      ],
    }))
    .filter((item) => item.d.length > 0);

  const resolvedLocations: ResolvedLocation[] = props.locations.map((loc) => {
    const cityKey = normalizeLocationKey(loc.label);
    const coordinates = CITY_COORDINATES[cityKey];
    const projectedPoint = coordinates ? projection(coordinates) : null;
    const fallbackX = (loc.x / 100) * MAP_WIDTH;
    const fallbackY = (loc.y / 100) * MAP_HEIGHT;

    return {
      ...loc,
      pixelX: projectedPoint?.[0] ?? fallbackX,
      pixelY: projectedPoint?.[1] ?? fallbackY,
      longitude: coordinates?.[0],
      latitude: coordinates?.[1],
    };
  });

  const routeSegments: RouteSegment[] = resolvedLocations
    .slice(0, -1)
    .map((loc, i) => {
      const next = resolvedLocations[i + 1];
      const x1 = loc.pixelX;
      const y1 = loc.pixelY;
      const x2 = next.pixelX;
      const y2 = next.pixelY;
      const directLength = Math.hypot(x2 - x1, y2 - y1);
      const arcLift = Math.max(26, Math.min(84, directLength * 0.22));
      const stagger = staggerDelay(
        i,
        Math.max(1, resolvedLocations.length - 1),
        routesDuration,
      );

      return {
        x1,
        y1,
        x2,
        y2,
        cx: (x1 + x2) / 2,
        cy: Math.min(y1, y2) - arcLift,
        estimatedLength: directLength + arcLift * 0.75,
        progress: interpolate(
          frame,
          [routesStart + stagger.startFrame, routesStart + stagger.endFrame],
          [0, 1],
          CLAMP,
        ),
      };
    });

  const networkLinks: NetworkLink[] = isNetworkVariant
    ? resolvedLocations.flatMap((loc, index) => {
        if (index === 0) {
          return resolvedLocations.slice(1).map((next, nextOffset) => {
            const stagger = staggerDelay(
              nextOffset,
              Math.max(1, resolvedLocations.length - 1),
              routesDuration,
            );

            return {
              x1: loc.pixelX,
              y1: loc.pixelY,
              x2: next.pixelX,
              y2: next.pixelY,
              progress: interpolate(
                frame,
                [
                  routesStart + stagger.startFrame,
                  routesStart + stagger.endFrame,
                ],
                [0, 1],
                CLAMP,
              ),
              pulseProgress: (frame / 40 + nextOffset * 0.19) % 1,
            };
          });
        }

        if (index < resolvedLocations.length - 1) {
          const next = resolvedLocations[index + 1];
          const stagger = staggerDelay(
            resolvedLocations.length - 1 + index,
            Math.max(1, resolvedLocations.length * 2 - 3),
            routesDuration,
          );

          return [
            {
              x1: loc.pixelX,
              y1: loc.pixelY,
              x2: next.pixelX,
              y2: next.pixelY,
              progress: interpolate(
                frame,
                [
                  routesStart + stagger.startFrame,
                  routesStart + stagger.endFrame,
                ],
                [0, 1],
                CLAMP,
              ),
              pulseProgress: (frame / 44 + index * 0.14) % 1,
            },
          ];
        }

        return [];
      })
    : [];

  const activeRouteDot =
    [...routeSegments]
      .reverse()
      .find((segment) => segment.progress > 0 && segment.progress < 1) ??
    (routeSegments.length > 0 &&
    routeSegments[routeSegments.length - 1].progress >= 1
      ? { ...routeSegments[routeSegments.length - 1], progress: 1 }
      : null);

  const routeSummary =
    isRouteVariant && resolvedLocations.length > 1
      ? `${resolvedLocations[0]?.label ?? "Start"} to ${resolvedLocations[resolvedLocations.length - 1]?.label ?? "End"}`
      : null;
  const isGeoColorVariant =
    isSpotlightVariant || isClusterVariant || isRadiusVariant;
  const highlightAccent = props.markerColor;
  const highlightTextPrimary = props.titleColor;
  const highlightTextSecondary = `${props.labelColor}CC`;
  const highlightPanelBorder = `${props.mapColor}26`;
  const highlightMapFill = `${props.mapColor}14`;
  const highlightFocus = isHighlightVariant
    ? (() => {
        const points = resolvedLocations.map((loc) => ({
          x: loc.pixelX,
          y: loc.pixelY,
        }));
        const minX = Math.min(...points.map((point) => point.x));
        const maxX = Math.max(...points.map((point) => point.x));
        const minY = Math.min(...points.map((point) => point.y));
        const maxY = Math.max(...points.map((point) => point.y));
        const bboxWidth = Math.max(maxX - minX, MAP_WIDTH * 0.14);
        const bboxHeight = Math.max(maxY - minY, MAP_HEIGHT * 0.14);

        return {
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2,
          radiusX: Math.max(MAP_WIDTH * 0.1, bboxWidth * 0.78),
          radiusY: Math.max(MAP_HEIGHT * 0.12, bboxHeight * 0.92),
        };
      })()
    : {
        centerX: MAP_WIDTH / 2,
        centerY: MAP_HEIGHT / 2,
        radiusX: MAP_WIDTH * 0.18,
        radiusY: MAP_HEIGHT * 0.2,
      };
  const networkAccent = "#8cb9c4";
  const networkAccentGlow = "rgba(140,185,196,0.28)";
  const networkTextPrimary = "#eef3f6";
  const networkTextSecondary = "rgba(238,243,246,0.72)";
  const networkPanelBorder = "rgba(176,194,201,0.16)";
  const networkMapFill = "rgba(191,204,211,0.08)";
  const networkMapStroke = "rgba(173,188,196,0.18)";
  const networkGridColor = "rgba(159,178,187,0.08)";
  const routeAccent = "#4c6670";
  const routeAccentGlow = "rgba(76,102,112,0.24)";
  const routeTextPrimary = "#1d252a";
  const routeTextSecondary = "rgba(29,37,42,0.7)";
  const routePanelBorder = "rgba(76,102,112,0.18)";
  const routeMapFill = "rgba(118,134,140,0.12)";
  const routeMapStroke = "rgba(92,110,117,0.34)";
  const routeGridColor = "rgba(92,110,117,0.16)";
  const geoWaterTint = "#d8edf8";
  const geoLandTint = "#f4eedf";
  const geoForestTint = "#dce8d1";
  const geoBorderTint = "rgba(144,152,160,0.48)";
  const geoGridTint = "rgba(128,139,150,0.12)";
  const clusterAccent = "#d97f2f";
  const clusterAccentSoft = "rgba(217,127,47,0.14)";
  const clusterTextPrimary = "#21323d";
  const clusterTextSecondary = "rgba(33,50,61,0.68)";
  const clusterPanelBorder = "rgba(188,170,141,0.46)";
  const clusterMapFill = geoLandTint;
  const clusterMapStroke = geoBorderTint;
  const clusterGridColor = geoGridTint;
  const spotlightAccent = "#f0c44f";
  const spotlightTextPrimary = "#23313d";
  const spotlightTextSecondary = "rgba(35,49,61,0.68)";
  const spotlightPanelBorder = "rgba(219,186,92,0.34)";
  const spotlightMapFill = geoLandTint;
  const spotlightMapStroke = "rgba(176,158,126,0.74)";
  const spotlightGridColor = "rgba(128,139,150,0.1)";
  const radiusAccent = "#4f8fe8";
  const radiusTextPrimary = "#203142";
  const radiusTextSecondary = "rgba(32,49,66,0.68)";
  const radiusPanelBorder = "rgba(129,166,221,0.34)";
  const radiusMapFill = geoLandTint;
  const radiusMapStroke = geoBorderTint;
  const radiusGridColor = geoGridTint;
  const targetingAccent = props.markerColor;
  const targetingTextPrimary = props.titleColor;
  const targetingTextSecondary = `${props.labelColor}C6`;
  const targetingPanelBorder = `${props.markerColor}30`;
  const targetingMapFill = "rgba(126,162,146,0.08)";
  const targetingMapStroke = "rgba(129,162,146,0.28)";
  const targetingGridColor = "rgba(126,162,146,0.1)";
  const primaryLocation = resolvedLocations[0] ?? null;
  const localizedCountryPaths = (() => {
    if (!(isGeoColorVariant && hasRegionalFocus && primaryLocation)) {
      return countryPaths;
    }

    const focusPaddingX =
      MAP_WIDTH * (isSpotlightVariant ? 0.22 : isClusterVariant ? 0.32 : 0.36);
    const focusPaddingY =
      MAP_HEIGHT *
      (isSpotlightVariant ? 0.24 : isClusterVariant ? 0.32 : 0.34);
    const filtered = countryPaths.filter((country) => {
      const [[minX, minY], [maxX, maxY]] = country.bounds;

      return (
        maxX >= primaryLocation.pixelX - focusPaddingX &&
        minX <= primaryLocation.pixelX + focusPaddingX &&
        maxY >= primaryLocation.pixelY - focusPaddingY &&
        minY <= primaryLocation.pixelY + focusPaddingY
      );
    });

    return filtered.length > 0 ? filtered : countryPaths;
  })();
  const anchoredLabelVariant =
    isNetworkVariant ||
    isRouteVariant ||
    isClusterVariant ||
    isSpotlightVariant ||
    isRadiusVariant ||
    isTargetingVariant;
  const networkFocus = isNetworkVariant
    ? (() => {
        const points = resolvedLocations.map((loc) => ({
          x: loc.pixelX,
          y: loc.pixelY,
        }));
        const minX = Math.min(...points.map((point) => point.x));
        const maxX = Math.max(...points.map((point) => point.x));
        const minY = Math.min(...points.map((point) => point.y));
        const maxY = Math.max(...points.map((point) => point.y));
        const bboxWidth = Math.max(maxX - minX, MAP_WIDTH * 0.34);
        const bboxHeight = Math.max(maxY - minY, MAP_HEIGHT * 0.26);
        const padX = MAP_WIDTH * 0.12;
        const padY = MAP_HEIGHT * 0.18;
        const scaleX = (MAP_WIDTH * 0.88) / (bboxWidth + padX);
        const scaleY = (MAP_HEIGHT * 0.68) / (bboxHeight + padY);
        const focusScale = clamp(Math.min(scaleX, scaleY), 1, 1.22);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        return {
          scale: focusScale,
          translateX: MAP_WIDTH / 2 - centerX * focusScale,
          translateY: MAP_HEIGHT * 0.58 - centerY * focusScale,
        };
      })()
    : { scale: 1, translateX: 0, translateY: 0 };
  const clusterFocus = isClusterVariant
    ? (() => {
        const points = resolvedLocations.map((loc) => ({
          x: loc.pixelX,
          y: loc.pixelY,
        }));
        const minX = Math.min(...points.map((point) => point.x));
        const maxX = Math.max(...points.map((point) => point.x));
        const minY = Math.min(...points.map((point) => point.y));
        const maxY = Math.max(...points.map((point) => point.y));
        const bboxWidth = Math.max(maxX - minX, MAP_WIDTH * 0.08);
        const bboxHeight = Math.max(maxY - minY, MAP_HEIGHT * 0.08);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        if (activeMapRegion !== "world") {
          const padX = MAP_WIDTH * 0.06;
          const padY = MAP_HEIGHT * 0.08;
          const scaleX = (MAP_WIDTH * 0.82) / (bboxWidth + padX);
          const scaleY = (MAP_HEIGHT * 0.74) / (bboxHeight + padY);
          const focusScale = clamp(
            Math.min(scaleX, scaleY),
            activeMapRegion === "europe" ? 1.6 : 1.35,
            activeMapRegion === "europe" ? 2.55 : 2.25,
          );
          return {
            scale: focusScale,
            translateX: MAP_WIDTH / 2 - centerX * focusScale,
            translateY: MAP_HEIGHT * 0.56 - centerY * focusScale,
            centerX,
            centerY,
            radiusX: Math.max(MAP_WIDTH * 0.07, bboxWidth * 0.82),
            radiusY: Math.max(MAP_HEIGHT * 0.09, bboxHeight * 0.96),
          };
        }

        const padX = MAP_WIDTH * 0.08;
        const padY = MAP_HEIGHT * 0.12;
        const scaleX = (MAP_WIDTH * 0.52) / (bboxWidth + padX);
        const scaleY = (MAP_HEIGHT * 0.46) / (bboxHeight + padY);
        const focusScale = clamp(Math.min(scaleX, scaleY), 1.05, 1.55);

        return {
          scale: focusScale,
          translateX: MAP_WIDTH / 2 - centerX * focusScale,
          translateY: MAP_HEIGHT * 0.56 - centerY * focusScale,
          centerX,
          centerY,
          radiusX: Math.max(MAP_WIDTH * 0.08, bboxWidth * 0.92),
          radiusY: Math.max(MAP_HEIGHT * 0.11, bboxHeight * 1.08),
        };
      })()
    : {
        scale: 1,
        translateX: 0,
        translateY: 0,
        centerX: MAP_WIDTH / 2,
        centerY: MAP_HEIGHT / 2,
        radiusX: MAP_WIDTH * 0.18,
        radiusY: MAP_HEIGHT * 0.18,
      };
  const clusterLabelPlacements = isClusterVariant
    ? (() => {
        const sideCounts = { left: 0, right: 0, top: 0, bottom: 0 };

        return resolvedLocations.map((loc) => {
          const dx = loc.pixelX - clusterFocus.centerX;
          const dy = loc.pixelY - clusterFocus.centerY;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          const preferHorizontal = absDx >= absDy * 0.85;
          const side = preferHorizontal
            ? dx < 0
              ? "left"
              : "right"
            : dy < 0
              ? "top"
              : "bottom";
          const stackIndex = sideCounts[side]++;
          const spreadDirection =
            side === "left" || side === "right"
              ? dy < 0
                ? -1
                : 1
              : dx < 0
                ? -1
                : 1;
          const stackOffset =
            stackIndex === 0
              ? 0
              : spreadDirection * (12 + (stackIndex - 1) * 16);

          if (side === "left") {
            return {
              left: -Math.round(22 * scale),
              top: stackOffset,
              align: "flex-end" as const,
              transform: "translate(-100%, -50%)",
            };
          }

          if (side === "right") {
            return {
              left: Math.round(22 * scale),
              top: stackOffset,
              align: "flex-start" as const,
              transform: "translate(0, -50%)",
            };
          }

          if (side === "top") {
            return {
              left: stackOffset,
              top: -Math.round(22 * scale),
              align: "center" as const,
              transform: "translate(-50%, -100%)",
            };
          }

          return {
            left: stackOffset,
            top: Math.round(22 * scale),
            align: "center" as const,
            transform: "translate(-50%, 0)",
          };
        });
      })()
    : [];
  const spotlightFocusScale =
    activeMapRegion === "world"
      ? 2.15
      : activeMapRegion === "europe" || activeMapRegion === "usa"
        ? 3.05
        : 2.75;
  const radiusFocusScale =
    activeMapRegion === "world" ? 1.32 : activeMapRegion === "usa" ? 1.22 : 1.16;
  const targetingFocusScale = activeMapRegion === "world" ? 1.5 : 1.18;
  const spotlightCenter = primaryLocation ?? {
    pixelX: MAP_WIDTH / 2,
    pixelY: MAP_HEIGHT / 2,
  };
  const routeFocus = isRouteVariant
    ? (() => {
        const points = resolvedLocations.map((loc) => ({
          x: loc.pixelX,
          y: loc.pixelY,
        }));
        const minX = Math.min(...points.map((point) => point.x));
        const maxX = Math.max(...points.map((point) => point.x));
        const minY = Math.min(...points.map((point) => point.y));
        const maxY = Math.max(...points.map((point) => point.y));
        const bboxWidth = Math.max(maxX - minX, MAP_WIDTH * 0.38);
        const bboxHeight = Math.max(maxY - minY, MAP_HEIGHT * 0.18);
        const padX = MAP_WIDTH * 0.2;
        const padY = MAP_HEIGHT * 0.28;
        const scaleX = (MAP_WIDTH * 0.86) / (bboxWidth + padX);
        const scaleY = (MAP_HEIGHT * 0.7) / (bboxHeight + padY);
        const focusScale = clamp(Math.min(scaleX, scaleY), 1, 1.1);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        return {
          scale: focusScale,
          translateX: MAP_WIDTH / 2 - centerX * focusScale,
          translateY: MAP_HEIGHT * 0.5 - centerY * focusScale,
        };
      })()
    : { scale: 1, translateX: 0, translateY: 0 };
  const routeLabelPlacements = isRouteVariant
    ? resolvedLocations.map((loc, index) => {
        const previous = index > 0 ? resolvedLocations[index - 1] : null;
        const next =
          index < resolvedLocations.length - 1
            ? resolvedLocations[index + 1]
            : null;
        const previousDistance = previous
          ? Math.hypot(loc.pixelX - previous.pixelX, loc.pixelY - previous.pixelY)
          : Number.POSITIVE_INFINITY;
        const nextDistance = next
          ? Math.hypot(loc.pixelX - next.pixelX, loc.pixelY - next.pixelY)
          : Number.POSITIVE_INFINITY;
        const crowded =
          Math.min(previousDistance, nextDistance) < MAP_WIDTH * 0.12;

        if (index === 0) {
          return crowded
            ? {
                left: Math.round(16 * scale),
                top: -Math.round(28 * scale),
                align: "flex-start" as const,
                transform: "translate(0, -100%)",
              }
            : {
                left: Math.round(18 * scale),
                top: Math.round(16 * scale),
                align: "flex-start" as const,
                transform: "translate(0, 0)",
              };
        }

        if (index === resolvedLocations.length - 1) {
          return crowded
            ? {
                left: Math.round(18 * scale),
                top: Math.round(22 * scale),
                align: "flex-start" as const,
                transform: "translate(0, 0)",
              }
            : {
                left: -Math.round(26 * scale),
                top: Math.round(16 * scale),
                align: "flex-end" as const,
                transform: "translate(-100%, 0)",
              };
        }

        return crowded
          ? index % 2 === 0
            ? {
                left: -Math.round(18 * scale),
                top: -Math.round(34 * scale),
                align: "flex-end" as const,
                transform: "translate(-100%, -100%)",
              }
            : {
                left: Math.round(18 * scale),
                top: Math.round(22 * scale),
                align: "flex-start" as const,
                transform: "translate(0, 0)",
              }
          : {
              left: 0,
              top: -Math.round(28 * scale),
              align: "center" as const,
              transform: "translate(-50%, -100%)",
            };
      })
    : [];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translateY(${floatY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: exitOpacity,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {props.title && isRouteVariant ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: `${Math.round(10 * scale)}px`,
              marginBottom: "28px",
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            <div
              style={{
                fontSize: `${Math.round((isNetworkVariant ? 34 : 40) * scale)}px`,
                fontWeight: typo.fontWeight ?? "bold",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.titleColor,
                textAlign: "center",
              }}
            >
              {props.title}
            </div>
            {routeSummary ? (
              <div
                style={{
                  fontSize: `${Math.round(16 * scale)}px`,
                  color: props.labelColor,
                  opacity: 0.78,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                {routeSummary}
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          style={{
            position: "relative",
            width: `${MAP_WIDTH}px`,
            height: `${MAP_HEIGHT}px`,
            background: isNetworkVariant
              ? "linear-gradient(180deg, rgba(16,20,23,0.98), rgba(11,14,17,0.96))"
              : isTargetingVariant
                ? "linear-gradient(180deg, rgba(8,18,16,0.98), rgba(4,10,9,0.98))"
                : isSpotlightVariant
                  ? "linear-gradient(180deg, #d9edf7 0%, #eef4ee 22%, #f7f0df 64%, #f2ebdd 100%)"
              : isClusterVariant
                ? "linear-gradient(180deg, #dceef7 0%, #eef4ef 20%, #f8f0e1 64%, #f3ecde 100%)"
                : isRadiusVariant
                  ? "linear-gradient(180deg, #dbeef8 0%, #eef3ef 20%, #f7efe1 62%, #f3ecde 100%)"
                : isRouteVariant
                  ? "linear-gradient(180deg, rgba(234,229,221,0.98), rgba(223,217,208,0.98))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
            border: isNetworkVariant
              ? `1px solid ${networkPanelBorder}`
              : isTargetingVariant
                ? `1px solid ${targetingPanelBorder}`
                : isSpotlightVariant
                  ? `1px solid ${spotlightPanelBorder}`
              : isClusterVariant
                ? `1px solid ${clusterPanelBorder}`
                : isRadiusVariant
                  ? `1px solid ${radiusPanelBorder}`
                : isRouteVariant
                  ? `1px solid ${routePanelBorder}`
                  : `1px solid ${highlightPanelBorder}`,
            borderRadius: isNetworkVariant
              ? `${Math.round(28 * scale)}px`
              : isTargetingVariant
                ? `${Math.round(24 * scale)}px`
                : isSpotlightVariant
                  ? `${Math.round(26 * scale)}px`
              : isClusterVariant
                ? `${Math.round(26 * scale)}px`
                : isRadiusVariant
                  ? `${Math.round(24 * scale)}px`
                : isRouteVariant
                  ? `${Math.round(24 * scale)}px`
                  : `${Math.round(28 * scale)}px`,
            overflow: "hidden",
            boxShadow: isNetworkVariant
              ? "0 24px 70px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(255,255,255,0.03)"
              : isTargetingVariant
                ? "0 24px 68px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(16,185,129,0.06)"
                : isSpotlightVariant
                  ? "0 24px 68px rgba(51,70,84,0.16), inset 0 0 0 1px rgba(255,255,255,0.28)"
              : isClusterVariant
                ? "0 22px 58px rgba(55,75,84,0.12), inset 0 0 0 1px rgba(255,255,255,0.24)"
                : isRadiusVariant
                  ? "0 22px 54px rgba(45,68,94,0.12), inset 0 0 0 1px rgba(255,255,255,0.22)"
                : isRouteVariant
                  ? "0 20px 50px rgba(28,33,36,0.12), inset 0 0 0 1px rgba(255,255,255,0.34)"
                  : "0 24px 60px rgba(15,23,42,0.08), inset 0 0 0 1px rgba(255,255,255,0.2)",
            backdropFilter:
              isHighlightVariant || isRadiusVariant ? "blur(12px)" : undefined,
          }}
        >
          {isHighlightVariant && props.title ? (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: `${Math.round(18 * scale)}px`,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: `${Math.round(4 * scale)}px`,
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontSize: `${Math.round(11 * scale)}px`,
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: highlightAccent,
                  opacity: 0.84,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Geographic presence
              </div>
              <div
                style={{
                  fontSize: `${Math.round(32 * scale)}px`,
                  fontWeight: typo.fontWeight ?? "bold",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: highlightTextPrimary,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {props.title}
              </div>
              <div
                style={{
                  fontSize: `${Math.round(13 * scale)}px`,
                  color: highlightTextSecondary,
                  opacity: 0.84,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {props.locations.length} active locations
              </div>
            </div>
          ) : null}
          {isNetworkVariant && props.title ? (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: `${Math.round(20 * scale)}px`,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: `${Math.round(6 * scale)}px`,
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontSize: `${Math.round(12 * scale)}px`,
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: networkAccent,
                  opacity: 0.9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Global network status: online
              </div>
              <div
                style={{
                  fontSize: `${Math.round(38 * scale)}px`,
                  fontWeight: typo.fontWeight ?? "bold",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: networkTextPrimary,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {props.title}
              </div>
              <div
                style={{
                  fontSize: `${Math.round(14 * scale)}px`,
                  color: networkTextSecondary,
                  opacity: 0.74,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {props.locations.length} connected hubs
              </div>
            </div>
          ) : null}
          {isClusterVariant && props.title ? (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: `${Math.round(18 * scale)}px`,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: `${Math.round(4 * scale)}px`,
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontSize: `${Math.round(11 * scale)}px`,
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: clusterAccent,
                  opacity: 0.84,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Coverage snapshot
              </div>
              <div
                style={{
                  fontSize: `${Math.round(28 * scale)}px`,
                  fontWeight: typo.fontWeight ?? "bold",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: clusterTextPrimary,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {props.title}
              </div>
              <div
                style={{
                  fontSize: `${Math.round(13 * scale)}px`,
                  color: clusterTextSecondary,
                  opacity: 0.86,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {props.locations.length} locations in focus
              </div>
            </div>
          ) : null}
          {isSpotlightVariant && props.title ? (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: `${Math.round(18 * scale)}px`,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: `${Math.round(4 * scale)}px`,
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontSize: `${Math.round(11 * scale)}px`,
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: spotlightAccent,
                  opacity: 0.88,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                City spotlight
              </div>
              <div
                style={{
                  fontSize: `${Math.round(34 * scale)}px`,
                  fontWeight: typo.fontWeight ?? "bold",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: spotlightTextPrimary,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {props.title}
              </div>
              <div
                style={{
                  fontSize: `${Math.round(13 * scale)}px`,
                  color: spotlightTextSecondary,
                  opacity: 0.84,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                primary location focus
              </div>
            </div>
          ) : null}
          {isRadiusVariant && props.title ? (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: `${Math.round(18 * scale)}px`,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: `${Math.round(4 * scale)}px`,
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontSize: `${Math.round(11 * scale)}px`,
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: radiusAccent,
                  opacity: 0.84,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Range coverage
              </div>
              <div
                style={{
                  fontSize: `${Math.round(32 * scale)}px`,
                  fontWeight: typo.fontWeight ?? "bold",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: radiusTextPrimary,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {props.title}
              </div>
              <div
                style={{
                  fontSize: `${Math.round(13 * scale)}px`,
                  color: radiusTextSecondary,
                  opacity: 0.84,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                concentric service zones
              </div>
            </div>
          ) : null}
          {isTargetingVariant && props.title ? (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: `${Math.round(18 * scale)}px`,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: `${Math.round(4 * scale)}px`,
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontSize: `${Math.round(11 * scale)}px`,
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: targetingAccent,
                  opacity: 0.84,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Tactical tracking
              </div>
              <div
                style={{
                  fontSize: `${Math.round(34 * scale)}px`,
                  fontWeight: typo.fontWeight ?? "bold",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: targetingTextPrimary,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {props.title}
              </div>
              <div
                style={{
                  fontSize: `${Math.round(13 * scale)}px`,
                  color: targetingTextSecondary,
                  opacity: 0.82,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                scanner lock on active target
              </div>
            </div>
          ) : null}

          {isNetworkVariant ? (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 50% 48%, rgba(140,185,196,0.07), transparent 48%), radial-gradient(circle at 80% 80%, rgba(140,185,196,0.05), transparent 34%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, transparent, rgba(140,185,196,0.04), transparent)",
                  transform: `translateX(${sweepProgress - MAP_WIDTH}px)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(24 * scale)}px`,
                  left: `${Math.round(26 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: networkAccent,
                  opacity: 0.84,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                Live topology
              </div>
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(24 * scale)}px`,
                  right: `${Math.round(26 * scale)}px`,
                  display: "flex",
                  gap: `${Math.round(18 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: networkTextSecondary,
                  opacity: 0.7,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                <span>{props.locations.length} nodes</span>
                <span>{networkLinks.length} links</span>
              </div>
            </>
          ) : null}
          {isRouteVariant ? (
            <>
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(22 * scale)}px`,
                  left: `${Math.round(24 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: routeAccent,
                  opacity: 0.84,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                Route overview
              </div>
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(22 * scale)}px`,
                  right: `${Math.round(24 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: routeTextSecondary,
                  opacity: 0.84,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                {props.locations.length} stops
              </div>
            </>
          ) : null}
          {isClusterVariant ? (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    `radial-gradient(circle at 16% 22%, ${geoWaterTint}B8, transparent 26%), radial-gradient(circle at 84% 18%, ${geoForestTint}88, transparent 24%), radial-gradient(circle at 52% 50%, rgba(217,127,47,0.08), transparent 32%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(22 * scale)}px`,
                  left: `${Math.round(24 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: clusterAccent,
                  opacity: 0.84,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                Hotspot density
              </div>
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(22 * scale)}px`,
                  right: `${Math.round(24 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: clusterTextSecondary,
                  opacity: 0.82,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                {props.locations.length} active hotspots
              </div>
              <div
                style={{
                  position: "absolute",
                  right: `${Math.round(24 * scale)}px`,
                  bottom: `${Math.round(20 * scale)}px`,
                  padding: `${Math.round(10 * scale)}px ${Math.round(12 * scale)}px`,
                  borderRadius: `${Math.round(14 * scale)}px`,
                  background:
                    "linear-gradient(180deg, rgba(255,252,246,0.94), rgba(246,239,226,0.98))",
                  border: `1px solid ${clusterPanelBorder}`,
                  boxShadow: "0 8px 24px rgba(39,53,59,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: `${Math.round(6 * scale)}px`,
                  zIndex: 5,
                }}
              >
                <div
                  style={{
                    fontSize: `${Math.round(10 * scale)}px`,
                    color: clusterTextSecondary,
                    opacity: 0.9,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  }}
                >
                  Density legend
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: `${Math.round(10 * scale)}px` }}>
                  {["rgba(249,115,22,0.18)", "rgba(249,115,22,0.3)", "rgba(249,115,22,0.46)"].map(
                    (color, index) => (
                      <div
                        key={color}
                        style={{
                          width: `${Math.round((12 + index * 4) * scale)}px`,
                          height: `${Math.round((12 + index * 4) * scale)}px`,
                          borderRadius: "50%",
                          background: color,
                          border: "1px solid rgba(249,115,22,0.28)",
                        }}
                      />
                    ),
                  )}
                </div>
              </div>
            </>
          ) : null}
          {isSpotlightVariant ? (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(circle at ${(spotlightCenter.pixelX / MAP_WIDTH) * 100}% ${(spotlightCenter.pixelY / MAP_HEIGHT) * 100}%, rgba(255,243,198,0.42), rgba(255,243,198,0.2) 9%, rgba(255,249,235,0.08) 18%, rgba(244,235,214,0.04) 28%, rgba(0,0,0,0) 40%), radial-gradient(circle at 14% 18%, ${geoWaterTint}A6, transparent 24%), radial-gradient(circle at 88% 18%, ${geoForestTint}88, transparent 22%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(22 * scale)}px`,
                  left: `${Math.round(24 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: spotlightAccent,
                  opacity: 0.82,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                Priority location
              </div>
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(22 * scale)}px`,
                  right: `${Math.round(24 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: spotlightTextSecondary,
                  opacity: 0.82,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                Spotlight view
              </div>
              <div
                style={{
                  position: "absolute",
                  left: `${Math.round(24 * scale)}px`,
                  bottom: `${Math.round(20 * scale)}px`,
                  padding: `${Math.round(10 * scale)}px ${Math.round(12 * scale)}px`,
                  borderRadius: `${Math.round(999 * scale)}px`,
                  background: "linear-gradient(180deg, rgba(255,251,242,0.96), rgba(245,237,224,0.98))",
                  border: `1px solid ${spotlightPanelBorder}`,
                  color: spotlightTextSecondary,
                  fontSize: `${Math.round(10 * scale)}px`,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  boxShadow: "0 10px 22px rgba(96,84,56,0.12)",
                  zIndex: 5,
                }}
              >
                1 primary focus point
              </div>
            </>
          ) : null}
          {isRadiusVariant ? (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    `radial-gradient(circle at 16% 20%, ${geoWaterTint}A8, transparent 24%), radial-gradient(circle at 82% 18%, ${geoForestTint}72, transparent 22%), radial-gradient(circle at 50% 48%, rgba(79,143,232,0.12), transparent 38%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(22 * scale)}px`,
                  left: `${Math.round(24 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: radiusAccent,
                  opacity: 0.84,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                Radius model
              </div>
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(22 * scale)}px`,
                  right: `${Math.round(24 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: radiusTextSecondary,
                  opacity: 0.82,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                3 coverage bands
              </div>
              <div
                style={{
                  position: "absolute",
                  right: `${Math.round(24 * scale)}px`,
                  bottom: `${Math.round(20 * scale)}px`,
                  padding: `${Math.round(10 * scale)}px ${Math.round(12 * scale)}px`,
                  borderRadius: `${Math.round(14 * scale)}px`,
                  background:
                    "linear-gradient(180deg, rgba(255,252,246,0.94), rgba(245,238,225,0.98))",
                  border: `1px solid ${radiusPanelBorder}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: `${Math.round(6 * scale)}px`,
                  zIndex: 5,
                }}
              >
                {["Core", "Service", "Extended"].map((label, index) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: `${Math.round(8 * scale)}px`,
                      color: radiusTextSecondary,
                      fontSize: `${Math.round(10 * scale)}px`,
                      fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round((10 + index * 3) * scale)}px`,
                        height: `${Math.round((10 + index * 3) * scale)}px`,
                        borderRadius: "50%",
                        border: `1.5px solid ${radiusAccent}${index === 0 ? "AA" : index === 1 ? "80" : "66"}`,
                      }}
                    />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
          {isTargetingVariant ? (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 50% 48%, rgba(16,185,129,0.08), transparent 36%), linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.06) 48%, transparent 52%, transparent 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(22 * scale)}px`,
                  left: `${Math.round(24 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: targetingAccent,
                  opacity: 0.84,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                Tracking lock
              </div>
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(22 * scale)}px`,
                  right: `${Math.round(24 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: targetingTextSecondary,
                  opacity: 0.82,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                live scanner
              </div>
              <div
                style={{
                  position: "absolute",
                  left: `${Math.round(18 * scale)}px`,
                  right: `${Math.round(18 * scale)}px`,
                  top: `${Math.round(64 * scale + (sweepProgress % (MAP_HEIGHT - 120)))}px`,
                  height: `${Math.max(2, Math.round(2 * scale))}px`,
                  background:
                    "linear-gradient(90deg, transparent, rgba(16,185,129,0.72), transparent)",
                  opacity: 0.42,
                  pointerEvents: "none",
                }}
              />
              {[
                { top: 18, left: 18, borderLeft: `2px solid ${targetingAccent}`, borderTop: `2px solid ${targetingAccent}` },
                { top: 18, right: 18, borderRight: `2px solid ${targetingAccent}`, borderTop: `2px solid ${targetingAccent}` },
                { bottom: 18, left: 18, borderLeft: `2px solid ${targetingAccent}`, borderBottom: `2px solid ${targetingAccent}` },
                { bottom: 18, right: 18, borderRight: `2px solid ${targetingAccent}`, borderBottom: `2px solid ${targetingAccent}` },
              ].map((corner, index) => (
                <div
                  key={`target-corner-${index}`}
                  style={{
                    position: "absolute",
                    width: `${Math.round(20 * scale)}px`,
                    height: `${Math.round(20 * scale)}px`,
                    opacity: 0.76,
                    ...corner,
                  }}
                />
              ))}
            </>
          ) : null}
          {isHighlightVariant ? (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.18), transparent 52%), radial-gradient(circle at 82% 16%, rgba(255,255,255,0.16), transparent 22%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(22 * scale)}px`,
                  left: `${Math.round(24 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: highlightAccent,
                  opacity: 0.82,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                Active region
              </div>
              <div
                style={{
                  position: "absolute",
                  top: `${Math.round(22 * scale)}px`,
                  right: `${Math.round(24 * scale)}px`,
                  fontSize: `${Math.round(11 * scale)}px`,
                  color: highlightTextSecondary,
                  opacity: 0.84,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                }}
              >
                Marker map
              </div>
            </>
          ) : null}

          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: isNetworkVariant
                ? `translate(${networkFocus.translateX}px, ${networkFocus.translateY}px) scale(${networkFocus.scale})`
                : isTargetingVariant
                  ? `translate(${MAP_WIDTH / 2 - (primaryLocation?.pixelX ?? MAP_WIDTH / 2) * targetingFocusScale}px, ${MAP_HEIGHT * 0.56 - (primaryLocation?.pixelY ?? MAP_HEIGHT / 2) * targetingFocusScale}px) scale(${targetingFocusScale})`
                  : isSpotlightVariant
                    ? `translate(${MAP_WIDTH / 2 - (primaryLocation?.pixelX ?? MAP_WIDTH / 2) * spotlightFocusScale}px, ${MAP_HEIGHT * 0.58 - (primaryLocation?.pixelY ?? MAP_HEIGHT / 2) * spotlightFocusScale}px) scale(${spotlightFocusScale})`
                : isClusterVariant
                  ? `translate(${clusterFocus.translateX}px, ${clusterFocus.translateY}px) scale(${clusterFocus.scale})`
                  : isRadiusVariant
                    ? `translate(${MAP_WIDTH / 2 - (primaryLocation?.pixelX ?? MAP_WIDTH / 2) * radiusFocusScale}px, ${MAP_HEIGHT * 0.57 - (primaryLocation?.pixelY ?? MAP_HEIGHT / 2) * radiusFocusScale}px) scale(${radiusFocusScale})`
                  : isRouteVariant
                    ? `translate(${routeFocus.translateX}px, ${routeFocus.translateY}px) scale(${routeFocus.scale})`
                    : undefined,
              transformOrigin: "top left",
            }}
          >
            <svg
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              style={{ position: "absolute", opacity: mapOpacity }}
            >
              {graticulePath && !usesWorldDotsStyle ? (
                <path
                  d={graticulePath}
                  fill="none"
                  stroke={
                    isNetworkVariant
                      ? networkGridColor
                      : isTargetingVariant
                        ? targetingGridColor
                        : isSpotlightVariant
                          ? spotlightGridColor
                      : isClusterVariant
                        ? clusterGridColor
                        : isRadiusVariant
                          ? radiusGridColor
                        : isRouteVariant
                          ? routeGridColor
                          : props.mapColor
                  }
                  strokeWidth="0.7"
                  opacity={
                    isNetworkVariant
                      ? 0.72
                      : isTargetingVariant
                        ? 0.52
                        : isSpotlightVariant
                          ? 0.24
                      : isClusterVariant
                        ? activeMapRegion === "world"
                          ? 0.36
                          : 0.14
                        : isRadiusVariant
                          ? 0.22
                        : isRouteVariant
                          ? 0.38
                          : 0.14
                  }
                />
              ) : null}
              {localizedCountryPaths.map((country) => (
                <path
                  key={country.key}
                  d={country.d}
                  fill={
                    usesMinimalOutlineStyle &&
                    !usesExplicitFilledStyle &&
                    !(isClusterVariant && hasRegionalFocus) &&
                    !(isHighlightVariant && hasRegionalFocus) &&
                    !(isSpotlightVariant && hasRegionalFocus) &&
                    !(isRadiusVariant && hasRegionalFocus)
                      ? "none"
                      : isNetworkVariant
                        ? networkMapFill
                        : isTargetingVariant
                          ? targetingMapFill
                          : isSpotlightVariant
                            ? spotlightMapFill
                        : isClusterVariant
                          ? clusterMapFill
                          : isRadiusVariant
                            ? radiusMapFill
                          : isRouteVariant
                            ? routeMapFill
                            : isHighlightVariant
                              ? highlightMapFill
                            : usesWorldDotsStyle
                              ? "rgba(255,255,255,0.04)"
                              : `${props.mapColor}22`
                  }
                  stroke={
                    isNetworkVariant
                      ? networkMapStroke
                      : isTargetingVariant
                        ? targetingMapStroke
                        : isSpotlightVariant
                          ? spotlightMapStroke
                      : isClusterVariant
                        ? clusterMapStroke
                        : isRadiusVariant
                          ? radiusMapStroke
                        : isRouteVariant
                          ? routeMapStroke
                          : props.mapColor
                  }
                  strokeWidth={
                    usesMinimalOutlineStyle
                      ? isClusterVariant && hasRegionalFocus
                        ? 1.7
                        : isSpotlightVariant && hasRegionalFocus
                          ? 1.5
                          : isRadiusVariant && hasRegionalFocus
                            ? 1.5
                        : isHighlightVariant && hasRegionalFocus
                          ? 1.45
                          : 1.2
                      : 0.75
                  }
                  opacity={
                    isNetworkVariant
                      ? 0.9
                      : isTargetingVariant
                        ? 0.9
                        : isSpotlightVariant
                          ? hasRegionalFocus
                            ? 0.95
                            : 0.86
                      : isClusterVariant
                        ? hasRegionalFocus
                          ? 0.96
                          : 0.88
                        : isRadiusVariant
                          ? hasRegionalFocus
                            ? 0.94
                            : 0.84
                        : isRouteVariant
                          ? 0.9
                          : isHighlightVariant && hasRegionalFocus
                            ? 0.92
                          : usesMinimalOutlineStyle
                            ? 0.78
                            : 0.66
                  }
                  />
              ))}
              {isHighlightVariant ? (
                <g>
                  <ellipse
                    cx={highlightFocus.centerX}
                    cy={highlightFocus.centerY}
                    rx={highlightFocus.radiusX}
                    ry={highlightFocus.radiusY}
                    fill={`${highlightAccent}12`}
                    opacity={0.22}
                  />
                  {resolvedLocations.map((loc) => (
                    <circle
                      key={`highlight-halo-${loc.label}`}
                      cx={loc.pixelX}
                      cy={loc.pixelY}
                      r={Math.max(18, Math.round(22 * scale))}
                      fill={`${highlightAccent}16`}
                      opacity={0.3}
                    />
                  ))}
                </g>
              ) : null}
              {isSpotlightVariant && primaryLocation ? (
                <g>
                  <circle
                    cx={primaryLocation.pixelX}
                    cy={primaryLocation.pixelY}
                    r={Math.max(28, Math.round(34 * scale))}
                    fill={`${spotlightAccent}12`}
                    opacity={0.52}
                  />
                  <circle
                    cx={primaryLocation.pixelX}
                    cy={primaryLocation.pixelY}
                    r={Math.max(44, Math.round(48 * scale))}
                    fill="none"
                    stroke={`${spotlightAccent}66`}
                    strokeWidth="1.4"
                    opacity={0.72}
                    strokeDasharray="5 6"
                  />
                  <line
                    x1={primaryLocation.pixelX - Math.max(24, Math.round(28 * scale))}
                    y1={primaryLocation.pixelY}
                    x2={primaryLocation.pixelX + Math.max(24, Math.round(28 * scale))}
                    y2={primaryLocation.pixelY}
                    stroke={`${spotlightAccent}AA`}
                    strokeWidth="1.4"
                    opacity={0.78}
                  />
                  <line
                    x1={primaryLocation.pixelX}
                    y1={primaryLocation.pixelY - Math.max(24, Math.round(28 * scale))}
                    x2={primaryLocation.pixelX}
                    y2={primaryLocation.pixelY + Math.max(24, Math.round(28 * scale))}
                    stroke={`${spotlightAccent}AA`}
                    strokeWidth="1.4"
                    opacity={0.78}
                  />
                </g>
              ) : null}
              {isClusterVariant ? (
                <g>
                  {resolvedLocations.map((loc, index) => (
                    <circle
                      key={`cluster-density-${loc.label}-${index}`}
                      cx={loc.pixelX}
                      cy={loc.pixelY}
                      r={Math.max(
                        20,
                        Math.round(
                          (activeMapRegion === "world" ? 24 + index * 3 : 20 + index * 2) * scale,
                        ),
                      )}
                      fill={clusterAccentSoft}
                      opacity={activeMapRegion === "world" ? 0.14 + index * 0.02 : 0.12 + index * 0.015}
                    />
                  ))}
                  <ellipse
                    cx={clusterFocus.centerX}
                    cy={clusterFocus.centerY}
                    rx={Math.max(22, clusterFocus.radiusX)}
                    ry={Math.max(18, clusterFocus.radiusY)}
                    fill={clusterAccentSoft}
                    opacity={activeMapRegion === "world" ? 0.24 : 0.16}
                  />
                  <ellipse
                    cx={clusterFocus.centerX}
                    cy={clusterFocus.centerY}
                    rx={Math.max(28, clusterFocus.radiusX) * pulseScale}
                    ry={Math.max(22, clusterFocus.radiusY) * pulseScale}
                    fill="none"
                    stroke={clusterAccent}
                    strokeWidth="1.2"
                    opacity={pulseOpacity * (activeMapRegion === "world" ? 0.34 : 0.22)}
                    strokeDasharray="5 6"
                  />
                </g>
              ) : null}
              {isRadiusVariant && primaryLocation ? (
                <g>
                  {[
                    { multiplier: 0.8, label: "Core zone" },
                    { multiplier: 1.28, label: "Service radius" },
                    { multiplier: 1.78, label: "Extended reach" },
                  ].map((ring, index) => {
                    const ringRadius =
                      Math.max(26, Math.round((activeMapRegion === "world" ? 54 : 42) * ring.multiplier * scale));
                    return (
                      <g key={`radius-ring-${ring.label}`}>
                        <circle
                          cx={primaryLocation.pixelX}
                          cy={primaryLocation.pixelY}
                          r={ringRadius}
                          fill={index === 0 ? `${radiusAccent}10` : "none"}
                          stroke={`${radiusAccent}${index === 1 ? "80" : "55"}`}
                          strokeWidth={index === 0 ? "2.2" : "1.6"}
                          opacity={0.82 - index * 0.12}
                          strokeDasharray={index === 1 ? "6 6" : index === 2 ? "2 6" : undefined}
                        />
                        <text
                          x={primaryLocation.pixelX + ringRadius + Math.round(10 * scale)}
                          y={primaryLocation.pixelY - ringRadius + Math.round((index + 1) * 14 * scale)}
                          fill={radiusAccent}
                          opacity={0.84}
                          fontSize={Math.round(11 * scale)}
                          fontWeight={600}
                          fontFamily={typo.fontFamily ?? "Arial, Helvetica, sans-serif"}
                          letterSpacing="0.08em"
                        >
                          {ring.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              ) : null}
              {isTargetingVariant && primaryLocation ? (
                <g>
                  <circle
                    cx={primaryLocation.pixelX}
                    cy={primaryLocation.pixelY}
                    r={Math.max(20, Math.round(22 * scale))}
                    fill="none"
                    stroke={`${targetingAccent}AA`}
                    strokeWidth="1.6"
                    opacity={0.84}
                  />
                  <circle
                    cx={primaryLocation.pixelX}
                    cy={primaryLocation.pixelY}
                    r={Math.max(32, Math.round(34 * scale)) * pulseScale}
                    fill="none"
                    stroke={`${targetingAccent}4D`}
                    strokeWidth="1.2"
                    opacity={pulseOpacity + 0.12}
                  />
                  <rect
                    x={primaryLocation.pixelX - Math.max(28, Math.round(30 * scale))}
                    y={primaryLocation.pixelY - Math.max(28, Math.round(30 * scale))}
                    width={Math.max(56, Math.round(60 * scale))}
                    height={Math.max(56, Math.round(60 * scale))}
                    fill="none"
                    stroke={`${targetingAccent}99`}
                    strokeWidth="1.2"
                    opacity={0.78}
                  />
                  <line
                    x1={primaryLocation.pixelX - Math.max(42, Math.round(46 * scale))}
                    y1={primaryLocation.pixelY}
                    x2={primaryLocation.pixelX + Math.max(42, Math.round(46 * scale))}
                    y2={primaryLocation.pixelY}
                    stroke={`${targetingAccent}66`}
                    strokeWidth="1"
                    opacity={0.72}
                  />
                  <line
                    x1={primaryLocation.pixelX}
                    y1={primaryLocation.pixelY - Math.max(42, Math.round(46 * scale))}
                    x2={primaryLocation.pixelX}
                    y2={primaryLocation.pixelY + Math.max(42, Math.round(46 * scale))}
                    stroke={`${targetingAccent}66`}
                    strokeWidth="1"
                    opacity={0.72}
                  />
                </g>
              ) : null}

              {isNetworkVariant
                ? networkLinks.map((link, index) => {
                    const progressPoint = getLinearPoint(link, link.progress);
                    const pulsePoint = getLinearPoint(link, link.pulseProgress);
                    return (
                      <g key={`network-${index}`}>
                        <line
                          x1={link.x1}
                          y1={link.y1}
                          x2={link.x2}
                          y2={link.y2}
                          stroke={networkAccent}
                          strokeWidth={
                            index < props.locations.length - 1 ? "1.9" : "1.2"
                          }
                          opacity={
                            index < props.locations.length - 1 ? 0.28 : 0.16
                          }
                        />
                        <line
                          x1={link.x1}
                          y1={link.y1}
                          x2={link.x2}
                          y2={link.y2}
                          stroke={networkAccentGlow}
                          strokeWidth={
                            index < props.locations.length - 1 ? "8" : "5"
                          }
                          opacity={
                            index < props.locations.length - 1 ? 0.12 : 0.06
                          }
                        />
                        <line
                          x1={link.x1}
                          y1={link.y1}
                          x2={progressPoint.x}
                          y2={progressPoint.y}
                          stroke={networkAccent}
                          strokeWidth={
                            index < props.locations.length - 1 ? "3.8" : "2.2"
                          }
                          strokeLinecap="round"
                          opacity={
                            index < props.locations.length - 1 ? 0.94 : 0.72
                          }
                        />
                        <circle
                          cx={pulsePoint.x}
                          cy={pulsePoint.y}
                          r={Math.max(3.2, Math.round(3.5 * scale))}
                          fill={networkAccent}
                          opacity={0.92}
                        />
                      </g>
                    );
                  })
                : isRouteVariant || props.connectionLines
                  ? routeSegments.map((segment, index) => {
                    const path = `M ${segment.x1.toFixed(2)} ${segment.y1.toFixed(2)} Q ${segment.cx.toFixed(2)} ${segment.cy.toFixed(2)} ${segment.x2.toFixed(2)} ${segment.y2.toFixed(2)}`;
                    const dashArray = isRouteVariant
                      ? `${segment.estimatedLength} ${segment.estimatedLength}`
                      : props.connectionStyle === "dashed"
                        ? "8 6"
                        : props.connectionStyle === "dotted"
                          ? "2 5"
                          : "none";
                    const dashOffset = isRouteVariant
                      ? segment.estimatedLength * (1 - segment.progress)
                      : 0;
                    return (
                      <g key={`route-${index}`}>
                        {isRouteVariant ? (
                          <path
                            d={path}
                            fill="none"
                            stroke={routeAccentGlow}
                            strokeWidth="6"
                            opacity={0.18}
                            strokeLinecap="round"
                          />
                        ) : null}
                        <path
                          d={path}
                          fill="none"
                          stroke={
                            isRouteVariant ? routeAccent : props.markerColor
                          }
                          strokeWidth={isRouteVariant ? "2.8" : "1.8"}
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          opacity={isRouteVariant ? 0.88 : 0.5}
                        />
                      </g>
                    );
                    })
                  : null}
              {isRouteVariant && activeRouteDot
                ? (() => {
                    const dotPoint = getQuadraticPoint(
                      activeRouteDot,
                      activeRouteDot.progress,
                    );
                    return (
                      <g>
                        <circle
                          cx={dotPoint.x}
                          cy={dotPoint.y}
                          r={Math.max(10, Math.round(10 * scale))}
                          fill={routeAccent}
                          opacity={0.2}
                        />
                        <circle
                          cx={dotPoint.x}
                          cy={dotPoint.y}
                          r={Math.max(4, Math.round(4.5 * scale))}
                          fill={routeAccent}
                          opacity={0.98}
                        />
                      </g>
                    );
                  })()
                : null}
            </svg>

            {resolvedLocations.map((loc, index) => {
              const stagger = staggerDelay(
                index,
                resolvedLocations.length,
                markersDuration,
              );
              const range = {
                startFrame: markersStart + stagger.startFrame,
                endFrame: markersStart + stagger.endFrame,
              };

              let markerOpacity = 1;
              let markerScale = 1;
              if (props.entranceAnimation === "progressive") {
                markerOpacity = fadeIn(frame, range).opacity;
                markerScale = interpolate(
                  frame,
                  [range.startFrame, range.endFrame],
                  [0, 1],
                  CLAMP,
                );
              } else if (props.entranceAnimation === "fade-in") {
                markerOpacity = fadeIn(frame, range).opacity;
              } else if (props.entranceAnimation === "scale-pop") {
                const pop = scalePop(frame, range, 1.3);
                markerOpacity = pop.opacity;
                markerScale = pop.scale;
              }

              const isHub = isNetworkVariant && index === 0;
              const nodeDescriptor =
                loc.description ??
                (isHub
                  ? "Primary Hub"
                  : isNetworkVariant
                    ? "Active Node"
                    : undefined);
              const pointXPercent = (loc.pixelX / MAP_WIDTH) * 100;
              const pointYPercent = (loc.pixelY / MAP_HEIGHT) * 100;
              const clusterPlacement = isClusterVariant
                ? clusterLabelPlacements[index]
                : null;
              const routePlacement = isRouteVariant
                ? routeLabelPlacements[index]
                : null;
              const labelOffsetX = isNetworkVariant
                ? pointXPercent < 55
                  ? Math.round(18 * scale)
                  : Math.round(-18 * scale)
                : isSpotlightVariant
                  ? pointXPercent < 55
                    ? Math.round(26 * scale)
                    : Math.round(-26 * scale)
                  : isRadiusVariant
                    ? pointXPercent < 55
                      ? Math.round(24 * scale)
                      : Math.round(-24 * scale)
                    : isTargetingVariant
                      ? pointXPercent < 55
                        ? Math.round(34 * scale)
                        : Math.round(-34 * scale)
                : isClusterVariant
                  ? (clusterPlacement?.left ?? Math.round(18 * scale))
                  : isRouteVariant
                    ? (routePlacement?.left ?? Math.round(12 * scale))
                    : 0;
              const labelOffsetY = isNetworkVariant
                ? pointYPercent < 42
                  ? Math.round(8 * scale)
                  : Math.round(-8 * scale)
                : isSpotlightVariant
                  ? pointYPercent < 48
                    ? -Math.round(16 * scale)
                    : Math.round(16 * scale)
                  : isRadiusVariant
                    ? pointYPercent < 48
                      ? -Math.round(14 * scale)
                      : Math.round(14 * scale)
                    : isTargetingVariant
                      ? Math.round(-12 * scale)
                : isClusterVariant
                  ? (clusterPlacement?.top ?? Math.round(-18 * scale))
                  : isRouteVariant
                    ? (routePlacement?.top ?? Math.round(16 * scale))
                    : 0;
              const labelAnchor = isNetworkVariant
                ? pointXPercent < 55
                  ? "flex-start"
                  : "flex-end"
                : isSpotlightVariant || isRadiusVariant || isTargetingVariant
                  ? pointXPercent < 55
                    ? "flex-start"
                    : "flex-end"
                : isClusterVariant
                  ? (clusterPlacement?.align ?? "flex-start")
                : isRouteVariant
                    ? (routePlacement?.align ?? "center")
                    : "center";
              const routeNodeDescriptor =
                loc.description ??
                (index === 0
                  ? "Origin"
                  : index === resolvedLocations.length - 1
                    ? "Destination"
                    : "Transit Stop");
              const clusterDescriptor = isClusterVariant
                ? loc.description
                : undefined;
              const spotlightDescriptor =
                loc.description ??
                (index === 0 ? "Priority Site" : "Nearby Node");
              const radiusDescriptor =
                loc.description ??
                (index === 0 ? "Impact Center" : "Within Reach");
              const targetingDescriptor =
                loc.description ??
                (index === 0 ? "Target Lock" : "Linked Point");

              return (
                <div
                  key={loc.label}
                  style={{
                    position: "absolute",
                    left: `${loc.pixelX}px`,
                    top: `${loc.pixelY}px`,
                    transform: `translate(-50%, -50%) scale(${markerScale})`,
                    opacity: markerOpacity,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {props.markerPulse && markerOpacity > 0.5 ? (
                    <div
                      style={{
                        position: "absolute",
                        width: isHub
                          ? "30px"
                          : isTargetingVariant
                            ? "28px"
                            : isSpotlightVariant
                              ? "24px"
                              : isRadiusVariant
                                ? "22px"
                          : isClusterVariant
                            ? "24px"
                            : isNetworkVariant
                              ? "22px"
                              : "18px",
                        height: isHub
                          ? "30px"
                          : isTargetingVariant
                            ? "28px"
                            : isSpotlightVariant
                              ? "24px"
                              : isRadiusVariant
                                ? "22px"
                          : isClusterVariant
                            ? "24px"
                            : isNetworkVariant
                              ? "22px"
                              : "18px",
                        borderRadius: "50%",
                        border: `2px solid ${
                          isNetworkVariant
                            ? networkAccent
                            : isTargetingVariant
                              ? targetingAccent
                              : isSpotlightVariant
                                ? spotlightAccent
                                : isRadiusVariant
                                  ? radiusAccent
                            : isClusterVariant
                              ? clusterAccent
                              : isRouteVariant
                                ? routeAccent
                                : props.markerColor
                        }`,
                        transform: `scale(${pulseScale})`,
                        opacity: pulseOpacity,
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: isRouteVariant
                        ? "16px"
                        : isTargetingVariant
                          ? "16px"
                          : isSpotlightVariant
                            ? "14px"
                            : isRadiusVariant
                              ? "13px"
                        : isClusterVariant
                          ? "14px"
                          : isHub
                            ? "18px"
                            : isNetworkVariant
                              ? "14px"
                              : "12px",
                      height: isRouteVariant
                        ? "16px"
                        : isTargetingVariant
                          ? "16px"
                          : isSpotlightVariant
                            ? "14px"
                            : isRadiusVariant
                              ? "13px"
                        : isClusterVariant
                          ? "14px"
                          : isHub
                            ? "18px"
                            : isNetworkVariant
                              ? "14px"
                              : "12px",
                      borderRadius:
                        isRouteVariant || isNetworkVariant || isTargetingVariant
                          ? "5px"
                          : isSpotlightVariant
                            ? "4px"
                          : isClusterVariant
                            ? "50%"
                            : "50%",
                      backgroundColor: isNetworkVariant
                        ? networkAccent
                        : isTargetingVariant
                          ? targetingAccent
                          : isSpotlightVariant
                            ? spotlightAccent
                            : isRadiusVariant
                              ? radiusAccent
                        : isClusterVariant
                          ? clusterAccent
                          : isRouteVariant
                            ? routeAccent
                            : props.markerColor,
                      border: `2px solid ${props.labelColor}33`,
                    boxShadow: isNetworkVariant
                        ? `0 0 18px rgba(140,185,196,0.45)`
                        : isTargetingVariant
                          ? "0 0 0 5px rgba(16,185,129,0.08), 0 0 16px rgba(16,185,129,0.2)"
                          : isSpotlightVariant
                            ? `0 0 0 5px ${spotlightAccent}12, 0 0 16px ${spotlightAccent}33`
                            : isRadiusVariant
                              ? `0 0 0 4px ${radiusAccent}12, 0 0 12px ${radiusAccent}2E`
                        : isClusterVariant
                          ? "0 0 0 4px rgba(47,111,122,0.08), 0 0 14px rgba(47,111,122,0.14)"
                          : isRouteVariant
                            ? "0 0 14px rgba(95,125,134,0.22)"
                            : `0 0 14px ${props.markerColor}66`,
                      zIndex: 2,
                    }}
                  />
                  <div
                    style={{
                      position:
                        anchoredLabelVariant
                          ? "absolute"
                          : "relative",
                      left:
                        anchoredLabelVariant
                          ? `${labelOffsetX}px`
                          : undefined,
                      top:
                        anchoredLabelVariant
                          ? `${labelOffsetY}px`
                          : undefined,
                      marginTop: isNetworkVariant
                        ? "0px"
                        : isSpotlightVariant || isRadiusVariant || isTargetingVariant
                          ? "0px"
                        : isRouteVariant
                          ? "0px"
                          : `${Math.round(10 * scale)}px`,
                      padding: isNetworkVariant
                        ? `${Math.round(9 * scale)}px ${Math.round(13 * scale)}px`
                        : isRouteVariant
                          ? `${Math.round(8 * scale)}px ${Math.round(12 * scale)}px`
                          : `${Math.round(6 * scale)}px ${Math.round(activeMapRegion === "world" ? 9 : 8 * scale)}px`,
                      borderRadius: `${Math.round(10 * scale)}px`,
                      background: isNetworkVariant
                        ? "linear-gradient(180deg, rgba(17,23,28,0.96), rgba(13,18,22,0.9))"
                        : isTargetingVariant
                          ? "linear-gradient(180deg, rgba(9,20,17,0.96), rgba(5,13,11,0.92))"
                          : isSpotlightVariant
                            ? "linear-gradient(180deg, rgba(17,23,31,0.96), rgba(11,16,23,0.9))"
                            : isRadiusVariant
                              ? "linear-gradient(180deg, rgba(247,250,253,0.94), rgba(232,239,246,0.97))"
                        : isClusterVariant
                          ? "linear-gradient(180deg, rgba(249,251,250,0.92), rgba(233,240,238,0.96))"
                          : isRouteVariant
                            ? "linear-gradient(180deg, rgba(248,244,238,0.88), rgba(233,227,218,0.96))"
                            : "linear-gradient(180deg, rgba(255,255,255,0.52), rgba(255,255,255,0.3))",
                      border: isNetworkVariant
                        ? `1px solid ${networkPanelBorder}`
                        : isTargetingVariant
                          ? `1px solid ${targetingPanelBorder}`
                          : isSpotlightVariant
                            ? `1px solid ${spotlightPanelBorder}`
                            : isRadiusVariant
                              ? `1px solid ${radiusPanelBorder}`
                        : isClusterVariant
                          ? `1px solid ${clusterPanelBorder}`
                          : isRouteVariant
                            ? `1px solid ${routePanelBorder}`
                            : `1px solid ${highlightPanelBorder}`,
                      backdropFilter: "blur(8px)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: labelAnchor,
                      minWidth: isNetworkVariant
                        ? `${Math.round(132 * scale)}px`
                        : isTargetingVariant
                          ? `${Math.round(142 * scale)}px`
                          : isSpotlightVariant || isRadiusVariant
                            ? `${Math.round(116 * scale)}px`
                        : isClusterVariant
                          ? `${Math.round(
                              (activeMapRegion === "world" ? 98 : 88) * scale,
                            )}px`
                          : undefined,
                      transform: isNetworkVariant
                        ? pointXPercent < 55
                          ? "translate(0, -50%)"
                          : "translate(-100%, -50%)"
                        : isSpotlightVariant || isRadiusVariant || isTargetingVariant
                          ? pointXPercent < 55
                            ? "translate(0, -50%)"
                            : "translate(-100%, -50%)"
                        : isClusterVariant
                          ? (clusterPlacement?.transform ??
                            "translate(0, -50%)")
                        : isRouteVariant
                            ? (routePlacement?.transform ??
                              "translate(-50%, -100%)")
                            : undefined,
                      boxShadow: isNetworkVariant
                        ? "0 10px 30px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.03)"
                        : isTargetingVariant
                          ? "0 10px 30px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(16,185,129,0.05)"
                          : isSpotlightVariant
                            ? "0 10px 28px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.04)"
                            : isRadiusVariant
                              ? "0 10px 24px rgba(59,130,246,0.08)"
                        : isClusterVariant
                          ? "0 6px 16px rgba(39,53,59,0.06)"
                          : isRouteVariant
                            ? "0 8px 20px rgba(34,40,44,0.08)"
                            : "0 8px 18px rgba(15,23,42,0.08)",
                      zIndex: 3,
                    }}
                  >
                    <div
                      style={{
                        fontSize: `${Math.round((isNetworkVariant ? 16 : 15) * scale)}px`,
                        fontWeight: typo.fontWeight ?? "bold",
                        fontFamily:
                          typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                        color: isNetworkVariant
                          ? networkTextPrimary
                          : isTargetingVariant
                            ? targetingTextPrimary
                            : isSpotlightVariant
                              ? spotlightTextPrimary
                              : isRadiusVariant
                                ? radiusTextPrimary
                          : isClusterVariant
                            ? clusterTextPrimary
                            : isRouteVariant
                              ? routeTextPrimary
                              : highlightTextPrimary,
                        whiteSpace: "nowrap",
                        textTransform: isNetworkVariant
                          ? "uppercase"
                          : isTargetingVariant
                            ? "uppercase"
                          : isClusterVariant
                            ? "none"
                            : undefined,
                      }}
                    >
                      {loc.label}
                    </div>
                    {isRouteVariant ||
                    nodeDescriptor ||
                    clusterDescriptor ||
                    isSpotlightVariant ||
                    isRadiusVariant ||
                    isTargetingVariant ? (
                      <div
                        style={{
                          marginTop: `${Math.round(3 * scale)}px`,
                          fontSize: `${Math.round((isNetworkVariant ? 11 : 10) * scale)}px`,
                          fontFamily:
                            typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                          color: isNetworkVariant
                            ? networkAccent
                            : isTargetingVariant
                              ? targetingAccent
                              : isSpotlightVariant
                                ? spotlightAccent
                                : isRadiusVariant
                                  ? radiusAccent
                            : isClusterVariant
                              ? clusterAccent
                              : isRouteVariant
                            ? routeAccent
                            : highlightAccent,
                          opacity: 0.88,
                          whiteSpace: "nowrap",
                          textTransform:
                            isRouteVariant || isNetworkVariant || isTargetingVariant
                              ? "uppercase"
                              : isClusterVariant || isSpotlightVariant || isRadiusVariant
                                ? "uppercase"
                                : undefined,
                          letterSpacing:
                            isRouteVariant || isNetworkVariant || isTargetingVariant
                              ? "0.14em"
                              : isClusterVariant || isSpotlightVariant || isRadiusVariant
                                ? "0.12em"
                                : undefined,
                        }}
                      >
                        {isRouteVariant
                          ? routeNodeDescriptor
                          : isTargetingVariant
                            ? targetingDescriptor
                            : isSpotlightVariant
                              ? spotlightDescriptor
                              : isRadiusVariant
                                ? radiusDescriptor
                          : isClusterVariant
                            ? clusterDescriptor
                            : nodeDescriptor}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
