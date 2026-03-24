import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;

// Title opacity (0s -> 1s => frames 0 -> 30)
const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
// Subtitle opacity (0s -> 1s)
const subtitleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Bars scaleY animations (1s -> 3s => frames 30 -> 90)
const barJan_scaleY = interpolate(frame, [30, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const barFeb_scaleY = interpolate(frame, [30, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const barMar_scaleY = interpolate(frame, [30, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const barApr_scaleY = interpolate(frame, [30, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const barMay_scaleY = interpolate(frame, [30, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const barJun_scaleY = interpolate(frame, [30, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Bar June pulse scale (3s->4s: 90->120, 4s->5s: 120->150)
const barJun_pulse_up = interpolate(frame, [90, 120], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const barJun_pulse_down = interpolate(frame, [120, 150], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let barJun_scale = 1;
if (frame >= 90 && frame < 120) {
  barJun_scale = barJun_pulse_up;
} else if (frame >= 120 && frame < 150) {
  barJun_scale = barJun_pulse_down;
} else {
  barJun_scale = 1;
}

// Common anchor mapping for bars (bottom-center)
const anchor_bottom_center = "50% 100%";

// Title positioning and style values
const titlePosX = 0;
const titlePosY = -480;
const titleFontSize = 48;
const titleFontWeight = "bold";
const titleFontFamily = "Arial, Helvetica, sans-serif";
const titleColor = "#000000";

// Subtitle positioning and style
const subtitlePosX = 0;
const subtitlePosY = -420;
const subtitleFontSize = 36;
const subtitleFontWeight = "normal";
const subtitleFontFamily = "Arial, Helvetica, sans-serif";
const subtitleColor = "#9E9E9E";

// Bar definitions (sizes, positions, colors)
const barJan_w = 60;
const barJan_h = 120;
const barJan_posX = -450;
const barJan_posY = 60;
const barJan_color = "#2196F3";

const barFeb_w = 60;
const barFeb_h = 180;
const barFeb_posX = -300;
const barFeb_posY = 0;
const barFeb_color = "#2196F3";

const barMar_w = 60;
const barMar_h = 150;
const barMar_posX = -150;
const barMar_posY = 30;
const barMar_color = "#2196F3";

const barApr_w = 60;
const barApr_h = 220;
const barApr_posX = 0;
const barApr_posY = -40;
const barApr_color = "#2196F3";

const barMay_w = 60;
const barMay_h = 195;
const barMay_posX = 150;
const barMay_posY = -15;
const barMay_color = "#2196F3";

const barJun_w = 60;
const barJun_h = 250;
const barJun_posX = 300;
const barJun_posY = -70;
const barJun_color = "#E53935";

return (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + titlePosX + "px) translateY(" + titlePosY + "px)",
        color: titleColor,
        fontSize: titleFontSize + "px",
        fontWeight: titleFontWeight,
        fontFamily: titleFontFamily,
        whiteSpace: "nowrap",
        lineHeight: "1",
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: titleOpacity,
        zIndex: 2
      }}
    >
      {"Monthly Revenue Growth"}
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + subtitlePosX + "px) translateY(" + subtitlePosY + "px)",
        color: subtitleColor,
        fontSize: subtitleFontSize + "px",
        fontWeight: subtitleFontWeight,
        fontFamily: subtitleFontFamily,
        whiteSpace: "nowrap",
        lineHeight: "1",
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: subtitleOpacity,
        zIndex: 2
      }}
    >
      {"First half of 2026"}
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: barJan_w + "px",
        height: barJan_h + "px",
        backgroundColor: barJan_color,
        transformOrigin: anchor_bottom_center,
        transform:
          "translate(-50%, -50%) translateX(" + barJan_posX + "px) translateY(" + barJan_posY + "px) scaleY(" + barJan_scaleY + ") scale(1)",
        zIndex: 3
      }}
    />

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: barFeb_w + "px",
        height: barFeb_h + "px",
        backgroundColor: barFeb_color,
        transformOrigin: anchor_bottom_center,
        transform:
          "translate(-50%, -50%) translateX(" + barFeb_posX + "px) translateY(" + barFeb_posY + "px) scaleY(" + barFeb_scaleY + ") scale(1)",
        zIndex: 3
      }}
    />

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: barMar_w + "px",
        height: barMar_h + "px",
        backgroundColor: barMar_color,
        transformOrigin: anchor_bottom_center,
        transform:
          "translate(-50%, -50%) translateX(" + barMar_posX + "px) translateY(" + barMar_posY + "px) scaleY(" + barMar_scaleY + ") scale(1)",
        zIndex: 3
      }}
    />

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: barApr_w + "px",
        height: barApr_h + "px",
        backgroundColor: barApr_color,
        transformOrigin: anchor_bottom_center,
        transform:
          "translate(-50%, -50%) translateX(" + barApr_posX + "px) translateY(" + barApr_posY + "px) scaleY(" + barApr_scaleY + ") scale(1)",
        zIndex: 3
      }}
    />

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: barMay_w + "px",
        height: barMay_h + "px",
        backgroundColor: barMay_color,
        transformOrigin: anchor_bottom_center,
        transform:
          "translate(-50%, -50%) translateX(" + barMay_posX + "px) translateY(" + barMay_posY + "px) scaleY(" + barMay_scaleY + ") scale(1)",
        zIndex: 3
      }}
    />

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: barJun_w + "px",
        height: barJun_h + "px",
        backgroundColor: barJun_color,
        transformOrigin: anchor_bottom_center,
        transform:
          "translate(-50%, -50%) translateX(" + barJun_posX + "px) translateY(" + barJun_posY + "px) scaleY(" + barJun_scaleY + ") scale(" + barJun_scale + ")",
        zIndex: 4
      }}
    />
  </AbsoluteFill>
);
};
