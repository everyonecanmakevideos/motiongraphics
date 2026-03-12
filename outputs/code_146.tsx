import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const finalWidth = 400;
const halfW = 200;
const finalHeight = 400;
const halfH = 200;
const thickness = 3;
// horizontal lines widths (frames rounded)
const h1Start = 0;
const h1End = 38;
const h1W = interpolate(frame, [h1Start, h1End], [0, finalWidth], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const h2Start = 38;
const h2End = 75;
const h2W = interpolate(frame, [h2Start, h2End], [0, finalWidth], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const h3Start = 75;
const h3End = 113;
const h3W = interpolate(frame, [h3Start, h3End], [0, finalWidth], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const h4Start = 113;
const h4End = 150;
const h4W = interpolate(frame, [h4Start, h4End], [0, finalWidth], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
// vertical lines heights
const v1Start = 150;
const v1End = 188;
const v1H = interpolate(frame, [v1Start, v1End], [0, finalHeight], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const v2Start = 188;
const v2End = 225;
const v2H = interpolate(frame, [v2Start, v2End], [0, finalHeight], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const v3Start = 225;
const v3End = 263;
const v3H = interpolate(frame, [v3Start, v3End], [0, finalHeight], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const v4Start = 263;
const v4End = 300;
const v4H = interpolate(frame, [v4Start, v4End], [0, finalHeight], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
// positions
const h1x = -200;
const h1y = -60;
const h2x = -200;
const h2y = -20;
const h3x = -200;
const h3y = 20;
const h4x = -200;
const h4y = 60;
const v1x = -60;
const v1y = -200;
const v2x = -20;
const v2y = -200;
const v3x = 20;
const v3y = -200;
const v4x = 60;
const v4y = -200;
return (
<AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: h1W + "px",
    height: thickness + "px",
    backgroundColor: "#FFFFFF",
    transform: "translateX(" + (h1x - halfW) + "px) translateY(-50%) translateY(" + h1y + "px)"
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: h2W + "px",
    height: thickness + "px",
    backgroundColor: "#FFFFFF",
    transform: "translateX(" + (h2x - halfW) + "px) translateY(-50%) translateY(" + h2y + "px)"
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: h3W + "px",
    height: thickness + "px",
    backgroundColor: "#FFFFFF",
    transform: "translateX(" + (h3x - halfW) + "px) translateY(-50%) translateY(" + h3y + "px)"
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: h4W + "px",
    height: thickness + "px",
    backgroundColor: "#FFFFFF",
    transform: "translateX(" + (h4x - halfW) + "px) translateY(-50%) translateY(" + h4y + "px)"
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: thickness + "px",
    height: v1H + "px",
    backgroundColor: "#FFFFFF",
    zIndex: 1,
    transform: "translateX(-50%) translateX(" + v1x + "px) translateY(" + (v1y - halfH) + "px)"
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: thickness + "px",
    height: v2H + "px",
    backgroundColor: "#FFFFFF",
    zIndex: 0,
    transform: "translateX(-50%) translateX(" + v2x + "px) translateY(" + (v2y - halfH) + "px)"
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: thickness + "px",
    height: v3H + "px",
    backgroundColor: "#FFFFFF",
    zIndex: 1,
    transform: "translateX(-50%) translateX(" + v3x + "px) translateY(" + (v3y - halfH) + "px)"
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: thickness + "px",
    height: v4H + "px",
    backgroundColor: "#FFFFFF",
    zIndex: 0,
    transform: "translateX(-50%) translateX(" + v4x + "px) translateY(" + (v4y - halfH) + "px)"
  }} />
</AbsoluteFill>
);
};
