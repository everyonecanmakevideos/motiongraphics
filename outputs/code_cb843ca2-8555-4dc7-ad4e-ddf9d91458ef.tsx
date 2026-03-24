import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvas = { w: 1920, h: 1080 };
const halfW = canvas.w / 2;
const halfH = canvas.h / 2;

const launch_posX = -360;
const launch_posY = 0;
const launch_text_posX = -360;
const launch_text_posY = -180;

const growth_posX = 0;
const growth_posY = -20;
const growth_text_posX = 0;
const growth_text_posY = -200;

const enterprise_posX = 360;
const enterprise_posY = 0;
const enterprise_text_posX = 360;
const enterprise_text_posY = -180;

const smartest_text_posX = 0;
const smartest_text_posY = 220;

const t0 = 0;
const t1 = 30;
const t2 = 60;
const t3 = 90;
const t5 = 150;

const launch_card_opacity = interpolate(frame, [t0, t1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const launch_text_opacity = interpolate(frame, [t0, t1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const growth_card_opacity = interpolate(frame, [t0, t1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const growth_text_opacity = interpolate(frame, [t0, t1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const enterprise_card_opacity = interpolate(frame, [t0, t1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const enterprise_text_opacity = interpolate(frame, [t0, t1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const growth_scale_up = interpolate(frame, [t1, t2], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const growth_scale_down = interpolate(frame, [t2, t3], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let growth_card_scale = growth_scale_up;
if (frame >= t2) {
  growth_card_scale = growth_scale_down;
}

const smartest_choice_opacity = interpolate(frame, [t3, t5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const cardW = 300;
const cardH = 400;
const launch_color = "#9E9E9E";
const growth_color = "#4CAF50";
const enterprise_color = "#9E9E9E";

return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", width: cardW + "px", height: cardH + "px", backgroundColor: launch_color, transform: "translate(-50%, -50%) translateX(" + launch_posX + "px) translateY(" + launch_posY + "px)", opacity: launch_card_opacity, pointerEvents: "none", userSelect: "none" }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", color: "#FFFFFF", fontSize: 48 + "px", fontWeight: "bold", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", transform: "translate(-50%, -50%) translateX(" + launch_text_posX + "px) translateY(" + launch_text_posY + "px)", opacity: launch_text_opacity }}>
      Launch
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", width: cardW + "px", height: cardH + "px", backgroundColor: growth_color, transform: "translate(-50%, -50%) translateX(" + growth_posX + "px) translateY(" + growth_posY + "px) scale(" + growth_card_scale + ")", opacity: growth_card_opacity, pointerEvents: "none", userSelect: "none" }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", color: "#FFFFFF", fontSize: 48 + "px", fontWeight: "bold", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", transform: "translate(-50%, -50%) translateX(" + growth_text_posX + "px) translateY(" + growth_text_posY + "px)", opacity: growth_text_opacity }}>
      Growth
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", width: cardW + "px", height: cardH + "px", backgroundColor: enterprise_color, transform: "translate(-50%, -50%) translateX(" + enterprise_posX + "px) translateY(" + enterprise_posY + "px)", opacity: enterprise_card_opacity, pointerEvents: "none", userSelect: "none" }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", color: "#FFFFFF", fontSize: 48 + "px", fontWeight: "bold", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", transform: "translate(-50%, -50%) translateX(" + enterprise_text_posX + "px) translateY(" + enterprise_text_posY + "px)", opacity: enterprise_text_opacity }}>
      Enterprise
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", color: "#333333", fontSize: 36 + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1.1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", transform: "translate(-50%, -50%) translateX(" + smartest_text_posX + "px) translateY(" + smartest_text_posY + "px)", opacity: smartest_choice_opacity }}>
      Smartest Choice for Scaling Teams
    </div>
  </AbsoluteFill>
);
};
