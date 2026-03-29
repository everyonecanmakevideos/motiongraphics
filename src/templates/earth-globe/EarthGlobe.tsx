import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countriesTopologyData from "../../../public/geo/countries-110m.json";
import {
  CITY_COORDINATES,
  normalizeLocationKey,
} from "../../../lib/geo/cityCatalog";
import { Background } from "../../primitives/Background";
import { fadeIn, scalePop, secToFrame, staggerDelay } from "../../primitives/animations";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import type { EarthGlobeProps } from "./schema";

type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties?: Record<string, unknown>;
  }>;
};

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const countriesTopology = countriesTopologyData as {
  objects: { countries: unknown };
};

const worldFeatureCollection = feature(
  countriesTopology as never,
  countriesTopology.objects.countries as never,
) as unknown as GeoFeatureCollection;

const isFrontHemisphere = (
  longitude: number,
  latitude: number,
  centerLongitude: number,
  centerLatitude: number,
) => {
  const toRad = Math.PI / 180;
  const lambda = longitude * toRad;
  const phi = latitude * toRad;
  const lambda0 = centerLongitude * toRad;
  const phi0 = centerLatitude * toRad;

  return (
    Math.sin(phi0) * Math.sin(phi) +
      Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0) >
    0
  );
};

export const EarthGlobe: React.FC<EarthGlobeProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale } = useResponsiveConfig();

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
  const panelWidth = Math.round(width * 0.9);
  const panelHeight = Math.round(height * 0.74);
  const globeSize = Math.round(Math.min(panelWidth * 0.48, panelHeight * 0.72));
  const globeX = Math.round(panelWidth * 0.5 - globeSize / 2);
  const globeY = Math.round(panelHeight * 0.18);

  const titleEnd = Math.round(totalFrames * 0.14 * motion.durationMultiplier);
  const markersStart = Math.round(totalFrames * 0.18);
  const markersDuration = Math.round(totalFrames * 0.48);
  const arcStart = Math.round(totalFrames * 0.16);
  const arcDuration = Math.round(totalFrames * 0.42);
  const globeOpacity = fadeIn(frame, { startFrame: 0, endFrame: titleEnd }).opacity;

  const locationCoordinates = props.locations.map((location) => {
    const key = normalizeLocationKey(location.label);
    const coordinates = CITY_COORDINATES[key];
    return {
      ...location,
      longitude: coordinates?.[0],
      latitude: coordinates?.[1],
    };
  });

  const resolvedCoordinates = locationCoordinates.filter(
    (
      location,
    ): location is typeof location & { longitude: number; latitude: number } =>
      typeof location.longitude === "number" && typeof location.latitude === "number",
  );

  const averageLongitude =
    resolvedCoordinates.length > 0
      ? resolvedCoordinates.reduce((sum, location) => sum + location.longitude, 0) /
        resolvedCoordinates.length
      : 20;
  const averageLatitude =
    resolvedCoordinates.length > 0
      ? resolvedCoordinates.reduce((sum, location) => sum + location.latitude, 0) /
        resolvedCoordinates.length
      : 16;

  const drift = interpolate(frame, [0, totalFrames], [-8, 8], CLAMP);
  const centerLongitude = averageLongitude + drift;
  const centerLatitude = averageLatitude * 0.45 + 8;

  const projection = geoOrthographic()
    .translate([globeSize / 2, globeSize / 2])
    .scale(globeSize * 0.34)
    .clipAngle(90)
    .rotate([-centerLongitude, -centerLatitude, 0]);

  const path = geoPath(projection);
  const spherePath = path({ type: "Sphere" }) ?? "";
  const graticulePath = path(geoGraticule10() as never) ?? "";

  const markerData = locationCoordinates.map((location, index) => {
    if (
      typeof location.longitude !== "number" ||
      typeof location.latitude !== "number"
    ) {
      return {
        ...location,
        index,
        visible: false,
        x: globeSize * (location.x / 100),
        y: globeSize * (location.y / 100),
      };
    }

    const projected = projection([location.longitude, location.latitude]);
    const visible = isFrontHemisphere(
      location.longitude,
      location.latitude,
      centerLongitude,
      centerLatitude,
    );

    return {
      ...location,
      index,
      visible,
      x: projected?.[0] ?? globeSize * 0.5,
      y: projected?.[1] ?? globeSize * 0.5,
    };
  });

  const connectionPairs =
    markerData.length > 1
      ? markerData
          .slice(1)
          .map((location) => [markerData[0], location] as const)
          .filter(([start, end]) => start.visible && end.visible)
      : [];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 40%, rgba(124,199,255,0.08), transparent 28%), radial-gradient(circle at 50% 82%, rgba(255,255,255,0.05), transparent 26%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: `${panelWidth}px`,
          height: `${panelHeight}px`,
          transform: "translate(-50%, -50%)",
          borderRadius: `${Math.round(30 * scale)}px`,
          background:
            "linear-gradient(180deg, rgba(8,12,20,0.84), rgba(5,9,16,0.74))",
          border: "1px solid rgba(148,163,184,0.18)",
          boxShadow: fx.boxShadow || "0 24px 80px rgba(0,0,0,0.28)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 30%, rgba(124,199,255,0.08), transparent 30%), linear-gradient(90deg, transparent, rgba(124,199,255,0.04), transparent)",
            transform: `translateX(${interpolate(frame, [0, totalFrames], [-panelWidth * 0.3, panelWidth * 0.3], CLAMP)}px)`,
            opacity: 0.72,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: `${Math.round(28 * scale)}px`,
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: `${Math.round(6 * scale)}px`,
            opacity: globeOpacity,
            zIndex: 4,
          }}
        >
          <div
            style={{
              fontSize: `${Math.round(11 * scale)}px`,
              color: props.markerColor,
              opacity: 0.86,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
            }}
          >
            Orbital View
          </div>
          <div
            style={{
              fontSize: `${Math.round(40 * scale)}px`,
              color: props.titleColor,
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {props.title ?? "Global Reach"}
          </div>
          <div
            style={{
              fontSize: `${Math.round(13 * scale)}px`,
              color: props.labelColor,
              opacity: 0.8,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
            }}
          >
            {props.locations.length} tracked locations
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: `${Math.round(22 * scale)}px`,
            left: `${Math.round(26 * scale)}px`,
            color: props.labelColor,
            opacity: 0.68,
            fontSize: `${Math.round(11 * scale)}px`,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
            zIndex: 4,
          }}
        >
          Earth globe
        </div>

        <div
          style={{
            position: "absolute",
            top: `${Math.round(22 * scale)}px`,
            right: `${Math.round(26 * scale)}px`,
            color: props.labelColor,
            opacity: 0.68,
            fontSize: `${Math.round(11 * scale)}px`,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
            zIndex: 4,
          }}
        >
          rotating planet
        </div>

        <div
          style={{
            position: "absolute",
            left: `${globeX}px`,
            top: `${globeY}px`,
            width: `${globeSize}px`,
            height: `${globeSize}px`,
            opacity: globeOpacity,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 38% 32%, rgba(124,199,255,0.28), rgba(20,32,54,0.96) 55%, rgba(5,8,16,1) 100%)",
              boxShadow:
                "0 0 0 1px rgba(148,163,184,0.12), 0 0 50px rgba(124,199,255,0.14), inset -40px -30px 70px rgba(0,0,0,0.36)",
            }}
          />
          <svg
            width={globeSize}
            height={globeSize}
            style={{ position: "absolute", inset: 0 }}
          >
            <path d={spherePath} fill="rgba(10,18,30,0.06)" stroke="rgba(160,196,221,0.2)" strokeWidth="1.2" />
            <path
              d={graticulePath}
              fill="none"
              stroke="rgba(124,199,255,0.12)"
              strokeWidth="0.8"
            />
            {worldFeatureCollection.features.map((featureItem, index) => (
              <path
                key={`country-${index}`}
                d={path(featureItem as never) ?? ""}
                fill="rgba(110,146,176,0.12)"
                stroke="rgba(191,219,254,0.28)"
                strokeWidth="0.75"
              />
            ))}
            {connectionPairs.map(([start, end], index) => {
              const arcProgress = interpolate(
                frame,
                [
                  arcStart + staggerDelay(index, Math.max(1, connectionPairs.length), arcDuration).startFrame,
                  arcStart + staggerDelay(index, Math.max(1, connectionPairs.length), arcDuration).endFrame,
                ],
                [0, 1],
                CLAMP,
              );
              const controlX = (start.x + end.x) / 2;
              const controlY = Math.min(start.y, end.y) - globeSize * 0.12;
              const progressX =
                start.x + (end.x - start.x) * arcProgress;
              const progressY =
                start.y + (end.y - start.y) * arcProgress;

              return (
                <g key={`arc-${index}`}>
                  <path
                    d={`M ${start.x.toFixed(2)} ${start.y.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`}
                    fill="none"
                    stroke="rgba(124,199,255,0.18)"
                    strokeWidth="2.2"
                  />
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={progressX}
                    y2={progressY}
                    stroke={props.markerColor}
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    opacity="0.94"
                  />
                </g>
              );
            })}
            {markerData.map((location) => {
              const stagger = staggerDelay(
                location.index,
                Math.max(1, markerData.length),
                markersDuration,
              );
              const pop = scalePop(frame, {
                startFrame: markersStart + stagger.startFrame,
                endFrame: markersStart + stagger.endFrame,
              }, 1.25);
              const markerOpacity =
                props.entranceAnimation === "none"
                  ? 1
                  : props.entranceAnimation === "fade-in"
                    ? fadeIn(frame, {
                        startFrame: markersStart + stagger.startFrame,
                        endFrame: markersStart + stagger.endFrame,
                      }).opacity
                    : pop.opacity;
              const markerScale =
                props.entranceAnimation === "scale-pop" ||
                props.entranceAnimation === "progressive"
                  ? pop.scale
                  : 1;

              return (
                <g
                  key={`marker-${location.label}`}
                  opacity={location.visible ? markerOpacity : markerOpacity * 0.16}
                  transform={`translate(${location.x}, ${location.y}) scale(${markerScale})`}
                >
                  <circle
                    r={Math.max(10, Math.round(10 * scale))}
                    fill={`${props.markerColor}22`}
                  />
                  <circle
                    r={Math.max(4, Math.round(4.5 * scale))}
                    fill={props.markerColor}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div
          style={{
            position: "absolute",
            left: `${Math.round(panelWidth * 0.11)}px`,
            bottom: `${Math.round(32 * scale)}px`,
            display: "flex",
            gap: `${Math.round(12 * scale)}px`,
            flexWrap: "wrap",
            maxWidth: `${Math.round(panelWidth * 0.78)}px`,
            zIndex: 4,
          }}
        >
          {markerData.slice(0, 6).map((location, index) => (
            <div
              key={`pill-${location.label}`}
              style={{
                padding: `${Math.round(7 * scale)}px ${Math.round(11 * scale)}px`,
                borderRadius: `${Math.round(999 * scale)}px`,
                background: "linear-gradient(180deg, rgba(18,26,39,0.94), rgba(11,17,28,0.9))",
                border: "1px solid rgba(148,163,184,0.18)",
                color: props.labelColor,
                fontSize: `${Math.round(12 * scale)}px`,
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                boxShadow:
                  index === 0
                    ? "0 0 0 1px rgba(124,199,255,0.2), 0 10px 24px rgba(0,0,0,0.16)"
                    : "0 8px 18px rgba(0,0,0,0.14)",
              }}
            >
              {location.label}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
