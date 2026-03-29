import React from "react";
import { MapHighlight } from "../map-highlight/MapHighlight";
import type { MapHighlightProps } from "../map-highlight/schema";

export const MapRadiusRings: React.FC<MapHighlightProps> = (props) => {
  return <MapHighlight {...props} templateVariant="radius-rings" />;
};
