import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countriesTopologyData from "../../../public/geo/countries-110m.json";
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

type MapTemplateVariant = "highlight" | "route-animation" | "network";

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

const countriesTopology = countriesTopologyData as {
  objects: { countries: unknown };
};

const worldFeatureCollection = feature(
  countriesTopology as never,
  countriesTopology.objects.countries as never,
) as unknown as {
  type: "FeatureCollection";
  features: Array<{ type: "Feature"; geometry: unknown }>;
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

export const MapHighlight: React.FC<MapRenderProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, scale } = useResponsiveConfig();
  const templateVariant = props.templateVariant ?? "highlight";
  const isRouteVariant = templateVariant === "route-animation";
  const isNetworkVariant = templateVariant === "network";

  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const motion = resolveMotionStyle(resolved.motionStyle);
  const fx = resolveEffects(resolved.effects);

  const totalFrames = secToFrame(props.duration);
  const MAP_WIDTH = Math.round(width * (isNetworkVariant ? 0.94 : 0.9));
  const MAP_HEIGHT = Math.round(MAP_WIDTH * (isNetworkVariant ? 0.54 : 0.5));
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

  const projection = geoNaturalEarth1()
    .fitExtent(
      [
        [MAP_WIDTH * (isNetworkVariant ? 0.025 : 0.03), MAP_HEIGHT * 0.1],
        [
          MAP_WIDTH * (isNetworkVariant ? 0.975 : 0.97),
          MAP_HEIGHT * (isNetworkVariant ? 0.92 : 0.9),
        ],
      ],
      worldFeatureCollection as never,
    )
    .precision(0.1);

  const worldPath = geoPath(projection);
  const graticule = geoGraticule10();
  const graticulePath = worldPath(graticule as never) ?? "";
  const countryPaths = worldFeatureCollection.features
    .map((featureItem, index) => ({
      key: `country-${index}`,
      d: worldPath(featureItem as never) ?? "",
    }))
    .filter((item) => item.d.length > 0);

  const routeSegments: RouteSegment[] = props.locations
    .slice(0, -1)
    .map((loc, i) => {
      const next = props.locations[i + 1];
      const x1 = (loc.x / 100) * MAP_WIDTH;
      const y1 = (loc.y / 100) * MAP_HEIGHT;
      const x2 = (next.x / 100) * MAP_WIDTH;
      const y2 = (next.y / 100) * MAP_HEIGHT;
      const directLength = Math.hypot(x2 - x1, y2 - y1);
      const arcLift = Math.max(26, Math.min(84, directLength * 0.22));
      const stagger = staggerDelay(
        i,
        Math.max(1, props.locations.length - 1),
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
    ? props.locations.flatMap((loc, index) => {
        if (index === 0) {
          return props.locations.slice(1).map((next, nextOffset) => {
            const stagger = staggerDelay(
              nextOffset,
              Math.max(1, props.locations.length - 1),
              routesDuration,
            );

            return {
              x1: (loc.x / 100) * MAP_WIDTH,
              y1: (loc.y / 100) * MAP_HEIGHT,
              x2: (next.x / 100) * MAP_WIDTH,
              y2: (next.y / 100) * MAP_HEIGHT,
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

        if (index < props.locations.length - 1) {
          const next = props.locations[index + 1];
          const stagger = staggerDelay(
            props.locations.length - 1 + index,
            Math.max(1, props.locations.length * 2 - 3),
            routesDuration,
          );

          return [
            {
              x1: (loc.x / 100) * MAP_WIDTH,
              y1: (loc.y / 100) * MAP_HEIGHT,
              x2: (next.x / 100) * MAP_WIDTH,
              y2: (next.y / 100) * MAP_HEIGHT,
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
    isRouteVariant && props.locations.length > 1
      ? `${props.locations[0]?.label ?? "Start"} to ${props.locations[props.locations.length - 1]?.label ?? "End"}`
      : null;
  const networkAccent = "#8cb9c4";
  const networkAccentSoft = "rgba(140,185,196,0.18)";
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
  const networkFocus = isNetworkVariant
    ? (() => {
        const points = props.locations.map((loc) => ({
          x: (loc.x / 100) * MAP_WIDTH,
          y: (loc.y / 100) * MAP_HEIGHT,
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
        {props.title && !isNetworkVariant ? (
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
              : isRouteVariant
                ? "linear-gradient(180deg, rgba(234,229,221,0.98), rgba(223,217,208,0.98))"
                : "transparent",
            border: isNetworkVariant
              ? `1px solid ${networkPanelBorder}`
              : isRouteVariant
                ? `1px solid ${routePanelBorder}`
                : "none",
            borderRadius: isNetworkVariant
              ? `${Math.round(28 * scale)}px`
              : isRouteVariant
                ? `${Math.round(24 * scale)}px`
                : "0px",
            overflow: "hidden",
            boxShadow: isNetworkVariant
              ? "0 24px 70px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(255,255,255,0.03)"
              : isRouteVariant
                ? "0 20px 50px rgba(28,33,36,0.12), inset 0 0 0 1px rgba(255,255,255,0.34)"
                : undefined,
          }}
        >
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

          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: isNetworkVariant
                ? `translate(${networkFocus.translateX}px, ${networkFocus.translateY}px) scale(${networkFocus.scale})`
                : undefined,
              transformOrigin: "top left",
            }}
          >
            <svg
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              style={{ position: "absolute", opacity: mapOpacity }}
            >
              {graticulePath && props.mapStyle !== "world-dots" ? (
                <path
                  d={graticulePath}
                  fill="none"
                  stroke={
                    isNetworkVariant
                      ? networkGridColor
                      : isRouteVariant
                        ? routeGridColor
                        : props.mapColor
                  }
                  strokeWidth="0.7"
                  opacity={
                    isNetworkVariant ? 0.72 : isRouteVariant ? 0.38 : 0.14
                  }
                />
              ) : null}
              {countryPaths.map((country) => (
                <path
                  key={country.key}
                  d={country.d}
                  fill={
                    props.mapStyle === "minimal-outline"
                      ? "none"
                      : isNetworkVariant
                        ? networkMapFill
                        : isRouteVariant
                          ? routeMapFill
                          : props.mapStyle === "world-dots"
                            ? "rgba(255,255,255,0.04)"
                            : `${props.mapColor}22`
                  }
                  stroke={
                    isNetworkVariant
                      ? networkMapStroke
                      : isRouteVariant
                        ? routeMapStroke
                        : props.mapColor
                  }
                  strokeWidth={
                    props.mapStyle === "minimal-outline" ? 1.2 : 0.75
                  }
                  opacity={
                    isNetworkVariant
                      ? 0.9
                      : isRouteVariant
                        ? 0.9
                        : props.mapStyle === "minimal-outline"
                          ? 0.78
                          : 0.66
                  }
                />
              ))}

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
                : routeSegments.map((segment, index) => {
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
                            strokeWidth="8"
                            opacity={0.24}
                            strokeLinecap="round"
                          />
                        ) : null}
                        <path
                          d={path}
                          fill="none"
                          stroke={
                            isRouteVariant ? routeAccent : props.markerColor
                          }
                          strokeWidth={isRouteVariant ? "3.2" : "1.8"}
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          opacity={isRouteVariant ? 0.96 : 0.5}
                        />
                      </g>
                    );
                  })}

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

            {props.locations.map((loc, index) => {
              const stagger = staggerDelay(
                index,
                props.locations.length,
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
              const labelOffsetX = isNetworkVariant
                ? loc.x < 55
                  ? Math.round(18 * scale)
                  : Math.round(-18 * scale)
                : 0;
              const labelOffsetY = isNetworkVariant
                ? loc.y < 42
                  ? Math.round(8 * scale)
                  : Math.round(-8 * scale)
                : 0;
              const labelAnchor = isNetworkVariant
                ? loc.x < 55
                  ? "flex-start"
                  : "flex-end"
                : "center";
              const routeNodeDescriptor =
                loc.description ??
                (index === 0
                  ? "Origin"
                  : index === props.locations.length - 1
                    ? "Destination"
                    : "Transit Stop");

              return (
                <div
                  key={loc.label}
                  style={{
                    position: "absolute",
                    left: `${loc.x}%`,
                    top: `${loc.y}%`,
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
                          : isNetworkVariant
                            ? "22px"
                            : "18px",
                        height: isHub
                          ? "30px"
                          : isNetworkVariant
                            ? "22px"
                            : "18px",
                        borderRadius: "50%",
                        border: `2px solid ${
                          isNetworkVariant
                            ? networkAccent
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
                        : isHub
                          ? "18px"
                          : isNetworkVariant
                            ? "14px"
                            : "12px",
                      height: isRouteVariant
                        ? "16px"
                        : isHub
                          ? "18px"
                          : isNetworkVariant
                            ? "14px"
                            : "12px",
                      borderRadius:
                        isRouteVariant || isNetworkVariant ? "5px" : "50%",
                      backgroundColor: isNetworkVariant
                        ? networkAccent
                        : isRouteVariant
                          ? routeAccent
                          : props.markerColor,
                      border: `2px solid ${props.labelColor}33`,
                      boxShadow: isNetworkVariant
                        ? `0 0 18px rgba(140,185,196,0.45)`
                        : isRouteVariant
                          ? "0 0 14px rgba(95,125,134,0.22)"
                          : `0 0 14px ${props.markerColor}66`,
                      zIndex: 2,
                    }}
                  />
                  <div
                    style={{
                      position: isNetworkVariant ? "absolute" : "relative",
                      left: isNetworkVariant ? `${labelOffsetX}px` : undefined,
                      top: isNetworkVariant ? `${labelOffsetY}px` : undefined,
                      marginTop: isNetworkVariant
                        ? "0px"
                        : `${Math.round(10 * scale)}px`,
                      padding: isNetworkVariant
                        ? `${Math.round(9 * scale)}px ${Math.round(13 * scale)}px`
                        : isRouteVariant
                          ? `${Math.round(8 * scale)}px ${Math.round(12 * scale)}px`
                          : `${Math.round(6 * scale)}px ${Math.round(9 * scale)}px`,
                      borderRadius: `${Math.round(10 * scale)}px`,
                      background: isNetworkVariant
                        ? "linear-gradient(180deg, rgba(17,23,28,0.96), rgba(13,18,22,0.9))"
                        : isRouteVariant
                          ? "linear-gradient(180deg, rgba(248,244,238,0.88), rgba(233,227,218,0.96))"
                          : "rgba(255,255,255,0.08)",
                      border: isNetworkVariant
                        ? `1px solid ${networkPanelBorder}`
                        : isRouteVariant
                          ? `1px solid ${routePanelBorder}`
                          : `1px solid ${props.labelColor}20`,
                      backdropFilter: "blur(8px)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: labelAnchor,
                      minWidth: isNetworkVariant
                        ? `${Math.round(132 * scale)}px`
                        : undefined,
                      transform: isNetworkVariant
                        ? loc.x < 55
                          ? "translate(0, -50%)"
                          : "translate(-100%, -50%)"
                        : undefined,
                      boxShadow: isNetworkVariant
                        ? "0 10px 30px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.03)"
                        : isRouteVariant
                          ? "0 8px 20px rgba(34,40,44,0.08)"
                          : undefined,
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
                          : isRouteVariant
                            ? routeTextPrimary
                            : props.labelColor,
                        whiteSpace: "nowrap",
                        textTransform: isNetworkVariant
                          ? "uppercase"
                          : undefined,
                      }}
                    >
                      {loc.label}
                    </div>
                    {isRouteVariant || nodeDescriptor ? (
                      <div
                        style={{
                          marginTop: `${Math.round(3 * scale)}px`,
                          fontSize: `${Math.round((isNetworkVariant ? 11 : 10) * scale)}px`,
                          fontFamily:
                            typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                          color: isNetworkVariant
                            ? networkAccent
                            : isRouteVariant
                              ? routeAccent
                              : props.markerColor,
                          opacity: 0.9,
                          whiteSpace: "nowrap",
                          textTransform:
                            isRouteVariant || isNetworkVariant
                              ? "uppercase"
                              : undefined,
                          letterSpacing:
                            isRouteVariant || isNetworkVariant
                              ? "0.14em"
                              : undefined,
                        }}
                      >
                        {isRouteVariant ? routeNodeDescriptor : nodeDescriptor}
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
