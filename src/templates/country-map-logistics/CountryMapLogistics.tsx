import React from "react";
import { CountryRouteScene } from "../country-map-flow/CountryMapFlow";
import type { CountryMapLogisticsProps } from "./schema";

export const CountryMapLogistics: React.FC<CountryMapLogisticsProps> = (props) => {
  return <CountryRouteScene {...props} routeMode="logistics" />;
};
