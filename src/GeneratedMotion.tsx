import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;
const titleStart = 0 * 30;
const titleEnd = 1 * 30;
const titleOpacity = interpolate(frame, [titleStart, titleEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const mainOpStart = 0 * 30;
const mainOpEnd = 1 * 30;
const mainOpacity = interpolate(frame, [mainOpStart, mainOpEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const labelStart = 0 * 30;
const labelEnd = 1 * 30;
const labelOpacity = interpolate(frame, [labelStart, labelEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const noteStart = 0 * 30;
const noteEnd = 1 * 30;
const noteOpacity = interpolate(frame, [noteStart, noteEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const s1Start = 1 * 30;
const s1End = 4 * 30;
const mainScaleA = interpolate(frame, [s1Start, s1End], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const s2Start = 4 * 30;
const s2End = 4.5 * 30;
const mainScaleB = interpolate(frame, [s2Start, s2End], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const s3Start = 4.5 * 30;
const s3End = 5 * 30;
const mainScaleC = interpolate(frame, [s3Start, s3End], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let mainScale = mainScaleA;
if (frame >= s2Start && frame < s2End) {
  mainScale = mainScaleB;
} else if (frame >= s3Start) {
  mainScale = mainScaleC;
}
const titlePosX = 0;
const titlePosY = -480;
const mainPosX = 0;
const mainPosY = 0;
const labelPosX = 0;
const labelPosY = 100;
const notePosX = 0;
const notePosY = 500;
return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + titlePosX + "px) translateY(" + titlePosY + "px)",
        color: "#333333",
        fontSize: 48 + "px",
        fontWeight: "bold",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: 1,
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: titleOpacity,
        zIndex: 1
      }}
    >
      Quarterly Performance
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + mainPosX + "px) translateY(" + mainPosY + "px) scale(" + mainScale + ")",
        color: "#4CAF50",
        fontSize: 96 + "px",
        fontWeight: "bold",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: 1,
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: mainOpacity,
        zIndex: 1
      }}
    >
      98.4%
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + labelPosX + "px) translateY(" + labelPosY + "px)",
        color: "#9E9E9E",
        fontSize: 36 + "px",
        fontWeight: "normal",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: 1,
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: labelOpacity,
        zIndex: 1
      }}
    >
      Customer Retention
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + notePosX + "px) translateY(" + notePosY + "px)",
        color: "#E0E0E0",
        fontSize: 24 + "px",
        fontWeight: "normal",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: 1,
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: noteOpacity,
        zIndex: 1
      }}
    >
      Up from 94.1% last quarter
    </div>
  </AbsoluteFill>
);
};
