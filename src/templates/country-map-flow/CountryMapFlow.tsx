import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  WORLD_COUNTRY_MAP,
  WORLD_MAP_VIEWBOX,
  canonicalizeCountryName,
  getWorldCountryAnchor,
} from "../../geo/worldCountries";
import { Asset } from "../../assets/Asset";
import { Background } from "../../primitives/Background";
import { fadeIn, scalePop, secToFrame, slideUp } from "../../primitives/animations";
import { resolveEffects } from "../../primitives/useEffects";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { alpha, mixHex } from "../chartShared";
import type { CountryMapFlowProps } from "./schema";

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const MAP_FRAME = {
  outerWidth: 1010,
  outerHeight: 666,
  innerX: 32,
  innerY: 32,
  innerWidth: 946,
  innerHeight: 602,
};

const CONNECT_PALETTE = ["#B7865C", "#D0B191", "#C49B72", "#A87C5A", "#D8C8B1"];
const DARK_ROUTE_PALETTE = ["#5D87A1", "#7A99B0", "#A56A43", "#7C8D74", "#C08F52"];
const LIGHT_LOGISTICS_PALETTE = ["#F3BE74", "#E5A759", "#C8C9BE", "#DAA36D", "#E8C88C"];

type PreparedCountry = {
  key: string;
  name: string;
  path: string;
  anchor: { x: number; y: number };
  accentColor: string;
  index: number;
};

type RouteSegment = {
  from: [number, number];
  control: [number, number];
  to: [number, number];
  path: string;
  length: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const CONNECT_LABEL_ALIASES: Record<string, string> = {
  "United Arab Emirates": "UAE",
  "United States": "USA",
  "United Kingdom": "UK",
};

const LARGE_CONNECT_COUNTRIES = new Set([
  "Canada",
  "Russia",
  "United States",
  "China",
  "Australia",
  "Brazil",
]);

function estimateWrappedLineCount(text: string, maxCharsPerLine: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;

  let lineCount = 1;
  let currentLength = 0;

  for (const word of words) {
    const nextLength = currentLength === 0 ? word.length : currentLength + 1 + word.length;
    if (nextLength > maxCharsPerLine && currentLength > 0) {
      lineCount += 1;
      currentLength = word.length;
    } else {
      currentLength = nextLength;
    }
  }

  return lineCount;
}

function getConnectDisplayLabel(label: string) {
  return CONNECT_LABEL_ALIASES[label] ?? label;
}

function applyEntrance(
  frame: number,
  preset: CountryMapFlowProps["entranceAnimation"],
  startFrame: number,
  endFrame: number,
) {
  if (preset === "none") return { opacity: 1, y: 0, scale: 1 };
  if (preset === "fade-in") {
    const entrance = fadeIn(frame, { startFrame, endFrame });
    return { opacity: entrance.opacity, y: 0, scale: entrance.scale };
  }
  if (preset === "scale-pop") {
    const entrance = scalePop(frame, { startFrame, endFrame }, 1.05);
    return { opacity: entrance.opacity, y: 0, scale: entrance.scale };
  }
  const entrance = slideUp(frame, { startFrame, endFrame }, 40);
  return { opacity: entrance.opacity, y: entrance.y, scale: 1 };
}

function buildCurveSegment(from: [number, number], to: [number, number], arcDirection: number): RouteSegment {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const distance = Math.hypot(dx, dy);
  const midX = (from[0] + to[0]) / 2;
  const midY = (from[1] + to[1]) / 2;
  const normX = distance === 0 ? 0 : (-dy / distance) * arcDirection;
  const normY = distance === 0 ? 0 : (dx / distance) * arcDirection;
  const arc = Math.min(88, Math.max(20, distance * 0.16));
  const control: [number, number] = [midX + normX * arc, midY + normY * arc];

  return {
    from,
    control,
    to,
    path: `M ${from[0]} ${from[1]} Q ${control[0]} ${control[1]} ${to[0]} ${to[1]}`,
    length: distance + arc * 0.35,
  };
}

function getQuadraticPoint(segment: RouteSegment, t: number): [number, number] {
  const p = clamp(t, 0, 1);
  const inv = 1 - p;
  return [
    inv * inv * segment.from[0] +
      2 * inv * p * segment.control[0] +
      p * p * segment.to[0],
    inv * inv * segment.from[1] +
      2 * inv * p * segment.control[1] +
      p * p * segment.to[1],
  ];
}

function getQuadraticAngle(segment: RouteSegment, t: number): number {
  const p = clamp(t, 0, 1);
  const dx =
    2 * (1 - p) * (segment.control[0] - segment.from[0]) +
    2 * p * (segment.to[0] - segment.control[0]);
  const dy =
    2 * (1 - p) * (segment.control[1] - segment.from[1]) +
    2 * p * (segment.to[1] - segment.control[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function getQuadraticTangent(segment: RouteSegment, t: number): [number, number] {
  const p = clamp(t, 0, 1);
  const dx =
    2 * (1 - p) * (segment.control[0] - segment.from[0]) +
    2 * p * (segment.to[0] - segment.control[0]);
  const dy =
    2 * (1 - p) * (segment.control[1] - segment.from[1]) +
    2 * p * (segment.to[1] - segment.control[1]);
  const length = Math.hypot(dx, dy) || 1;
  return [dx / length, dy / length];
}

function normalizeVector(x: number, y: number): [number, number] {
  const length = Math.hypot(x, y) || 1;
  return [x / length, y / length];
}

function getRouteTransform(
  countries: PreparedCountry[],
  segments: RouteSegment[],
  options?: { minScale?: number; maxScale?: number; fixedScale?: number },
) {
  if (typeof options?.fixedScale === "number") {
    const scale = options.fixedScale;
    return {
      scale,
      x: MAP_FRAME.innerX + (MAP_FRAME.innerWidth * (1 - scale)) / 2,
      y: MAP_FRAME.innerY + (MAP_FRAME.innerHeight * (1 - scale)) / 2,
    };
  }

  const points = [
    ...countries.map((country) => [country.anchor.x, country.anchor.y] as [number, number]),
    ...segments.flatMap((segment) => [segment.from, segment.control, segment.to]),
  ];
  if (points.length === 0) {
    return { scale: 1, x: 0, y: 0 };
  }
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const fitScale = Math.min(
    MAP_FRAME.innerWidth / Math.max(180, spanX + Math.max(80, spanX * 0.95) * 2),
    MAP_FRAME.innerHeight / Math.max(180, spanY + Math.max(64, spanY * 1.05) * 2),
  );
  const scale = clamp(
    fitScale,
    options?.minScale ?? 0.92,
    options?.maxScale ??
      (countries.length === 2 ? 2.9 : countries.length <= 4 ? 2.15 : 1.55),
  );
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  return {
    scale,
    x: MAP_FRAME.innerX + MAP_FRAME.innerWidth / 2 - centerX * scale,
    y: MAP_FRAME.innerY + MAP_FRAME.innerHeight / 2 - centerY * scale,
  };
}

function FlightIcon({
  x,
  y,
  angle,
  color,
  planeColor,
}: {
  x: number;
  y: number;
  angle: number;
  color: string;
  planeColor?: string;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <circle cx={0} cy={0} r={18} fill={alpha(color, 0.12)} />
      <g transform="translate(-12,-12)">
        <Asset
          id="airplane"
          width={24}
          height={24}
          color={planeColor ?? alpha(color, 0.98)}
          style={{
            filter: `drop-shadow(0 1px 1px ${alpha("#FFF8EF", 0.24)})`,
          }}
        />
      </g>
    </g>
  );
}

export const CountryRouteScene: React.FC<CountryMapFlowProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale } = useResponsiveConfig();
  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typography = resolveTypography(resolved.typography);
  const effects = resolveEffects(resolved.effects, props.routeColor);

  const isLogistics = props.routeMode === "logistics";
  const isConnect = props.routeMode === "connect";
  const isRoute = !isConnect && !isLogistics;

  const totalFrames = secToFrame(props.duration);
  const introEnd = Math.round(totalFrames * 0.18);
  const routeStart = Math.round(totalFrames * 0.18);
  const routeEnd = Math.round(totalFrames * 0.76);

  const stageLeft = Math.round(width * 0.055);
  const stageTop = Math.round(height * 0.06);
  const stageRight = Math.round(width * 0.055);
  const contentWidth = width - stageLeft - stageRight;
  const panelWidth = Math.round(width * 0.25);
  const panelLeft = width - panelWidth - stageRight;
  const titleWidth = Math.round(
    Math.min(
      panelLeft - stageLeft - Math.round(width * 0.04),
      contentWidth * (isConnect ? 0.56 : isRoute ? 0.5 : 0.46),
    ),
  );
  const badgeHeight = Math.round(34 * scale);
  const titleFontSize = Math.round(
    ((isConnect
      ? props.title.length > 32
        ? 50
        : props.title.length > 24
          ? 56
          : 60
      : isRoute
        ? props.title.length > 28
          ? 54
          : 60
        : 60)) * scale,
  );
  const titleLineHeight = isConnect ? 0.94 : isRoute ? 0.95 : 0.96;
  const titleCharsPerLine = Math.max(12, Math.floor(titleWidth / (titleFontSize * 0.57)));
  const titleLineCount = estimateWrappedLineCount(props.title, titleCharsPerLine);
  const titleBlockHeight = Math.round(titleFontSize * titleLineHeight * titleLineCount);
  const subtitleHeight = props.subtitle ? Math.round(30 * scale * 1.3) : 0;
  const titleSectionHeight =
    badgeHeight +
    Math.round(18 * scale) +
    titleBlockHeight +
    (props.subtitle ? Math.round(18 * scale) + subtitleHeight : 0);
  const contentTop = stageTop + titleSectionHeight + Math.round(height * (isConnect ? 0.045 : 0.03));
  const panelTop = contentTop + Math.round(height * 0.08);
  const mapMaxWidth = contentWidth - panelWidth - Math.round(width * 0.03);
  const availableMapHeight = height - contentTop - Math.round(height * 0.08);
  const mapWidth = Math.min(
    mapMaxWidth,
    Math.round(availableMapHeight * (WORLD_MAP_VIEWBOX.width / WORLD_MAP_VIEWBOX.height)),
  );
  const mapHeight = Math.round(mapWidth * (WORLD_MAP_VIEWBOX.height / WORLD_MAP_VIEWBOX.width));
  const mapLeft = stageLeft;
  const mapTop = contentTop + Math.round(height * 0.02);

  const palette = isLogistics
    ? LIGHT_LOGISTICS_PALETTE
    : isConnect
      ? CONNECT_PALETTE
      : DARK_ROUTE_PALETTE;
  const routeCountries = [props.originCountry, ...props.viaCountries, props.destinationCountry];
  const preparedCountries = routeCountries
    .map((country, index) => {
      const location = WORLD_COUNTRY_MAP.findLocation(country);
      const anchor = getWorldCountryAnchor(country);
      if (!location || !anchor) return null;
      return {
        key: `world-route-${canonicalizeCountryName(location.name)}-${index}`,
        name: location.name,
        path: location.path,
        anchor,
        accentColor: palette[index % palette.length],
        index,
      };
    })
    .filter((item): item is PreparedCountry => item !== null);

  const preparedLookup = new Map(
    preparedCountries.map((country) => [canonicalizeCountryName(country.name), country]),
  );
  const routeSegments = preparedCountries.slice(0, -1).map((country, index) =>
    buildCurveSegment(
      [country.anchor.x, country.anchor.y],
      [preparedCountries[index + 1].anchor.x, preparedCountries[index + 1].anchor.y],
      index % 2 === 0 ? 1 : -1,
    ),
  );
  const routeTransform = getRouteTransform(
    preparedCountries,
    routeSegments,
    isConnect ? { fixedScale: 1 } : undefined,
  );
  const routeProgress = interpolate(frame, [routeStart, routeEnd], [0, 1], CLAMP);
  const titleEntrance = applyEntrance(frame, props.entranceAnimation, 0, introEnd);
  const mapEntrance = applyEntrance(
    frame,
    props.entranceAnimation,
    Math.round(totalFrames * 0.04),
    Math.round(totalFrames * 0.24),
  );

  const modeAccent = isConnect ? "#C08F52" : isLogistics ? "#F3BE74" : props.routeColor;
  const modeLabel = isConnect
    ? "World Connection Map"
    : isLogistics
      ? "World Logistics Route"
      : "World Route Flow";
  const overlayWash = isLogistics
    ? `radial-gradient(circle at 18% 18%, ${alpha("#F4E1C0", 0.18)}, transparent 24%), radial-gradient(circle at 74% 18%, ${alpha("#D8E5EF", 0.24)}, transparent 22%)`
    : isRoute
      ? `radial-gradient(circle at 18% 16%, ${alpha("#D7E4F4", 0.055)}, transparent 24%), radial-gradient(circle at 70% 18%, ${alpha(modeAccent, 0.06)}, transparent 18%), linear-gradient(180deg, ${alpha("#06111A", 0.04)}, transparent 34%)`
      : `radial-gradient(circle at 20% 18%, ${alpha("#E7DCCA", 0.045)}, transparent 26%), radial-gradient(circle at 74% 16%, ${alpha(modeAccent, 0.045)}, transparent 18%)`;

  const panelBackground = isLogistics
    ? alpha("#FFFFFF", 0.8)
    : isConnect
      ? alpha("#0F1720", 0.82)
      : alpha("#0E1620", 0.78);
  const panelBorder = isLogistics
    ? alpha("#E1C08A", 0.44)
    : isConnect
      ? alpha("#D8C7AF", 0.2)
      : alpha("#CFE0EE", 0.16);
  const mapShellStroke = isLogistics
    ? alpha("#E1C08A", 0.48)
    : isConnect
      ? alpha("#D8C7AF", 0.18)
      : alpha("#CFE0EE", 0.14);
  const mapShellFill = isLogistics ? alpha("#FCF7EF", 0.78) : alpha("#091119", 0.6);
  const mapSurfaceFill = isLogistics
    ? alpha("#EDF2F7", 0.92)
    : isConnect
      ? alpha("#0D151E", 0.985)
      : alpha("#0D151E", 0.98);
  const baseCountryFill = isLogistics ? "#F4F7FA" : props.baseFillColor;
  const baseCountryStroke = isLogistics
    ? alpha("#CAD7E4", 0.92)
    : isConnect
      ? alpha("#536A81", 0.98)
      : alpha("#50667D", 0.94);
  const titleColor = isLogistics ? "#1F2B3D" : props.titleColor;
  const subtitleColor = isLogistics ? "#5A6B7E" : props.subtitleColor;
  const labelTextColor = isLogistics ? "#233044" : props.labelColor;
  const logisticsPlaneColor = "#6B4C2A";
  const panelHeading = isConnect
    ? "Connected Countries"
    : isLogistics
      ? "Route Manifest"
      : "Route Sequence";
  const panelDescription = isConnect
    ? "Deterministic country-to-country linking with restrained global framing."
    : isLogistics
      ? "Global logistics route animation"
      : "Global route flow animation";
  const pathCountries = [
    props.originLabel ?? props.originCountry,
    ...props.viaCountries,
    props.destinationLabel ?? props.destinationCountry,
  ];

  const segmentLengths = routeSegments.map((segment) => segment.length);
  const totalRouteLength = segmentLengths.reduce((sum, value) => sum + value, 0) || 1;
  let remainingLength = routeProgress * totalRouteLength;
  let activeSegment: RouteSegment | null = routeSegments[routeSegments.length - 1] ?? null;
  let activeProgress = 1;
  for (let index = 0; index < routeSegments.length; index++) {
    if (remainingLength <= segmentLengths[index]) {
      activeSegment = routeSegments[index];
      activeProgress = segmentLengths[index] === 0 ? 0 : remainingLength / segmentLengths[index];
      break;
    }
    remainingLength -= segmentLengths[index];
  }
  const movingPoint = activeSegment ? getQuadraticPoint(activeSegment, activeProgress) : null;
  const movingAngle = activeSegment ? getQuadraticAngle(activeSegment, activeProgress) : 0;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />
      <div style={{ position: "absolute", inset: 0, background: overlayWash }} />

      <div
        style={{
          position: "absolute",
          left: stageLeft,
          top: stageTop + titleEntrance.y,
          width: titleWidth,
          opacity: titleEntrance.opacity,
          transform: `scale(${titleEntrance.scale})`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: Math.round(12 * scale),
            padding: `${Math.round(9 * scale)}px ${Math.round(15 * scale)}px`,
            borderRadius: Math.round(999 * scale),
            background: panelBackground,
            border: `1px solid ${panelBorder}`,
          }}
        >
          <div
            style={{
              width: Math.round(18 * scale),
              height: isLogistics ? Math.round(8 * scale) : 1,
              borderRadius: isLogistics ? Math.round(999 * scale) : 0,
              background: isLogistics ? modeAccent : alpha("#D8C7AF", 0.6),
            }}
          />
          <div
            style={{
              fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
              fontSize: Math.round(14 * scale),
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: isLogistics ? alpha("#566679", 0.92) : alpha("#D8C7AF", 0.82),
            }}
          >
            {modeLabel}
          </div>
        </div>

        <div
          style={{
            fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
            fontWeight: typography.fontWeight ?? 700,
            fontSize: titleFontSize,
            lineHeight: titleLineHeight,
            letterSpacing: typography.letterSpacing ?? "-0.05em",
            color: titleColor,
            marginTop: Math.round(18 * scale),
            maxWidth: titleWidth,
          }}
        >
          {props.title}
        </div>

        {props.subtitle ? (
          <div
            style={{
              marginTop: Math.round(16 * scale),
              maxWidth: Math.round(620 * scale),
              fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
              fontSize: Math.round(22 * scale),
              lineHeight: 1.3,
              color: subtitleColor,
            }}
          >
            {props.subtitle}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          left: mapLeft,
          top: mapTop + mapEntrance.y,
          width: mapWidth,
          height: mapHeight,
          opacity: mapEntrance.opacity,
          transform: `scale(${mapEntrance.scale})`,
          filter:
            effects.boxShadow !== "none"
              ? effects.boxShadow
              : `drop-shadow(0 18px 40px ${alpha("#04080D", isLogistics ? 0.12 : 0.22)})`,
        }}
      >
        <svg
          viewBox={WORLD_COUNTRY_MAP.viewBox}
          style={{ width: "100%", height: "100%", shapeRendering: "geometricPrecision" }}
        >
          <defs>
            <clipPath id="world-route-clip">
              <rect
                x={MAP_FRAME.innerX}
                y={MAP_FRAME.innerY}
                width={MAP_FRAME.innerWidth}
                height={MAP_FRAME.innerHeight}
                rx={24}
              />
            </clipPath>
          </defs>

          <rect
            x={0}
            y={0}
            width={MAP_FRAME.outerWidth}
            height={MAP_FRAME.outerHeight}
            rx={30}
            fill={mapShellFill}
            stroke={mapShellStroke}
            strokeWidth={1.4}
          />
          <rect
            x={24}
            y={24}
            width={962}
            height={618}
            rx={24}
            fill={mapSurfaceFill}
            stroke={alpha(isLogistics ? "#D5DEE8" : "#65788B", isLogistics ? 0.74 : 0.18)}
            strokeWidth={1}
          />
          <line
            x1={46}
            y1={76}
            x2={964}
            y2={76}
            stroke={alpha(isLogistics ? "#C8D4E0" : "#D8C7AF", isLogistics ? 0.34 : 0.08)}
            strokeWidth={1}
          />

          <g clipPath="url(#world-route-clip)">
            <g transform={`translate(${routeTransform.x}, ${routeTransform.y}) scale(${routeTransform.scale})`}>
              {WORLD_COUNTRY_MAP.locations.map((location) => {
                const matched = preparedLookup.get(canonicalizeCountryName(location.name));
                const reveal = matched
                  ? interpolate(frame, [introEnd + matched.index * 3, introEnd + matched.index * 3 + 18], [0, 1], CLAMP)
                  : 0;
                const connectBlend =
                  isConnect && matched
                    ? reveal *
                      (LARGE_CONNECT_COUNTRIES.has(location.name) ? 0.5 : 0.84)
                    : reveal;
                return (
                  <path
                    key={`world-route-country-${location.id}`}
                    d={location.path}
                    fill={
                      matched
                        ? mixHex(baseCountryFill, matched.accentColor, connectBlend)
                        : baseCountryFill
                    }
                    stroke={
                      matched
                        ? alpha(matched.accentColor, isLogistics ? 0.9 : isConnect ? 0.94 : 0.8)
                        : baseCountryStroke
                    }
                    strokeWidth={matched ? (isConnect ? 1.25 : 1.15) : isConnect ? 0.9 : 0.75}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                );
              })}

              {routeSegments.map((segment, index) => {
                const passed = segmentLengths.slice(0, index).reduce((sum, value) => sum + value, 0);
                const portion = clamp((routeProgress * totalRouteLength - passed) / segment.length, 0, 1);
                return (
                  <g key={`world-route-segment-${index}`}>
                    <path
                      d={segment.path}
                      fill="none"
                      stroke={alpha(isLogistics ? "#F4D7A3" : "#D7E6F6", isLogistics ? 0.32 : isConnect ? 0.14 : 0.18)}
                      strokeWidth={isLogistics ? 10 : isConnect ? 6 : 9}
                      strokeLinecap="round"
                    />
                    <path
                      d={segment.path}
                      fill="none"
                      stroke={alpha(modeAccent, isLogistics ? 0.96 : isConnect ? 0.98 : 0.92)}
                      strokeWidth={isLogistics ? 4.5 : isConnect ? 3 : 4}
                      strokeLinecap="round"
                      strokeDasharray={`${segment.length} ${segment.length}`}
                      strokeDashoffset={segment.length * (1 - portion)}
                    />
                    {isLogistics ? (
                      <path
                        d={segment.path}
                        fill="none"
                        stroke={alpha("#FFF9F0", 0.72)}
                        strokeWidth={1.2}
                        strokeLinecap="round"
                        strokeDasharray={`${segment.length} ${segment.length}`}
                        strokeDashoffset={segment.length * (1 - portion)}
                      />
                    ) : null}
                    {isRoute ? (
                      <path
                        d={segment.path}
                        fill="none"
                        stroke={alpha("#E7F1FC", 0.82)}
                        strokeWidth={1.4}
                        strokeLinecap="round"
                        strokeDasharray={`${segment.length} ${segment.length}`}
                        strokeDashoffset={segment.length * (1 - portion)}
                      />
                    ) : null}
                  </g>
                );
              })}

              {preparedCountries.map((country, index) => (
                <g key={`world-route-node-${country.key}`}>
                  <circle cx={country.anchor.x} cy={country.anchor.y} r={isLogistics ? 10 : isConnect ? 8 : 11} fill={alpha(modeAccent, isLogistics ? 0.12 : isConnect ? 0.08 : 0.14)} />
                  <circle
                    cx={country.anchor.x}
                    cy={country.anchor.y}
                    r={isLogistics ? 5.6 : isConnect ? 4.8 : 6.2}
                    fill={alpha(modeAccent, 0.98)}
                    stroke={alpha(isLogistics ? "#FFF8EF" : "#F8F3EA", 0.9)}
                    strokeWidth={isConnect ? 1.8 : 2}
                  />
                  {!isLogistics && !isConnect && index > 0 && index < preparedCountries.length - 1 ? (
                    <circle cx={country.anchor.x} cy={country.anchor.y} r={13} fill="none" stroke={alpha(modeAccent, 0.16)} strokeWidth={1.4} />
                  ) : null}
                </g>
              ))}

              {movingPoint && !isConnect ? (
                isLogistics ? (
                  <FlightIcon
                    x={movingPoint[0]}
                    y={movingPoint[1]}
                    angle={movingAngle}
                    color={modeAccent}
                    planeColor={logisticsPlaneColor}
                  />
                ) : (
                  <g>
                    <circle cx={movingPoint[0]} cy={movingPoint[1]} r={isRoute ? 10 : 12} fill={alpha(modeAccent, isRoute ? 0.1 : 0.14)} />
                    <circle cx={movingPoint[0]} cy={movingPoint[1]} r={isRoute ? 5 : 6} fill={alpha(modeAccent, 0.98)} stroke={alpha("#F8F3EA", 0.88)} strokeWidth={2} />
                  </g>
                )
              ) : null}
            </g>
          </g>
        </svg>

        {preparedCountries.map((country, index) => {
          const rawLabel =
            index === 0
              ? props.originLabel ?? props.originCountry
              : index === preparedCountries.length - 1
                ? props.destinationLabel ?? props.destinationCountry
                : routeCountries[index];
          const label = isConnect ? getConnectDisplayLabel(rawLabel) : rawLabel;
          const x = ((routeTransform.x + country.anchor.x * routeTransform.scale) / WORLD_MAP_VIEWBOX.width) * mapWidth;
          const y = ((routeTransform.y + country.anchor.y * routeTransform.scale) / WORLD_MAP_VIEWBOX.height) * mapHeight;
          const isViaStop = index > 0 && index < preparedCountries.length - 1;
          const labelWidth = isConnect
            ? Math.max(98, Math.min(170, label.length * 9 + 40))
            : isRoute && isViaStop
              ? Math.max(96, Math.min(176, label.length * 10 + 34))
              : Math.max(112, Math.min(208, label.length * 11 + 48));
          const isEndpoint = index === 0 || index === preparedCountries.length - 1;
          let left = isConnect
            ? clamp(
                x +
                  (index === preparedCountries.length - 1
                    ? x > mapWidth * 0.22
                      ? -labelWidth - 18
                      : 18
                    : x > mapWidth * 0.78
                      ? -labelWidth - 18
                      : 18),
                10,
                mapWidth - labelWidth - 10,
              )
            : isRoute
              ? clamp(
                  x +
                    (index === 0
                      ? 16
                      : index === preparedCountries.length - 1
                        ? -labelWidth - 18
                        : x > mapWidth * 0.62
                          ? -labelWidth - 18
                          : 18),
                  10,
                  mapWidth - labelWidth - 10,
                )
            : clamp(x + (x > mapWidth * 0.76 ? -labelWidth - 18 : 16), 10, mapWidth - labelWidth - 10);
          let top = isConnect
            ? clamp(
                y +
                  (y < mapHeight * 0.18
                    ? 18
                    : isEndpoint
                      ? -50
                      : y > mapHeight * 0.78
                        ? -44
                        : -32),
                10,
                mapHeight - 42,
              )
            : isRoute
              ? clamp(
                  y +
                    (index === 0
                      ? -34
                      : index === preparedCountries.length - 1
                        ? -24
                        : -44),
                  10,
                  mapHeight - 42,
                )
            : clamp(y + (y > mapHeight * 0.78 ? -44 : y < mapHeight * 0.2 ? 18 : -22), 10, mapHeight - 42);

          if (isRoute) {
            if (index === 0) {
              left = clamp(x + (x > mapWidth * 0.68 ? -labelWidth - 18 : 18), 10, mapWidth - labelWidth - 10);
              top = clamp(y + (y < mapHeight * 0.24 ? 18 : -34), 10, mapHeight - 42);
            } else if (index === preparedCountries.length - 1) {
              left = clamp(x + (x > mapWidth * 0.54 ? -labelWidth - 18 : 18), 10, mapWidth - labelWidth - 10);
              top = clamp(y + (y > mapHeight * 0.62 ? -54 : -22), 10, mapHeight - 42);
            } else {
              const incomingSegment = routeSegments[index - 1];
              const outgoingSegment = routeSegments[index];
              const incomingTangent = getQuadraticTangent(incomingSegment, 1);
              const outgoingTangent = outgoingSegment
                ? getQuadraticTangent(outgoingSegment, 0)
                : incomingTangent;
              const bisector = normalizeVector(
                incomingTangent[0] + outgoingTangent[0],
                incomingTangent[1] + outgoingTangent[1],
              );
              const normal: [number, number] = [-bisector[1], bisector[0]];
              const horizontal = normal[0] >= 0 ? 14 : -labelWidth - 14;
              const vertical = normal[1] >= 0 ? 14 : -42;

              left = clamp(x + horizontal + normal[0] * 8, 10, mapWidth - labelWidth - 10);
              top = clamp(y + vertical + normal[1] * 8, 10, mapHeight - 42);
            }
          }

          const routeLabelAccent =
            isViaStop ? country.accentColor : modeAccent;
          const routeLabelText =
            isViaStop
              ? alpha("#D7E6F6", 0.86)
              : labelTextColor;
          const routeLabelBorderColor =
            isViaStop
              ? alpha("#A8BDD2", 0.12)
              : alpha("#D8C7AF", 0.18);
          const routeLabelBg =
            isViaStop
              ? alpha("#0E161F", 0.72)
              : alpha("#101923", 0.84);

          return (
            <div
              key={`world-route-label-${country.key}`}
              style={{
                position: "absolute",
                left,
                top,
                width: labelWidth,
                height: isConnect ? 30 : isRoute && isViaStop ? 30 : 32,
                borderRadius: Math.round((isLogistics ? 14 : isConnect ? 10 : 12) * scale),
                background: isLogistics
                  ? alpha("#FFF9F2", 0.88)
                  : isConnect
                    ? alpha("#0E161F", 0.9)
                    : routeLabelBg,
                border: `1px solid ${
                  isLogistics
                    ? alpha("#E8D0A6", 0.7)
                    : isConnect
                      ? alpha("#D8C7AF", 0.16)
                      : routeLabelBorderColor
                }`,
                display: "flex",
                alignItems: "center",
                padding: isConnect ? "0 10px" : "0 12px",
                gap: isConnect ? 8 : 10,
                boxShadow: isConnect ? `0 6px 18px ${alpha("#05090D", 0.18)}` : "none",
              }}
            >
              <div
                style={{
                  width: 4,
                  height: isConnect ? 14 : 16,
                  borderRadius: 999,
                  background: isConnect ? modeAccent : routeLabelAccent,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                  fontSize: Math.round((isConnect ? 13 : isRoute && isViaStop ? 13 : 14) * scale),
                  fontWeight: isViaStop && isRoute ? 600 : 700,
                  color: isConnect ? alpha("#F1E6D6", 0.96) : isRoute ? routeLabelText : labelTextColor,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: panelLeft,
          top: panelTop,
          width: panelWidth,
          padding: `${Math.round(22 * scale)}px ${Math.round(24 * scale)}px`,
          borderRadius: Math.round(26 * scale),
          background: panelBackground,
          border: `1px solid ${panelBorder}`,
        }}
      >
        <div
          style={{
            width: Math.round(42 * scale),
            height: 1,
            background: alpha(isLogistics ? "#D9B374" : "#D8C7AF", 0.72),
            marginBottom: Math.round(16 * scale),
          }}
        />
        <div
          style={{
            fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
            fontSize: Math.round(14 * scale),
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: isLogistics ? alpha("#566679", 0.94) : alpha("#D8C7AF", 0.82),
          }}
        >
          {panelHeading}
        </div>

        {props.routeLabel || isConnect ? (
          <div
            style={{
              marginTop: Math.round(18 * scale),
              fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
              fontSize: Math.round(16 * scale),
              lineHeight: 1.45,
              color: isLogistics ? alpha("#566679", 0.92) : alpha("#E5D9C6", 0.88),
            }}
          >
            {isConnect ? panelDescription : props.routeLabel}
          </div>
        ) : null}

        <div
          style={{
            marginTop: Math.round(22 * scale),
            display: "flex",
            flexDirection: "column",
            gap: Math.round(14 * scale),
          }}
        >
          {pathCountries.map((country, index) => (
            <div
              key={`world-route-panel-${country}-${index}`}
              style={{
                borderRadius: Math.round((isConnect ? 16 : 18) * scale),
                background: isLogistics
                  ? alpha("#FFFFFF", 0.8)
                  : isConnect
                    ? alpha("#0E161F", 0.56)
                    : alpha("#0F1720", 0.46),
                border: `1px solid ${alpha(
                  isLogistics ? "#D9E2EB" : "#D8C7AF",
                  isLogistics ? 0.58 : isConnect ? 0.14 : 0.1,
                )}`,
                padding: `${Math.round(12 * scale)}px ${Math.round(14 * scale)}px`,
                display: "flex",
                alignItems: "center",
                gap: Math.round(12 * scale),
              }}
            >
              <div
                style={{
                  width: Math.round(18 * scale),
                  display: "flex",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isConnect ? (
                  <div
                    style={{
                      width: 4,
                      height: 18,
                      borderRadius: 999,
                      background: modeAccent,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: index === 0 || index === pathCountries.length - 1 ? 8 : 6,
                      height: index === 0 || index === pathCountries.length - 1 ? 8 : 6,
                      borderRadius: 999,
                      background: palette[index % palette.length],
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                  fontSize: Math.round(16 * scale),
                  fontWeight: 700,
                  color: isConnect ? alpha("#F1E6D6", 0.96) : labelTextColor,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {country}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
