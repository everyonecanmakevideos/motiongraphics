import React from "react";
import { CountryRouteScene } from "../country-map-flow/CountryMapFlow";
import type { CountryMapRouteProps } from "./schema";

export const CountryMapRoute: React.FC<CountryMapRouteProps> = (props) => {
  return <CountryRouteScene {...props} routeMode="route" />;
};
