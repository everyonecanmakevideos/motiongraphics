import React from "react";
import { IndiaRouteScene } from "../map-route-flow/MapRouteFlow";
import type { IndiaMapRouteProps } from "./schema";

export const IndiaMapRoute: React.FC<IndiaMapRouteProps> = (props) => {
  return <IndiaRouteScene {...props} routeMode="route" />;
};
