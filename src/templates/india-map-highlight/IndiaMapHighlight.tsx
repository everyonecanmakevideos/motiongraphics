import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { geoMercator, geoPath } from "d3-geo";
import indiaGeoJson from "../../../public/geo/india_state.json";
import { Background } from "../../primitives/Background";
import {
  fadeIn,
  scalePop,
  secToFrame,
  slideUp,
  staggerDelay,
} from "../../primitives/animations";
import { resolveEffects } from "../../primitives/useEffects";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import type { IndiaMapHighlightProps } from "./schema";

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

type HighlightedStateVisual = {
  state: IndiaMapHighlightProps["highlightedStates"][number];
  shape: PreparedStateShape;
  accent: string;
  appear: number;
  cardAppear: {
    opacity: number;
    y: number;
    scale: number;
  };
  labelSide: "left" | "right";
  anchorX: number;
  anchorY: number;
  cardX: number;
  cardY: number;
};

const INDIA_GEO = indiaGeoJson as GeoFeatureCollection;
const PREMIUM_MULTI_STATE_PALETTE = [
  "#A56A43",
  "#C08F52",
  "#7C8D74",
  "#8A5A44",
  "#6E8194",
  "#B39A76",
];

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
  "dadra and nagar haveli and daman and diu": "dadra and nagar haveli and daman and diu",
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
      key: `india-state-${key}`,
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

function mixHex(a: string, b: string, amount: number) {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  const t = Math.max(0, Math.min(1, amount));
  const channel = (from: number, to: number) =>
    Math.round(from + (to - from) * t)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(left.r, right.r)}${channel(left.g, right.g)}${channel(left.b, right.b)}`;
}

function alpha(hex: string, opacity: number) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

function applyEntrance(
  frame: number,
  preset: IndiaMapHighlightProps["entranceAnimation"],
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
    const entrance = scalePop(frame, { startFrame, endFrame }, 1.06);
    return { opacity: entrance.opacity, y: 0, scale: entrance.scale };
  }

  const entrance = slideUp(frame, { startFrame, endFrame }, 44);
  return { opacity: entrance.opacity, y: entrance.y, scale: 1 };
}

export const IndiaMapHighlight: React.FC<IndiaMapHighlightProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale } = useResponsiveConfig();

  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typography = resolveTypography(resolved.typography);
  const effects = resolveEffects(resolved.effects, props.highlightColor);

  const totalFrames = secToFrame(props.duration);
  const introEnd = Math.round(totalFrames * 0.18);
  const mapScale = Math.min(width / 1920, height / 1080);
  const stageLeft = Math.round(width * 0.055);
  const stageTop = Math.round(height * 0.06);
  const stageRight = Math.round(width * 0.055);
  const headerHeight = Math.round(height * 0.16);
  const contentTop = stageTop + headerHeight;
  const mapWidth = Math.round(920 * mapScale * 0.92);
  const mapHeight = Math.round(900 * mapScale * 0.92);
  const mapLeft = stageLeft;
  const mapTop = contentTop + Math.round(height * 0.015);
  const panelWidth = Math.round(width * 0.25);
  const panelLeft = width - panelWidth - stageRight;
  const panelTop = contentTop + Math.round(height * 0.07);
  const contentWidth = width - stageLeft - stageRight;
  const titleWidth = Math.round(contentWidth * 0.46);
  const subtitleLength = props.subtitle?.length ?? 0;
  const compactSubtitle = subtitleLength > 56;
  const subtitleFontSize = Math.round((compactSubtitle ? 20 : 24) * scale);
  const subtitleMaxWidth = Math.round((compactSubtitle ? 500 : 560) * scale);
  const atlasAccent = props.highlightColor;

  const highlightedLookup = new Map(
    props.highlightedStates.map((item, index) => [
      canonicalizeStateName(item.state),
      {
        ...item,
        accentColor:
          item.accentColor ??
          PREMIUM_MULTI_STATE_PALETTE[index % PREMIUM_MULTI_STATE_PALETTE.length],
        index,
      },
    ]),
  );

  const titleEntrance = applyEntrance(frame, props.entranceAnimation, 0, introEnd);
  const mapEntrance = applyEntrance(
    frame,
    props.entranceAnimation,
    Math.round(totalFrames * 0.04),
    Math.round(totalFrames * 0.24),
  );
  const highlightedVisuals: HighlightedStateVisual[] = props.highlightedStates
    .map((item, index) => {
      const shape = INDIA_STATE_SHAPES.find(
        (candidate) =>
          canonicalizeStateName(candidate.name) === canonicalizeStateName(item.state),
      );

      if (!shape) {
        return null;
      }

      const range = staggerDelay(
        index,
        Math.max(props.highlightedStates.length, 1),
        Math.round(totalFrames * 0.36),
      );
      const appear = interpolate(
        frame,
        [introEnd + range.startFrame, introEnd + range.endFrame],
        [0, 1],
        CLAMP,
      );
      const effectiveAccent =
        props.highlightedStates.length > 1
          ? item.accentColor ??
            PREMIUM_MULTI_STATE_PALETTE[index % PREMIUM_MULTI_STATE_PALETTE.length]
          : item.accentColor ?? props.highlightColor;
      const [cx, cy] = shape.centroid;
      const labelSide = cx < 420 ? "right" : "left";
      const cardWidth = 172;
      const cardX = labelSide === "right" ? Math.min(cx + 34, 820 - cardWidth) : Math.max(cx - 34 - cardWidth, 28);
      const cardY = Math.max(40, Math.min(cy - 36, 760));

      return {
        state: item,
        shape,
        accent: effectiveAccent,
        appear,
        cardAppear: applyEntrance(
          frame,
          "slide-up",
          introEnd + range.startFrame,
          introEnd + range.endFrame,
        ),
        labelSide,
        anchorX: cx,
        anchorY: cy,
        cardX,
        cardY,
      };
    })
    .filter((item): item is HighlightedStateVisual => item !== null);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${alpha("#071018", 0.86)}, ${alpha(
            "#0C1520",
            0.82,
          )})`,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            `radial-gradient(circle at 22% 18%, ${alpha("#E7DCCA", 0.045)}, transparent 26%), radial-gradient(circle at 78% 16%, ${alpha(
              "#7E8A96",
              0.05,
            )}, transparent 22%), radial-gradient(circle at 72% 78%, ${alpha(
              atlasAccent,
              0.035,
            )}, transparent 18%)`,
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
            padding: `${Math.round(9 * scale)}px ${Math.round(15 * scale)}px`,
            borderRadius: Math.round(999 * scale),
            background: alpha("#101821", 0.7),
            border: `1px solid ${alpha("#D8C7AF", 0.14)}`,
          }}
        >
          <div
            style={{
              width: Math.round(18 * scale),
              height: 1,
              background: alpha("#D8C7AF", 0.6),
            }}
          />
          <div
            style={{
              fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
              fontSize: Math.round(14 * scale),
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: alpha("#D8C7AF", 0.82),
            }}
          >
            India Geo Focus
          </div>
        </div>
        <div
          style={{
            fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
            fontWeight: typography.fontWeight ?? 700,
            fontSize: Math.round(60 * scale),
            lineHeight: 0.96,
            letterSpacing: typography.letterSpacing ?? "-0.05em",
            color: alpha(props.titleColor, 0.98),
            marginTop: Math.round(18 * scale),
          }}
        >
          {props.title}
        </div>
        {props.subtitle ? (
          <div
            style={{
              marginTop: Math.round(16 * scale),
              maxWidth: subtitleMaxWidth,
              fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
              fontSize: subtitleFontSize,
              lineHeight: compactSubtitle ? 1.28 : typography.lineHeight ?? 1.32,
              color: alpha("#C4B59E", 0.96),
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
              : `drop-shadow(0 18px 40px ${alpha("#04080D", 0.22)})`,
        }}
      >
        <svg viewBox="0 0 920 900" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="india-shell" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha("#D8C7AF", 0.13)} />
              <stop offset="100%" stopColor={alpha("#546577", 0.18)} />
            </linearGradient>
            <linearGradient id="india-surface" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha("#121C25", 0.98)} />
              <stop offset="100%" stopColor={alpha("#0D151D", 0.98)} />
            </linearGradient>
            <linearGradient id="india-inner-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={alpha("#D8C7AF", 0.1)} />
              <stop offset="100%" stopColor={alpha("#65788B", 0.18)} />
            </linearGradient>
          </defs>

          <rect
            x={0}
            y={0}
            width={920}
            height={900}
            rx={30}
            fill={alpha("#091119", 0.6)}
            stroke="url(#india-shell)"
            strokeWidth={1.4}
          />
          <rect
            x={24}
            y={24}
            width={872}
            height={852}
            rx={24}
            fill="url(#india-surface)"
            stroke="url(#india-inner-line)"
            strokeWidth={1}
          />
          <line
            x1={44}
            y1={74}
            x2={874}
            y2={74}
            stroke={alpha("#D8C7AF", 0.08)}
            strokeWidth={1}
          />

          <g transform="translate(46,28)">
            {INDIA_STATE_SHAPES.map((shape) => {
              const matched = highlightedLookup.get(canonicalizeStateName(shape.name));
              const range = matched
                ? staggerDelay(
                    matched.index,
                    Math.max(props.highlightedStates.length, 1),
                    Math.round(totalFrames * 0.36),
                  )
                : null;
              const fillProgress = matched
                ? interpolate(
                    frame,
                    [introEnd + range!.startFrame, introEnd + range!.endFrame],
                    [0, 1],
                    CLAMP,
                  )
                : 0;
              const stateColor = mixHex(
                props.baseFillColor,
                matched?.accentColor ?? props.highlightColor,
                fillProgress,
              );
              const strokeColor = matched
                ? mixHex(props.outlineColor, matched.accentColor ?? props.highlightColor, fillProgress * 0.45)
                : props.outlineColor;
              const washOpacity = matched
                ? interpolate(
                    frame,
                    [introEnd + range!.startFrame, introEnd + range!.endFrame, totalFrames],
                    [0, 0.08, 0.04],
                    CLAMP,
                  )
                : 0;

              return (
                <g key={shape.key}>
                  {shape.paths.map((pathD, pathIndex) => (
                    <React.Fragment key={`${shape.key}-${pathIndex}`}>
                      {matched ? (
                        <path
                          d={pathD}
                          fill={alpha(matched.accentColor ?? props.highlightColor, washOpacity)}
                          stroke="none"
                        />
                      ) : null}
                      <path
                        d={pathD}
                        fill={stateColor}
                        stroke={strokeColor}
                        strokeWidth={1.15}
                        strokeLinejoin="round"
                      />
                    </React.Fragment>
                  ))}
                </g>
              );
            })}

            {highlightedVisuals.map((item) => {
              return (
                <g key={`${item.shape.key}-marker`} opacity={item.appear}>
                  <circle
                    cx={item.anchorX}
                    cy={item.anchorY}
                    r={14}
                    fill={alpha(item.accent, 0.08)}
                    stroke="none"
                    transform={`scale(${1 + item.appear * 0.15})`}
                  />
                  <circle
                    cx={item.anchorX}
                    cy={item.anchorY}
                    r={5}
                    fill={item.accent}
                    stroke={alpha("#F5EBDD", 0.9)}
                    strokeWidth={1.4}
                  />
                  <path
                    d={`M ${item.anchorX} ${item.anchorY} C ${
                      item.labelSide === "right" ? item.anchorX + 26 : item.anchorX - 26
                    } ${item.anchorY - 18}, ${
                      item.labelSide === "right" ? item.cardX - 6 : item.cardX + 178
                    } ${item.cardY + 18}, ${
                      item.labelSide === "right" ? item.cardX : item.cardX + 172
                    } ${item.cardY + 18}`}
                    fill="none"
                    stroke={alpha("#D8C7AF", 0.16)}
                    strokeWidth={1}
                    strokeLinecap="round"
                    opacity={item.appear * 0.75}
                  />
                  <g
                    transform={`translate(${item.cardX}, ${item.cardY})`}
                    opacity={item.cardAppear.opacity}
                  >
                    <rect
                      x={0}
                      y={0}
                      width={172}
                      height={item.state.value ? 54 : 34}
                      rx={9}
                      fill={alpha("#121B24", 0.94)}
                      stroke={alpha("#D9C9B2", 0.14)}
                      strokeWidth={1}
                    />
                    <rect
                      x={10}
                      y={9}
                      width={4}
                      height={item.state.value ? 34 : 16}
                      rx={999}
                      fill={item.accent}
                    />
                    <text
                      x={24}
                      y={22}
                      fill={alpha(props.labelColor, 0.96)}
                      style={{
                        fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: "0.01em",
                      }}
                    >
                      {item.state.state}
                    </text>
                    {item.state.value ? (
                      <text
                        x={24}
                        y={40}
                        fill={alpha(item.accent, 0.82)}
                        style={{
                          fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                        }}
                      >
                        {item.state.value.toUpperCase()}
                      </text>
                    ) : null}
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div
        style={{
          position: "absolute",
          left: panelLeft,
          top: panelTop,
          width: panelWidth,
          padding: `${Math.round(26 * scale)}px`,
          borderRadius: Math.round(18 * scale),
          background: alpha("#121B24", 0.9),
          border: `1px solid ${alpha("#D8C7AF", 0.12)}`,
          boxShadow: `0 18px 40px ${alpha("#04090E", 0.18)}`,
        }}
      >
        <div
          style={{
            width: Math.round(46 * scale),
            height: 1,
            background: alpha("#D8C7AF", 0.38),
          }}
        />
        <div
          style={{
            fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
            fontSize: Math.round(15 * scale),
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: alpha("#D8C7AF", 0.74),
            marginTop: Math.round(14 * scale),
          }}
        >
          Highlighted States
        </div>

        <div
          style={{
            marginTop: Math.round(14 * scale),
            fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
            fontSize: Math.round(17 * scale),
            lineHeight: 1.35,
            color: alpha("#D0C2AE", 0.72),
            maxWidth: Math.round(300 * scale),
          }}
        >
          Deterministic state rendering with restrained fills, direct labeling, and an editorial map hierarchy.
        </div>

        <div style={{ marginTop: Math.round(22 * scale), display: "grid", gap: Math.round(14 * scale) }}>
          {props.highlightedStates.map((item, index) => {
            const range = staggerDelay(
              index,
              Math.max(props.highlightedStates.length, 1),
              Math.round(totalFrames * 0.34),
            );
            const cardEntrance = applyEntrance(
              frame,
              "slide-up",
              introEnd + range.startFrame,
              introEnd + range.endFrame,
            );
            const accent =
              props.highlightedStates.length > 1
                ? item.accentColor ??
                  PREMIUM_MULTI_STATE_PALETTE[index % PREMIUM_MULTI_STATE_PALETTE.length]
                : item.accentColor ?? props.highlightColor;

            return (
              <div
                key={`${item.state}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: `${Math.round(12 * scale)}px 1fr`,
                  gap: Math.round(12 * scale),
                  alignItems: "start",
                  opacity: cardEntrance.opacity,
                  transform: `translateY(${cardEntrance.y}px) scale(${cardEntrance.scale})`,
                  padding: `${Math.round(12 * scale)}px ${Math.round(12 * scale)}px`,
                  borderRadius: Math.round(12 * scale),
                  background: alpha("#0E161E", 0.52),
                  border: `1px solid ${alpha("#D8C7AF", 0.08)}`,
                }}
              >
                <div
                  style={{
                    width: Math.round(4 * scale),
                    height: Math.round(42 * scale),
                    borderRadius: 999,
                    background: accent,
                  }}
                />
                <div>
                  <div
                    style={{
                        fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                        fontSize: Math.round(21 * scale),
                        fontWeight: 700,
                        color: alpha(props.labelColor, 0.96),
                        lineHeight: 1.1,
                      }}
                    >
                    {item.state}
                  </div>
                  {item.value ? (
                    <div
                      style={{
                        marginTop: Math.round(5 * scale),
                        fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                        fontSize: Math.round(12 * scale),
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: alpha(accent, 0.82),
                      }}
                    >
                      {item.value}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
