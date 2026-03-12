import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const towerPosX = 0;
const towerPosY = 150;
const towerOpacity = interpolate(frame, [0, 45], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});

const hubOffsetX = 0;
const hubOffsetY = -150;
const hubOpacity = interpolate(frame, [0, 45], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});

const rotPhase1 = interpolate(frame, [45, 180], [0, 720], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const rotPhase2 = interpolate(frame, [180, 240], [720, 810], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
let hubRotation = 0;
if (frame <= 180) {
  hubRotation = rotPhase1;
} else {
  hubRotation = rotPhase2;
}

const bladeOpacity1 = interpolate(frame, [0, 45], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const bladeOpacity2 = interpolate(frame, [0, 45], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const bladeOpacity3 = interpolate(frame, [0, 45], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const bladeOpacity4 = interpolate(frame, [0, 45], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});

return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          towerPosX +
          "px) translateY(" +
          towerPosY +
          "px)",
        opacity: towerOpacity
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 80,
          height: 300,
          backgroundColor: "#757575",
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
            hubOffsetX +
            "px) translateY(" +
            hubOffsetY +
            "px) rotate(" +
            hubRotation +
            "deg)",
          opacity: hubOpacity
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 40,
            height: 40,
            backgroundColor: "#212121",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 220,
            height: 30,
            backgroundColor: "#E53935",
            transform:
              "translate(-50%, -50%) translateX(" + 110 + "px) translateY(" + 0 + "px)",
            transformOrigin: "0% 50%",
            opacity: bladeOpacity1
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 220,
            height: 30,
            backgroundColor: "#E53935",
            transform:
              "translate(-50%, -50%) translateX(" + -110 + "px) translateY(" + 0 + "px)",
            transformOrigin: "100% 50%",
            opacity: bladeOpacity2
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 220,
            height: 30,
            backgroundColor: "#E53935",
            transform:
              "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + 110 + "px)",
            transformOrigin: "50% 0%",
            opacity: bladeOpacity3
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 220,
            height: 30,
            backgroundColor: "#E53935",
            transform:
              "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + -110 + "px)",
            transformOrigin: "50% 100%",
            opacity: bladeOpacity4
          }}
        />
      </div>
    </div>
  </AbsoluteFill>
);
};
