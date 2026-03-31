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
  "#C8A96B",
  "#3FA7A3",
  "#B87333",
  "#8B6F47",
  "#6D9F71",
  "#A56C5D",
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
          background:
            `radial-gradient(circle at 18% 24%, ${alpha("#F3EBDD", 0.04)}, transparent 26%), radial-gradient(circle at 78% 18%, ${alpha(
              props.highlightColor,
              0.1,
            )}, transparent 18%), radial-gradient(circle at 74% 76%, ${alpha(
              "#6C7D8D",
              0.06,
            )}, transparent 20%)`,
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
            padding: `${Math.round(10 * scale)}px ${Math.round(16 * scale)}px`,
            borderRadius: Math.round(999 * scale),
            background: alpha("#0D1825", 0.72),
            border: `1px solid ${alpha(props.highlightColor, 0.26)}`,
            boxShadow: `0 12px 28px ${alpha("#050B12", 0.32)}, inset 0 1px 0 ${alpha(
              "#F3EBDD",
              0.05,
            )}`,
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              width: Math.round(10 * scale),
              height: Math.round(10 * scale),
              borderRadius: 999,
              background: props.highlightColor,
              boxShadow: `0 0 18px ${alpha(props.highlightColor, 0.34)}`,
            }}
          />
          <div
            style={{
              fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
              fontSize: Math.round(15 * scale),
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: alpha(props.labelColor, 0.76),
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
            color: props.titleColor,
            marginTop: Math.round(18 * scale),
            textShadow: "0 10px 28px rgba(15,23,42,0.08)",
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
              color: props.subtitleColor,
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
              : `drop-shadow(0 30px 80px ${alpha("#050B12", 0.28)})`,
        }}
      >
        <svg viewBox="0 0 920 900" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="india-panel-grid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha("#F2E6D2", 0.08)} />
              <stop offset="100%" stopColor={alpha(props.highlightColor, 0.07)} />
            </linearGradient>
            <linearGradient id="india-panel-shell" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha("#F2E6D2", 0.12)} />
              <stop offset="100%" stopColor={alpha(props.highlightColor, 0.08)} />
            </linearGradient>
          </defs>

          <rect
            x={0}
            y={0}
            width={920}
            height={900}
            rx={36}
            fill={alpha("#0A141F", 0.54)}
            stroke="url(#india-panel-shell)"
            strokeWidth={2}
          />
          <rect
            x={22}
            y={22}
            width={876}
            height={856}
            rx={28}
            fill="none"
            stroke="url(#india-panel-grid)"
            strokeWidth={1.5}
            strokeDasharray="8 14"
          />
          <rect
            x={36}
            y={36}
            width={848}
            height={828}
            rx={24}
            fill={alpha("#08111A", 0.64)}
            stroke={alpha("#F2E6D2", 0.035)}
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
                ? mixHex(props.outlineColor, matched.accentColor ?? props.highlightColor, fillProgress * 0.8)
                : props.outlineColor;
              const glowOpacity = matched
                ? interpolate(
                    frame,
                    [introEnd + range!.startFrame, introEnd + range!.endFrame, totalFrames],
                    [0, 0.26, 0.12],
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
                          fill={alpha(matched.accentColor ?? props.highlightColor, glowOpacity)}
                          stroke="none"
                          transform="scale(1.008)"
                        />
                      ) : null}
                      <path
                        d={pathD}
                        fill={stateColor}
                        stroke={strokeColor}
                        strokeWidth={1.8}
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
                    r={22}
                    fill={alpha(item.accent, 0.12)}
                    stroke="none"
                    transform={`scale(${1 + item.appear * 0.3})`}
                  />
                  <circle
                    cx={item.anchorX}
                    cy={item.anchorY}
                    r={8}
                    fill={item.accent}
                    stroke={alpha("#FFFFFF", 0.45)}
                    strokeWidth={2}
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
                    stroke={alpha(item.accent, 0.75)}
                    strokeWidth={2}
                    strokeDasharray="5 7"
                    strokeLinecap="round"
                    opacity={item.appear * 0.9}
                  />
                  <g
                    transform={`translate(${item.cardX}, ${item.cardY})`}
                    opacity={item.cardAppear.opacity}
                  >
                    <rect
                      x={0}
                      y={0}
                      width={172}
                      height={item.state.value ? 58 : 44}
                      rx={18}
                      fill="rgba(8,17,31,0.82)"
                      stroke={alpha(item.accent, 0.35)}
                      strokeWidth={1.4}
                    />
                    <rect
                      x={10}
                      y={10}
                      width={10}
                      height={10}
                      rx={999}
                      fill={item.accent}
                    />
                    <text
                      x={30}
                      y={22}
                      fill={props.labelColor}
                      style={{
                        fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {item.state.state}
                    </text>
                    {item.state.value ? (
                      <text
                        x={30}
                        y={40}
                        fill={alpha(item.accent, 0.95)}
                        style={{
                          fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.16em",
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
          borderRadius: Math.round(28 * scale),
          background: `linear-gradient(180deg, ${alpha("#0D1825", 0.9)}, ${alpha(
            "#101D2A",
            0.78,
          )})`,
          border: `1px solid ${alpha(props.highlightColor, 0.18)}`,
          boxShadow: `0 26px 70px ${alpha("#040A10", 0.3)}, inset 0 1px 0 ${alpha(
            "#F3EBDD",
            0.04,
          )}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
            fontSize: Math.round(15 * scale),
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: alpha(props.labelColor, 0.62),
          }}
        >
          Highlighted States
        </div>

        <div
          style={{
            marginTop: Math.round(14 * scale),
            fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
            fontSize: Math.round(18 * scale),
            lineHeight: 1.35,
            color: alpha(props.labelColor, 0.68),
            maxWidth: Math.round(300 * scale),
          }}
        >
          State-level focus rendered from deterministic SVG paths with crisp region fills.
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
                  gridTemplateColumns: `${Math.round(18 * scale)}px 1fr`,
                  gap: Math.round(14 * scale),
                  alignItems: "center",
                  opacity: cardEntrance.opacity,
                  transform: `translateY(${cardEntrance.y}px) scale(${cardEntrance.scale})`,
                  padding: `${Math.round(13 * scale)}px ${Math.round(14 * scale)}px`,
                  borderRadius: Math.round(18 * scale),
                  background: `linear-gradient(180deg, ${alpha("#F3EBDD", 0.03)}, ${alpha(
                    "#0D1825",
                    0.28,
                  )})`,
                  border: `1px solid ${alpha(accent, 0.34)}`,
                  boxShadow: `inset 0 1px 0 ${alpha("#F3EBDD", 0.04)}`,
                }}
              >
                <div
                  style={{
                    width: Math.round(18 * scale),
                    height: Math.round(18 * scale),
                    borderRadius: 999,
                    background: accent,
                    boxShadow: `0 0 18px ${alpha(accent, 0.35)}`,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                      fontSize: Math.round(24 * scale),
                      fontWeight: 700,
                      color: props.labelColor,
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
                        fontSize: Math.round(14 * scale),
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: alpha(accent, 0.92),
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
