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
  "#A56A43",
  "#C08F52",
  "#7C8D74",
  "#8A5A44",
  "#6E8194",
  "#B39A76",
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
  const atlasAccent = props.highlightColor;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />

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
              color: alpha(props.subtitleColor, 0.9),
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
            <linearGradient id="world-shell" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha("#D8C7AF", 0.13)} />
              <stop offset="100%" stopColor={alpha("#546577", 0.18)} />
            </linearGradient>
            <linearGradient id="world-surface" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={alpha("#121C25", 0.98)} />
              <stop offset="100%" stopColor={alpha("#0D151D", 0.98)} />
            </linearGradient>
            <linearGradient id="world-inner-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={alpha("#D8C7AF", 0.1)} />
              <stop offset="100%" stopColor={alpha("#65788B", 0.18)} />
            </linearGradient>
          </defs>

          <rect
            x={0}
            y={0}
            width={1010}
            height={666}
            rx={30}
            fill={alpha("#091119", 0.6)}
            stroke="url(#world-shell)"
            strokeWidth={1.4}
          />
          <rect
            x={24}
            y={24}
            width={962}
            height={618}
            rx={24}
            fill="url(#world-surface)"
            stroke="url(#world-inner-line)"
            strokeWidth={1}
          />
          <line
            x1={46}
            y1={76}
            x2={964}
            y2={76}
            stroke={alpha("#D8C7AF", 0.08)}
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
                      fillProgress * 0.45,
                    )
                  : props.outlineColor;
                const washOpacity = matched
                  ? interpolate(
                      frame,
                      [
                        introEnd + range!.startFrame,
                        introEnd + range!.endFrame,
                        totalFrames,
                      ],
                      [0, 0.08, 0.04],
                      CLAMP,
                    )
                  : 0;

                return (
                  <React.Fragment key={location.id}>
                    {matched ? (
                      <path
                        d={location.path}
                        fill={alpha(matched.accentColor ?? props.highlightColor, washOpacity)}
                        stroke="none"
                      />
                    ) : null}
                    <path
                      d={location.path}
                      fill={countryColor}
                      stroke={strokeColor}
                      strokeWidth={matched ? 1.15 : 0.72}
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
                const pulseRadius = 8 + markerProgress * 8;
                const labelWidth = Math.max(
                  116,
                  Math.min(252, marker.country.length * 9 + 56),
                );
                const labelHeight = 34;
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
                  marker.country.length > 18 ? 12 : 13;

                return (
                  <React.Fragment key={`marker-${marker.location.id}`}>
                    <circle
                      cx={marker.anchor.x}
                      cy={marker.anchor.y}
                      r={pulseRadius}
                      fill={alpha(marker.accentColor, 0.08 * markerProgress)}
                    />
                    <circle
                      cx={marker.anchor.x}
                      cy={marker.anchor.y}
                      r={4 + markerProgress * 2}
                      fill={marker.accentColor}
                      stroke={alpha("#F5EBDD", 0.9)}
                      strokeWidth={1.4}
                    />
                    <circle
                      cx={marker.anchor.x}
                      cy={marker.anchor.y}
                      r={9 + markerProgress * 1.5}
                      fill="none"
                      stroke={alpha(marker.accentColor, 0.28)}
                      strokeWidth={1}
                    />
                    <g
                      opacity={markerProgress}
                      transform={`translate(${resolvedLabelX}, ${labelY})`}
                    >
                      <rect
                        x={0}
                        y={0}
                        width={labelWidth}
                        height={34}
                        rx={9}
                        fill={alpha("#121B24", 0.94)}
                        stroke={alpha("#D9C9B2", 0.14)}
                        strokeWidth={1}
                      />
                      <rect x={10} y={9} width={4} height={16} rx={2} fill={marker.accentColor} />
                      <text
                        x={24}
                        y={22}
                        fill={alpha(props.labelColor, 0.96)}
                        style={{
                          fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
                          fontSize: labelFontSize,
                          fontWeight: 700,
                          letterSpacing: "0.01em",
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
          Highlighted Countries
        </div>

        <div
          style={{
            marginTop: Math.round(14 * scale),
            fontFamily: typography.fontFamily ?? "'Inter', sans-serif",
            fontSize: Math.round(17 * scale),
            lineHeight: 1.35,
            color: alpha(props.labelColor, 0.62),
            maxWidth: Math.round(300 * scale),
          }}
        >
          Deterministic country rendering with restrained fills, direct labeling, and an editorial map hierarchy.
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
