import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { countUp, fadeIn, microFloat, secToFrame, slideUp } from "../../primitives/animations";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { ChartScaffold } from "../ChartScaffold";
import { alpha, CHART_CLAMP, formatValue, getChartSurface, px } from "../chartShared";
import type { UpdatingBarChartProps } from "./schema";

function getLayoutConfig(
  preset: UpdatingBarChartProps["layoutPreset"],
  isPortrait: boolean,
) {
  switch (preset) {
    case "editorial":
      return {
        titleAlign: "left" as const,
        maxPanelWidth: isPortrait ? 0.9 : 0.82,
        headerGap: 12,
        valueWeightBoost: 100,
      };
    case "presentation":
      return {
        titleAlign: "center" as const,
        maxPanelWidth: isPortrait ? 0.92 : 0.86,
        headerGap: 14,
        valueWeightBoost: 0,
      };
    case "social":
      return {
        titleAlign: "left" as const,
        maxPanelWidth: isPortrait ? 0.94 : 0.88,
        headerGap: 10,
        valueWeightBoost: 150,
      };
    case "minimal":
    default:
      return {
        titleAlign: "left" as const,
        maxPanelWidth: isPortrait ? 0.9 : 0.84,
        headerGap: 10,
        valueWeightBoost: 0,
      };
  }
}

export const UpdatingBarChart: React.FC<UpdatingBarChartProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale, isPortrait, isSquare } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);

  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const motion = resolveMotionStyle(resolved.motionStyle);
  const accentColor = props.bars[0]?.color ?? "#3B82F6";
  const fx = resolveEffects(resolved.effects, accentColor);

  const layout = getLayoutConfig(props.layoutPreset, isPortrait || isSquare);
  const { panelBackground, panelBorder, panelShadow } = getChartSurface(props.background, "bar");

  const titleEnd = Math.round(totalFrames * 0.15 * motion.durationMultiplier);
  const barsStart = Math.round(totalFrames * 0.12);
  const barsWindow = Math.max(px(scale, 48), Math.round(totalFrames * 0.52 * motion.durationMultiplier));
  const exitStart = Math.round(totalFrames * 0.88);
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CHART_CLAMP);
  const floatY =
    motion.microMotionEnabled && frame > barsStart && frame < exitStart
      ? microFloat(frame, Math.max(1, scale * 2.5)).y
      : 0;
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, totalFrames], [0, 8], CHART_CLAMP)
    : 0;
  const panelFilter = [
    fx.glowFilter !== "none" ? fx.glowFilter : "",
    exitBlur > 0 ? `blur(${exitBlur}px)` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const panelWidth = Math.min(
    Math.round(width * layout.maxPanelWidth),
    px(scale, 1480),
  );
  const panelHeight = Math.min(
    Math.round(height * (isPortrait ? 0.84 : 0.76)),
    px(scale, 940),
  );
  const panelPaddingX = px(scale, props.layoutPreset === "social" ? 44 : 54);
  const panelPaddingY = px(scale, props.layoutPreset === "presentation" ? 44 : 40);
  const headerHeight =
    (props.title || props.subtitle) ?
      px(scale, props.layoutPreset === "presentation" ? 164 : 146)
      : px(scale, 44);
  const trackerHeight = props.showStepTracker ? px(scale, 74) : 0;

  const chartWidth = panelWidth - panelPaddingX * 2;
  const chartHeight = panelHeight - panelPaddingY * 2 - headerHeight - trackerHeight;
  const titleOpacity = props.title ? interpolate(frame, [0, titleEnd], [0, 1], CHART_CLAMP) : 0;
  const subtitleOpacity = props.subtitle
    ? interpolate(frame, [Math.round(titleEnd * 0.3), titleEnd + px(scale, 10)], [0, 1], CHART_CLAMP)
    : 0;

  const titleSize =
    props.layoutPreset === "social"
      ? px(scale, 60)
      : props.layoutPreset === "presentation"
        ? px(scale, 58)
        : px(scale, 52);
  const subtitleSize =
    props.layoutPreset === "social"
      ? px(scale, 24)
      : px(scale, 22);
  const labelSize =
    props.layoutPreset === "social"
      ? px(scale, 20)
      : px(scale, 17);
  const valueSize =
    props.layoutPreset === "social"
      ? px(scale, 24)
      : px(scale, 21);

  const plotWidth = chartWidth;
  const plotHeight = chartHeight;
  const plotInsetTop = px(scale, 18);
  const plotInsetBottom = px(scale, 84);
  const plotInsetLeft = px(scale, 12);
  const plotInsetRight = px(scale, 18);
  const drawableWidth = plotWidth - plotInsetLeft - plotInsetRight;
  const drawableHeight = plotHeight - plotInsetTop - plotInsetBottom;
  const verticalSlot = drawableWidth / props.bars.length;
  const actualBarWidth = Math.min(
    Math.max(px(scale, 22), px(scale, props.barRadius + 54)),
    Math.round(verticalSlot * 0.68),
  );

  const maxValue = Math.max(
    1,
    ...props.bars.flatMap((bar) => bar.values),
  );
  const stepCount = props.stepLabels.length;
  const stepWindow = barsWindow / Math.max(1, stepCount - 1);
  const activeStepIndex = Math.min(
    stepCount - 1,
    Math.max(0, Math.floor((Math.max(0, frame - barsStart) / Math.max(1, stepWindow)))),
  );

  return (
    <ChartScaffold
      background={props.background}
      scale={scale}
      panelWidth={panelWidth}
      panelHeight={panelHeight}
      panelPaddingX={panelPaddingX}
      panelPaddingY={panelPaddingY}
      panelBackground={panelBackground}
      panelBorder={panelBorder}
      panelShadow={panelShadow}
      fxBoxShadow={fx.boxShadow}
      subtleBlur={fx.subtleBlur}
      exitOpacity={exitOpacity}
      panelFilter={panelFilter}
      floatY={floatY}
      title={props.title}
      subtitle={props.subtitle}
      titleColor={props.titleColor}
      subtitleColor={props.subtitleColor}
      titleOpacity={titleOpacity}
      subtitleOpacity={subtitleOpacity}
      titleAlign={layout.titleAlign}
      headerHeight={headerHeight}
      headerGap={px(scale, layout.headerGap)}
      titleSize={titleSize}
      subtitleSize={subtitleSize}
      titleMaxWidth="90%"
      subtitleMaxWidth={layout.titleAlign === "center" ? "72%" : "78%"}
      typography={typo}
    >
      {props.showStepTracker && (
        <div
          style={{
            position: "relative",
            width: `${chartWidth}px`,
            height: `${trackerHeight}px`,
            marginBottom: `${px(scale, 8)}px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: `${px(scale, 6)}px`,
              right: `${px(scale, 6)}px`,
              top: `${px(scale, 22)}px`,
              height: `${px(scale, 3)}px`,
              borderRadius: `${px(scale, 999)}px`,
              background: alpha(props.stepTrackColor, 0.38),
            }}
          />
          {props.stepLabels.map((stepLabel, index) => {
            const left = (chartWidth - px(scale, 12)) * (index / Math.max(1, stepCount - 1));
            const isActive = index === activeStepIndex;
            const isComplete = index < activeStepIndex;
            return (
              <div
                key={stepLabel}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: 0,
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: `${px(scale, 10)}px`,
                }}
              >
                <div
                  style={{
                    width: `${px(scale, 16)}px`,
                    height: `${px(scale, 16)}px`,
                    borderRadius: "999px",
                    backgroundColor: isActive
                      ? props.activeStepColor
                      : isComplete
                        ? props.stepLabelColor
                        : alpha(props.stepTrackColor, 0.55),
                    boxShadow: isActive ? `0 0 ${px(scale, 18)}px ${alpha(props.activeStepColor, 0.24)}` : "none",
                  }}
                />
                <div
                  style={{
                    fontSize: `${px(scale, 15)}px`,
                    color: isActive ? props.activeStepColor : props.stepLabelColor,
                    opacity: isActive || isComplete ? 1 : 0.72,
                    whiteSpace: "nowrap",
                    ...typo,
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {stepLabel}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          position: "relative",
          width: `${plotWidth}px`,
          height: `${plotHeight}px`,
        }}
      >
        {props.gridLines &&
          Array.from({ length: 5 }).map((_, index) => {
            const progress = index / 4;
            const top = plotInsetTop + drawableHeight - Math.round(drawableHeight * progress);
            return (
              <div
                key={`grid-${index}`}
                style={{
                  position: "absolute",
                  left: `${plotInsetLeft}px`,
                  top: `${top}px`,
                  width: `${drawableWidth}px`,
                  borderTop: `1px solid ${alpha(props.gridColor, index === 0 ? 0.42 : 0.2)}`,
                }}
              />
            );
          })}

        {props.showAxis && (
          <div
            style={{
              position: "absolute",
              left: `${plotInsetLeft}px`,
              bottom: `${plotInsetBottom}px`,
              width: `${drawableWidth}px`,
              borderTop: `1px solid ${alpha(props.axisColor, 0.85)}`,
            }}
          />
        )}

        {props.bars.map((bar, index) => {
          const x = plotInsetLeft + Math.round(index * verticalSlot + (verticalSlot - actualBarWidth) / 2);
          const initialStart = props.entranceAnimation === "none" ? 0 : barsStart + Math.round(index * px(scale, 4));
          const initialEnd = initialStart + Math.max(px(scale, 18), Math.round(stepWindow * 0.8));

          const stepProgress = (frame - barsStart) / Math.max(1, barsWindow);
          const normalizedStep = Math.min(Math.max(stepProgress, 0), 1) * Math.max(1, stepCount - 1);
          const baseStep = Math.floor(normalizedStep);
          const stepMix = props.updateBehavior === "step-update"
            ? (frame >= barsStart + Math.round(baseStep * stepWindow) ? 1 : 0)
            : normalizedStep - baseStep;

          const currentValue = (() => {
            if (baseStep >= stepCount - 1) return bar.values[stepCount - 1] ?? 0;
            const from = bar.values[baseStep] ?? 0;
            const to = bar.values[baseStep + 1] ?? from;
            return from + (to - from) * stepMix;
          })();

          const introProgress =
            props.entranceAnimation === "grow"
              ? interpolate(frame, [initialStart, initialEnd], [0, 1], CHART_CLAMP)
              : props.entranceAnimation === "none"
                ? 1
                : 1;
          const fade = fadeIn(frame, { startFrame: initialStart, endFrame: initialEnd });
          const slide = slideUp(frame, { startFrame: initialStart, endFrame: initialEnd }, px(scale, 28));
          const barOpacity =
            props.entranceAnimation === "fade-in"
              ? fade.opacity
              : props.entranceAnimation === "slide-up"
                ? slide.opacity
                : interpolate(frame, [initialStart, initialStart + px(scale, 10)], [0.3, 1], CHART_CLAMP);
          const translateY = props.entranceAnimation === "slide-up" ? slide.y : 0;
          const barHeight = Math.max(
            0,
            Math.round((currentValue / maxValue) * (drawableHeight - px(scale, 18)) * introProgress),
          );
          const y = plotInsetTop + drawableHeight - barHeight;
          const valueRevealStart =
            props.labelReveal === "after-update"
              ? initialEnd
              : initialStart + px(scale, 6);
          const valueOpacity = props.showValues
            ? interpolate(frame, [valueRevealStart, valueRevealStart + px(scale, 10)], [0, 1], CHART_CLAMP)
            : 0;
          const displayedValue =
            props.valueAnimation === "count-up"
              ? countUp(frame, { startFrame: initialStart, endFrame: initialEnd + Math.round(stepWindow) }, 0, Math.round(currentValue))
              : Math.round(currentValue);

          return (
            <div
              key={bar.label}
              style={{
                position: "absolute",
                left: `${x}px`,
                top: `${plotInsetTop}px`,
                width: `${actualBarWidth}px`,
                height: `${drawableHeight + plotInsetBottom}px`,
                opacity: barOpacity,
                transform: `translateY(${translateY}px)`,
                transformOrigin: "center bottom",
              }}
            >
              {props.showValues && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: `${Math.max(0, y - plotInsetTop - px(scale, 42))}px`,
                    transform: "translateX(-50%)",
                    fontSize: `${valueSize}px`,
                    color: props.valueColor,
                    opacity: valueOpacity,
                    whiteSpace: "nowrap",
                    ...typo,
                    fontWeight: Math.min(900, Number(typo.fontWeight ?? 700) + layout.valueWeightBoost),
                  }}
                >
                  {formatValue(displayedValue, props.valuePrefix, props.valueSuffix)}
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: `${plotInsetBottom}px`,
                  width: `${actualBarWidth}px`,
                  height: `${barHeight}px`,
                  borderRadius: `${props.barRadius}px ${props.barRadius}px 0 0`,
                  background: `linear-gradient(180deg, ${alpha(bar.color, 0.96)} 0%, ${bar.color} 100%)`,
                  boxShadow: `0 ${px(scale, 8)}px ${px(scale, 24)}px ${alpha(bar.color, 0.18)}`,
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 0,
                  transform: "translateX(-50%)",
                  width: `${actualBarWidth + px(scale, 24)}px`,
                  textAlign: "center",
                  fontSize: `${labelSize}px`,
                  color: props.labelColor,
                  opacity: 1,
                  ...typo,
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                {bar.label}
              </div>
            </div>
          );
        })}
      </div>
    </ChartScaffold>
  );
};
