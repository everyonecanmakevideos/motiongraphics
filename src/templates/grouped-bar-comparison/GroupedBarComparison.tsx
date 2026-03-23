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
import type { GroupedBarComparisonProps } from "./schema";

export const GroupedBarComparison: React.FC<GroupedBarComparisonProps> = (props) => {
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
  const accentColor = props.series[0]?.color ?? "#3B82F6";
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

  const panelWidth = Math.min(
    Math.round(width * layout.maxPanelWidth),
    px(scale, 1600),
  );
  const panelHeight = Math.min(
    Math.round(height * (isPortrait ? 0.84 : 0.76)),
    px(scale, 940),
  );
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

  const maxValue = Math.max(
    1,
    ...props.series.flatMap((item) => item.values),
  );

  const groupSlot = drawableWidth / props.categories.length;
  const barGap = px(scale, 12);
  const availableGroupWidth = Math.max(px(scale, 60), groupSlot - px(scale, 24));
  const groupInnerWidth = availableGroupWidth - barGap * (props.series.length - 1);
  const barWidth = Math.max(
    px(scale, 18),
    Math.min(px(scale, 52), Math.floor(groupInnerWidth / props.series.length)),
  );

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
      legendItems={props.showLegend ? props.series.map((item) => ({ label: item.label, color: item.color })) : []}
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

              return (
                <React.Fragment key={category}>
                  {props.series.map((item, seriesIndex) => {
                    const value = item.values[categoryIndex] ?? 0;
                    const animationDuration = Math.max(px(scale, 16), Math.round(barsWindow * 0.24));
                    let startFrame = barsStart;
                    if (props.groupReveal === "group-by-group") {
                      startFrame += Math.round((barsWindow * categoryIndex) / Math.max(1, props.categories.length));
                    } else if (props.groupReveal === "series-by-series") {
                      startFrame += Math.round((barsWindow * seriesIndex) / Math.max(1, props.series.length));
                    }

                    const perBarOffset = props.groupReveal === "together" ? 0 : Math.round(seriesIndex * px(scale, 3));
                    startFrame += perBarOffset;
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
                    const barHeight = Math.max(
                      0,
                      Math.round((value / maxValue) * (drawableHeight - px(scale, 18)) * baseProgress),
                    );
                    const x = groupX + seriesIndex * (barWidth + barGap);
                    const y = plotInsetTop + drawableHeight - barHeight;
                    const valueRevealStart =
                      props.labelReveal === "after-group"
                        ? endFrame - px(scale, 3)
                        : startFrame + px(scale, 6);
                    const valueOpacity = props.showValues
                      ? interpolate(frame, [valueRevealStart, valueRevealStart + px(scale, 10)], [0, 1], CHART_CLAMP)
                      : 0;
                    const labelWeight = Math.min(900, Number(typo.fontWeight ?? 700) + layout.valueWeightBoost);
                    const displayedValue =
                      props.valueAnimation === "count-up" && props.entranceAnimation !== "none"
                        ? countUp(frame, { startFrame, endFrame }, 0, value)
                        : value;

                    return (
                      <div
                        key={`${category}-${item.label}`}
                        style={{
                          position: "absolute",
                          left: `${x}px`,
                          top: `${plotInsetTop}px`,
                          width: `${barWidth}px`,
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
                              top: `${Math.max(0, y - plotInsetTop - px(scale, 40))}px`,
                              transform: "translateX(-50%)",
                              fontSize: `${px(scale, 18)}px`,
                              color: props.valueColor,
                              opacity: valueOpacity,
                              whiteSpace: "nowrap",
                              ...typo,
                              fontWeight: labelWeight,
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
                            width: `${barWidth}px`,
                            height: `${barHeight}px`,
                            borderRadius: `${props.barRadius}px ${props.barRadius}px 0 0`,
                            background: `linear-gradient(180deg, ${alpha(item.color, 0.95)} 0%, ${item.color} 100%)`,
                            boxShadow: `0 ${px(scale, 8)}px ${px(scale, 24)}px ${alpha(item.color, 0.18)}`,
                          }}
                        />
                      </div>
                    );
                  })}

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
