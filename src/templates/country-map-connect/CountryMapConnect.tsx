import React from "react";
import { CountryRouteScene } from "../country-map-flow/CountryMapFlow";
import type { CountryMapConnectProps } from "./schema";

export const CountryMapConnect: React.FC<CountryMapConnectProps> = (props) => {
  return <CountryRouteScene {...props} routeMode="connect" />;
};
