import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { geoMercator, geoPath } from "d3-geo";
import indiaGeoJson from "../../../public/geo/india_state.json";
import { Background } from "../../primitives/Background";
import { fadeIn, scalePop, secToFrame, slideUp } from "../../primitives/animations";
import { resolveEffects } from "../../primitives/useEffects";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import type { MapRouteFlowProps } from "./schema";

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

type GeoFeature = {
  type: "Feature";
  properties?: {
    st_nm?: string;
  };
  geometry: unknown;
};

type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

type PreparedStateShape = {
  key: string;
  name: string;
  paths: string[];
  centroid: [number, number];
};

type RouteSegment = {
  from: [number, number];
  control: [number, number];
  to: [number, number];
  path: string;
};

type ViewTransform = {
  scale: number;
  x: number;
  y: number;
};

const INDIA_GEO = indiaGeoJson as GeoFeatureCollection;

const normalizeStateName = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[().,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const STATE_ALIASES: Record<string, string> = {
  "andaman nicobar": "andaman and nicobar",
  "andaman and nicobar islands": "andaman and nicobar",
  "dadra nagar haveli": "dadra and nagar haveli and daman and diu",
  "daman diu": "dadra and nagar haveli and daman and diu",
  "dadra nagar haveli daman diu": "dadra and nagar haveli and daman and diu",
  "dadra and nagar haveli and daman and diu":
    "dadra and nagar haveli and daman and diu",
  "jammu kashmir": "jammu and kashmir",
  "andaman and nicobar": "andaman and nicobar islands",
  orissa: "odisha",
  pondicherry: "puducherry",
  uttaranchal: "uttarakhand",
};

const canonicalizeStateName = (value: string) => {
  const normalized = normalizeStateName(value);
  return STATE_ALIASES[normalized] ?? normalized;
};

const projection = geoMercator()
  .fitExtent(
    [
      [0, 0],
      [920, 900],
    ],
    INDIA_GEO as never,
  )
  .precision(0.1);

const mapPath = geoPath(projection);

const INDIA_STATE_SHAPES: PreparedStateShape[] = (() => {
  const grouped = new Map<
    string,
    {
      name: string;
      paths: string[];
      centroids: Array<[number, number]>;
    }
  >();

  for (const feature of INDIA_GEO.features) {
    const stateName = feature.properties?.st_nm;
    const path = mapPath(feature as never);
    if (!stateName || !path) {
      continue;
    }

    const key = canonicalizeStateName(stateName);
    const existing = grouped.get(key) ?? {
      name: stateName,
      paths: [],
      centroids: [],
    };
    existing.paths.push(path);
    existing.centroids.push(mapPath.centroid(feature as never) as [number, number]);
    grouped.set(key, existing);
  }

  return [...grouped.entries()].map(([key, value]) => {
    const centroid = value.centroids.reduce(
      (acc, point) => [acc[0] + point[0], acc[1] + point[1]] as [number, number],
      [0, 0],
    );

    return {
      key: `india-route-state-${key}`,
      name: value.name,
      paths: value.paths,
      centroid: [
        centroid[0] / value.centroids.length,
        centroid[1] / value.centroids.length,
      ],
    };
  });
})();

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function alpha(hex: string, opacity: number) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

function applyEntrance(
  frame: number,
  preset: MapRouteFlowProps["entranceAnimation"],
  startFrame: number,
  endFrame: number,
) {
  if (preset === "none") {
    return { opacity: 1, y: 0, scale: 1 };
  }

  if (preset === "fade-in") {
    const entrance = fadeIn(frame, { startFrame, endFrame });
    return { opacity: entrance.opacity, y: 0, scale: entrance.scale };
  }

  if (preset === "scale-pop") {
    const entrance = scalePop(frame, { startFrame, endFrame }, 1.04);
    return { opacity: entrance.opacity, y: 0, scale: entrance.scale };
  }

  const entrance = slideUp(frame, { startFrame, endFrame }, 36);
  return { opacity: entrance.opacity, y: entrance.y, scale: 1 };
}

function buildCurveSegment(from: [number, number], to: [number, number]): RouteSegment {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const distance = Math.hypot(dx, dy);
  const midX = (from[0] + to[0]) / 2;
  const midY = (from[1] + to[1]) / 2;
  const normX = distance === 0 ? 0 : -dy / distance;
  const normY = distance === 0 ? 0 : dx / distance;
  const arc = Math.min(62, Math.max(16, distance * 0.15));
  const control: [number, number] = [midX + normX * arc, midY + normY * arc];

  return {
    from,
    control,
    to,
    path: `M ${from[0]} ${from[1]} Q ${control[0]} ${control[1]} ${to[0]} ${to[1]}`,
  };
}

function getQuadraticPoint(segment: RouteSegment, t: number): [number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  const inv = 1 - clamped;
  const x =
    inv * inv * segment.from[0] +
    2 * inv * clamped * segment.control[0] +
    clamped * clamped * segment.to[0];
  const y =
    inv * inv * segment.from[1] +
    2 * inv * clamped * segment.control[1] +
    clamped * clamped * segment.to[1];
  return [x, y];
}

function getQuadraticAngle(segment: RouteSegment, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const dx =
    2 * (1 - clamped) * (segment.control[0] - segment.from[0]) +
    2 * clamped * (segment.to[0] - segment.control[0]);
  const dy =
    2 * (1 - clamped) * (segment.control[1] - segment.from[1]) +
    2 * clamped * (segment.to[1] - segment.control[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function getRouteFocusTransform(
  routeShapes: PreparedStateShape[],
  routeSegments: RouteSegment[],
  options?: {
    minScale?: number;
    maxScale?: number;
    paddingX?: number;
    paddingY?: number;
    targetX?: number;
    targetY?: number;
  },
): ViewTransform {
  const routePoints = [
    ...routeShapes.map((shape) => shape.centroid),
    ...routeSegments.flatMap((segment) => [segment.from, segment.control, segment.to]),
  ];

  if (routePoints.length < 2) {
    return { scale: 1, x: 0, y: 0 };
  }

  const xs = routePoints.map((point) => point[0]);
  const ys = routePoints.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const paddingX = options?.paddingX ?? 150;
  const paddingY = options?.paddingY ?? 180;
  const minScale = options?.minScale ?? 1.06;
  const maxScale = options?.maxScale ?? 2.05;
  const width = Math.max(140, maxX - minX + paddingX);
  const height = Math.max(220, maxY - minY + paddingY);
  const scale = Math.max(minScale, Math.min(maxScale, Math.min(828 / width, 820 / height)));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const targetX = options?.targetX ?? 424;
  const targetY = options?.targetY ?? 426;

  return {
    scale,
    x: targetX - centerX * scale,
    y: targetY - centerY * scale,
  };
}

function TruckIcon({
  x,
  y,
  angle,
  color,
}: {
  x: number;
  y: number;
  angle: number;
  color: string;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <circle cx={0} cy={0} r={18} fill={alpha(color, 0.12)} />
      <g transform="translate(-18,-10)">
        <rect
          x={0}
          y={1}
          width={21}
          height={13}
          rx={3}
          fill={alpha(color, 0.96)}
          stroke={alpha("#FFF6E6", 0.4)}
          strokeWidth={1}
        />
        <path
          d="M3 5 H18"
          stroke={alpha("#FFF6E6", 0.24)}
          strokeWidth={1}
          strokeLinecap="round"
        />
        <path
          d="M3 9 H18"
          stroke={alpha("#FFF6E6", 0.2)}
          strokeWidth={1}
          strokeLinecap="round"
        />
        <path
          d="M21 5 L30 5 L34 9 L34 14 L21 14 Z"
          fill={alpha("#FFD28A", 0.94)}
          stroke={alpha("#FFF6E6", 0.38)}
          strokeWidth={1}
          strokeLinejoin="round"
        />
        <rect x={25} y={7} width={6} height={4} rx={1.2} fill={alpha("#E8F4FF", 0.92)} />
        <circle cx={8} cy={16} r={3.3} fill="#10161D" stroke={alpha("#FFFFFF", 0.42)} strokeWidth={1} />
        <circle cx={26} cy={16} r={3.3} fill="#10161D" stroke={alpha("#FFFFFF", 0.42)} strokeWidth={1} />
        <circle cx={8} cy={16} r={1.3} fill={alpha("#DCE8F7", 0.82)} />
        <circle cx={26} cy={16} r={1.3} fill={alpha("#DCE8F7", 0.82)} />
      </g>
    </g>
  );
}

export const IndiaRouteScene: React.FC<MapRouteFlowProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale } = useResponsiveConfig();
  const isLogistics = props.routeMode === "logistics";
  const isRoute = props.routeMode === "route";
  const isConnect = props.routeMode === "connect";

  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typography = resolveTypography(resolved.typography);
  const effects = resolveEffects(resolved.effects, props.routeColor);

  const totalFrames = secToFrame(props.duration);
  const introEnd = Math.round(totalFrames * 0.16);
  const routeStart = Math.round(totalFrames * 0.18);
  const routeEnd = Math.round(totalFrames * 0.74);
  const mapScale = Math.min(width / 1920, height / 1080);
  const stageLeft = Math.round(width * 0.055);
  const stageTop = Math.round(height * 0.06);
  const contentWidth = width - stageLeft * 2;
  const mapWidth = Math.round(1080 * mapScale);
  const mapHeight = Math.round(930 * mapScale);
  const mapLeft = stageLeft;
  const mapTop = Math.round(height * 0.225);
  const titleWidth = Math.round(contentWidth * 0.72);
  const routeStates = [props.originState, ...props.viaStates, props.destinationState];

  const routeShapes = routeStates
    .map((state) =>
      INDIA_STATE_SHAPES.find(
        (candidate) =>
          canonicalizeStateName(candidate.name) === canonicalizeStateName(state),
      ) ?? null,
    )
    .filter((shape): shape is PreparedStateShape => shape !== null);
  const logisticsStopPalette = [
    "#FFB24A",
    "#FFC96E",
    "#F59E42",
    "#F4D18C",
    "#FF8E5A",
    "#FFD9A0",
  ];

  const routeSegments = routeShapes.slice(0, -1).map((shape, index) =>
    buildCurveSegment(shape.centroid, routeShapes[index + 1].centroid),
  );

  const routeProgress = interpolate(frame, [routeStart, routeEnd], [0, 1], CLAMP);
  const titleEntrance = applyEntrance(frame, props.entranceAnimation, 0, introEnd);
  const mapEntrance = applyEntrance(
    frame,
    props.entranceAnimation,
    Math.round(totalFrames * 0.03),
    Math.round(totalFrames * 0.2),
  );

  const modeAccent =
    props.routeMode === "connect"
      ? "#F4B942"
      : isLogistics
        ? "#FFB24A"
        : props.routeColor;
  const glowColor =
    isRoute
      ? "#BFD6FF"
      : props.routeMode === "connect"
        ? "#FFE2A8"
        : "#FFD89C";
  const uiPanelBackground = isLogistics
    ? alpha("#FFFFFF", 0.82)
    : isConnect
      ? alpha("#101821", 0.7)
      : alpha("#0A1017", 0.82);
  const uiPanelBorder = isLogistics
    ? alpha("#E1C08A", 0.44)
    : isConnect
      ? alpha("#D8C7AF", 0.14)
      : alpha(modeAccent, 0.34);
  const uiPanelShadow = isLogistics
    ? `0 22px 46px ${alpha("#9DA8B6", 0.18)}, inset 0 1px 0 ${alpha("#FFFFFF", 0.55)}`
    : isConnect
      ? "none"
      : `0 18px 44px ${alpha("#01060B", 0.44)}, inset 0 1px 0 ${alpha(glowColor, 0.1)}`;
  const uiBadgeText = isLogistics
    ? alpha("#425160", 0.9)
    : isConnect
      ? alpha("#D8C7AF", 0.82)
      : alpha(props.labelColor, 0.72);
  const backdropWash = isLogistics
    ? `radial-gradient(circle at 68% 52%, ${alpha("#E9C98E", 0.16)}, transparent 28%), radial-gradient(circle at 22% 18%, ${alpha(
        "#D2DFEA",
        0.24,
      )}, transparent 22%)`
    : isConnect
      ? `radial-gradient(circle at 22% 18%, ${alpha("#E7DCCA", 0.045)}, transparent 26%), radial-gradient(circle at 78% 16%, ${alpha(
          "#7E8A96",
          0.05,
        )}, transparent 22%), radial-gradient(circle at 72% 78%, ${alpha(
          modeAccent,
          0.035,
        )}, transparent 18%)`
      : `radial-gradient(circle at 68% 52%, ${alpha(modeAccent, 0.08)}, transparent 26%), radial-gradient(circle at 22% 18%, ${alpha(
          "#C2D3E6",
          0.05,
        )}, transparent 20%)`;
  const travelerSegmentCount = Math.max(routeSegments.length, 1);
  const travelerIndex = Math.max(
    0,
    Math.min(routeSegments.length - 1, Math.floor(routeProgress * travelerSegmentCount)),
  );
  const travelerLocalProgress =
    routeSegments.length > 0
      ? Math.max(0, Math.min(1, routeProgress * travelerSegmentCount - travelerIndex))
      : 0;
  const travelerSegment =
    routeSegments.length > 0 ? routeSegments[travelerIndex] : null;
  const travelerPoint =
    travelerSegment ? getQuadraticPoint(travelerSegment, travelerLocalProgress) : null;
  const travelerAngle =
    travelerSegment ? getQuadraticAngle(travelerSegment, travelerLocalProgress) : 0;
  const routeFocusTransform =
    isRoute
      ? getRouteFocusTransform(routeShapes, routeSegments)
      : isConnect
        ? getRouteFocusTransform(routeShapes, routeSegments, {
            minScale: 1,
            maxScale: 1.32,
            paddingX: 210,
            paddingY: 240,
            targetX: 430,
            targetY: 438,
          })
      : { scale: 1, x: 0, y: 0 };

  const shouldShowIntermediateLabels =
    props.routeMode === "logistics" ||
    (props.routeMode === "connect" && props.viaStates.length <= 2);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: backdropWash,
        }}
      />

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
            padding: isConnect
              ? `${Math.round(9 * scale)}px ${Math.round(15 * scale)}px`
              : `${Math.round(10 * scale)}px ${Math.round(16 * scale)}px`,
            borderRadius: Math.round(999 * scale),
            background: uiPanelBackground,
            border: `1px solid ${uiPanelBorder}`,
            boxShadow: uiPanelShadow,
            backdropFilter: isConnect ? undefined : "blur(10px)",
          }}
        >
          <div
            style={{
              width: isConnect ? Math.round(18 * scale) : Math.round(10 * scale),
              height: isConnect ? 1 : Math.round(10 * scale),
              borderRadius: isConnect ? 0 : 999,
              background: isConnect ? alpha("#D8C7AF", 0.6) : modeAccent,
              boxShadow: isConnect ? undefined : `0 0 18px ${alpha(modeAccent, 0.42)}`,
            }}
          />
          <div
            style={{
              fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
              fontSize: Math.round(14 * scale),
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: uiBadgeText,
            }}
          >
            {props.routeMode === "logistics"
              ? "India Logistics Route"
              : props.routeMode === "connect"
                ? "India Connection Map"
                : "India Route Animation"}
          </div>
        </div>

        <div
          style={{
            fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
            fontWeight: typography.fontWeight ?? 700,
            fontSize: Math.round(48 * scale),
            lineHeight: 0.96,
            letterSpacing: typography.letterSpacing ?? "-0.05em",
            color: isConnect ? alpha(props.titleColor, 0.98) : props.titleColor,
            marginTop: Math.round(16 * scale),
          }}
        >
          {props.title}
        </div>

        {props.subtitle ? (
          <div
            style={{
              marginTop: Math.round(14 * scale),
              maxWidth: Math.round(700 * scale),
              fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
              fontSize: Math.round(20 * scale),
              lineHeight: 1.3,
              color: isConnect ? alpha("#C4B59E", 0.96) : props.subtitleColor,
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
              : isConnect
                ? `drop-shadow(0 18px 40px ${alpha("#04080D", 0.22)})`
                : `drop-shadow(0 30px 80px ${alpha("#000000", 0.34)})`,
        }}
      >
        <svg viewBox="0 0 920 900" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="route-shell" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha(glowColor, 0.2)} />
              <stop offset="100%" stopColor={alpha(modeAccent, 0.14)} />
            </linearGradient>
            <linearGradient id="route-surface" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha("#071019", 0.98)} />
              <stop offset="55%" stopColor={alpha("#08111A", 0.96)} />
              <stop offset="100%" stopColor={alpha("#0B1520", 0.98)} />
            </linearGradient>
            <linearGradient id="logistics-surface" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha("#DDE7EF", 0.98)} />
              <stop offset="52%" stopColor={alpha("#D3E0EA", 0.97)} />
              <stop offset="100%" stopColor={alpha("#CBD9E4", 0.98)} />
            </linearGradient>
            <radialGradient id="route-ocean-glow" cx="30%" cy="56%" r="72%">
              <stop offset="0%" stopColor={alpha("#16314E", 0.14)} />
              <stop offset="45%" stopColor={alpha("#0B1623", 0.05)} />
              <stop offset="100%" stopColor={alpha("#04080E", 0)} />
            </radialGradient>
            <radialGradient id="logistics-ocean-glow" cx="34%" cy="60%" r="78%">
              <stop offset="0%" stopColor={alpha("#AEC8D8", 0.18)} />
              <stop offset="42%" stopColor={alpha("#C9D9E4", 0.08)} />
              <stop offset="100%" stopColor={alpha("#E9EFF4", 0)} />
            </radialGradient>
            <linearGradient id="route-line" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={glowColor} />
              <stop offset="100%" stopColor={modeAccent} />
            </linearGradient>
            <linearGradient id="connect-shell" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha("#D8C7AF", 0.13)} />
              <stop offset="100%" stopColor={alpha("#546577", 0.18)} />
            </linearGradient>
            <linearGradient id="connect-surface" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha("#121C25", 0.98)} />
              <stop offset="100%" stopColor={alpha("#0D151D", 0.98)} />
            </linearGradient>
            <linearGradient id="connect-inner-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={alpha("#D8C7AF", 0.1)} />
              <stop offset="100%" stopColor={alpha("#65788B", 0.18)} />
            </linearGradient>
          </defs>

          <rect
            x={0}
            y={0}
            width={920}
            height={900}
            rx={34}
            fill={
              isLogistics
                ? alpha("#F6F2EA", 0.92)
                : isConnect
                  ? alpha("#091119", 0.6)
                  : alpha("#05090F", 0.84)
            }
            stroke={
              isLogistics
                ? alpha("#E8D6B5", 0.72)
                : isConnect
                  ? "url(#connect-shell)"
                  : "url(#route-shell)"
            }
            strokeWidth={1.6}
          />
          <rect
            x={18}
            y={18}
            width={884}
            height={864}
            rx={26}
            fill={
              props.routeMode === "route"
                ? "url(#route-surface)"
                : props.routeMode === "logistics"
                  ? "url(#logistics-surface)"
                  : isConnect
                    ? "url(#connect-surface)"
                    : alpha("#090F16", 0.92)
            }
            stroke={
              isLogistics
                ? alpha("#D3C1A1", 0.42)
                : isConnect
                  ? "url(#connect-inner-line)"
                  : alpha("#A8B7CC", 0.06)
            }
            strokeWidth={1}
          />
          {isConnect ? (
            <line
              x1={36}
              y1={70}
              x2={884}
              y2={70}
              stroke={alpha("#D8C7AF", 0.08)}
              strokeWidth={1}
            />
          ) : null}
          {props.routeMode === "route" ? (
            <rect
              x={18}
              y={18}
              width={884}
              height={864}
              rx={26}
              fill="url(#route-ocean-glow)"
            />
          ) : props.routeMode === "logistics" ? (
            <rect
              x={18}
              y={18}
              width={884}
              height={864}
              rx={26}
              fill="url(#logistics-ocean-glow)"
            />
          ) : null}

          <g transform="translate(46,28)">
            <g
              transform={`translate(${routeFocusTransform.x}, ${routeFocusTransform.y}) scale(${routeFocusTransform.scale})`}
            >
            {isRoute
              ? INDIA_STATE_SHAPES.map((shape) => (
                  <g key={shape.key}>
                    {shape.paths.map((pathD, pathIndex) => (
                      <path
                        key={`${shape.key}-${pathIndex}`}
                        d={pathD}
                        fill={alpha("#0A121B", 0.9)}
                        stroke={alpha("#3A4A61", 0.34)}
                        strokeWidth={0.72}
                        strokeLinejoin="round"
                      />
                    ))}
                  </g>
                ))
              : isLogistics
                ? INDIA_STATE_SHAPES.map((shape) => {
                    const stopIndex = routeStates.findIndex(
                      (state) =>
                        canonicalizeStateName(state) === canonicalizeStateName(shape.name),
                    );
                    const isStop = stopIndex >= 0;
                    const stopColor = isStop
                      ? logisticsStopPalette[stopIndex % logisticsStopPalette.length]
                      : props.baseFillColor;

                    return (
                      <g key={shape.key}>
                        {shape.paths.map((pathD, pathIndex) => (
                          <path
                            key={`${shape.key}-${pathIndex}`}
                            d={pathD}
                            fill={
                              isStop
                                ? alpha(stopColor, stopIndex === 0 || stopIndex === routeStates.length - 1 ? 0.22 : 0.16)
                                : alpha("#EEF2F4", 0.96)
                            }
                            stroke={
                              isStop ? alpha(stopColor, 0.86) : alpha("#C6D5DF", 0.72)
                            }
                            strokeWidth={isStop ? 1.8 : 0.92}
                            strokeLinejoin="round"
                        />
                      ))}
                    </g>
                  );
                })
              : isConnect
                ? (
                    <>
                      {INDIA_STATE_SHAPES.map((shape) => (
                        <g key={`connect-base-${shape.key}`}>
                          {shape.paths.map((pathD, pathIndex) => (
                            <path
                              key={`connect-base-${shape.key}-${pathIndex}`}
                              d={pathD}
                              fill={alpha("#121C26", 0.92)}
                              stroke={alpha("#44576A", 0.62)}
                              strokeWidth={0.8}
                              strokeLinejoin="round"
                            />
                          ))}
                        </g>
                      ))}

                      {routeShapes.map((shape, index) => {
                        const isEndpoint =
                          index === 0 || index === routeShapes.length - 1;
                        const highlightFill = isEndpoint
                          ? alpha(modeAccent, 0.18)
                          : alpha(modeAccent, 0.08);

                        return (
                          <g key={`connect-highlight-${shape.key}`}>
                            {shape.paths.map((pathD, pathIndex) => (
                              <path
                                key={`connect-highlight-${shape.key}-${pathIndex}`}
                                d={pathD}
                                fill={highlightFill}
                                stroke="none"
                              />
                            ))}
                          </g>
                        );
                      })}
                    </>
                  )
              : INDIA_STATE_SHAPES.map((shape) => {
                  const isStop = routeStates.some(
                    (state) =>
                      canonicalizeStateName(state) === canonicalizeStateName(shape.name),
                  );
                  const isEndpoint =
                    canonicalizeStateName(props.originState) ===
                      canonicalizeStateName(shape.name) ||
                    canonicalizeStateName(props.destinationState) ===
                      canonicalizeStateName(shape.name);
                  const outlineColor = isEndpoint
                    ? modeAccent
                    : isStop
                      ? alpha(modeAccent, 0.72)
                      : props.outlineColor;
                  const fillColor = "transparent";
                  const strokeWidth = isEndpoint
                    ? 2.2
                    : isStop
                      ? 1.8
                      : 1.05;

                  return (
                    <g key={shape.key}>
                      {shape.paths.map((pathD, pathIndex) => (
                        <path
                          key={`${shape.key}-${pathIndex}`}
                          d={pathD}
                          fill={fillColor}
                          stroke={outlineColor}
                          strokeWidth={strokeWidth}
                          strokeLinejoin="round"
                        />
                      ))}
                    </g>
                  );
                })}

            {routeSegments.map((segment, index) => {
              const startWindow = index / travelerSegmentCount;
              const endWindow = (index + 1) / travelerSegmentCount;
              const segmentProgress = interpolate(
                routeProgress,
                [startWindow, endWindow],
                [0, 1],
                CLAMP,
              );

              return (
                <g key={`route-segment-${index}`}>
                  <path
                    d={segment.path}
                    fill="none"
                    stroke={alpha(glowColor, isRoute ? 0.16 : isLogistics ? 0.1 : isConnect ? 0.06 : 0.12)}
                    strokeWidth={props.routeMode === "connect" ? 5 : isRoute ? 9 : isLogistics ? 8 : 8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                  />
                  {isLogistics ? (
                    <path
                      d={segment.path}
                      fill="none"
                      stroke={alpha("#FFF7EA", 0.42)}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray="0.04 0.08"
                      strokeDashoffset={1 - segmentProgress}
                      opacity={segmentProgress > 0 ? 0.95 : 0}
                    />
                  ) : null}
                  <path
                    d={segment.path}
                    fill="none"
                    stroke={alpha(modeAccent, isRoute ? 0.4 : isLogistics ? 0.18 : isConnect ? 0.2 : 0.28)}
                    strokeWidth={props.routeMode === "connect" ? 3.2 : isRoute ? 6.2 : isLogistics ? 4.5 : 5.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset={1 - segmentProgress}
                    opacity={segmentProgress > 0 ? 1 : 0}
                    style={isConnect ? undefined : {
                      filter: `drop-shadow(0 0 10px ${alpha(modeAccent, 0.36)})`,
                    }}
                  />
                  <path
                    d={segment.path}
                    fill="none"
                    stroke="url(#route-line)"
                    strokeWidth={props.routeMode === "connect" ? 2 : isRoute ? 3.8 : isLogistics ? 2.8 : 3.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset={1 - segmentProgress}
                    opacity={segmentProgress > 0 ? 1 : 0}
                  />
                </g>
              );
            })}

            {routeShapes.map((shape, index) => {
              if (index > 0 && index < routeShapes.length - 1 && !shouldShowIntermediateLabels) {
                return null;
              }

              const label =
                index === 0
                  ? props.originLabel ?? props.originState
                  : index === routeShapes.length - 1
                    ? props.destinationLabel ?? props.destinationState
                    : routeStates[index];
              const reveal = interpolate(
                routeProgress,
                [
                  Math.max(0, index / Math.max(routeShapes.length - 1, 1) - 0.06),
                  Math.min(1, index / Math.max(routeShapes.length - 1, 1) + 0.06),
                ],
                [0.22, 1],
                CLAMP,
              );
              const pillWidth = Math.min(
                isRoute ? 150 : isLogistics ? 182 : 190,
                Math.max(108, label.length * 9 + (isLogistics ? 40 : 42)),
              );
              const labelSide =
                isRoute
                  ? index === 0
                    ? "right"
                    : "left"
                  : isLogistics
                    ? index === 0
                      ? "right"
                      : index === routeShapes.length - 1
                        ? shape.centroid[0] < 620
                          ? "right"
                          : "left"
                        : index % 2 === 0
                          ? "right"
                          : "left"
                  : isConnect
                    ? index === 0
                      ? "right"
                      : shape.centroid[1] > 700
                        ? shape.centroid[0] < 430
                          ? "right"
                          : "left"
                        : shape.centroid[0] < 430
                          ? "right"
                          : "left"
                  : shape.centroid[0] < 430
                    ? "right"
                    : "left";
              const pillX =
                labelSide === "right"
                  ? Math.min(
                      shape.centroid[0] + (isRoute ? 16 : isLogistics ? 18 : 22),
                      838 - pillWidth,
                    )
                  : Math.max(
                      shape.centroid[0] - pillWidth - (isRoute ? 16 : isLogistics ? 18 : 22),
                      24,
                    );
              const logisticsYOffset =
                isLogistics && index === 0
                  ? -18
                  : isLogistics && index === routeShapes.length - 1
                    ? -6
                    : isLogistics
                      ? -12
                      : isConnect && index === routeShapes.length - 1 && shape.centroid[1] > 700
                        ? -34
                        : isConnect
                          ? -8
                      : 0;
              const pillY = Math.max(
                32,
                Math.min(
                  shape.centroid[1] - (isRoute ? 10 : isLogistics ? 14 : 18) + logisticsYOffset,
                  isConnect ? 748 : 790,
                ),
              );
              const stopRole =
                index === 0
                  ? "ORIGIN"
                  : index === routeShapes.length - 1
                    ? "DESTINATION"
                    : "HUB";
              const nodeAccent =
                props.routeMode === "logistics"
                  ? logisticsStopPalette[index % logisticsStopPalette.length]
                  : index === 0 || index === routeShapes.length - 1
                    ? modeAccent
                    : props.nodeColor;

              return (
                <g key={`route-label-${shape.key}`} opacity={reveal}>
                  <circle
                    cx={shape.centroid[0]}
                    cy={shape.centroid[1]}
                    r={
                      props.routeMode === "route"
                        ? index === 0 || index === routeShapes.length - 1
                          ? 4.8
                          : 4
                        : isLogistics
                          ? index === 0 || index === routeShapes.length - 1
                            ? 5.4
                            : 4.5
                          : index === 0 || index === routeShapes.length - 1
                            ? 5.6
                            : 4.6
                    }
                    fill={nodeAccent}
                    stroke={alpha("#FFFFFF", isLogistics ? 0.92 : 0.85)}
                    strokeWidth={isConnect ? 1.2 : 1.6}
                    style={isConnect ? undefined : {
                      filter: `drop-shadow(0 0 10px ${alpha(nodeAccent, 0.4)})`,
                    }}
                  />
                  <g transform={`translate(${pillX}, ${pillY})`}>
                    <rect
                      x={0}
                      y={0}
                      width={pillWidth}
                      height={isRoute ? 34 : isLogistics ? 34 : 38}
                      rx={isRoute ? 9 : isLogistics ? 11 : isConnect ? 9 : 10}
                      fill={
                        isLogistics
                          ? alpha("#FFFDF9", 0.93)
                          : isConnect
                            ? alpha("#121B24", 0.94)
                            : alpha("#0A1017", isRoute ? 0.94 : 0.88)
                      }
                      stroke={
                        isLogistics
                          ? alpha("#DCC8A3", 0.55)
                          : isConnect
                            ? alpha("#D9C9B2", 0.14)
                            : alpha(nodeAccent, isRoute ? 0.22 : 0.28)
                      }
                      strokeWidth={isRoute ? 1 : isLogistics ? 1 : isConnect ? 1 : 1.2}
                    />
                    {isConnect ? (
                      <rect x={10} y={9} width={4} height={16} rx={999} fill={nodeAccent} />
                    ) : null}
                    {isLogistics ? (
                      <text
                        x={12}
                        y={12}
                        fill={alpha("#927044", 0.92)}
                        style={{
                          fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                        }}
                      >
                        {stopRole}
                      </text>
                    ) : null}
                    <text
                      x={isConnect ? 24 : 12}
                      y={isRoute ? 22 : isLogistics ? 25 : 24}
                      fill={
                        isLogistics
                          ? "#23313F"
                          : isConnect
                            ? alpha(props.labelColor, 0.96)
                            : props.labelColor
                      }
                      style={{
                        fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                        fontSize: isRoute ? 13 : isLogistics ? 13 : 14,
                        fontWeight: 700,
                        letterSpacing: isConnect ? "0.01em" : "-0.02em",
                      }}
                    >
                      {label}
                    </text>
                  </g>
                </g>
              );
            })}

            {travelerPoint ? (
              props.routeMode === "logistics" ? (
                <g>
                  <circle
                    cx={travelerPoint[0]}
                    cy={travelerPoint[1]}
                    r={20}
                    fill={alpha(modeAccent, 0.08)}
                  />
                  <TruckIcon
                    x={travelerPoint[0]}
                    y={travelerPoint[1]}
                    angle={travelerAngle}
                    color={modeAccent}
                  />
                </g>
              ) : (
                <g>
                  <circle
                    cx={travelerPoint[0]}
                    cy={travelerPoint[1]}
                    r={props.routeMode === "route" ? 10 : 11}
                    fill={alpha(modeAccent, props.routeMode === "route" ? 0.18 : isConnect ? 0.08 : 0.14)}
                  />
                  <circle
                    cx={travelerPoint[0]}
                    cy={travelerPoint[1]}
                    r={props.routeMode === "route" ? 4 : 4.5}
                    fill={modeAccent}
                    stroke={alpha("#FFFFFF", 0.55)}
                    strokeWidth={1.4}
                  />
                </g>
              )
            ) : null}
            </g>
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const MapRouteFlow: React.FC<MapRouteFlowProps> = (props) => {
  return <IndiaRouteScene {...props} />;
};
