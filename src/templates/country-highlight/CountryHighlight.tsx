import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  WORLD_COUNTRY_MAP,
  WORLD_MAP_VIEWBOX,
  canonicalizeCountryName,
  getWorldCountryAnchor,
} from "../../geo/worldCountries";
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
import { alpha, mixHex } from "../chartShared";
import type { CountryHighlightProps } from "./schema";

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const PREMIUM_COUNTRY_PALETTE = [
  "#5BC0EB",
  "#F4B942",
  "#6EE7B7",
  "#F97316",
  "#C084FC",
  "#F472B6",
];

const MAP_FRAME = {
  outerX: 0,
  outerY: 0,
  outerWidth: 1010,
  outerHeight: 666,
  innerX: 32,
  innerY: 32,
  innerWidth: 946,
  innerHeight: 602,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function applyEntrance(
  frame: number,
  preset: CountryHighlightProps["entranceAnimation"],
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

export const CountryHighlight: React.FC<CountryHighlightProps> = (props) => {
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
  const stageLeft = Math.round(width * 0.055);
  const stageTop = Math.round(height * 0.06);
  const stageRight = Math.round(width * 0.055);
  const headerHeight = Math.round(height * 0.16);
  const contentTop = stageTop + headerHeight;
  const contentWidth = width - stageLeft - stageRight;
  const panelWidth = Math.round(width * 0.25);
  const panelLeft = width - panelWidth - stageRight;
  const panelTop = contentTop + Math.round(height * 0.07);
  const mapMaxWidth = contentWidth - panelWidth - Math.round(width * 0.03);
  const availableMapHeight = height - contentTop - Math.round(height * 0.08);
  const mapWidth = Math.min(
    mapMaxWidth,
    Math.round(
      availableMapHeight *
        (WORLD_COUNTRY_MAP.viewBox.split(" ").map(Number)[2] /
          WORLD_COUNTRY_MAP.viewBox.split(" ").map(Number)[3]),
    ),
  );
  const mapHeight = Math.round(
    mapWidth *
      (WORLD_COUNTRY_MAP.viewBox.split(" ").map(Number)[3] /
        WORLD_COUNTRY_MAP.viewBox.split(" ").map(Number)[2]),
  );
  const mapLeft = stageLeft;
  const mapTop = contentTop + Math.round(height * 0.02);
  const titleWidth = Math.round(contentWidth * 0.46);
  const subtitleLength = props.subtitle?.length ?? 0;
  const compactSubtitle = subtitleLength > 56;
  const subtitleFontSize = Math.round((compactSubtitle ? 20 : 24) * scale);
  const subtitleMaxWidth = Math.round((compactSubtitle ? 520 : 580) * scale);

  const highlightedLookup = new Map(
    props.highlightedCountries.map((item, index) => [
      canonicalizeCountryName(item.country),
      {
        ...item,
        accentColor:
          item.accentColor ??
          PREMIUM_COUNTRY_PALETTE[index % PREMIUM_COUNTRY_PALETTE.length],
        index,
      },
    ]),
  );

  const highlightedMarkers = props.highlightedCountries
    .map((item, index) => {
      const accentColor =
        item.accentColor ?? PREMIUM_COUNTRY_PALETTE[index % PREMIUM_COUNTRY_PALETTE.length];
      const anchor = getWorldCountryAnchor(item.country);
      const location = WORLD_COUNTRY_MAP.findLocation(item.country);

      if (!anchor || !location) {
        return null;
      }

      return {
        ...item,
        index,
        accentColor,
        anchor,
        location,
      };
    })
    .filter(
      (
        marker,
      ): marker is {
        country: string;
        value?: string;
        accentColor: string;
        index: number;
        anchor: { x: number; y: number };
        location: { name: string; id: string; path: string };
      } => marker !== null,
    );

  const focusTransform = (() => {
    if (highlightedMarkers.length === 0) {
      return { scale: 1, translateX: 0, translateY: 0 };
    }

    const xs = highlightedMarkers.map((marker) => marker.anchor.x);
    const ys = highlightedMarkers.map((marker) => marker.anchor.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const paddingX = Math.max(60, spanX * 0.9);
    const paddingY = Math.max(56, spanY * 1.1);
    const focusWidth = Math.max(160, spanX + paddingX * 2);
    const focusHeight = Math.max(140, spanY + paddingY * 2);
    const fitScale = Math.min(
      MAP_FRAME.innerWidth / focusWidth,
      MAP_FRAME.innerHeight / focusHeight,
    );
    const maxScale =
      highlightedMarkers.length === 1
        ? 4.8
        : highlightedMarkers.length === 2
          ? 3.6
          : highlightedMarkers.length <= 4
            ? 2.4
            : 1.5;
    const scaleValue = clamp(fitScale, 1, maxScale);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
      scale: scaleValue,
      translateX:
        MAP_FRAME.innerX + MAP_FRAME.innerWidth / 2 - centerX * scaleValue,
      translateY:
        MAP_FRAME.innerY + MAP_FRAME.innerHeight / 2 - centerY * scaleValue,
    };
  })();

  const titleEntrance = applyEntrance(frame, props.entranceAnimation, 0, introEnd);
  const mapEntrance = applyEntrance(
    frame,
    props.entranceAnimation,
    Math.round(totalFrames * 0.04),
    Math.round(totalFrames * 0.24),
  );
  const visibleMapBounds = {
    minX:
      (MAP_FRAME.innerX - focusTransform.translateX) / focusTransform.scale,
    maxX:
      (MAP_FRAME.innerX + MAP_FRAME.innerWidth - focusTransform.translateX) /
      focusTransform.scale,
    minY:
      (MAP_FRAME.innerY - focusTransform.translateY) / focusTransform.scale,
    maxY:
      (MAP_FRAME.innerY + MAP_FRAME.innerHeight - focusTransform.translateY) /
      focusTransform.scale,
  };

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
            World Geo Focus
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
        <svg viewBox={WORLD_COUNTRY_MAP.viewBox} style={{ width: "100%", height: "100%" }}>
          <defs>
            <clipPath id="world-highlight-clip">
              <rect
                x={MAP_FRAME.innerX}
                y={MAP_FRAME.innerY}
                width={MAP_FRAME.innerWidth}
                height={MAP_FRAME.innerHeight}
                rx={24}
              />
            </clipPath>
            <linearGradient id="world-panel-grid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha("#F2E6D2", 0.08)} />
              <stop offset="100%" stopColor={alpha(props.highlightColor, 0.07)} />
            </linearGradient>
            <linearGradient id="world-panel-shell" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha("#F2E6D2", 0.12)} />
              <stop offset="100%" stopColor={alpha(props.highlightColor, 0.08)} />
            </linearGradient>
          </defs>

          <rect
            x={0}
            y={0}
            width={1010}
            height={666}
            rx={36}
            fill={alpha("#0A141F", 0.54)}
            stroke="url(#world-panel-shell)"
            strokeWidth={2}
          />
          <rect
            x={20}
            y={20}
            width={970}
            height={626}
            rx={28}
            fill="none"
            stroke="url(#world-panel-grid)"
            strokeWidth={1.5}
            strokeDasharray="8 14"
          />
          <rect
            x={32}
            y={32}
            width={946}
            height={602}
            rx={24}
            fill={alpha("#08111A", 0.64)}
            stroke={alpha("#F2E6D2", 0.035)}
            strokeWidth={1}
          />

          <g clipPath="url(#world-highlight-clip)">
            <g
              transform={`translate(${focusTransform.translateX}, ${focusTransform.translateY}) scale(${focusTransform.scale})`}
            >
              {WORLD_COUNTRY_MAP.locations.map((location) => {
                const matched = highlightedLookup.get(
                  canonicalizeCountryName(location.name),
                );
                const range = matched
                  ? staggerDelay(
                      matched.index,
                      Math.max(props.highlightedCountries.length, 1),
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
                const countryColor = mixHex(
                  props.baseFillColor,
                  matched?.accentColor ?? props.highlightColor,
                  fillProgress,
                );
                const strokeColor = matched
                  ? mixHex(
                      props.outlineColor,
                      matched.accentColor ?? props.highlightColor,
                      fillProgress * 0.8,
                    )
                  : props.outlineColor;
                const glowOpacity = matched
                  ? interpolate(
                      frame,
                      [
                        introEnd + range!.startFrame,
                        introEnd + range!.endFrame,
                        totalFrames,
                      ],
                      [0, 0.22, 0.1],
                      CLAMP,
                    )
                  : 0;

                return (
                  <React.Fragment key={location.id}>
                    {matched ? (
                      <path
                        d={location.path}
                        fill={alpha(matched.accentColor ?? props.highlightColor, glowOpacity)}
                        stroke="none"
                      />
                    ) : null}
                    <path
                      d={location.path}
                      fill={countryColor}
                      stroke={strokeColor}
                      strokeWidth={matched ? 1.5 : 0.9}
                      strokeLinejoin="round"
                    />
                  </React.Fragment>
                );
              })}

              {highlightedMarkers.map((marker) => {
                const range = staggerDelay(
                  marker.index,
                  Math.max(props.highlightedCountries.length, 1),
                  Math.round(totalFrames * 0.36),
                );
                const markerProgress = interpolate(
                  frame,
                  [introEnd + range.startFrame, introEnd + range.endFrame],
                  [0, 1],
                  CLAMP,
                );
                const pulseRadius = 10 + markerProgress * 16;
                const labelWidth = Math.max(
                  110,
                  Math.min(240, marker.country.length * 10 + 52),
                );
                const labelHeight = 40;
                const mapPadding = 14;
                const preferRight =
                  marker.anchor.x < WORLD_MAP_VIEWBOX.width * 0.58;
                const rightCandidateX = marker.anchor.x + 16;
                const leftCandidateX = marker.anchor.x - labelWidth - 16;
                const minLabelX = visibleMapBounds.minX + mapPadding;
                const maxLabelX =
                  visibleMapBounds.maxX - labelWidth - mapPadding;
                const rightFits =
                  rightCandidateX >= minLabelX &&
                  rightCandidateX <= maxLabelX;
                const leftFits =
                  leftCandidateX >= minLabelX &&
                  leftCandidateX <= maxLabelX;
                const resolvedLabelX = preferRight
                  ? rightFits
                    ? rightCandidateX
                    : leftFits
                      ? leftCandidateX
                      : clamp(rightCandidateX, minLabelX, maxLabelX)
                  : leftFits
                    ? leftCandidateX
                    : rightFits
                      ? rightCandidateX
                      : clamp(leftCandidateX, minLabelX, maxLabelX);
                const labelY = clamp(
                  marker.anchor.y - labelHeight / 2,
                  visibleMapBounds.minY + mapPadding,
                  visibleMapBounds.maxY - labelHeight - mapPadding,
                );
                const labelFontSize =
                  marker.country.length > 18 ? 13 : 14;

                return (
                  <React.Fragment key={`marker-${marker.location.id}`}>
                    <circle
                      cx={marker.anchor.x}
                      cy={marker.anchor.y}
                      r={pulseRadius}
                      fill={alpha(marker.accentColor, 0.14 * markerProgress)}
                    />
                    <circle
                      cx={marker.anchor.x}
                      cy={marker.anchor.y}
                      r={5 + markerProgress * 3}
                      fill={marker.accentColor}
                      stroke={alpha("#F8FAFC", 0.9)}
                      strokeWidth={2}
                    />
                    <circle
                      cx={marker.anchor.x}
                      cy={marker.anchor.y}
                      r={12 + markerProgress * 2}
                      fill="none"
                      stroke={alpha(marker.accentColor, 0.5)}
                      strokeWidth={1.8}
                    />
                    <g
                      opacity={markerProgress}
                      transform={`translate(${resolvedLabelX}, ${labelY})`}
                    >
                      <rect
                        x={0}
                        y={0}
                        width={labelWidth}
                        height={40}
                        rx={18}
                        fill={alpha("#08111A", 0.9)}
                        stroke={alpha(marker.accentColor, 0.4)}
                        strokeWidth={1.4}
                      />
                      <circle
                        cx={18}
                        cy={20}
                        r={5}
                        fill={marker.accentColor}
                      />
                      <text
                        x={32}
                        y={25}
                        fill={props.labelColor}
                        style={{
                          fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                          fontSize: labelFontSize,
                          fontWeight: 700,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {marker.country}
                      </text>
                    </g>
                  </React.Fragment>
                );
              })}
            </g>
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
          Highlighted Countries
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
          Country-level focus rendered from deterministic SVG paths with crisp global highlights.
        </div>

        <div style={{ marginTop: Math.round(22 * scale), display: "grid", gap: Math.round(14 * scale) }}>
          {props.highlightedCountries.map((item, index) => {
            const range = staggerDelay(
              index,
              Math.max(props.highlightedCountries.length, 1),
              Math.round(totalFrames * 0.34),
            );
            const cardEntrance = applyEntrance(
              frame,
              "slide-up",
              introEnd + range.startFrame,
              introEnd + range.endFrame,
            );
            const accent =
              item.accentColor ??
              PREMIUM_COUNTRY_PALETTE[index % PREMIUM_COUNTRY_PALETTE.length];

            return (
              <div
                key={`${item.country}-${index}`}
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
                      fontSize: Math.round(22 * scale),
                      fontWeight: 700,
                      color: props.labelColor,
                      lineHeight: 1.1,
                    }}
                  >
                    {item.country}
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
