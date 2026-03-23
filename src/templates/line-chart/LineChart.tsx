import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { secToFrame, microFloat } from "../../primitives/animations";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { ChartScaffold } from "../ChartScaffold";
import {
  alpha,
  CHART_CLAMP,
  formatValue,
  getChartSurface,
  getComparisonChartLayout,
  px,
} from "../chartShared";
import type { LineChartProps } from "./schema";

type PlotPoint = {
  x: number;
  y: number;
  label: string;
  value: number;
  isEmphasized: boolean;
};

function buildLinePath(points: PlotPoint[], curveStyle: "smooth" | "linear"): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (curveStyle === "linear") {
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index++) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function buildAreaPath(
  points: PlotPoint[],
  baselineY: number,
  curveStyle: "smooth" | "linear",
): string {
  if (points.length === 0) return "";
  const linePath = buildLinePath(points, curveStyle);
  const last = points[points.length - 1];
  const first = points[0];
  return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

function getPointAtLength(points: PlotPoint[], progress: number): number {
  if (points.length <= 1) return 0;
  return Math.max(0, Math.min(points.length - 1, Math.floor(progress * (points.length - 1))));
}

export const LineChart: React.FC<LineChartProps> = (props) => {
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
  const accentColor = props.series[0]?.color ?? "#6366F1";
  const fx = resolveEffects(resolved.effects, accentColor);
  const { panelBackground, panelBorder, panelShadow } = getChartSurface(props.background);
  const layout = getComparisonChartLayout(props.layoutPreset, isPortrait || isSquare);

  const titleEnd = Math.round(totalFrames * 0.16 * motion.durationMultiplier);
  const legendEnd = Math.round(totalFrames * 0.26 * motion.durationMultiplier);
  const chartStart = Math.round(totalFrames * 0.08);
  const chartEnd = Math.round(totalFrames * 0.58);
  const labelsStart = Math.round(totalFrames * 0.42);
  const labelsEnd = Math.round(totalFrames * 0.68);
  const exitStart = Math.round(totalFrames * 0.88);
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CHART_CLAMP);

  const floatY =
    motion.microMotionEnabled && frame > chartEnd && frame < exitStart
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

  const titleOpacity = props.title ? interpolate(frame, [0, titleEnd], [0, 1], CHART_CLAMP) : 0;
  const subtitleOpacity = props.subtitle ? interpolate(frame, [0, titleEnd], [0, 1], CHART_CLAMP) : 0;
  const legendOpacity = props.showLegend ? interpolate(frame, [titleEnd * 0.4, legendEnd], [0, 1], CHART_CLAMP) : 0;
  const labelOpacity = interpolate(frame, [labelsStart, labelsEnd], [0, 1], CHART_CLAMP);

  let lineProgress = 1;
  let chartOpacity = 1;
  let chartTranslateY = 0;
  if (props.entranceAnimation === "draw") {
    lineProgress = interpolate(frame, [chartStart, chartEnd], [0, 1], CHART_CLAMP);
  } else if (props.entranceAnimation === "fade-in") {
    chartOpacity = interpolate(frame, [chartStart, chartEnd], [0, 1], CHART_CLAMP);
  } else if (props.entranceAnimation === "slide-up") {
    chartOpacity = interpolate(frame, [chartStart, chartEnd], [0, 1], CHART_CLAMP);
    chartTranslateY = interpolate(frame, [chartStart, chartEnd], [px(scale, 30), 0], CHART_CLAMP);
  }

  const panelWidth = width * layout.maxPanelWidth;
  const panelHeight = height * (isPortrait ? 0.72 : 0.7);
  const panelPaddingX = px(scale, isPortrait ? 42 : 54);
  const panelPaddingY = px(scale, isPortrait ? 38 : 46);
  const headerHeight = props.title || props.subtitle ? px(scale, props.subtitle ? 110 : 82) : 0;
  const legendHeight = props.showLegend ? px(scale, props.layoutPreset === "social" ? 54 : 44) : 0;
  const contentHeight = Math.max(
    px(scale, 230),
    panelHeight - panelPaddingY * 2 - headerHeight - legendHeight,
  );

  const plotWidth = panelWidth - panelPaddingX * 2;
  const plotHeight = Math.max(px(scale, 220), contentHeight - px(scale, 22));
  const leftPad = px(scale, 20);
  const rightPad = px(scale, props.labelReveal === "all" ? 30 : 16);
  const topPad = px(scale, 20);
  const bottomPad = px(scale, 54);
  const innerWidth = Math.max(px(scale, 260), plotWidth - leftPad - rightPad);
  const innerHeight = Math.max(px(scale, 150), plotHeight - topPad - bottomPad);
  const baselineY = topPad + innerHeight;

  const valueMax = Math.max(
    1,
    ...props.series.flatMap((series) => series.values),
  );
  const pointSpacing = props.categories.length > 1 ? innerWidth / (props.categories.length - 1) : innerWidth;
  const lineCount = props.series.length;

  const seriesData = props.series.map((series) => {
    const values = props.categories.map((_, categoryIndex) => series.values[categoryIndex] ?? 0);
    const targetIndex =
      props.emphasisMode === "latest"
        ? values.length - 1
        : props.emphasisMode === "highest"
          ? values.indexOf(Math.max(...values))
          : props.emphasisMode === "lowest"
            ? values.indexOf(Math.min(...values))
            : -1;
    const points = values.map((value, categoryIndex) => {
      const x = leftPad + pointSpacing * categoryIndex;
      const normalized = valueMax === 0 ? 0 : value / valueMax;
      const y = topPad + innerHeight - normalized * innerHeight;
      return {
        x,
        y,
        value,
        label: props.categories[categoryIndex] ?? `Point ${categoryIndex + 1}`,
        isEmphasized: categoryIndex === targetIndex,
      };
    });
    return {
      ...series,
      points,
      path: buildLinePath(points, props.curveStyle),
      areaPath: buildAreaPath(points, baselineY, props.curveStyle),
      opacity:
        props.emphasisMode !== "none" && lineCount > 1 && !points.some((point) => point.isEmphasized)
          ? props.dimOpacity
          : 1,
      emphasisPointIndex: targetIndex,
      drawProgressIndex: getPointAtLength(points, lineProgress),
      strokeColor:
        props.emphasisMode !== "none" && points.some((point) => point.isEmphasized) && props.emphasisColor
          ? props.emphasisColor
          : series.color,
    };
  });

  const legendItems = props.showLegend
    ? props.series.map((series) => ({ label: series.label, color: series.color }))
    : [];

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
      panelBackdropBlur={props.layoutPreset === "social" ? 4 : 8}
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
      headerGap={px(scale, props.layoutPreset === "social" ? 12 : 14)}
      titleSize={px(scale, props.layoutPreset === "social" ? (isPortrait || isSquare ? 50 : 46) : 52)}
      subtitleSize={px(scale, props.layoutPreset === "social" ? 22 : 21)}
      titleMaxWidth="92%"
      subtitleMaxWidth={layout.titleAlign === "center" ? "70%" : "80%"}
      typography={typo}
      legendItems={legendItems}
      legendHeight={legendHeight}
      legendOpacity={legendOpacity}
      legendTextColor={props.legendTextColor}
      legendFontSize={px(scale, props.layoutPreset === "social" ? 20 : 18)}
      legendSwatchSize={px(scale, props.layoutPreset === "social" ? 18 : 16)}
    >
      <div
        style={{
          height: `${contentHeight}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${chartTranslateY}px)`,
          opacity: chartOpacity,
        }}
      >
        <svg
          width={plotWidth}
          height={plotHeight}
          viewBox={`0 0 ${plotWidth} ${plotHeight}`}
          style={{ overflow: "visible" }}
        >
          {props.gridLines &&
            Array.from({ length: 5 }, (_, index) => {
              const y = topPad + (innerHeight / 4) * index;
              return (
                <line
                  key={`grid-${index}`}
                  x1={leftPad}
                  y1={y}
                  x2={leftPad + innerWidth}
                  y2={y}
                  stroke={props.gridColor}
                  strokeOpacity={0.45}
                  strokeWidth={1}
                />
              );
            })}

          {props.showAxis && (
            <>
              <line
                x1={leftPad}
                y1={baselineY}
                x2={leftPad + innerWidth}
                y2={baselineY}
                stroke={props.axisColor}
                strokeWidth={1.5}
              />
              <line
                x1={leftPad}
                y1={topPad}
                x2={leftPad}
                y2={baselineY}
                stroke={props.axisColor}
                strokeOpacity={0.38}
                strokeWidth={1}
              />
            </>
          )}

          {seriesData.map((series) => (
            <g key={series.label} opacity={series.opacity}>
              {props.showAreaFill && (
                <path
                  d={series.areaPath}
                  fill={alpha(series.strokeColor, 0.12)}
                  stroke="none"
                />
              )}
              <path
                d={series.path}
                fill="none"
                stroke={series.strokeColor}
                strokeWidth={props.lineWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - lineProgress}
              />

              {props.showPoints &&
                series.points.map((point, pointIndex) => {
                  const visible = pointIndex <= series.drawProgressIndex || props.entranceAnimation !== "draw";
                  if (!visible) return null;
                  const radius = point.isEmphasized ? props.pointRadius + px(scale, 1) : props.pointRadius;
                  return (
                    <g key={`${series.label}-${point.label}`}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={radius}
                        fill={series.strokeColor}
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={Math.max(1, radius - px(scale, 2))}
                        fill={props.background.type === "solid" ? props.background.color : panelBackground}
                      />
                      {((props.labelReveal === "all") ||
                        (props.labelReveal === "latest" && pointIndex === series.points.length - 1) ||
                        (props.emphasisMode !== "none" && point.isEmphasized)) && (
                        <text
                          x={point.x}
                          y={point.y - px(scale, 14)}
                          textAnchor="middle"
                          fill={props.valueColor}
                          opacity={labelOpacity}
                          fontFamily={typo.fontFamily ?? "Arial, sans-serif"}
                          fontSize={px(scale, props.layoutPreset === "social" ? 18 : 16)}
                          fontWeight={700}
                        >
                          {formatValue(point.value, props.valuePrefix, props.valueSuffix)}
                        </text>
                      )}
                    </g>
                  );
                })}
            </g>
          ))}

          {props.categories.map((category, index) => (
            <g key={category}>
              <line
                x1={leftPad + pointSpacing * index}
                y1={baselineY}
                x2={leftPad + pointSpacing * index}
                y2={baselineY + px(scale, 6)}
                stroke={props.axisColor}
                strokeWidth={1}
              />
              <text
                x={leftPad + pointSpacing * index}
                y={baselineY + px(scale, 26)}
                textAnchor="middle"
                fill={props.labelColor}
                fontFamily={typo.fontFamily ?? "Arial, sans-serif"}
                fontSize={px(scale, props.layoutPreset === "social" ? 18 : 16)}
                fontWeight={500}
              >
                {category}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </ChartScaffold>
  );
};
