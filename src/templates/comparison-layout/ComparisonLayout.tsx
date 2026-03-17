import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, scalePop } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { ComparisonLayoutProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const ComparisonLayout: React.FC<ComparisonLayoutProps> = (props) => {
  const frame = useCurrentFrame();
  const { isPortrait, scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);

  // Phase timing
  const sidesEnd = Math.round(totalFrames * 0.3);
  const vsStart = Math.round(totalFrames * 0.15);
  const vsEnd = Math.round(totalFrames * 0.3);
  const itemsStart = Math.round(totalFrames * 0.2);
  const itemsEnd = Math.round(totalFrames * 0.55);
  const exitStart = Math.round(totalFrames * 0.85);

  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);

  // Left side entrance
  let leftOpacity = 1;
  let leftX = 0;
  let leftScale = 1;
  if (props.entranceAnimation === "slide-in") {
    leftOpacity = interpolate(frame, [0, sidesEnd], [0, 1], CLAMP);
    leftX = interpolate(frame, [0, sidesEnd], [-80, 0], CLAMP);
  } else if (props.entranceAnimation === "fade-in") {
    leftOpacity = fadeIn(frame, { startFrame: 0, endFrame: sidesEnd }).opacity;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, { startFrame: 0, endFrame: sidesEnd }, 1.1);
    leftOpacity = p.opacity;
    leftScale = p.scale;
  }

  // Right side entrance
  let rightOpacity = 1;
  let rightX = 0;
  let rightScale = 1;
  if (props.entranceAnimation === "slide-in") {
    rightOpacity = interpolate(frame, [0, sidesEnd], [0, 1], CLAMP);
    rightX = interpolate(frame, [0, sidesEnd], [80, 0], CLAMP);
  } else if (props.entranceAnimation === "fade-in") {
    rightOpacity = fadeIn(frame, { startFrame: 0, endFrame: sidesEnd }).opacity;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, { startFrame: 0, endFrame: sidesEnd }, 1.1);
    rightOpacity = p.opacity;
    rightScale = p.scale;
  }

  // VS badge
  const vsOpacity = interpolate(frame, [vsStart, vsEnd], [0, 1], CLAMP);
  const vsScale = interpolate(frame, [vsStart, vsEnd], [0.5, 1], CLAMP);

  const maxItems = Math.max(props.leftItems.length, props.rightItems.length);

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
          flexDirection: isPortrait ? "column" : "row",
          alignItems: isPortrait ? "center" : "flex-start",
          gap: Math.round((isPortrait ? 30 : 60) * scale) + "px",
          opacity: exitOpacity,
          width: "85%",
        }}
      >
        {/* Left side */}
        <div
          style={{
            flex: 1,
            opacity: leftOpacity,
            transform: "translateX(" + leftX + "px) scale(" + leftScale + ")",
          }}
        >
          <div
            style={{
              fontSize: Math.round(48 * scale) + "px",
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.leftColor,
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            {props.leftTitle}
          </div>
          {props.leftItems.map((item, i) => {
            const itemDelay = Math.round(itemsStart + ((itemsEnd - itemsStart) * i) / maxItems);
            const itemEnd = Math.min(itemDelay + Math.round(totalFrames * 0.12), totalFrames);
            const itemOpacity = interpolate(frame, [itemDelay, itemEnd], [0, 1], CLAMP);
            const itemY = interpolate(frame, [itemDelay, itemEnd], [15, 0], CLAMP);
            return (
              <div
                key={i}
                style={{
                  fontSize: "24px",
                  fontFamily: "Arial, sans-serif",
                  color: props.textColor,
                  padding: "10px 16px",
                  marginBottom: "8px",
                  backgroundColor: props.leftColor + "1A",
                  borderRadius: "8px",
                  borderLeft: "3px solid " + props.leftColor,
                  opacity: itemOpacity,
                  transform: "translateY(" + itemY + "px)",
                }}
              >
                {item}
              </div>
            );
          })}
        </div>

        {/* VS badge with divider */}
        <div
          style={{
            display: "flex",
            flexDirection: isPortrait ? "row" : "column",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            gap: "12px",
            opacity: vsOpacity,
            transform: "scale(" + vsScale + ")",
          }}
        >
          <div
            style={{
              width: isPortrait ? "40px" : "3px",
              height: isPortrait ? "3px" : "40px",
              backgroundColor: props.dividerColor,
              borderRadius: "2px",
            }}
          />
          <div
            style={{
              fontSize: Math.round(40 * scale) + "px",
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.vsColor,
              padding: "12px 20px",
              border: "3px solid " + props.vsColor,
              borderRadius: "50%",
              width: "80px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {props.vsText}
          </div>
          <div
            style={{
              width: isPortrait ? "40px" : "3px",
              height: isPortrait ? "3px" : "40px",
              backgroundColor: props.dividerColor,
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Right side */}
        <div
          style={{
            flex: 1,
            opacity: rightOpacity,
            transform: "translateX(" + rightX + "px) scale(" + rightScale + ")",
          }}
        >
          <div
            style={{
              fontSize: Math.round(48 * scale) + "px",
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.rightColor,
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            {props.rightTitle}
          </div>
          {props.rightItems.map((item, i) => {
            const itemDelay = Math.round(itemsStart + ((itemsEnd - itemsStart) * i) / maxItems);
            const itemEnd = Math.min(itemDelay + Math.round(totalFrames * 0.12), totalFrames);
            const itemOpacity = interpolate(frame, [itemDelay, itemEnd], [0, 1], CLAMP);
            const itemY = interpolate(frame, [itemDelay, itemEnd], [15, 0], CLAMP);
            return (
              <div
                key={i}
                style={{
                  fontSize: "24px",
                  fontFamily: "Arial, sans-serif",
                  color: props.textColor,
                  padding: "10px 16px",
                  marginBottom: "8px",
                  backgroundColor: props.rightColor + "1A",
                  borderRadius: "8px",
                  borderLeft: "3px solid " + props.rightColor,
                  opacity: itemOpacity,
                  transform: "translateY(" + itemY + "px)",
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
