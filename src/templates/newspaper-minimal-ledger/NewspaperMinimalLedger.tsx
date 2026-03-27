import React from "react";
import { NewspaperFrontPage } from "../newspaper-front-page/NewspaperFrontPage";
import type { NewspaperFrontPageProps } from "../newspaper-front-page/schema";

export const NewspaperMinimalLedger: React.FC<NewspaperFrontPageProps> = (
  props,
) => {
  return <NewspaperFrontPage {...props} templateVariant="minimal-ledger" />;
};
