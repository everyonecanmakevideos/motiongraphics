import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { secToFrame, microFloat } from "../../primitives/animations";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { ChartScaffold } from "../ChartScaffold";
import { alpha, CHART_CLAMP, formatValue, getChartSurface, px } from "../chartShared";
import type { PieChartProps } from "./schema";

const TAU = 2 * Math.PI;
const LABEL_SHORTENERS: Array<[RegExp, string]> = [
  [/\bNorth America\b/gi, "NA"],
  [/\bSouth America\b/gi, "SA"],
  [/\bLatin America\b/gi, "LATAM"],
  [/\bEurope\b/gi, "EU"],
  [/\bAsia Pacific\b/gi, "APAC"],
  [/\bMiddle East\b/gi, "ME"],
  [/\bAfrica\b/gi, "Africa"],
  [/\bEnterprise\b/gi, "Enterprise"],
  [/\bMid-Market\b/gi, "Mid-Market"],
  [/\bSmall and Medium Business\b/gi, "SMB"],
  [/\bStrategic Accounts\b/gi, "Strategic"],
  [/\bPartnerships\b/gi, "Partners"],
];
const GROUPED_SLICE_COLOR = "#94A3B8";

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    "M", cx, cy,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArc, 0, end.x, end.y,
    "Z",
  ].join(" ");
}

function describeDonutArc(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerRadius, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    "M", outerStart.x, outerStart.y,
    "A", outerRadius, outerRadius, 0, largeArc, 0, outerEnd.x, outerEnd.y,
    "L", innerStart.x, innerStart.y,
    "A", innerRadius, innerRadius, 0, largeArc, 1, innerEnd.x, innerEnd.y,
    "Z",
  ].join(" ");
}

function compactLabel(label: string) {
  let next = label.trim();
  for (const [pattern, replacement] of LABEL_SHORTENERS) {
    next = next.replace(pattern, replacement);
  }
  return next.replace(/\s+/g, " ").trim();
}

function splitLabelLines(label: string, maxChars: number, maxLines = 2) {
  const words = label.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";
  let consumedWords = 0;

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxChars) {
      currentLine = candidate;
      consumedWords += 1;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
      consumedWords += 1;
    } else {
      lines.push(word);
      currentLine = "";
      consumedWords += 1;
    }

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  const remainingWords = words.slice(consumedWords);
  const lastLineSource = [currentLine, ...remainingWords].filter(Boolean).join(" ").trim();

  if (lines.length < maxLines && lastLineSource) {
    lines.push(lastLineSource);
  }

  return lines.slice(0, maxLines).map((line, index, arr) => {
    if (index !== arr.length - 1) {
      return line;
    }
    if (line.length <= maxChars) {
      return line;
    }
    return `${line.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
  });
}

function getLayoutConfig(preset: PieChartProps["layoutPreset"], isPortrait: boolean) {
  switch (preset) {
    case "editorial":
      return {
        titleAlign: "left" as const,
        maxPanelWidth: isPortrait ? 0.9 : 0.82,
        headerGap: 12,
        sideLabels: !isPortrait,
      };
    case "social":
      return {
        titleAlign: "center" as const,
        maxPanelWidth: isPortrait ? 0.94 : 0.82,
        headerGap: 12,
        sideLabels: false,
      };
    case "minimal":
      return {
        titleAlign: "left" as const,
        maxPanelWidth: isPortrait ? 0.92 : 0.84,
        headerGap: 10,
        sideLabels: !isPortrait,
      };
    case "presentation":
    default:
      return {
        titleAlign: "center" as const,
        maxPanelWidth: isPortrait ? 0.92 : 0.86,
        headerGap: 14,
        sideLabels: !isPortrait,
      };
  }
}

export const PieChart: React.FC<PieChartProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale, isPortrait, isSquare } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);
  const rawSegments = props.segments;
  const rawTotal = rawSegments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const rawSegmentCount = rawSegments.length;
  const rawLongestLabelLength = rawSegments.reduce((max, segment) => Math.max(max, segment.label.trim().length), 0);
  const rawTinySliceCount = rawSegments.filter((segment) => (segment.value / rawTotal) * 100 <= 8).length;
  const shouldGroupTinySlices =
    props.arcMode === "full" &&
    rawSegmentCount >= 6 &&
    rawTinySliceCount >= 2;
  const groupingThresholdPct = rawSegmentCount >= 8 ? 6 : 4.5;
  const groupedMinorSegments = shouldGroupTinySlices
    ? rawSegments.filter((segment) => (segment.value / rawTotal) * 100 <= groupingThresholdPct)
    : [];
  const canGroupMinorSegments =
    groupedMinorSegments.length >= 2 &&
    rawSegments.length - groupedMinorSegments.length >= 3;
  const displaySegments = canGroupMinorSegments
    ? [
        ...rawSegments.filter((segment) => !groupedMinorSegments.includes(segment)),
        {
          label: "Other",
          value: groupedMinorSegments.reduce((sum, segment) => sum + segment.value, 0),
          color: GROUPED_SLICE_COLOR,
        },
      ]
    : rawSegments;

  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const motion = resolveMotionStyle(resolved.motionStyle);
  const accentColor = displaySegments[0]?.color ?? "#6366F1";
  const fx = resolveEffects(resolved.effects, accentColor);
  const { panelBackground, panelBorder, panelShadow } = getChartSurface(props.background);
  const layout = getLayoutConfig(props.layoutPreset, isPortrait || isSquare);
  const segmentCount = displaySegments.length;
  const longestLabelLength = displaySegments.reduce((max, segment) => Math.max(max, segment.label.trim().length), 0);
  const hasLongLabels = longestLabelLength >= 18;
  const hasVeryLongLabels = longestLabelLength >= 25;
  const hasManySegments = segmentCount >= 6;
  const tinySliceCount = displaySegments.filter((segment) => (segment.value / rawTotal) * 100 <= 8).length;
  const shouldAutoDonut =
    props.arcMode === "full" &&
    !props.donut &&
    (props.layoutPreset === "presentation" || props.layoutPreset === "editorial") &&
    (rawSegmentCount >= 5 || rawLongestLabelLength >= 18 || rawTinySliceCount >= 2);
  const useDonut = props.arcMode === "semi" ? props.donut : props.donut || shouldAutoDonut;
  const preferSideLabels = hasLongLabels || hasManySegments || useDonut;

  const titleEnd = Math.round(totalFrames * 0.15 * motion.durationMultiplier);
  const legendEnd = Math.round(totalFrames * 0.24 * motion.durationMultiplier);
  const chartStart = Math.round(totalFrames * 0.08);
  const chartEnd = Math.round(totalFrames * 0.55);
  const labelsStart = Math.round(totalFrames * 0.36);
  const labelsEnd = Math.round(totalFrames * 0.58);
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

  let chartProgress = 1;
  let chartScale = 1;
  let chartOpacity = 1;
  if (props.entranceAnimation === "spin") {
    chartProgress = interpolate(frame, [chartStart, chartEnd], [0, 1], CHART_CLAMP);
  } else if (props.entranceAnimation === "fade-in") {
    chartOpacity = interpolate(frame, [chartStart, chartEnd], [0, 1], CHART_CLAMP);
  } else if (props.entranceAnimation === "scale-pop") {
    const mid = Math.round((chartStart + chartEnd) / 2);
    chartScale = frame < mid
      ? interpolate(frame, [chartStart, mid], [0.86, 1.06], CHART_CLAMP)
      : interpolate(frame, [mid, chartEnd], [1.06, 1], CHART_CLAMP);
    chartOpacity = interpolate(frame, [chartStart, mid], [0, 1], CHART_CLAMP);
  }

  const panelWidth = width * layout.maxPanelWidth;
  const panelHeight = height * (isPortrait ? 0.72 : 0.7);
  const panelPaddingX = px(scale, isPortrait ? 44 : 54);
  const panelPaddingY = px(scale, isPortrait ? 40 : 46);
  const contentWidth = Math.max(px(scale, 320), panelWidth - panelPaddingX * 2);
  const headerHeight = props.title || props.subtitle ? px(scale, props.subtitle ? 112 : 82) : 0;
  const showCallout = props.showCallout;
  const calloutOnBottom = props.calloutAlign === "bottom" || isPortrait || isSquare || props.layoutPreset === "social";
  const showInlineCallout = showCallout;
  const showSideLabels =
    props.showLabels &&
    layout.sideLabels &&
    props.arcMode !== "semi" &&
    !showInlineCallout &&
    preferSideLabels;
  const showTopLegend =
    props.showLegend &&
    !showInlineCallout &&
    !showSideLabels &&
    !hasLongLabels &&
    segmentCount <= 4;
  const legendHeight = showTopLegend ? px(scale, 44) : 0;
  const contentHeight = Math.max(
    px(scale, 220),
    panelHeight - panelPaddingY * 2 - headerHeight - legendHeight,
  );
  const contentGap = px(scale, layout.sideLabels ? 40 : 20);
  const calloutWidth = Math.max(px(scale, 300), contentWidth * 0.3);
  const hasNarrativeSidebar = showInlineCallout && !calloutOnBottom;
  const sideLabelWidth = showSideLabels
    ? Math.max(px(scale, hasVeryLongLabels ? 280 : 236), contentWidth * (hasVeryLongLabels ? 0.3 : 0.26))
    : 0;
  const useSplitLayout = hasNarrativeSidebar || showSideLabels;
  const bottomCalloutReserve = showInlineCallout && calloutOnBottom ? px(scale, props.layoutPreset === "social" ? 168 : 152) : 0;
  const semiMetricReserve = props.arcMode === "semi" ? px(scale, props.layoutPreset === "social" ? 118 : 104) : 0;
  const chartAreaHeight = Math.max(
    px(scale, 220),
    contentHeight - bottomCalloutReserve - semiMetricReserve - (bottomCalloutReserve > 0 ? contentGap : 0),
  );
  const chartWidthBudget = useSplitLayout
    ? Math.max(
        px(scale, 260),
        contentWidth - (hasNarrativeSidebar ? calloutWidth : sideLabelWidth) - contentGap,
      )
    : contentWidth;
  const chartSize = Math.min(
    px(scale, isPortrait ? 460 : useDonut ? 640 : 660),
    useSplitLayout
      ? chartWidthBudget * (useDonut ? 0.66 : 0.61)
      : chartWidthBudget * (isPortrait ? 0.82 : useDonut ? 0.72 : 0.68),
    chartAreaHeight * (hasNarrativeSidebar ? 0.86 : useDonut ? 0.98 : 0.96),
  );
  const chartHeight = props.arcMode === "semi" ? chartSize * 0.64 : chartSize;
  const chartYOffset = props.arcMode === "semi" ? -px(scale, 6) : -px(scale, isPortrait ? 10 : 16);

  const total = props.arcMode === "semi" ? 100 : rawTotal;
  const centerX = chartSize / 2;
  const centerY = props.arcMode === "semi" ? chartHeight - px(scale, 18) : chartSize / 2;
  const outerRadius = props.arcMode === "semi"
    ? Math.min(chartSize * 0.38, chartHeight - px(scale, 26))
    : chartSize / 2 - px(scale, 12);
  const innerRadius = useDonut ? outerRadius * (hasManySegments || hasVeryLongLabels ? 0.64 : 0.58) : 0;
  const normalizedHighlightLabel = props.highlightLabel?.trim().toLowerCase() ?? "";
  const shouldAutoHighlightLargest =
    props.highlightMode === "none" &&
    props.arcMode === "full" &&
    segmentCount > 1 &&
    (useDonut || hasManySegments || hasLongLabels || tinySliceCount > 0);
  const effectiveHighlightMode = shouldAutoHighlightLargest ? "largest" : props.highlightMode;

  const highlightedIndex = (() => {
    if (effectiveHighlightMode === "largest") {
      return displaySegments.reduce((best, segment, index, arr) =>
        segment.value > arr[best].value ? index : best, 0);
    }
    if (effectiveHighlightMode === "smallest") {
      return displaySegments.reduce((best, segment, index, arr) =>
        segment.value < arr[best].value ? index : best, 0);
    }
    if (effectiveHighlightMode === "specific" && normalizedHighlightLabel) {
      return displaySegments.findIndex((segment) => segment.label.trim().toLowerCase() === normalizedHighlightLabel);
    }
    return -1;
  })();
  const hasHighlight = highlightedIndex >= 0;
  const effectiveExplodeOffset = props.explodeOffset > 0
    ? props.explodeOffset
    : shouldAutoHighlightLargest
      ? px(scale, useDonut ? 16 : 12)
      : 0;
  const explodeDistance = hasHighlight
    ? interpolate(frame, [chartStart, chartEnd], [0, effectiveExplodeOffset], CHART_CLAMP)
    : 0;

  const baseStartAngle = props.arcMode === "semi" ? Math.PI : -Math.PI / 2;
  const chartSpan = props.arcMode === "semi" ? Math.PI : TAU;
  let currentAngle = baseStartAngle;
  const segmentData = displaySegments.map((segment, index) => {
    const fullSweep = (segment.value / total) * chartSpan;
    const sweep = fullSweep * chartProgress;
    const start = currentAngle;
    const end = currentAngle + sweep;
    currentAngle = end;
    const midAngle = start + sweep / 2;
    const pct = Math.round((segment.value / total) * 100);
    const labelPoint = polarToCartesian(centerX, centerY, outerRadius + px(scale, useDonut ? 40 : 34), midAngle);
    const isHighlighted = index === highlightedIndex;
    const explodeVector = isHighlighted
      ? polarToCartesian(0, 0, explodeDistance, midAngle)
      : { x: 0, y: 0 };
    return {
      ...segment,
      start,
      end,
      midAngle,
      pct,
      labelPoint,
      isGroupedOther: segment.label === "Other",
      isHighlighted,
      explodeVector,
    };
  });

  const showDonutOverlay = useDonut && props.arcMode !== "semi";
  const featuredSegment =
    segmentData.find((segment) => segment.isHighlighted) ??
    [...segmentData].sort((a, b) => b.value - a.value)[0];
  const compactFeaturedLabel = featuredSegment ? compactLabel(featuredSegment.label) : "Largest segment";
  const featuredIsGroupedOther = featuredSegment?.label === "Other";
  const centerValue = props.centerValue ?? (
    useDonut
      ? (props.showPercentages ? `${featuredSegment?.pct ?? 0}%` : formatValue(featuredSegment?.value ?? 0, "", ""))
      : (props.showPercentages ? "100%" : String(total))
  );
  const centerLabel = props.centerLabel ?? (useDonut ? "Lead share" : undefined);
  const centerCaption = useDonut ? compactFeaturedLabel : undefined;
  const legendItems = showTopLegend
    ? displaySegments.map((segment) => ({ label: segment.label, color: segment.color }))
    : [];
  const chartHaloColor = featuredSegment?.color ?? accentColor;
  const featuredValue = props.showPercentages
    ? `${featuredSegment?.pct ?? 0}%`
    : formatValue(featuredSegment?.value ?? 0, "", "");
  const calloutTitle = props.calloutTitle ?? featuredSegment?.label ?? "Key Insight";
  const calloutValue = props.calloutValue ?? featuredValue;
  const calloutBody = props.calloutBody ?? (
    featuredSegment
      ? `${featuredSegment.label} contributes ${featuredSegment.pct}% of the total.`
      : undefined
  );
  const shouldRenderCallout = showInlineCallout && Boolean(featuredSegment);
  const calloutEyebrow = featuredSegment ? "Featured Slice" : "Key Insight";

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
      headerGap={px(scale, layout.headerGap)}
      titleSize={px(scale, props.layoutPreset === "social" ? (isPortrait || isSquare ? 54 : 50) : 54)}
      subtitleSize={px(scale, props.layoutPreset === "social" ? 24 : 22)}
      titleMaxWidth="90%"
      subtitleMaxWidth={layout.titleAlign === "center" ? "72%" : "78%"}
      typography={typo}
      legendItems={legendItems}
      legendHeight={showTopLegend ? px(scale, props.layoutPreset === "social" ? 54 : 44) : 0}
      legendOpacity={legendOpacity}
      legendTextColor={props.legendTextColor}
      legendFontSize={px(scale, props.layoutPreset === "social" ? 20 : 18)}
      legendSwatchSize={px(scale, props.layoutPreset === "social" ? 20 : 18)}
    >
      <div
        style={{
          height: `${contentHeight}px`,
          display: "flex",
          flexDirection: useSplitLayout ? "row" : "column",
          alignItems: "center",
          justifyContent: useSplitLayout ? "center" : calloutOnBottom ? "flex-start" : "center",
          gap: `${contentGap}px`,
        }}
      >
        <div
          style={{
            width: `${useSplitLayout ? chartWidthBudget : Math.min(chartWidthBudget, contentWidth)}px`,
            minHeight: `${chartAreaHeight}px`,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: `${props.arcMode === "semi" ? px(scale, 10) : 0}px`,
          }}
        >
          <div
            style={{
              position: "relative",
              width: `${chartSize}px`,
              height: `${chartHeight}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `translateY(${chartYOffset}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: props.arcMode === "semi" ? `${px(scale, 28)}px ${px(scale, 46)}px ${px(scale, 12)}px` : `${px(scale, 34)}px`,
                borderRadius: "999px",
                background: `radial-gradient(circle, ${alpha(chartHaloColor, 0.18)} 0%, ${alpha(chartHaloColor, 0.06)} 42%, transparent 72%)`,
                filter: `blur(${px(scale, 22)}px)`,
                opacity: chartOpacity,
                transform: `scale(${chartScale})`,
              }}
            />
            <svg
              width={chartSize}
              height={chartHeight}
              viewBox={`0 0 ${chartSize} ${chartHeight}`}
              style={{
                opacity: chartOpacity,
                transform: `scale(${chartScale})`,
              }}
            >
            {props.arcMode === "semi" && props.showTrack && (
              <path
                d={
                  useDonut
                    ? describeDonutArc(centerX, centerY, outerRadius, innerRadius, baseStartAngle, baseStartAngle + chartSpan)
                    : describeArc(centerX, centerY, outerRadius, baseStartAngle, baseStartAngle + chartSpan)
                }
                fill={props.trackColor}
                opacity={0.28}
                stroke={props.strokeColor}
                strokeWidth={props.strokeWidth}
              />
            )}
            {segmentData.map((segment) => {
              if (segment.end - segment.start < 0.001) return null;
              const d = useDonut
                ? describeDonutArc(centerX, centerY, outerRadius, innerRadius, segment.start, segment.end)
                : describeArc(centerX, centerY, outerRadius, segment.start, segment.end);
              return (
                <path
                  key={segment.label}
                  d={d}
                  fill={segment.isHighlighted && props.highlightColor ? props.highlightColor : segment.color}
                  stroke={props.strokeColor}
                  strokeWidth={props.strokeWidth}
                  opacity={
                    hasHighlight && !segment.isHighlighted
                      ? props.dimOpacity
                      : segment.isGroupedOther
                        ? 0.76
                        : 1
                  }
                  transform={`translate(${segment.explodeVector.x} ${segment.explodeVector.y})`}
                />
              );
            })}

            {!showSideLabels && props.showPercentages && segmentData.map((segment) => (
              <text
                key={`${segment.label}-pct`}
                x={segment.labelPoint.x}
                y={segment.labelPoint.y}
                textAnchor={segment.labelPoint.x >= centerX ? "start" : "end"}
                dominantBaseline="middle"
                fill={props.valueColor}
                opacity={labelOpacity * (hasHighlight && !segment.isHighlighted ? props.dimOpacity : 1)}
                fontFamily={typo.fontFamily ?? "Arial, sans-serif"}
                fontSize={px(scale, props.layoutPreset === "social" ? 20 : 20)}
                fontWeight={700}
                transform={`translate(${segment.explodeVector.x} ${segment.explodeVector.y})`}
              >
                {segment.pct}%
              </text>
            ))}
          </svg>

          {showDonutOverlay && (
            <div
              style={{
                position: "absolute",
                left: `${centerX - innerRadius}px`,
                top: `${centerY - innerRadius}px`,
                width: `${innerRadius * 2}px`,
                height: `${innerRadius * 2}px`,
                borderRadius: "999px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                background: alpha(props.background.type === "solid" ? props.background.color : props.strokeColor, 0.2),
                backdropFilter: "blur(6px)",
                opacity: labelOpacity,
                padding: `${px(scale, 16)}px`,
                border: `1px solid ${alpha(props.strokeColor, 0.12)}`,
                boxShadow: `inset 0 0 ${px(scale, 22)}px ${alpha("#FFFFFF", props.background.type === "solid" ? 0.03 : 0.05)}`,
              }}
            >
              {centerLabel && (
                <div
                  style={{
                    color: props.labelColor,
                    fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                    fontSize: `${px(scale, props.layoutPreset === "social" ? 15 : 14)}px`,
                    fontWeight: 700,
                    marginBottom: `${px(scale, 10)}px`,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    opacity: 0.72,
                  }}
                >
                  {centerLabel}
                </div>
              )}
              <div
                style={{
                  color: props.valueColor,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  fontSize: `${px(scale, props.layoutPreset === "social" ? 42 : 38)}px`,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {centerValue}
              </div>
              {centerCaption && (
                <div
                  style={{
                    color: featuredIsGroupedOther ? alpha(props.labelColor, 0.78) : props.labelColor,
                    fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                    fontSize: `${px(scale, props.layoutPreset === "social" ? 17 : 16)}px`,
                    fontWeight: 500,
                    lineHeight: 1.16,
                    marginTop: `${px(scale, 8)}px`,
                    maxWidth: `${innerRadius * 1.36}px`,
                  }}
                >
                  {centerCaption}
                </div>
              )}
            </div>
          )}
          </div>

          {props.arcMode === "semi" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: `${px(scale, 8)}px`,
                minWidth: `${px(scale, 180)}px`,
                opacity: labelOpacity,
                marginTop: `${px(scale, 4)}px`,
              }}
            >
              {centerLabel && (
                <div
                  style={{
                    color: props.labelColor,
                    fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                    fontSize: `${px(scale, props.layoutPreset === "social" ? 20 : 18)}px`,
                    fontWeight: 500,
                  }}
                >
                  {centerLabel}
                </div>
              )}
              <div
                style={{
                  color: props.valueColor,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  fontSize: `${px(scale, props.layoutPreset === "social" ? 42 : 38)}px`,
                  fontWeight: 700,
                }}
              >
                {centerValue}
              </div>
            </div>
          )}
        </div>

        {shouldRenderCallout && !calloutOnBottom && (
          <div
            style={{
              width: `${calloutWidth}px`,
              borderRadius: `${px(scale, 24)}px`,
              background: panelBackground,
              border: `1px solid ${panelBorder}`,
              boxShadow: panelShadow,
              padding: `${px(scale, 28)}px`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: `${px(scale, 14)}px`,
              opacity: labelOpacity,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: `${px(scale, 12)}px`,
              }}
            >
              <div
                style={{
                  width: `${px(scale, 18)}px`,
                  height: `${px(scale, 18)}px`,
                  borderRadius: `${px(scale, 6)}px`,
                  backgroundColor: featuredSegment?.isHighlighted && props.highlightColor
                    ? props.highlightColor
                    : featuredSegment?.color,
                }}
              />
              <div
                style={{
                  color: props.labelColor,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  fontSize: `${px(scale, 14)}px`,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {calloutEyebrow}
              </div>
            </div>
            <div
              style={{
                color: props.labelColor,
                fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                fontSize: `${px(scale, 28)}px`,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              {calloutTitle}
            </div>
            <div
              style={{
                color: props.valueColor,
                fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                fontSize: `${px(scale, 50)}px`,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {calloutValue}
            </div>
            {calloutBody && (
              <div
                style={{
                  color: props.labelColor,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  fontSize: `${px(scale, 19)}px`,
                  lineHeight: 1.45,
                  fontWeight: 500,
                }}
              >
                {calloutBody}
              </div>
            )}
          </div>
        )}

        {shouldRenderCallout && calloutOnBottom && (
          <div
            style={{
              width: `${Math.min(contentWidth * 0.82, px(scale, 560))}px`,
              borderRadius: `${px(scale, 24)}px`,
              background: panelBackground,
              border: `1px solid ${panelBorder}`,
              boxShadow: panelShadow,
              padding: `${px(scale, 22)}px ${px(scale, 24)}px`,
              display: "flex",
              flexDirection: "column",
              gap: `${px(scale, 12)}px`,
              opacity: labelOpacity,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: `${px(scale, 12)}px`,
              }}
            >
              <div
                style={{
                  width: `${px(scale, 18)}px`,
                  height: `${px(scale, 18)}px`,
                  borderRadius: `${px(scale, 6)}px`,
                  backgroundColor: featuredSegment?.isHighlighted && props.highlightColor
                    ? props.highlightColor
                    : featuredSegment?.color,
                }}
              />
              <div
                style={{
                  color: props.labelColor,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  fontSize: `${px(scale, 14)}px`,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {calloutEyebrow}
              </div>
            </div>
            <div
              style={{
                color: props.labelColor,
                fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                fontSize: `${px(scale, props.layoutPreset === "social" ? 24 : 22)}px`,
                fontWeight: 700,
                lineHeight: 1.15,
              }}
            >
              {calloutTitle}
            </div>
            <div
              style={{
                color: props.valueColor,
                fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                fontSize: `${px(scale, props.layoutPreset === "social" ? 38 : 34)}px`,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {calloutValue}
            </div>
            {calloutBody && (
              <div
                style={{
                  color: props.labelColor,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  fontSize: `${px(scale, props.layoutPreset === "social" ? 18 : 17)}px`,
                  lineHeight: 1.45,
                  fontWeight: 500,
                }}
              >
                {calloutBody}
              </div>
            )}
          </div>
        )}

        {showSideLabels && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: `${px(scale, 20)}px`,
              width: `${sideLabelWidth}px`,
              opacity: labelOpacity,
              flexShrink: 0,
            }}
          >
            {segmentData.map((segment) => {
              const wrappedLines = splitLabelLines(compactLabel(segment.label), hasVeryLongLabels ? 16 : 18);
              return (
              <div
                key={`${segment.label}-legend`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: `${px(scale, 15)}px`,
                  opacity: hasHighlight && !segment.isHighlighted ? props.dimOpacity : segment.isGroupedOther ? 0.88 : 1,
                }}
              >
                <div
                  style={{
                    width: `${px(scale, 16)}px`,
                    height: `${px(scale, 16)}px`,
                    borderRadius: `${px(scale, 6)}px`,
                    backgroundColor: segment.isHighlighted && props.highlightColor ? props.highlightColor : segment.color,
                    flexShrink: 0,
                    marginTop: `${px(scale, 5)}px`,
                    boxShadow: segment.isGroupedOther ? "none" : `0 0 ${px(scale, 14)}px ${alpha(segment.color, 0.28)}`,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: `${px(scale, 5)}px`, minWidth: 0 }}>
                  <div
                    style={{
                      color: segment.isGroupedOther ? alpha(props.labelColor, 0.84) : props.labelColor,
                      fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                      fontSize: `${px(scale, props.layoutPreset === "social" ? 24 : 23)}px`,
                      fontWeight: 700,
                      lineHeight: 1.08,
                    }}
                  >
                    {wrappedLines.map((line, index) => (
                      <div key={`${segment.label}-line-${index}`}>{line}</div>
                    ))}
                  </div>
                  <span
                    style={{
                      color: segment.isGroupedOther ? alpha(props.valueColor, 0.8) : props.valueColor,
                      fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                      fontSize: `${px(scale, props.layoutPreset === "social" ? 20 : 19)}px`,
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {props.showPercentages ? `${segment.pct}%` : formatValue(segment.value, "", "")}
                  </span>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </ChartScaffold>
  );
};
