import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const badgePosX = 0;
const badgePosY = 0;
const badgeWidth = 300;
const badgeHeight = 120;
const badgeColor = "#1E88E5";
const badgeCorner = 24;
// Frame ranges (in frames)
const badgeFadeInStart = 0;
const badgeFadeInEnd = 30;
const textFadeInStart = 30;
const textFadeInEnd = 60;
const scaleUpStart = 60;
const scaleUpEnd = 120;
const rotateStart1 = 120;
const rotateEnd1 = 165;
const rotateStart2 = 165;
const rotateEnd2 = 210;
const scaleDownStart = 165;
const scaleDownEnd = 210;
const fadeOutStart = 210;
const fadeOutEnd = 240;
// Badge opacity: fade in then fade out (combine by multiplication)
const badgeOpacityIn = interpolate(frame, [badgeFadeInStart, badgeFadeInEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const badgeOpacityOut = interpolate(frame, [fadeOutStart, fadeOutEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const badgeOpacity = badgeOpacityIn * badgeOpacityOut;
// Text opacity: fade in at 1-2s then fade out at 7-8s
const textOpacityIn = interpolate(frame, [textFadeInStart, textFadeInEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const textOpacityOut = interpolate(frame, [fadeOutStart, fadeOutEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const textOpacity = textOpacityIn * textOpacityOut;
// Badge scale (piecewise)
let badgeScale = 1;
if (frame >= scaleUpStart && frame <= scaleUpEnd) {
  badgeScale = interpolate(frame, [scaleUpStart, scaleUpEnd], [1, 1.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame > scaleUpEnd && frame < scaleDownStart) {
  badgeScale = 1.15;
} else if (frame >= scaleDownStart && frame <= scaleDownEnd) {
  badgeScale = interpolate(frame, [scaleDownStart, scaleDownEnd], [1.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  badgeScale = 1;
}
// Badge rotation (piecewise)
let badgeRotation = 0;
if (frame >= rotateStart1 && frame <= rotateEnd1) {
  badgeRotation = interpolate(frame, [rotateStart1, rotateEnd1], [-8, 8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame > rotateEnd1 && frame < rotateStart2) {
  badgeRotation = 8;
} else if (frame >= rotateStart2 && frame <= rotateEnd2) {
  badgeRotation = interpolate(frame, [rotateStart2, rotateEnd2], [8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  badgeRotation = 0;
}
// Child offset relative to parent (no explicit offset provided, using 0,0)
const childOffsetX = 0;
const childOffsetY = 0;
const textColor = "#FFFFFF";
const fontSize = 60;
const fontWeight = "bold";
const fontFamily = "sans-serif";
const textAlign = "center";
const lineHeight = "1";
const letterSpacing = 0;
const textTransform = "none";
return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          badgePosX +
          "px) translateY(" +
          badgePosY +
          "px) rotate(" +
          badgeRotation +
          "deg) scale(" +
          badgeScale +
          ")",
        opacity: badgeOpacity
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: badgeWidth + "px",
          height: badgeHeight + "px",
          backgroundColor: badgeColor,
          borderRadius: badgeCorner + "px",
          transform: "translate(-50%, -50%)"
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform:
            "translate(-50%, -50%) translateX(" +
            childOffsetX +
            "px) translateY(" +
            childOffsetY +
            "px)",
          color: textColor,
          fontSize: fontSize + "px",
          fontWeight: fontWeight,
          fontFamily: fontFamily,
          whiteSpace: "nowrap",
          lineHeight: lineHeight,
          letterSpacing: letterSpacing + "px",
          textAlign: textAlign,
          textTransform: textTransform,
          userSelect: "none",
          pointerEvents: "none",
          opacity: textOpacity
        }}
      >
        HELLO
      </div>
    </div>
  </AbsoluteFill>
);
};
