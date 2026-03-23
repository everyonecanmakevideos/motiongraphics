import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;
const posX = 0;
const posY = 0;

// Opacity timeline frames
const op_f0 = 0;
const op_f1 = 30;
const op_f2 = 90;
const op_f3 = 105;
const op_f4 = 120;
const op_f5 = 135;
const op_f6 = 150;

// Scale timeline frames
const sc_f0 = 30;
const sc_f1 = 60;
const sc_f2 = 90;

// Base opacity from 0s to 1s
const baseOpacity = interpolate(frame, [op_f0, op_f1], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
let opacity = baseOpacity;
// Maintain opacity = 1 between 1s and 3s (frames 30-90)
if (frame > op_f1 && frame < op_f2) {
  opacity = 1;
}
// 3s - 3.5s : 1 -> 0.5
if (frame >= op_f2 && frame <= op_f3) {
  opacity = interpolate(frame, [op_f2, op_f3], [1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
} else if (frame > op_f3 && frame <= op_f4) {
  // 3.5s - 4s : 0.5 -> 1
  opacity = interpolate(frame, [op_f3, op_f4], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
} else if (frame > op_f4 && frame <= op_f5) {
  // 4s - 4.5s : 1 -> 0.5
  opacity = interpolate(frame, [op_f4, op_f5], [1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
} else if (frame > op_f5 && frame <= op_f6) {
  // 4.5s - 5s : 0.5 -> 1
  opacity = interpolate(frame, [op_f5, op_f6], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
}

// Scale piecewise
let scale = 1;
if (frame >= sc_f0 && frame <= sc_f1) {
  // 1s - 2s : 1 -> 1.2
  scale = interpolate(frame, [sc_f0, sc_f1], [1, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
} else if (frame > sc_f1 && frame <= sc_f2) {
  // 2s - 3s : 1.2 -> 1
  scale = interpolate(frame, [sc_f1, sc_f2], [1.2, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
} else if (frame < sc_f0) {
  scale = 1;
} else if (frame > sc_f2) {
  scale = 1;
}

return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          posX +
          "px) translateY(" +
          posY +
          "px) scale(" +
          scale +
          ")",
        color: "#E53935",
        fontSize: 48 + "px",
        fontWeight: "bold",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: "1",
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: opacity,
        zIndex: 1
      }}
    >
      Breaking News
    </div>
  </AbsoluteFill>
);
};
