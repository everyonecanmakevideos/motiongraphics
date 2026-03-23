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
import type { BarChartProps } from "./schema";

type LayoutPreset = BarChartProps["layoutPreset"];

function getHighlightIndex(props: BarChartProps): number {
  switch (props.emphasisMode) {
    case "highest":
      return props.bars.reduce(
        (bestIndex, bar, index, bars) => (bar.value > bars[bestIndex].value ? index : bestIndex),
        0,
      );
    case "lowest":
      return props.bars.reduce(
        (bestIndex, bar, index, bars) => (bar.value < bars[bestIndex].value ? index : bestIndex),
        0,
      );
    case "latest":
      return props.bars.length - 1;
    case "none":
    default:
      return -1;
  }
}

function getLayoutConfig(preset: LayoutPreset, isPortrait: boolean) {
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

export const BarChart: React.FC<BarChartProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale, isPortrait, isSquare } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);
  const isVertical = props.orientation === "vertical";

  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const motion = resolveMotionStyle(resolved.motionStyle);
  const highlightIndex = getHighlightIndex(props);
  const accentColor =
    props.emphasisColor ??
    (highlightIndex >= 0 ? props.bars[highlightIndex].color : props.bars[0]?.color) ??
    "#3B82F6";
  const fx = resolveEffects(resolved.effects, accentColor);

  const layout = getLayoutConfig(props.layoutPreset, isPortrait || isSquare);
  const { panelBackground, panelBorder, panelShadow } = getChartSurface(props.background, "bar");

  const titleEnd = Math.round(totalFrames * 0.15 * motion.durationMultiplier);
  const barsStart = Math.round(totalFrames * 0.12);
  const barsWindow = Math.max(px(scale, 48), Math.round(totalFrames * 0.44 * motion.durationMultiplier));
  const exitStart = Math.round(totalFrames * 0.86);
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
    isVertical ? px(scale, 1480) : px(scale, 1560),
  );
  const panelHeight = Math.min(
    Math.round(height * (isPortrait ? 0.84 : 0.74)),
    isVertical ? px(scale, 900) : px(scale, 920),
  );
  const panelPaddingX = px(scale, props.layoutPreset === "social" ? 44 : 54);
  const panelPaddingY = px(scale, props.layoutPreset === "presentation" ? 44 : 40);
  const headerHeight =
    (props.title || props.subtitle) ?
      px(scale, props.layoutPreset === "presentation" ? 164 : 146)
      : px(scale, 44);

  const chartWidth = panelWidth - panelPaddingX * 2;
  const chartHeight = panelHeight - panelPaddingY * 2 - headerHeight;
  const maxValue = Math.max(...props.bars.map((bar) => bar.value), 1);

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
  const plotInsetBottom = isVertical ? px(scale, 84) : px(scale, 18);
  const plotInsetLeft = isVertical ? px(scale, 12) : px(scale, 160);
  const plotInsetRight = isVertical ? px(scale, 18) : px(scale, 28);
  const drawableWidth = plotWidth - plotInsetLeft - plotInsetRight;
  const drawableHeight = plotHeight - plotInsetTop - plotInsetBottom;
  const verticalSlot = drawableWidth / props.bars.length;
  const horizontalSlot = drawableHeight / props.bars.length;

  const actualBarWidth = isVertical
    ? Math.min(
        Math.max(px(scale, 22), px(scale, props.barWidth)),
        Math.round(verticalSlot * 0.68),
      )
    : Math.min(
        Math.max(px(scale, 18), px(scale, props.barWidth)),
        Math.round(horizontalSlot * 0.62),
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
                if (isVertical) {
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
                }

                const left = plotInsetLeft + Math.round(drawableWidth * progress);
                return (
                  <div
                    key={`grid-${index}`}
                    style={{
                      position: "absolute",
                      left: `${left}px`,
                      top: `${plotInsetTop}px`,
                      height: `${drawableHeight}px`,
                      borderLeft: `1px solid ${alpha(props.gridColor, index === 0 ? 0.42 : 0.18)}`,
                    }}
                  />
                );
              })}

            {props.showAxis && isVertical && (
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

            {props.showAxis && !isVertical && (
              <div
                style={{
                  position: "absolute",
                  left: `${plotInsetLeft}px`,
                  top: `${plotInsetTop}px`,
                  height: `${drawableHeight}px`,
                  borderLeft: `1px solid ${alpha(props.axisColor, 0.85)}`,
                }}
              />
            )}

            {props.bars.map((bar, index) => {
              const animationDuration = Math.max(px(scale, 18), Math.round(barsWindow * 0.36));
              const startFrame =
                props.entranceAnimation === "none"
                  ? 0
                  : barsStart + Math.round((barsWindow * index) / Math.max(1, props.bars.length));
              const endFrame = Math.min(startFrame + animationDuration, totalFrames - px(scale, 10));

              const baseProgress =
                props.entranceAnimation === "grow"
                  ? interpolate(frame, [startFrame, endFrame], [0, 1], CHART_CLAMP)
                  : props.entranceAnimation === "none"
                    ? 1
                    : 1;

              const fade = fadeIn(frame, { startFrame, endFrame });
              const slide = slideUp(frame, { startFrame, endFrame }, px(scale, 28));
              const barOpacity =
                props.entranceAnimation === "fade-in"
                  ? fade.opacity
                  : props.entranceAnimation === "slide-up"
                    ? slide.opacity
                  : interpolate(frame, [startFrame, startFrame + px(scale, 10)], [0.3, 1], CHART_CLAMP);
              const translateY = props.entranceAnimation === "slide-up" ? slide.y : 0;

              const isHighlighted = highlightIndex === index;
              const focusProgress =
                isHighlighted && props.emphasisMode !== "none"
                  ? interpolate(frame, [endFrame - px(scale, 4), endFrame + px(scale, 10)], [0, 1], CHART_CLAMP)
                  : 0;
              const visualOpacity =
                props.emphasisMode === "none" || isHighlighted
                  ? 1
                  : props.dimOpacity;
              const effectiveColor = isHighlighted && props.emphasisColor ? props.emphasisColor : bar.color;
              const renderedValue =
                props.valueAnimation === "count-up" && props.entranceAnimation !== "none"
                  ? countUp(frame, { startFrame, endFrame }, 0, bar.value)
                  : bar.value;
              const valueRevealStart =
                props.labelReveal === "after-bar" ? endFrame - px(scale, 3) : startFrame + px(scale, 6);
              const valueOpacity =
                props.showValues
                  ? interpolate(frame, [valueRevealStart, valueRevealStart + px(scale, 10)], [0, 1], CHART_CLAMP)
                  : 0;
              const labelOpacity =
                interpolate(
                  frame,
                  [
                    props.labelReveal === "after-bar" ? endFrame - px(scale, 2) : startFrame + px(scale, 4),
                    endFrame + px(scale, 8),
                  ],
                  [0.2, 1],
                  CHART_CLAMP,
                );

              if (isVertical) {
                const x = plotInsetLeft + Math.round(index * verticalSlot + (verticalSlot - actualBarWidth) / 2);
                const barHeight = Math.max(0, Math.round((bar.value / maxValue) * (drawableHeight - px(scale, 18)) * baseProgress));
                const y = plotInsetTop + drawableHeight - barHeight;

                return (
                  <div
                    key={bar.label}
                    style={{
                      position: "absolute",
                      left: `${x}px`,
                      top: `${plotInsetTop}px`,
                      width: `${actualBarWidth}px`,
                      height: `${drawableHeight + plotInsetBottom}px`,
                      opacity: barOpacity * visualOpacity,
                      transform: `translateY(${translateY}px) scale(${1 + focusProgress * 0.04})`,
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
                        {formatValue(renderedValue, props.valuePrefix, props.valueSuffix)}
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
                        background: `linear-gradient(180deg, ${alpha(effectiveColor, 0.96)} 0%, ${effectiveColor} 100%)`,
                        boxShadow: isHighlighted
                          ? `0 0 ${px(scale, 20)}px ${alpha(accentColor, 0.26)}`
                          : `0 ${px(scale, 8)}px ${px(scale, 24)}px ${alpha(effectiveColor, 0.18)}`,
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
                        opacity: labelOpacity,
                        ...typo,
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      {bar.label}
                    </div>
                  </div>
                );
              }

              const y = plotInsetTop + Math.round(index * horizontalSlot + (horizontalSlot - actualBarWidth) / 2);
              const barWidth = Math.max(0, Math.round((bar.value / maxValue) * (drawableWidth - px(scale, 20)) * baseProgress));

              return (
                <div
                  key={bar.label}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: `${y}px`,
                    width: `${plotWidth}px`,
                    height: `${actualBarWidth}px`,
                    opacity: barOpacity * visualOpacity,
                    transform: `translateY(${translateY}px) scale(${1 + focusProgress * 0.03})`,
                    transformOrigin: "left center",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      width: `${plotInsetLeft - px(scale, 22)}px`,
                      transform: "translateY(-50%)",
                      textAlign: "right",
                      fontSize: `${labelSize}px`,
                      color: props.labelColor,
                      opacity: labelOpacity,
                      ...typo,
                      fontWeight: 500,
                      lineHeight: 1.2,
                    }}
                  >
                    {bar.label}
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      left: `${plotInsetLeft}px`,
                      top: 0,
                      width: `${barWidth}px`,
                      height: `${actualBarWidth}px`,
                      borderRadius: `0 ${props.barRadius}px ${props.barRadius}px 0`,
                      background: `linear-gradient(90deg, ${alpha(effectiveColor, 0.96)} 0%, ${effectiveColor} 100%)`,
                      boxShadow: isHighlighted
                        ? `0 0 ${px(scale, 20)}px ${alpha(accentColor, 0.24)}`
                        : `0 ${px(scale, 8)}px ${px(scale, 24)}px ${alpha(effectiveColor, 0.16)}`,
                    }}
                  />

                  {props.showValues && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${plotInsetLeft + barWidth + px(scale, 18)}px`,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: `${valueSize}px`,
                        color: props.valueColor,
                        opacity: valueOpacity,
                        whiteSpace: "nowrap",
                        ...typo,
                        fontWeight: Math.min(900, Number(typo.fontWeight ?? 700) + layout.valueWeightBoost),
                      }}
                    >
                      {formatValue(renderedValue, props.valuePrefix, props.valueSuffix)}
                    </div>
                  )}
                </div>
              );
            })}
      </div>
    </ChartScaffold>
  );
};
