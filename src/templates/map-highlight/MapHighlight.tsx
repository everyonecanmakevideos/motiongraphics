import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, scalePop, staggerDelay } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { MapHighlightProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// Simplified world map as dot-matrix coordinates [col, row] on a 60x30 grid
// Each pair represents a dot that should be rendered to form continent shapes
const WORLD_DOTS: [number, number][] = [
  // North America
  [10,5],[11,5],[12,5],[13,5],[14,5],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],
  [8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[7,8],[8,8],[9,8],[10,8],[11,8],
  [12,8],[13,8],[14,8],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[9,10],[10,10],[11,10],
  [12,10],[10,11],[11,11],[12,11],[10,12],[11,12],
  // South America
  [14,15],[15,15],[16,15],[14,16],[15,16],[16,16],[17,16],[14,17],[15,17],[16,17],[17,17],
  [14,18],[15,18],[16,18],[17,18],[14,19],[15,19],[16,19],[14,20],[15,20],[16,20],
  [14,21],[15,21],[14,22],[15,22],[14,23],[15,23],[15,24],
  // Europe
  [28,5],[29,5],[30,5],[31,5],[27,6],[28,6],[29,6],[30,6],[31,6],[32,6],
  [27,7],[28,7],[29,7],[30,7],[31,7],[32,7],[28,8],[29,8],[30,8],[31,8],
  [29,9],[30,9],[31,9],
  // Africa
  [28,11],[29,11],[30,11],[31,11],[32,11],[27,12],[28,12],[29,12],[30,12],[31,12],[32,12],
  [33,12],[28,13],[29,13],[30,13],[31,13],[32,13],[33,13],[28,14],[29,14],[30,14],[31,14],
  [32,14],[29,15],[30,15],[31,15],[32,15],[29,16],[30,16],[31,16],[30,17],[31,17],
  [30,18],[31,18],[31,19],
  // Asia
  [33,5],[34,5],[35,5],[36,5],[37,5],[38,5],[39,5],[40,5],[41,5],[42,5],
  [33,6],[34,6],[35,6],[36,6],[37,6],[38,6],[39,6],[40,6],[41,6],[42,6],[43,6],
  [34,7],[35,7],[36,7],[37,7],[38,7],[39,7],[40,7],[41,7],[42,7],[43,7],[44,7],
  [35,8],[36,8],[37,8],[38,8],[39,8],[40,8],[41,8],[42,8],[43,8],[44,8],[45,8],
  [36,9],[37,9],[38,9],[39,9],[40,9],[41,9],[42,9],[43,9],[44,9],
  [37,10],[38,10],[39,10],[40,10],[41,10],[42,10],[43,10],
  [38,11],[39,11],[40,11],[41,11],[42,11],
  [39,12],[40,12],[41,12],[42,12],
  // Australia
  [44,18],[45,18],[46,18],[47,18],[44,19],[45,19],[46,19],[47,19],[48,19],
  [44,20],[45,20],[46,20],[47,20],[48,20],[45,21],[46,21],[47,21],[46,22],
];

const GRID_COLS = 60;
const GRID_ROWS = 30;

export const MapHighlight: React.FC<MapHighlightProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);

  // Dynamic map dimensions based on composition size
  const MAP_WIDTH = Math.round(width * 0.9);
  const MAP_HEIGHT = Math.round(MAP_WIDTH * 0.5);

  const mapFadeEnd = Math.round(totalFrames * 0.15);
  const markersStart = Math.round(totalFrames * 0.12);
  const markersDuration = Math.round(totalFrames * 0.5);
  const titleEnd = Math.round(totalFrames * 0.12);
  const exitStart = Math.round(totalFrames * 0.85);

  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);
  const mapOpacity = fadeIn(frame, { startFrame: 0, endFrame: mapFadeEnd }).opacity;

  // Title animation
  let titleOpacity = 1;
  let titleY = 0;
  if (props.title && props.entranceAnimation !== "none") {
    titleOpacity = interpolate(frame, [0, titleEnd], [0, 1], CLAMP);
    titleY = interpolate(frame, [0, titleEnd], [15, 0], CLAMP);
  }

  // Pulse animation for markers
  const pulseFrame = frame % 30;
  const pulseScale = props.markerPulse
    ? 1 + interpolate(pulseFrame, [0, 15, 30], [0, 0.8, 0], CLAMP)
    : 1;
  const pulseOpacity = props.markerPulse
    ? interpolate(pulseFrame, [0, 15, 30], [0.5, 0, 0], CLAMP)
    : 0;

  const dotSize = MAP_WIDTH / GRID_COLS;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: exitOpacity,
        }}
      >
        {/* Title */}
        {props.title && (
          <div
            style={{
              fontSize: Math.round(40 * scale) + "px",
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.titleColor,
              marginBottom: "40px",
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            {props.title}
          </div>
        )}

        {/* Map container */}
        <div
          style={{
            position: "relative",
            width: `${MAP_WIDTH}px`,
            height: `${MAP_HEIGHT}px`,
          }}
        >
          {/* Map dots */}
          {props.mapStyle === "world-dots" && (
            <svg
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              style={{ position: "absolute", opacity: mapOpacity }}
            >
              {WORLD_DOTS.map(([col, row], i) => (
                <circle
                  key={i}
                  cx={col * dotSize + dotSize / 2}
                  cy={row * (MAP_HEIGHT / GRID_ROWS) + (MAP_HEIGHT / GRID_ROWS) / 2}
                  r={3}
                  fill={props.mapColor}
                />
              ))}
            </svg>
          )}

          {props.mapStyle === "abstract-grid" && (
            <svg
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              style={{ position: "absolute", opacity: mapOpacity }}
            >
              {Array.from({ length: 20 }, (_, col) =>
                Array.from({ length: 10 }, (_, row) => (
                  <circle
                    key={`${col}-${row}`}
                    cx={col * (MAP_WIDTH / 20) + MAP_WIDTH / 40}
                    cy={row * (MAP_HEIGHT / 10) + MAP_HEIGHT / 20}
                    r={2}
                    fill={props.mapColor}
                  />
                ))
              )}
            </svg>
          )}

          {props.mapStyle === "minimal-outline" && (
            <svg
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              style={{ position: "absolute", opacity: mapOpacity }}
              viewBox={"0 0 " + MAP_WIDTH + " " + MAP_HEIGHT}
            >
              {/* Simplified continent outlines */}
              <ellipse cx={MAP_WIDTH * 0.2} cy={MAP_HEIGHT * 0.4} rx={MAP_WIDTH * 0.114} ry={MAP_HEIGHT * 0.257} fill="none" stroke={props.mapColor} strokeWidth="1.5" />
              <ellipse cx={MAP_WIDTH * 0.264} cy={MAP_HEIGHT * 0.757} rx={MAP_WIDTH * 0.043} ry={MAP_HEIGHT * 0.186} fill="none" stroke={props.mapColor} strokeWidth="1.5" />
              <ellipse cx={MAP_WIDTH * 0.5} cy={MAP_HEIGHT * 0.314} rx={MAP_WIDTH * 0.071} ry={MAP_HEIGHT * 0.143} fill="none" stroke={props.mapColor} strokeWidth="1.5" />
              <ellipse cx={MAP_WIDTH * 0.521} cy={MAP_HEIGHT * 0.6} rx={MAP_WIDTH * 0.064} ry={MAP_HEIGHT * 0.214} fill="none" stroke={props.mapColor} strokeWidth="1.5" />
              <ellipse cx={MAP_WIDTH * 0.714} cy={MAP_HEIGHT * 0.357} rx={MAP_WIDTH * 0.157} ry={MAP_HEIGHT * 0.229} fill="none" stroke={props.mapColor} strokeWidth="1.5" />
              <ellipse cx={MAP_WIDTH * 0.8} cy={MAP_HEIGHT * 0.757} rx={MAP_WIDTH * 0.071} ry={MAP_HEIGHT * 0.114} fill="none" stroke={props.mapColor} strokeWidth="1.5" />
            </svg>
          )}

          {/* Connection lines */}
          {props.connectionLines && props.locations.length > 1 && (
            <svg
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              style={{ position: "absolute", opacity: mapOpacity * 0.4 }}
            >
              {props.locations.slice(0, -1).map((loc, i) => {
                const next = props.locations[i + 1];
                return (
                  <line
                    key={i}
                    x1={`${loc.x}%`}
                    y1={`${loc.y}%`}
                    x2={`${next.x}%`}
                    y2={`${next.y}%`}
                    stroke={props.markerColor}
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                );
              })}
            </svg>
          )}

          {/* Location markers */}
          {props.locations.map((loc, i) => {
            const stagger = staggerDelay(i, props.locations.length, markersDuration);
            const range = {
              startFrame: markersStart + stagger.startFrame,
              endFrame: markersStart + stagger.endFrame,
            };

            let markerOpacity = 1;
            let markerScale = 1;

            if (props.entranceAnimation === "progressive") {
              markerOpacity = fadeIn(frame, range).opacity;
              markerScale = interpolate(frame, [range.startFrame, range.endFrame], [0, 1], CLAMP);
            } else if (props.entranceAnimation === "fade-in") {
              markerOpacity = fadeIn(frame, range).opacity;
            } else if (props.entranceAnimation === "scale-pop") {
              const p = scalePop(frame, range, 1.3);
              markerOpacity = p.opacity;
              markerScale = p.scale;
            }

            return (
              <div
                key={i}
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
                {/* Pulse ring */}
                {props.markerPulse && markerOpacity > 0.5 && (
                  <div
                    style={{
                      position: "absolute",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      border: `2px solid ${props.markerColor}`,
                      transform: `scale(${pulseScale})`,
                      opacity: pulseOpacity,
                    }}
                  />
                )}

                {/* Marker dot */}
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: props.markerColor,
                    boxShadow: `0 0 10px ${props.markerColor}80`,
                  }}
                />

                {/* Label */}
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    color: props.labelColor,
                    whiteSpace: "nowrap",
                    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                  }}
                >
                  {loc.label}
                </div>

                {/* Description */}
                {loc.description && (
                  <div
                    style={{
                      fontSize: "13px",
                      fontFamily: "Arial, Helvetica, sans-serif",
                      color: props.labelColor,
                      opacity: 0.7,
                      whiteSpace: "nowrap",
                      textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    {loc.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
