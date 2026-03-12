import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const startFade = 0;
const endFade = 45;
const supportBarOpacity = interpolate(frame, [startFade, endFade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const chainLeftOpacity = interpolate(frame, [startFade, endFade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const chainRightOpacity = interpolate(frame, [startFade, endFade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const signOpacity = interpolate(frame, [startFade, endFade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Rotation segments for sign_board (constructed to form a swing: 0 -> 30 -> -30 -> 0)
const seg1Start = 45;
const seg1End = 98;
const seg2Start = 98;
const seg2End = 150;
const seg3Start = 150;
const seg3End = 210;
const seg1 = interpolate(frame, [seg1Start, seg1End], [0, 30], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const seg2 = interpolate(frame, [seg2Start, seg2End], [0, -60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const seg3 = interpolate(frame, [seg3Start, seg3End], [0, 30], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const signRotation = seg1 + seg2 + seg3;

// Parent (support_bar) position
const parentPosX = 0;
const parentPosY = -200;

// Child offsets
const chainLeftOffsetX = -130;
const chainLeftOffsetY = 1;
const chainRightOffsetX = 130;
const chainRightOffsetY = 1;
const signOffsetX = 0;
const signOffsetY = 121;

// Sizes
const supportBarWidth = 400;
const supportBarHeight = 2;
const chainWidth = 2;
const chainHeight = 120;
const signWidth = 260;
const signHeight = 120;

// Anchor for sign_board: top-center -> "50% 0%"
const signTransformOrigin = "50% 0%";

return (
<AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%) translateX(" + parentPosX + "px) translateY(" + parentPosY + "px)",
    width: supportBarWidth + "px",
    height: supportBarHeight + "px",
    pointerEvents: "none",
    opacity: supportBarOpacity
  }}>
    {/* support bar visual */}
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: supportBarWidth + "px",
      height: supportBarHeight + "px",
      backgroundColor: "#212121"
    }} />
    {/* left chain (child of support_bar) */}
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + chainLeftOffsetX + "px) translateY(" + chainLeftOffsetY + "px)",
      width: chainWidth + "px",
      height: chainHeight + "px",
      backgroundColor: "#616161",
      opacity: chainLeftOpacity
    }} />
    {/* right chain (child of support_bar) */}
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + chainRightOffsetX + "px) translateY(" + chainRightOffsetY + "px)",
      width: chainWidth + "px",
      height: chainHeight + "px",
      backgroundColor: "#616161",
      opacity: chainRightOpacity
    }} />
    {/* sign board (child of support_bar) */}
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transformOrigin: signTransformOrigin,
      transform: "translate(-50%, -50%) translateX(" + signOffsetX + "px) translateY(" + signOffsetY + "px) rotate(" + signRotation + "deg)",
      width: signWidth + "px",
      height: signHeight + "px",
      backgroundColor: "#1E88E5",
      opacity: signOpacity
    }} />
  </div>
</AbsoluteFill>
);
};
