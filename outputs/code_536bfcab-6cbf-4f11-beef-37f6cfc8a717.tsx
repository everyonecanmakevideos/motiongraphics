import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Asset } from "./assets/Asset";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1080;
const canvasH = 1920;
const halfW = canvasW / 2;
const halfH = canvasH / 2;

const step1PosX = 0;
const step1PosY = -330;
const arrow1PosX = 0;
const arrow1PosY = -210;
const step2PosX = 0;
const step2PosY = 0;
const arrow2PosX = 0;
const arrow2PosY = 120;
const step3PosX = 0;
const step3PosY = 330;

const stepWidth = 200;
const stepHeight = 120;
const arrowWidth = 100;
const arrowHeight = 60;

const step1Color = "#E53935";
const step2Color = "#2196F3";
const step3Color = "#4CAF50";
const arrowColor = "#333333";

const step1Opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const arrow1Opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const step2Opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const arrow2Opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const step3Opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

let step1Scale = 1;
if (frame >= 15 && frame <= 30) {
  step1Scale = interpolate(frame, [15, 30], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame > 30 && frame <= 45) {
  step1Scale = interpolate(frame, [30, 45], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  step1Scale = 1;
}

let step2Scale = 1;
if (frame >= 45 && frame <= 60) {
  step2Scale = interpolate(frame, [45, 60], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame > 60 && frame <= 75) {
  step2Scale = interpolate(frame, [60, 75], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  step2Scale = 1;
}

let step3Scale = 1;
if (frame >= 75 && frame <= 90) {
  step3Scale = interpolate(frame, [75, 90], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame > 90 && frame <= 105) {
  step3Scale = interpolate(frame, [90, 105], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  step3Scale = 1;
}

const step1Transform = "translate(-50%, -50%) translateX(" + step1PosX + "px) translateY(" + step1PosY + "px) scale(" + step1Scale + ")";
const arrow1Transform = "translate(-50%, -50%) translateX(" + arrow1PosX + "px) translateY(" + arrow1PosY + "px)";
const step2Transform = "translate(-50%, -50%) translateX(" + step2PosX + "px) translateY(" + step2PosY + "px) scale(" + step2Scale + ")";
const arrow2Transform = "translate(-50%, -50%) translateX(" + arrow2PosX + "px) translateY(" + arrow2PosY + "px)";
const step3Transform = "translate(-50%, -50%) translateX(" + step3PosX + "px) translateY(" + step3PosY + "px) scale(" + step3Scale + ")";

return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: stepWidth + "px",
        height: stepHeight + "px",
        backgroundColor: step1Color,
        transform: step1Transform,
        opacity: step1Opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
        borderRadius: "8px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          color: "#FFFFFF",
          fontSize: 24 + "px",
          fontFamily: "Arial",
          fontWeight: "bold",
          textAlign: "center",
          whiteSpace: "nowrap",
          userSelect: "none",
          pointerEvents: "none"
        }}
      >
        Upload File
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: arrowWidth + "px",
        height: arrowHeight + "px",
        backgroundColor: arrowColor,
        transform: arrow1Transform,
        opacity: arrow1Opacity,
        zIndex: 1,
        clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
        boxSizing: "border-box"
      }}
    />

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: stepWidth + "px",
        height: stepHeight + "px",
        backgroundColor: step2Color,
        transform: step2Transform,
        opacity: step2Opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
        borderRadius: "8px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          color: "#FFFFFF",
          fontSize: 24 + "px",
          fontFamily: "Arial",
          fontWeight: "bold",
          textAlign: "center",
          whiteSpace: "nowrap",
          userSelect: "none",
          pointerEvents: "none"
        }}
      >
        Edit
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: arrowWidth + "px",
        height: arrowHeight + "px",
        backgroundColor: arrowColor,
        transform: arrow2Transform,
        opacity: arrow2Opacity,
        zIndex: 1,
        clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
        boxSizing: "border-box"
      }}
    />

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: stepWidth + "px",
        height: stepHeight + "px",
        backgroundColor: step3Color,
        transform: step3Transform,
        opacity: step3Opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
        borderRadius: "8px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          color: "#FFFFFF",
          fontSize: 24 + "px",
          fontFamily: "Arial",
          fontWeight: "bold",
          textAlign: "center",
          whiteSpace: "nowrap",
          userSelect: "none",
          pointerEvents: "none"
        }}
      >
        Download
      </div>
    </div>
  </AbsoluteFill>
);
};
