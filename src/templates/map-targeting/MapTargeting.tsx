import React from "react";
import { MapHighlight } from "../map-highlight/MapHighlight";
import type { MapHighlightProps } from "../map-highlight/schema";

export const MapTargeting: React.FC<MapHighlightProps> = (props) => {
  return <MapHighlight {...props} templateVariant="targeting" />;
};
