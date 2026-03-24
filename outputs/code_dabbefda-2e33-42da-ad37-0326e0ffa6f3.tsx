import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Asset } from "./assets/Asset";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;

// Frames for timeline conversion
const f0 = 0;
const f15 = 15;
const f75 = 75;
const f135 = 135;
const f165 = 165;
const f180 = 180;

// card_left
const cardLeftPosX = -320;
const cardLeftPosY = 0;
const cardLeftOpacity = interpolate(frame, [f0, f15], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const cardLeftScale = 1;

// card_middle
const cardMiddlePosX = 0;
const cardMiddlePosY = 0;
const cardMiddleOpacity = interpolate(frame, [f0, f15], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const cardMiddleScalePhase1 = interpolate(frame, [f15, f75], [1, 1.1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const cardMiddleScalePhase2 = interpolate(frame, [f135, f165], [1.05, 1.1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const cardMiddleScalePhase3 = interpolate(frame, [f165, f180], [1.1, 1.1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
let cardMiddleScale = cardMiddleScalePhase1;
if (frame >= f135) {
  cardMiddleScale = cardMiddleScalePhase2;
}
if (frame >= f165) {
  cardMiddleScale = cardMiddleScalePhase3;
}

// card_right
const cardRightPosX = 320;
const cardRightPosY = 0;
const cardRightOpacity = interpolate(frame, [f0, f15], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const cardRightScale = 1;

// text_plan_left
const textPlanLeftPosX = -320;
const textPlanLeftY = interpolate(frame, [f75, f135], [-180, -100], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const textPlanLeftOpacity = 1;

// text_plan_middle
const textPlanMiddlePosX = 0;
const textPlanMiddleY = interpolate(frame, [f75, f135], [-180, -100], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const textPlanMiddleOpacity = 1;

// text_plan_right
const textPlanRightPosX = 320;
const textPlanRightY = interpolate(frame, [f75, f135], [-180, -100], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const textPlanRightOpacity = 1;

// text_features_left
const textFeaturesLeftPosX = -320;
const textFeaturesLeftY = interpolate(frame, [f75, f135], [-100, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const textFeaturesLeftOpacity = 1;

// text_features_middle
const textFeaturesMiddlePosX = 0;
const textFeaturesMiddleY = interpolate(frame, [f75, f135], [-100, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const textFeaturesMiddleOpacity = 1;

// text_features_right
const textFeaturesRightPosX = 320;
const textFeaturesRightY = interpolate(frame, [f75, f135], [-100, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const textFeaturesRightOpacity = 1;

// icons_left (asset)
const iconsLeftPosX = -320;
const iconsLeftY = interpolate(frame, [f75, f135], [-100, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const iconsLeftOpacity = 1;

// icons_middle (asset)
const iconsMiddlePosX = 0;
const iconsMiddleY = interpolate(frame, [f75, f135], [-100, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const iconsMiddleOpacity = 1;

// icons_right (asset)
const iconsRightPosX = 320;
const iconsRightY = interpolate(frame, [f75, f135], [-100, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const iconsRightOpacity = 1;

return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "300px",
        height: "400px",
        backgroundColor: "#E0E0E0",
        transform:
          "translate(-50%, -50%) translateX(" +
          cardLeftPosX +
          "px) translateY(" +
          cardLeftPosY +
          "px) scale(" +
          cardLeftScale +
          ")",
        opacity: cardLeftOpacity,
        zIndex: 1
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "300px",
        height: "400px",
        backgroundColor: "#2196F3",
        transform:
          "translate(-50%, -50%) translateX(" +
          cardMiddlePosX +
          "px) translateY(" +
          cardMiddlePosY +
          "px) scale(" +
          cardMiddleScale +
          ")",
        opacity: cardMiddleOpacity,
        zIndex: 2
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "300px",
        height: "400px",
        backgroundColor: "#E0E0E0",
        transform:
          "translate(-50%, -50%) translateX(" +
          cardRightPosX +
          "px) translateY(" +
          cardRightPosY +
          "px) scale(" +
          cardRightScale +
          ")",
        opacity: cardRightOpacity,
        zIndex: 1
      }}
    />

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          textPlanLeftPosX +
          "px) translateY(" +
          textPlanLeftY +
          "px)",
        color: "#000000",
        fontSize: 36 + "px",
        fontWeight: "bold",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: 1.2,
        letterSpacing: 0,
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: textPlanLeftOpacity,
        zIndex: 3
      }}
    >
      {"Plan Name"}
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          textPlanMiddlePosX +
          "px) translateY(" +
          textPlanMiddleY +
          "px)",
        color: "#000000",
        fontSize: 36 + "px",
        fontWeight: "bold",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: 1.2,
        letterSpacing: 0,
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: textPlanMiddleOpacity,
        zIndex: 3
      }}
    >
      {"Plan Name"}
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          textPlanRightPosX +
          "px) translateY(" +
          textPlanRightY +
          "px)",
        color: "#000000",
        fontSize: 36 + "px",
        fontWeight: "bold",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: 1.2,
        letterSpacing: 0,
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: textPlanRightOpacity,
        zIndex: 3
      }}
    >
      {"Plan Name"}
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          textFeaturesLeftPosX +
          "px) translateY(" +
          textFeaturesLeftY +
          "px)",
        color: "#333333",
        fontSize: 24 + "px",
        fontWeight: "normal",
        fontFamily: "Arial",
        whiteSpace: "pre-wrap",
        lineHeight: 1.2,
        letterSpacing: 0,
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: textFeaturesLeftOpacity,
        zIndex: 3
      }}
    >
      {"Seats\nExports\nIntegrations\nSupport\nAnalytics"}
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          textFeaturesMiddlePosX +
          "px) translateY(" +
          textFeaturesMiddleY +
          "px)",
        color: "#333333",
        fontSize: 24 + "px",
        fontWeight: "normal",
        fontFamily: "Arial",
        whiteSpace: "pre-wrap",
        lineHeight: 1.2,
        letterSpacing: 0,
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: textFeaturesMiddleOpacity,
        zIndex: 3
      }}
    >
      {"Seats\nExports\nIntegrations\nSupport\nAnalytics"}
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          textFeaturesRightPosX +
          "px) translateY(" +
          textFeaturesRightY +
          "px)",
        color: "#333333",
        fontSize: 24 + "px",
        fontWeight: "normal",
        fontFamily: "Arial",
        whiteSpace: "pre-wrap",
        lineHeight: 1.2,
        letterSpacing: 0,
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: textFeaturesRightOpacity,
        zIndex: 3
      }}
    >
      {"Seats\nExports\nIntegrations\nSupport\nAnalytics"}
    </div>

    <Asset
      id={"briefcase"}
      width={20}
      height={20}
      color={"#9E9E9E"}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          iconsLeftPosX +
          "px) translateY(" +
          iconsLeftY +
          "px)",
        opacity: iconsLeftOpacity,
        zIndex: 3
      }}
    />

    <Asset
      id={"briefcase"}
      width={20}
      height={20}
      color={"#9E9E9E"}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          iconsMiddlePosX +
          "px) translateY(" +
          iconsMiddleY +
          "px)",
        opacity: iconsMiddleOpacity,
        zIndex: 3
      }}
    />

    <Asset
      id={"briefcase"}
      width={20}
      height={20}
      color={"#9E9E9E"}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          iconsRightPosX +
          "px) translateY(" +
          iconsRightY +
          "px)",
        opacity: iconsRightOpacity,
        zIndex: 3
      }}
    />
  </AbsoluteFill>
);
};
