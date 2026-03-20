import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1080;
const canvasH = 1920;
const halfW = canvasW / 2;
const halfH = canvasH / 2;
const posX = 0;
const posY = 0;
const fontSize = 48;
const fontWeight = "bold";
const fontFamily = "Arial";
const textColor = "#333333";
const fadeInStart = 0;
const fadeInEnd = 15;
const bounceAStart = 15;
const bounceAEnd = 30;
const bounceBStart = 30;
const bounceBEnd = 45;
const bounceCStart = 45;
const bounceCEnd = 60;
const bounceDStart = 60;
const bounceDEnd = 75;
const fadeOutStart = 75;
const fadeOutEnd = 90;
let opacity = 1;
if (frame >= fadeInStart && frame <= fadeInEnd) {
  opacity = interpolate(frame, [fadeInStart, fadeInEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
} else if (frame >= fadeOutStart && frame <= fadeOutEnd) {
  opacity = interpolate(frame, [fadeOutStart, fadeOutEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
} else if (frame < fadeInStart) {
  opacity = 0;
} else if (frame > fadeInEnd && frame < fadeOutStart) {
  opacity = 1;
}
let yAnim = 0;
if (frame >= bounceAStart && frame <= bounceAEnd) {
  yAnim = interpolate(frame, [bounceAStart, bounceAEnd], [0, -10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
} else if (frame > bounceAEnd && frame <= bounceBEnd) {
  yAnim = interpolate(frame, [bounceBStart, bounceBEnd], [-10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
} else if (frame > bounceBEnd && frame <= bounceCEnd) {
  yAnim = interpolate(frame, [bounceCStart, bounceCEnd], [0, -10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
} else if (frame > bounceCEnd && frame <= bounceDEnd) {
  yAnim = interpolate(frame, [bounceDStart, bounceDEnd], [-10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
} else {
  yAnim = 0;
}
const finalY = posY + yAnim;
return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" + posX + "px) translateY(" + finalY + "px)",
        color: textColor,
        fontSize: fontSize + "px",
        fontWeight: fontWeight,
        fontFamily: fontFamily,
        whiteSpace: "nowrap",
        lineHeight: "1.2",
        letterSpacing: "0px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: opacity
      }}
    >
      saving...
    </div>
  </AbsoluteFill>
);
};
