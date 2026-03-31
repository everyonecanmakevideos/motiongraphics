import React from "react";
import { IndiaRouteScene } from "../map-route-flow/MapRouteFlow";
import type { IndiaMapLogisticsProps } from "./schema";

export const IndiaMapLogistics: React.FC<IndiaMapLogisticsProps> = (props) => {
  return <IndiaRouteScene {...props} routeMode="logistics" />;
};
