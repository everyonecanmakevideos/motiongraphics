import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { countUp, fadeIn, microFloat, secToFrame, slideUp } from "../../primitives/animations";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { ChartScaffold } from "../ChartScaffold";
import { alpha, CHART_CLAMP, formatValue, getChartSurface, getComparisonChartLayout, px } from "../chartShared";
import type { StackedBarBreakdownProps } from "./schema";

export const StackedBarBreakdown: React.FC<StackedBarBreakdownProps> = (props) => {
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
  const accentColor = props.segments[0]?.color ?? "#3B82F6";
  const fx = resolveEffects(resolved.effects, accentColor);

  const { panelBackground, panelBorder, panelShadow } = getChartSurface(props.background);
  const layout = getComparisonChartLayout(props.layoutPreset, isPortrait || isSquare);

  const titleEnd = Math.round(totalFrames * 0.15 * motion.durationMultiplier);
  const legendEnd = Math.round(totalFrames * 0.22 * motion.durationMultiplier);
  const barsStart = Math.round(totalFrames * 0.14);
  const barsWindow = Math.max(px(scale, 54), Math.round(totalFrames * 0.5 * motion.durationMultiplier));
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

  const panelWidth = Math.min(Math.round(width * layout.maxPanelWidth), px(scale, 1600));
  const panelHeight = Math.min(Math.round(height * (isPortrait ? 0.84 : 0.76)), px(scale, 940));
  const panelPaddingX = px(scale, 54);
  const panelPaddingY = px(scale, 40);
  const legendHeight = props.showLegend ? px(scale, 68) : 0;
  const headerHeight = (props.title || props.subtitle) ? px(scale, 150) : px(scale, 32);

  const plotWidth = panelWidth - panelPaddingX * 2;
  const plotHeight = panelHeight - panelPaddingY * 2 - headerHeight - legendHeight;
  const plotInsetTop = px(scale, 16);
  const plotInsetBottom = px(scale, 92);
  const plotInsetLeft = px(scale, 12);
  const plotInsetRight = px(scale, 18);
  const drawableWidth = plotWidth - plotInsetLeft - plotInsetRight;
  const drawableHeight = plotHeight - plotInsetTop - plotInsetBottom;
  const groupSlot = drawableWidth / props.categories.length;
  const barWidth = Math.max(px(scale, 24), Math.min(px(scale, 72), Math.round(groupSlot * 0.48)));
  const availableGroupWidth = Math.max(px(scale, 70), groupSlot - px(scale, 24));

  const totals = props.categories.map((_, categoryIndex) =>
    props.segments.reduce((sum, segment) => sum + (segment.values[categoryIndex] ?? 0), 0),
  );
  const maxTotal = Math.max(1, ...totals);

  const titleOpacity = props.title ? interpolate(frame, [0, titleEnd], [0, 1], CHART_CLAMP) : 0;
  const subtitleOpacity = props.subtitle
    ? interpolate(frame, [Math.round(titleEnd * 0.35), titleEnd + px(scale, 8)], [0, 1], CHART_CLAMP)
    : 0;
  const legendOpacity = props.showLegend
    ? interpolate(frame, [Math.round(titleEnd * 0.6), legendEnd], [0, 1], CHART_CLAMP)
    : 0;

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
      headerGap={px(scale, 12)}
      titleSize={px(scale, 54)}
      subtitleSize={px(scale, 22)}
      titleMaxWidth="90%"
      subtitleMaxWidth={layout.titleAlign === "center" ? "74%" : "80%"}
      typography={typo}
      legendItems={props.showLegend ? props.segments.map((item) => ({ label: item.label, color: item.color })) : []}
      legendHeight={legendHeight}
      legendOpacity={legendOpacity}
      legendTextColor={props.legendTextColor}
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

            {props.categories.map((category, categoryIndex) => {
              const groupX = plotInsetLeft + Math.round(categoryIndex * groupSlot + (groupSlot - availableGroupWidth) / 2);
              const stackX = groupX + Math.round((availableGroupWidth - barWidth) / 2);
              const stackTotal = totals[categoryIndex] ?? 0;

              let cumulativeBase = 0;

              return (
                <React.Fragment key={category}>
                  {props.segments.map((segment, segmentIndex) => {
                    const value = segment.values[categoryIndex] ?? 0;
                    const animationDuration = Math.max(px(scale, 16), Math.round(barsWindow * 0.22));
                    let startFrame = barsStart;

                    if (props.segmentReveal === "stack-by-stack") {
                      startFrame += Math.round((barsWindow * categoryIndex) / Math.max(1, props.categories.length));
                      startFrame += Math.round(segmentIndex * px(scale, 4));
                    } else if (props.segmentReveal === "segment-by-segment") {
                      startFrame += Math.round((barsWindow * segmentIndex) / Math.max(1, props.segments.length));
                      startFrame += Math.round(categoryIndex * px(scale, 4));
                    }

                    const endFrame = Math.min(startFrame + animationDuration, totalFrames - px(scale, 10));
                    const baseProgress =
                      props.entranceAnimation === "grow"
                        ? interpolate(frame, [startFrame, endFrame], [0, 1], CHART_CLAMP)
                        : props.entranceAnimation === "none"
                          ? 1
                          : 1;
                    const fade = fadeIn(frame, { startFrame, endFrame });
                    const slide = slideUp(frame, { startFrame, endFrame }, px(scale, 28));
                    const segmentOpacity =
                      props.entranceAnimation === "fade-in"
                        ? fade.opacity
                        : props.entranceAnimation === "slide-up"
                          ? slide.opacity
                          : interpolate(frame, [startFrame, startFrame + px(scale, 10)], [0.3, 1], CHART_CLAMP);
                    const translateY = props.entranceAnimation === "slide-up" ? slide.y : 0;
                    const fullSegmentHeight = Math.round((value / maxTotal) * (drawableHeight - px(scale, 18)));
                    const renderedSegmentHeight = Math.max(0, Math.round(fullSegmentHeight * baseProgress));
                    const baseHeight = Math.round((cumulativeBase / maxTotal) * (drawableHeight - px(scale, 18)));
                    const bottomOffset = plotInsetBottom + baseHeight;
                    cumulativeBase += value;

                    return (
                      <div
                        key={`${category}-${segment.label}`}
                        style={{
                          position: "absolute",
                          left: `${stackX}px`,
                          bottom: `${bottomOffset}px`,
                          width: `${barWidth}px`,
                          height: `${renderedSegmentHeight}px`,
                          opacity: segmentOpacity,
                          transform: `translateY(${translateY}px)`,
                          transformOrigin: "center bottom",
                          borderRadius:
                            segmentIndex === props.segments.length - 1
                              ? `${props.barRadius}px ${props.barRadius}px 0 0`
                              : "0",
                          background: `linear-gradient(180deg, ${alpha(segment.color, 0.95)} 0%, ${segment.color} 100%)`,
                          boxShadow: `0 ${px(scale, 8)}px ${px(scale, 24)}px ${alpha(segment.color, 0.16)}`,
                        }}
                      />
                    );
                  })}

                  {props.showTotals && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${stackX + Math.round(barWidth / 2)}px`,
                        top: `${Math.max(0, plotInsetTop + drawableHeight - Math.round((stackTotal / maxTotal) * (drawableHeight - px(scale, 18))) - px(scale, 42))}px`,
                        transform: "translateX(-50%)",
                        fontSize: `${px(scale, 18)}px`,
                        color: props.totalColor,
                        opacity:
                          props.labelReveal === "after-stack"
                            ? interpolate(frame, [barsStart + Math.round((barsWindow * (categoryIndex + 1)) / Math.max(1, props.categories.length)), barsStart + Math.round((barsWindow * (categoryIndex + 1)) / Math.max(1, props.categories.length)) + px(scale, 10)], [0, 1], CHART_CLAMP)
                            : 1,
                        whiteSpace: "nowrap",
                        ...typo,
                        fontWeight: Math.min(900, Number(typo.fontWeight ?? 700) + layout.valueWeightBoost),
                      }}
                    >
                      {formatValue(
                        props.valueAnimation === "count-up"
                          ? countUp(
                              frame,
                              {
                                startFrame: barsStart + Math.round((barsWindow * categoryIndex) / Math.max(1, props.categories.length)),
                                endFrame: barsStart + Math.round((barsWindow * categoryIndex) / Math.max(1, props.categories.length)) + Math.max(px(scale, 16), Math.round(barsWindow * 0.28)),
                              },
                              0,
                              stackTotal,
                            )
                          : stackTotal,
                        props.valuePrefix,
                        props.valueSuffix,
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      position: "absolute",
                      left: `${groupX}px`,
                      bottom: 0,
                      width: `${availableGroupWidth}px`,
                      textAlign: "center",
                      fontSize: `${px(scale, 17)}px`,
                      color: props.labelColor,
                      ...typo,
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}
                  >
                    {category}
                  </div>
                </React.Fragment>
              );
            })}
      </div>
    </ChartScaffold>
  );
};
