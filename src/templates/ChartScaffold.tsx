import React from "react";
import { AbsoluteFill } from "remotion";
import { Background } from "../primitives/Background";
import { px } from "./chartShared";
import type { BackgroundConfig } from "./types";

type LegendItem = {
  label: string;
  color: string;
};

type ChartScaffoldProps = {
  background: BackgroundConfig;
  scale: number;
  panelWidth: number;
  panelHeight: number;
  panelPaddingX: number;
  panelPaddingY: number;
  panelBackground: string;
  panelBorder: string;
  panelShadow: string;
  fxBoxShadow: string;
  subtleBlur: boolean;
  exitOpacity: number;
  panelFilter?: string;
  panelBackdropBlur?: number;
  floatY: number;
  title?: string;
  subtitle?: string;
  titleColor: string;
  subtitleColor: string;
  titleOpacity: number;
  subtitleOpacity: number;
  titleAlign: "left" | "center";
  headerHeight: number;
  headerGap: number;
  titleSize: number;
  subtitleSize: number;
  titleMaxWidth?: string;
  subtitleMaxWidth?: string;
  typography: React.CSSProperties;
  legendItems?: LegendItem[];
  legendHeight?: number;
  legendOpacity?: number;
  legendTextColor?: string;
  legendFontSize?: number;
  legendSwatchSize?: number;
  children: React.ReactNode;
};

export const ChartScaffold: React.FC<ChartScaffoldProps> = ({
  background,
  scale,
  panelWidth,
  panelHeight,
  panelPaddingX,
  panelPaddingY,
  panelBackground,
  panelBorder,
  panelShadow,
  fxBoxShadow,
  subtleBlur,
  exitOpacity,
  panelFilter,
  panelBackdropBlur = subtleBlur ? 10 : 6,
  floatY,
  title,
  subtitle,
  titleColor,
  subtitleColor,
  titleOpacity,
  subtitleOpacity,
  titleAlign,
  headerHeight,
  headerGap,
  titleSize,
  subtitleSize,
  titleMaxWidth = "90%",
  subtitleMaxWidth = titleAlign === "center" ? "74%" : "80%",
  typography,
  legendItems = [],
  legendHeight = 0,
  legendOpacity = 1,
  legendTextColor = "#CBD5E1",
  legendFontSize,
  legendSwatchSize,
  children,
}) => {
  const hasHeader = Boolean(title || subtitle);
  const hasLegend = legendItems.length > 0 && legendHeight > 0;
  const resolvedLegendFontSize = legendFontSize ?? px(scale, 18);
  const resolvedLegendSwatchSize = legendSwatchSize ?? px(scale, 18);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={background} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `${px(scale, 36)}px`,
        }}
      >
        <div
          style={{
            width: `${panelWidth}px`,
            height: `${panelHeight}px`,
            padding: `${panelPaddingY}px ${panelPaddingX}px`,
            borderRadius: `${px(scale, 34)}px`,
            background: panelBackground,
            border: `1px solid ${panelBorder}`,
            boxShadow: `${panelShadow}, ${fxBoxShadow}`,
            backdropFilter: `blur(${panelBackdropBlur}px)`,
            opacity: exitOpacity,
            filter: panelFilter || undefined,
            transform: `translateY(${floatY}px)`,
            overflow: "hidden",
          }}
        >
          {hasHeader && (
            <div
              style={{
                height: `${headerHeight}px`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: titleAlign === "center" ? "center" : "flex-start",
                textAlign: titleAlign,
                gap: `${headerGap}px`,
              }}
            >
              {title && (
                <div
                  style={{
                    fontSize: `${titleSize}px`,
                    color: titleColor,
                    opacity: titleOpacity,
                    maxWidth: titleMaxWidth,
                    ...typography,
                  }}
                >
                  {title}
                </div>
              )}

              {subtitle && (
                <div
                  style={{
                    fontSize: `${subtitleSize}px`,
                    color: subtitleColor,
                    opacity: subtitleOpacity,
                    maxWidth: subtitleMaxWidth,
                    ...typography,
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                    lineHeight: 1.45,
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
          )}

          {hasLegend && (
            <div
              style={{
                height: `${legendHeight}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: titleAlign === "center" ? "center" : "flex-start",
                gap: `${px(scale, 24)}px`,
                opacity: legendOpacity,
                flexWrap: "wrap",
              }}
            >
              {legendItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: `${px(scale, 10)}px`,
                    color: legendTextColor,
                    fontSize: `${resolvedLegendFontSize}px`,
                    ...typography,
                    fontWeight: 500,
                  }}
                >
                  <div
                    style={{
                      width: `${resolvedLegendSwatchSize}px`,
                      height: `${resolvedLegendSwatchSize}px`,
                      borderRadius: `${px(scale, 6)}px`,
                      backgroundColor: item.color,
                    }}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
