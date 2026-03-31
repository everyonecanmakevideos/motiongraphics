import React from "react";
import { IndiaRouteScene } from "../map-route-flow/MapRouteFlow";
import type { IndiaMapConnectProps } from "./schema";

export const IndiaMapConnect: React.FC<IndiaMapConnectProps> = (props) => {
  return <IndiaRouteScene {...props} routeMode="connect" />;
};
